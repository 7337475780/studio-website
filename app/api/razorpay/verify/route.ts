// app/api/razorpay/verify/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    // ✅ Check for missing fields
    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      console.log("Missing fields in verify request:", {
        bookingId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // ✅ Verify signature
    if (generated_signature !== razorpay_signature) {
      console.log("Signature mismatch", {
        generated_signature,
        razorpay_signature,
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // ✅ Optionally, update booking status in Supabase
    // import { createClient } from '@supabase/supabase-js';
    // const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    // await supabase.from('Bookings').update({ status: 'paid' }).eq('id', bookingId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Razorpay verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
