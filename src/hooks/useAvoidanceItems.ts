import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AvoidanceItem } from "@/types/database";

export function useAvoidanceItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["avoidance-items", user?.id],
    queryFn: async (): Promise<AvoidanceItem[]> => {
      const { data, error } = await supabase
        .from("avoidance_items")
        .select("*")
        .eq("user_id", user!.id)
        .order("rank", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: Boolean(user?.id && isSupabaseConfigured),
    staleTime: 15_000,
  });
}
