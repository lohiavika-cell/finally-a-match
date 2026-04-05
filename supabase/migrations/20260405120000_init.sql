-- Finally: profiles, ranked avoidance list, overlap matching, plans
-- Run via Supabase CLI or SQL Editor after linking a project.

create extension if not exists "pgcrypto";

-- ─── Profiles (1:1 with auth.users) ─────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  onboarding_complete boolean not null default false,
  energy_level text,
  timing_pref text,
  budget_band text,
  vibe_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_energy_level_check check (
    energy_level is null or energy_level in ('low_key', 'balanced', 'high_energy')
  ),
  constraint profiles_timing_pref_check check (
    timing_pref is null or timing_pref in ('weekends', 'weeknights', 'flexible')
  ),
  constraint profiles_budget_band_check check (
    budget_band is null or budget_band in ('free_cheap', 'mid', 'splurge_ok')
  )
);

create index profiles_onboarding_idx on public.profiles (onboarding_complete) where onboarding_complete = true;

-- ─── Five ranked “things I keep putting off” ────────────────────────────────
create table public.avoidance_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rank smallint not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint avoidance_items_rank_check check (rank between 1 and 5),
  constraint avoidance_items_user_rank_unique unique (user_id, rank)
);

create index avoidance_items_user_id_idx on public.avoidance_items (user_id);

-- ─── Plans (overlap → concrete plan) ───────────────────────────────────────
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id) on delete cascade,
  participant_a uuid not null references public.profiles (id) on delete cascade,
  participant_b uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  detail text,
  status text not null default 'proposed',
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint plans_participants_distinct check (participant_a <> participant_b),
  constraint plans_creator_is_participant check (
    created_by = participant_a or created_by = participant_b
  ),
  constraint plans_status_check check (
    status in ('proposed', 'accepted', 'scheduled', 'done', 'passed')
  )
);

create index plans_participant_a_idx on public.plans (participant_a);
create index plans_participant_b_idx on public.plans (participant_b);

-- ─── New auth user → profile row ───────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1),
      'Friend'
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── updated_at ─────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─── Match candidates: list overlap + preference alignment ────────────────
create or replace function public.get_match_candidates(p_limit int default 30)
returns table (
  profile_id uuid,
  display_name text,
  overlap_score numeric,
  pref_bonus numeric,
  total_score numeric,
  shared_items jsonb,
  energy_level text,
  timing_pref text,
  budget_band text,
  vibe_notes text
)
language sql
stable
security definer
set search_path = public
as $$
  with
  me as (
    select * from public.profiles where id = auth.uid()
  ),
  my_items as (
    select ai.rank, lower(trim(ai.body)) as norm, ai.body as raw
    from public.avoidance_items ai
    where ai.user_id = auth.uid()
  ),
  their_items as (
    select ai.user_id, ai.rank, lower(trim(ai.body)) as norm, ai.body as raw
    from public.avoidance_items ai
    where ai.user_id <> auth.uid()
  ),
  pairs as (
    select
      t.user_id as other_id,
      mi.rank as my_rank,
      t.rank as their_rank,
      mi.raw as text_mine,
      t.raw as text_theirs
    from my_items mi
    inner join their_items t on mi.norm = t.norm and mi.norm <> ''
  ),
  scored as (
    select
      p.other_id,
      sum((6 - p.my_rank) * (6 - p.their_rank))::numeric as overlap_score,
      jsonb_agg(
        jsonb_build_object(
          'my_rank', p.my_rank,
          'their_rank', p.their_rank,
          'text', p.text_mine
        )
        order by p.my_rank
      ) as shared_items
    from pairs p
    group by p.other_id
  )
  select
    pr.id as profile_id,
    pr.display_name,
    s.overlap_score,
    (
      case when pr.energy_level is not null and pr.energy_level = me.energy_level then 4 else 0 end
      + case when pr.timing_pref is not null and pr.timing_pref = me.timing_pref then 4 else 0 end
      + case when pr.budget_band is not null and pr.budget_band = me.budget_band then 3 else 0 end
    )::numeric as pref_bonus,
    (
      s.overlap_score
      + case when pr.energy_level is not null and pr.energy_level = me.energy_level then 4 else 0 end
      + case when pr.timing_pref is not null and pr.timing_pref = me.timing_pref then 4 else 0 end
      + case when pr.budget_band is not null and pr.budget_band = me.budget_band then 3 else 0 end
    )::numeric as total_score,
    s.shared_items,
    pr.energy_level,
    pr.timing_pref,
    pr.budget_band,
    pr.vibe_notes
  from scored s
  inner join public.profiles pr on pr.id = s.other_id
  cross join me
  where pr.onboarding_complete = true
    and me.onboarding_complete = true
  order by total_score desc, overlap_score desc
  limit greatest(1, least(coalesce(p_limit, 30), 100));
$$;

grant execute on function public.get_match_candidates(int) to authenticated;

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.avoidance_items enable row level security;
alter table public.plans enable row level security;

create policy "Profiles: read discoverable or self"
  on public.profiles for select
  to authenticated
  using (onboarding_complete = true or id = auth.uid());

create policy "Profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Avoidance items: CRUD own"
  on public.avoidance_items for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Plans: read if participant"
  on public.plans for select
  to authenticated
  using (auth.uid() = participant_a or auth.uid() = participant_b);

create policy "Plans: insert if creator and participant"
  on public.plans for insert
  to authenticated
  with check (
    auth.uid() = created_by
    and (auth.uid() = participant_a or auth.uid() = participant_b)
  );

create policy "Plans: update if participant"
  on public.plans for update
  to authenticated
  using (auth.uid() = participant_a or auth.uid() = participant_b)
  with check (auth.uid() = participant_a or auth.uid() = participant_b);

-- API access (Supabase PostgREST)
grant usage on schema public to anon, authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on public.avoidance_items to authenticated;
grant select, insert, update, delete on public.plans to authenticated;
