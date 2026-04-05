import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useAvoidanceItems } from "@/hooks/useAvoidanceItems";
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

const slots = [1, 2, 3, 4, 5] as const;

const MyList = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: rows, isLoading: itemsLoading } = useAvoidanceItems();
  const qc = useQueryClient();

  const [displayName, setDisplayName] = useState("");
  const [items, setItems] = useState<string[]>(["", "", "", "", ""]);
  const [energy, setEnergy] = useState<EnergyLevel | "">("");
  const [timing, setTiming] = useState<TimingPref | "">("");
  const [budget, setBudget] = useState<BudgetBand | "">("");
  const [vibe, setVibe] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? "");
    setEnergy(profile.energy_level ?? "");
    setTiming(profile.timing_pref ?? "");
    setBudget(profile.budget_band ?? "");
    setVibe(profile.vibe_notes ?? "");
  }, [profile]);

  useEffect(() => {
    if (!rows?.length) return;
    const next = ["", "", "", "", ""];
    for (const r of rows) {
      if (r.rank >= 1 && r.rank <= 5) next[r.rank - 1] = r.body;
    }
    setItems(next);
  }, [rows]);

  const setItem = (i: number, v: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[i] = v;
      return copy;
    });
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const trimmed = items.map((t) => t.trim());
    if (trimmed.some((t) => t.length < 3)) {
      toast.error("Each line needs at least 3 characters.");
      return;
    }
    if (!energy || !timing || !budget) {
      toast.error("Pick energy, timing, and budget.");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Display name required.");
      return;
    }

    setSaving(true);

    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        energy_level: energy,
        timing_pref: timing,
        budget_band: budget,
        vibe_notes: vibe.trim() || null,
      })
      .eq("id", user.id);

    if (pErr) {
      setSaving(false);
      toast.error(pErr.message);
      return;
    }

    for (const rank of slots) {
      const { error: iErr } = await supabase.from("avoidance_items").upsert(
        {
          user_id: user.id,
          rank,
          body: trimmed[rank - 1]!,
        },
        { onConflict: "user_id,rank" },
      );
      if (iErr) {
        setSaving(false);
        toast.error(iErr.message);
        return;
      }
    }

    await qc.invalidateQueries({ queryKey: ["profile", user.id] });
    await qc.invalidateQueries({ queryKey: ["avoidance-items", user.id] });
    await qc.invalidateQueries({ queryKey: ["match-candidates", user.id] });
    setSaving(false);
    toast.success("List updated");
  };

  if (profileLoading || itemsLoading || !profile) {
    return <FullPageSpinner />;
  }

  return (
    <div className="max-w-lg mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold font-pixel text-foreground">My list</h1>
        <p className="font-mono-space text-sm text-foreground/70 mt-2 leading-relaxed">
          Keep this honest — matches only work when the lines are specific and true.
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-8">
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
          <Label className="font-mono-space text-xs block">Ranked five</Label>
          {slots.map((rank) => (
            <div key={rank} className="flex gap-2 items-center">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-pixel flex items-center justify-center shrink-0">
                {rank}
              </span>
              <Input
                value={items[rank - 1]}
                onChange={(ev) => setItem(rank - 1, ev.target.value)}
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
                <SelectValue placeholder="Pick" />
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
                <SelectValue placeholder="Pick" />
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
                <SelectValue placeholder="Pick" />
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
          <Label className="font-mono-space text-xs">Vibe notes</Label>
          <Textarea
            value={vibe}
            onChange={(ev) => setVibe(ev.target.value)}
            className="rounded-2xl border-border font-mono-space text-sm min-h-[100px]"
          />
        </div>

        <Button type="submit" disabled={saving} className="w-full rounded-full font-pixel py-6">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
};

export default MyList;
