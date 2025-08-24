// app/api/create-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { id, email, full_name } = await req.json();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .insert([{ id, email, full_name, role: "user" }])
      .select()
      .single();

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}
