import type { BudgetBand, EnergyLevel, PlanStatus, TimingPref } from "@/types/database";

export const ENERGY_LABELS: Record<EnergyLevel, string> = {
  low_key: "Low key / cozy",
  balanced: "Balanced",
  high_energy: "High energy",
};

export const TIMING_LABELS: Record<TimingPref, string> = {
  weekends: "Mostly weekends",
  weeknights: "Weeknights",
  flexible: "Flexible",
};

export const BUDGET_LABELS: Record<BudgetBand, string> = {
  free_cheap: "Free / cheap wins",
  mid: "Mid-range is fine",
  splurge_ok: "Happy to splurge sometimes",
};

export const PLAN_STATUS_LABELS: Record<PlanStatus, string> = {
  proposed: "Proposed",
  accepted: "Accepted",
  scheduled: "Scheduled",
  done: "Done",
  passed: "Passed",
};
