import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  const { id } = await req.json();

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
    });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
