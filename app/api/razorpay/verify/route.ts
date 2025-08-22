// app/api/razorpay/verify/route.ts
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

    const keySecret = process.env.RAZORPAY_KEY_SECRET!;
    if (!keySecret) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay secret" },
        { status: 500 }
      );
    }

    // Verify Razorpay signature
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }

    //Signature valid → Update booking as paid
    const { error } = await supabase
      .from("Bookings")
      .update({
        status: "paid",
        payment_id: razorpay_payment_id,
      })
      .eq("id", bookingId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json(
        { success: false, message: "Failed to update booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Payment verified" });
  } catch (err: any) {
    console.error("Verify API error:", err);
    return NextResponse.json(
      { success: false, message: "Verification failed", error: err.message },
      { status: 500 }
    );
  }
}
