import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // apiVersion: "2022-11-15",
});

export async function POST(req: NextRequest) {
  const { amount, bookingId } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: "Photo Session" },
          unit_amount: amount, // in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${req.headers.get("origin")}/success?bookingId=${bookingId}`,
    cancel_url: `${req.headers.get("origin")}/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
