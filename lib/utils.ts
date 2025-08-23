mport { supabase } from "../lib/supabaseClient";

export const fetchPhotos = async () => {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};
