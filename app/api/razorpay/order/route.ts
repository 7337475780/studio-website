import { NextResponse } from "next/server";

function makeReceipt(bookingId: string) {
  const base = `receipt_${bookingId}`;
  return base.length > 40 ? base.slice(0, 40) : base;
}

export async function POST(req: Request) {
  try {
    const { amount, bookingId } = await req.json();

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-fA-F-]{36}$/;
    if (!bookingId || !uuidRegex.test(bookingId)) {
      return NextResponse.json({ error: "Invalid bookingId" }, { status: 400 });
    }

    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!;
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt: makeReceipt(bookingId),
      }),
    });

    const data = await orderRes.json();

    if (!orderRes.ok) {
      console.error("Razorpay API Error:", data);
      return NextResponse.json(
        { error: "Razorpay order creation failed", details: data },
        { status: orderRes.status }
      );
    }

    return NextResponse.json({ ...data, key });
  } catch (err: any) {
    console.error("Order error:", err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
