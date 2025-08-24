import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, message } = await req.json();

    if (!bookingId || !message) {
      return NextResponse.json(
        { error: "Missing bookingId or message" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("notifications")
      .insert([
        { booking_id: bookingId, message, type: "payment", is_read: false },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification: data });
  } catch (err: any) {
    console.error("Notify error:", err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
