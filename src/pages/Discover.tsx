import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { BUDGET_LABELS, ENERGY_LABELS, TIMING_LABELS } from "@/lib/labels";
import type { MatchCandidate } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FullPageSpinner } from "@/components/FullPageSpinner";

type SharedRow = { my_rank: number; their_rank: number; text: string };

function parseShared(raw: unknown): SharedRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is SharedRow =>
      typeof x === "object" &&
      x !== null &&
      "text" in x &&
      typeof (x as SharedRow).text === "string",
  ) as SharedRow[];
}

const Discover = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<MatchCandidate | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [planDetail, setPlanDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: matches, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["match-candidates", user?.id],
    queryFn: async () => {
      const { data, error: rpcErr } = await supabase.rpc("get_match_candidates", { p_limit: 30 });
      if (rpcErr) throw rpcErr;
      return data as MatchCandidate[];
    },
    enabled: Boolean(user?.id),
  });

  const openPropose = (m: MatchCandidate) => {
    const shared = parseShared(m.shared_items);
    const first = shared[0]?.text ?? "Something we both keep avoiding";
    setSelected(m);
    setPlanTitle(first);
    setPlanDetail("");
    setDialogOpen(true);
  };

  const submitPlan = async () => {
    if (!user || !selected) return;
    const title = planTitle.trim();
    if (title.length < 3) {
      toast.error("Give the plan a short title (3+ characters).");
      return;
    }
    const [participant_a, participant_b] = [user.id, selected.profile_id].sort();
    setSubmitting(true);
    const { error: insErr } = await supabase.from("plans").insert({
      created_by: user.id,
      participant_a,
      participant_b,
      title,
      detail: planDetail.trim() || null,
      status: "proposed",
    });
    setSubmitting(false);
    if (insErr) {
      toast.error(insErr.message);
      return;
    }
    toast.success("Plan proposed — check Plans tab");
    setDialogOpen(false);
    setSelected(null);
    await qc.invalidateQueries({ queryKey: ["plans", user.id] });
  };

  if (isLoading && !matches) {
    return <FullPageSpinner message="Finding overlap…" />;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <p className="font-mono-space text-sm text-destructive">{error.message}</p>
        <Button variant="outline" className="rounded-full font-pixel" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const list = matches ?? [];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-pixel text-foreground">Discover</h1>
          <p className="font-mono-space text-sm text-foreground/70 mt-2 max-w-xl leading-relaxed">
            Sorted by list overlap plus how your energy, timing, and budget line up. The plan is the point — say hi by
            proposing something concrete.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full font-pixel shrink-0"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="rounded-3xl border-border bg-card max-w-lg">
          <CardHeader>
            <CardTitle className="font-pixel text-lg">No overlap yet</CardTitle>
            <CardDescription className="font-mono-space text-sm leading-relaxed">
              Finish onboarding, invite friends, or tweak your five — matches need the same normalized text (case and
              extra spaces ignored) to count.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => {
            const shared = parseShared(m.shared_items);
            return (
              <Card key={m.profile_id} className="rounded-3xl border-border bg-card flex flex-col">
                <CardHeader className="space-y-1">
                  <CardTitle className="font-pixel text-xl">{m.display_name}</CardTitle>
                  <CardDescription className="font-mono-space text-xs space-y-1">
                    <span className="block">
                      Overlap score <strong>{Number(m.overlap_score).toFixed(0)}</strong>
                      {Number(m.pref_bonus) > 0 ? (
                        <>
                          {" "}
                          + prefs <strong>{Number(m.pref_bonus).toFixed(0)}</strong>
                        </>
                      ) : null}
                    </span>
                    <span className="block opacity-80">
                      {m.energy_level ? ENERGY_LABELS[m.energy_level] : "—"} ·{" "}
                      {m.timing_pref ? TIMING_LABELS[m.timing_pref] : "—"} ·{" "}
                      {m.budget_band ? BUDGET_LABELS[m.budget_band] : "—"}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <div>
                    <p className="font-mono-space text-[10px] uppercase tracking-wider text-foreground/50 mb-2">
                      Shared list lines
                    </p>
                    <ul className="space-y-2">
                      {shared.map((s, i) => (
                        <li
                          key={i}
                          className="font-mono-space text-xs text-foreground/85 border border-border rounded-2xl px-3 py-2 bg-secondary/40"
                        >
                          {s.text}
                          <span className="opacity-50 ml-2">
                            (you #{s.my_rank} · them #{s.their_rank})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {m.vibe_notes ? (
                    <p className="font-mono-space text-xs text-foreground/60 italic line-clamp-4">{m.vibe_notes}</p>
                  ) : null}
                  <Button className="rounded-full font-pixel mt-auto" onClick={() => openPropose(m)}>
                    Propose a plan
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-3xl border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-pixel">Turn overlap into a plan</DialogTitle>
            <DialogDescription className="font-mono-space text-sm">
              Suggest a specific time window or place in the details so the other person can say yes without awkward
              back-and-forth.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="plan-title" className="font-mono-space text-xs">
                Plan title
              </Label>
              <Input
                id="plan-title"
                value={planTitle}
                onChange={(ev) => setPlanTitle(ev.target.value)}
                className="rounded-full font-mono-space text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-detail" className="font-mono-space text-xs">
                Details (optional)
              </Label>
              <Textarea
                id="plan-detail"
                value={planDetail}
                onChange={(ev) => setPlanDetail(ev.target.value)}
                placeholder="e.g. Saturday 4pm, City Museum, tickets ~$15"
                className="rounded-2xl font-mono-space text-sm min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-full font-pixel" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full font-pixel" disabled={submitting} onClick={() => void submitPlan()}>
              {submitting ? "Sending…" : "Send proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discover;
