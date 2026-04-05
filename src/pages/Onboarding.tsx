import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/lib/supabase";
import { BUDGET_LABELS, ENERGY_LABELS, TIMING_LABELS } from "@/lib/labels";
import type { BudgetBand, EnergyLevel, TimingPref } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FullPageSpinner } from "@/components/FullPageSpinner";

const emptyItems = () => ["", "", "", "", ""];

const Onboarding = () => {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [items, setItems] = useState(emptyItems);
  const [energy, setEnergy] = useState<EnergyLevel | "">("");
  const [timing, setTiming] = useState<TimingPref | "">("");
  const [budget, setBudget] = useState<BudgetBand | "">("");
  const [vibe, setVibe] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
  }, [profile?.display_name]);

  if (isLoading || !profile) {
    return <FullPageSpinner message="Loading profile…" />;
  }

  if (profile.onboarding_complete) {
    return <Navigate to="/app" replace />;
  }

  const setItem = (i: number, v: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmed = items.map((t) => t.trim());
    if (trimmed.some((t) => t.length < 3)) {
      toast.error("Each list item needs at least 3 characters.");
      return;
    }
    if (!energy || !timing || !budget) {
      toast.error("Pick energy, timing, and budget so we can align plans.");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Add a display name.");
      return;
    }

    setSaving(true);

    const { error: profileErr } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        energy_level: energy,
        timing_pref: timing,
        budget_band: budget,
        vibe_notes: vibe.trim() || null,
        onboarding_complete: true,
      })
      .eq("id", user.id);

    if (profileErr) {
      setSaving(false);
      toast.error(profileErr.message);
      return;
    }

    for (let rank = 1; rank <= 5; rank++) {
      const { error: itemErr } = await supabase.from("avoidance_items").upsert(
        {
          user_id: user.id,
          rank,
          body: trimmed[rank - 1]!,
        },
        { onConflict: "user_id,rank" },
      );
      if (itemErr) {
        setSaving(false);
        toast.error(itemErr.message);
        return;
      }
    }

    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    await qc.invalidateQueries({ queryKey: ["avoidance-items", user.id] });
    setSaving(false);
    toast.success("You're in — go find your overlap");
    navigate("/app", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:py-16">
      <div className="max-w-lg mx-auto space-y-10">
        <header className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-pixel text-foreground">Your five</h1>
          <p className="font-mono-space text-sm text-foreground/70 leading-relaxed">
            Rank real things you keep postponing — museums, classes, nights out, creative skills. We match on overlap and
            turn it into a plan.
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="space-y-2">
            <Label className="font-mono-space text-xs">Display name</Label>
            <Input
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
              className="rounded-full border-border font-mono-space text-sm"
              required
            />
          </div>

          <div className="space-y-3">
            <Label className="font-mono-space text-xs block">Rank 1 → 5 (1 = most avoided lately)</Label>
            {items.map((val, i) => (
              <div key={i} className="flex gap-2 items-center">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-pixel flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <Input
                  value={val}
                  onChange={(ev) => setItem(i, ev.target.value)}
                  placeholder={`Thing ${i + 1}`}
                  className="rounded-full border-border font-mono-space text-sm flex-1"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="font-mono-space text-xs">Energy</Label>
              <Select value={energy || undefined} onValueChange={(v) => setEnergy(v as EnergyLevel)}>
                <SelectTrigger className="rounded-full border-border font-mono-space text-xs h-10">
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENERGY_LABELS) as EnergyLevel[]).map((k) => (
                    <SelectItem key={k} value={k} className="font-mono-space text-xs">
                      {ENERGY_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono-space text-xs">Timing</Label>
              <Select value={timing || undefined} onValueChange={(v) => setTiming(v as TimingPref)}>
                <SelectTrigger className="rounded-full border-border font-mono-space text-xs h-10">
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIMING_LABELS) as TimingPref[]).map((k) => (
                    <SelectItem key={k} value={k} className="font-mono-space text-xs">
                      {TIMING_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono-space text-xs">Budget</Label>
              <Select value={budget || undefined} onValueChange={(v) => setBudget(v as BudgetBand)}>
                <SelectTrigger className="rounded-full border-border font-mono-space text-xs h-10">
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BUDGET_LABELS) as BudgetBand[]).map((k) => (
                    <SelectItem key={k} value={k} className="font-mono-space text-xs">
                      {BUDGET_LABELS[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-mono-space text-xs">Vibe notes (optional)</Label>
            <Textarea
              value={vibe}
              onChange={(ev) => setVibe(ev.target.value)}
              placeholder="Humor style, what makes you feel safe meeting someone new, anything that helps timing feel right."
              className="rounded-2xl border-border font-mono-space text-sm min-h-[100px]"
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full rounded-full font-pixel text-base py-6">
            {saving ? "Saving…" : "Save list & enter Finally"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
