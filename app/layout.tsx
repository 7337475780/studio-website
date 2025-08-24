import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import AuthProvider from "@/components/AuthProvider";
import Script from "next/script";
import { NotificationsProvider } from "@/components/NotificationProvider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: "600",
});

export const metadata: Metadata = {
  title: "Suresh Digitals",
  description:
    "Suresh Digitals offers professional photography services including weddings, portraits, events, and more. Explore our portfolio, book sessions online, and get high-quality digital or print photos delivered securely. Your memories captured perfectly.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <AuthProvider>
          <NotificationsProvider>
            <Toaster position="top-center" />
            <Navbar />
            {children}
          </NotificationsProvider>
        </AuthProvider>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
