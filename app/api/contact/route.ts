import { NextRequest, NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

// In-memory rate limiter (replace with Redis in production)
const rateLimit: Record<string, { count: number; lastRequest: number }> = {};

export async function POST(req: NextRequest) {
  try {
    // Get IP safely
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // Rate limiting (5 req/hour)
    const now = Date.now();
    const windowMs = 60 * 60 * 1000;
    const maxRequests = 5;

    if (!rateLimit[ip]) {
      rateLimit[ip] = { count: 1, lastRequest: now };
    } else {
      const elapsed = now - rateLimit[ip].lastRequest;
      if (elapsed > windowMs) {
        rateLimit[ip] = { count: 1, lastRequest: now };
      } else {
        rateLimit[ip].count++;
        if (rateLimit[ip].count > maxRequests) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 }
          );
        }
      }
    }

    const { name, email, phone, message, _honeypot } = await req.json();

    // Honeypot anti-spam
    if (_honeypot) {
      return NextResponse.json({ error: "Spam detected" }, { status: 400 });
    }

    // Validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (message.length > 2000) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const studioName = "Suresh Digitals";
    const studioEmail = process.env.ADMIN_EMAIL!;
    const websiteUrl = "https://sureshdigitals.vercel.app";

    // Admin notification
    const adminMsg = {
      to: studioEmail,
      from: studioEmail,
      subject: `📸 New Booking/Inquiry from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${
        phone || "N/A"
      }\nMessage: ${message}`,
      html: `
        <h3>New Inquiry Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    };

    // Client auto-reply
    const clientMsg = {
      to: email,
      from: studioEmail,
      subject: `✅ We've received your message – ${studioName}`,
      text: `Hi ${name},\n\nThanks for reaching out to ${studioName}! We've received your inquiry and will get back to you within 24 hours.\n\nMeanwhile, you can explore our portfolio here: ${websiteUrl}\n\nWarm regards,\n${studioName} Team`,
      html: `
        <div style="font-family:Arial, sans-serif; line-height:1.6; color:#333;">
          <h2 style="color:#4f46e5;">Hi ${name},</h2>
          <p>
            Thank you for contacting <b>${studioName}</b>. 
            We've received your message and will get back to you within <b>24 hours</b>.
          </p>
          <p>
            Meanwhile, feel free to explore our 
            <a href="${websiteUrl}" target="_blank" style="color:#4f46e5; text-decoration:none;">portfolio</a>.
          </p>
          <br/>
          <p>Warm regards,<br/><b>${studioName} Team</b></p>
        </div>
      `,
    };

    // Send both
    await Promise.all([sgMail.send(adminMsg), sgMail.send(clientMsg)]);

    return NextResponse.json({ message: "Message sent successfully" });
  } catch (err: any) {
    console.error("SendGrid Error:", err.response?.body || err.message);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
