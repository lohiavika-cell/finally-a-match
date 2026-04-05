import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { PLAN_STATUS_LABELS } from "@/lib/labels";
import type { Plan, PlanStatus } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FullPageSpinner } from "@/components/FullPageSpinner";

const Plans = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: plans, isLoading, error, refetch } = useQuery({
    queryKey: ["plans", uid],
    queryFn: async () => {
      const { data, error: qErr } = await supabase
        .from("plans")
        .select("*")
        .or(`participant_a.eq.${uid},participant_b.eq.${uid}`)
        .order("created_at", { ascending: false });
      if (qErr) throw qErr;
      return data as Plan[];
    },
    enabled: Boolean(uid),
  });

  const otherIds = useMemo(() => {
    if (!plans?.length || !uid) return [];
    const set = new Set<string>();
    for (const p of plans) {
      set.add(p.participant_a === uid ? p.participant_b : p.participant_a);
    }
    return [...set];
  }, [plans, uid]);

  const { data: nameById } = useQuery({
    queryKey: ["plan-partner-names", [...otherIds].sort().join(",")],
    queryFn: async () => {
      if (otherIds.length === 0) return {} as Record<string, string>;
      const { data, error: e } = await supabase.from("profiles").select("id, display_name").in("id", otherIds);
      if (e) throw e;
      const map: Record<string, string> = {};
      for (const row of data ?? []) map[row.id] = row.display_name;
      return map;
    },
    enabled: otherIds.length > 0,
  });

  const updateStatus = async (planId: string, status: PlanStatus) => {
    const { error: uErr } = await supabase.from("plans").update({ status }).eq("id", planId);
    if (uErr) {
      toast.error(uErr.message);
      return;
    }
    toast.success("Plan updated");
    await qc.invalidateQueries({ queryKey: ["plans", uid] });
  };

  if (isLoading) {
    return <FullPageSpinner message="Loading plans…" />;
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-12">
        <p className="font-mono-space text-sm text-destructive">{error.message}</p>
        <Button variant="outline" className="rounded-full font-pixel" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const list = plans ?? [];

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold font-pixel text-foreground">Plans</h1>
        <p className="font-mono-space text-sm text-foreground/70 mt-2 leading-relaxed">
          Shared proposals with people you overlapped with. Update status as things move — done still counts as a win
          without romance.
        </p>
      </div>

      {list.length === 0 ? (
        <Card className="rounded-3xl border-border bg-card">
          <CardHeader>
            <CardTitle className="font-pixel text-lg">Nothing scheduled yet</CardTitle>
            <CardDescription className="font-mono-space text-sm">
              Propose something from Discover — the app is built so the activity leads, not small talk.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="space-y-4">
          {list.map((p) => {
            const other = p.participant_a === uid ? p.participant_b : p.participant_a;
            const name = nameById?.[other] ?? "Someone";
            return (
              <li key={p.id}>
                <Card className="rounded-3xl border-border bg-card">
                  <CardHeader className="space-y-1">
                    <CardTitle className="font-pixel text-lg">{p.title}</CardTitle>
                    <CardDescription className="font-mono-space text-xs">
                      With <strong>{name}</strong>
                      {p.created_by === uid ? (
                        <span className="opacity-70"> · you proposed</span>
                      ) : (
                        <span className="opacity-70"> · they proposed</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {p.detail ? <p className="font-mono-space text-sm text-foreground/80 whitespace-pre-wrap">{p.detail}</p> : null}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="font-mono-space text-xs text-foreground/50 shrink-0">Status</span>
                      <Select value={p.status} onValueChange={(v) => void updateStatus(p.id, v as PlanStatus)}>
                        <SelectTrigger className="rounded-full border-border font-mono-space text-xs h-9 w-full sm:max-w-[220px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(PLAN_STATUS_LABELS) as PlanStatus[]).map((k) => (
                            <SelectItem key={k} value={k} className="font-mono-space text-xs">
                              {PLAN_STATUS_LABELS[k]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default Plans;
