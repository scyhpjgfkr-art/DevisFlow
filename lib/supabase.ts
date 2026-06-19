import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "missing-supabase-anon-key";

if (
  process.env.VERCEL &&
  (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
) {
  throw new Error("Variables Supabase publiques manquantes sur Vercel.");
}

if (
  (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
  process.env.NODE_ENV !== "production"
) {
  console.warn("Variables Supabase publiques manquantes.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
