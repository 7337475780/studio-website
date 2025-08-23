import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const msg = {
      to: process.env.ADMIN_EMAIL!,
      from: process.env.ADMIN_EMAIL!, // verified sender in SendGrid
      subject: `New Booking Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${
        phone || "N/A"
      }\nMessage: ${message}`,
      html: `<p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Phone:</strong> ${phone || "N/A"}</p>
             <p><strong>Message:</strong> ${message}</p>`,
    };

    await sgMail.send(msg);

    return NextResponse.json({ message: "Message sent successfully" });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
