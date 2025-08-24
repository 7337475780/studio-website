import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  throw new Error("SUPABASE_SERVICE_KEY is missing in environment variables");
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
