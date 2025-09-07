import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabaseClient";

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
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // Update booking status in Supabase
    const { error } = await supabase
      .from("Bookings")
      .update({ status: "paid" })
      .eq("id", bookingId);

    if (error) {
      console.error("Supabase update error:", error.message);
      return NextResponse.json(
        { success: false, message: "DB update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Payment verified" });
  } catch (err: any) {
    console.error("Verification error:", err);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}
