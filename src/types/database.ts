export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type EnergyLevel = "low_key" | "balanced" | "high_energy";
export type TimingPref = "weekends" | "weeknights" | "flexible";
export type BudgetBand = "free_cheap" | "mid" | "splurge_ok";
export type PlanStatus = "proposed" | "accepted" | "scheduled" | "done" | "passed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          onboarding_complete: boolean;
          energy_level: EnergyLevel | null;
          timing_pref: TimingPref | null;
          budget_band: BudgetBand | null;
          vibe_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          onboarding_complete?: boolean;
          energy_level?: EnergyLevel | null;
          timing_pref?: TimingPref | null;
          budget_band?: BudgetBand | null;
          vibe_notes?: string | null;
        };
        Update: {
          display_name?: string;
          onboarding_complete?: boolean;
          energy_level?: EnergyLevel | null;
          timing_pref?: TimingPref | null;
          budget_band?: BudgetBand | null;
          vibe_notes?: string | null;
        };
      };
      avoidance_items: {
        Row: {
          id: string;
          user_id: string;
          rank: number;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rank: number;
          body: string;
        };
        Update: {
          body?: string;
          rank?: number;
        };
      };
      plans: {
        Row: {
          id: string;
          created_by: string;
          participant_a: string;
          participant_b: string;
          title: string;
          detail: string | null;
          status: PlanStatus;
          scheduled_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_by: string;
          participant_a: string;
          participant_b: string;
          title: string;
          detail?: string | null;
          status?: PlanStatus;
          scheduled_at?: string | null;
        };
        Update: {
          title?: string;
          detail?: string | null;
          status?: PlanStatus;
          scheduled_at?: string | null;
        };
      };
    };
    Functions: {
      get_match_candidates: {
        Args: { p_limit?: number };
        Returns: {
          profile_id: string;
          display_name: string;
          overlap_score: number;
          pref_bonus: number;
          total_score: number;
          shared_items: Json;
          energy_level: EnergyLevel | null;
          timing_pref: TimingPref | null;
          budget_band: BudgetBand | null;
          vibe_notes: string | null;
        }[];
      };
    };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AvoidanceItem = Database["public"]["Tables"]["avoidance_items"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];

export type MatchCandidate = Database["public"]["Functions"]["get_match_candidates"]["Returns"][number];
