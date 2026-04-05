import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  typeof url === "string" && url.trim().length > 0 && typeof anonKey === "string" && anonKey.trim().length > 0,
);

// createClient throws if the URL is empty ("supabaseUrl is required"). On hosts like Vercel, env vars
// must be set at build time — without them the bundle used to crash before React mounted (blank yellow screen).
const resolvedUrl = isSupabaseConfigured ? url!.trim() : "https://placeholder.supabase.co";
const resolvedKey = isSupabaseConfigured ? anonKey!.trim() : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.unused";

export const supabase = createClient<Database>(resolvedUrl, resolvedKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
