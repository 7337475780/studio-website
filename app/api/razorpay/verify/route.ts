import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  return NextResponse.json({ ok: true, message: "Verify API running 🚀" });
}

export async function POST(req: Request) {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      !bookingId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required payment details" },
        { status: 400 }
      );
    }

    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!uuidRegex.test(bookingId)) {
      return NextResponse.json(
        { success: false, message: "Invalid bookingId" },
        { status: 400 }
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Payment verification failed" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("Bookings")
      .update({
        status: "paid",
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        signature: razorpay_signature,
        payment_verified_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .eq("status", "pending")
      .select();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to update booking" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: "Booking not found or already paid" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Payment verified ✅" });
  } catch (err: any) {
    console.error("Verify API error:", err);
    return NextResponse.json(
      { success: false, message: "Verification failed", error: err.message },
      { status: 500 }
    );
  }
}
