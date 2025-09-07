"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { PiSpinner } from "react-icons/pi";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDollarSign,
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import gsap from "gsap";
import confetti from "canvas-confetti";

interface Booking {
  id: string;
  user_id: string;
  date: string;
  time: string;
  status: "accepted" | "pending" | "rejected";
  package_id: string | null;
  package_name?: string;
  package_price?: number;
  package_image?: string;
  payment_verified_at?: string | null;
  created_at: string;
  full_name: string;
  email: string;
  mobile: string;
  location: string;
}

const statusStyles = {
  accepted: "bg-green-600 text-white",
  pending: "bg-yellow-500 text-black",
  rejected: "bg-red-600 text-white",
};

const statusIcons = {
  accepted: <FiCheckCircle className="inline mr-1" />,
  pending: <FiClock className="inline mr-1" />,
  rejected: <FiXCircle className="inline mr-1" />,
};

function FirstLetterToUpperCase(word: string) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const BookingsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast.error("Error fetching user");
        console.error(error);
      } else {
        setUserId(data?.user?.id ?? null);
      }
    };
    fetchUser();
  }, []);

  // Fetch bookings + packages
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchBookingsWithPackages = async () => {
      try {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("Bookings")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;

        const packageIds =
          bookingsData?.map((b: any) => b.package_id).filter(Boolean) || [];

        let packagesData: any[] = [];
        if (packageIds.length > 0) {
          const { data: pkgs, error: packagesError } = await supabase
            .from("Packages")
            .select("id, name, price")
            .in("id", packageIds);

          if (packagesError) throw packagesError;
          packagesData = pkgs || [];
        }

        const bookingsWithPackages = (bookingsData || []).map((b: any) => {
          const pkg = packagesData.find((p) => p.id === b.package_id);
          return {
            ...b,
            package_name: pkg?.name || "Unknown",
            package_price: pkg?.price,
          };
        });

        if (isMounted) setBookings(bookingsWithPackages);
      } catch (err: any) {
        toast.error("Error fetching bookings");
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBookingsWithPackages();

    // Realtime subscription
    const channel = supabase
      .channel(`realtime-bookings-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (!isMounted) return;

          if (payload.eventType === "INSERT") {
            setBookings((prev) => [payload.new, ...prev]);
            toast.success("New booking added!");
          } else if (payload.eventType === "UPDATE") {
            setBookings((prev) =>
              prev.map((b) => (b.id === payload.new.id ? payload.new : b))
            );
            if (payload.new.status === "accepted") {
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
              toast.success(`Booking confirmed for ${payload.new.date}!`);
            }
          } else if (payload.eventType === "DELETE") {
            setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
            toast.error("Booking cancelled");
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [userId]);

  // GSAP animation
  useLayoutEffect(() => {
    if (listRef.current && bookings.length > 0) {
      gsap.from(listRef.current.children, {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
      });
    }
  }, [bookings]);

  // Download invoice + send email
  const downloadInvoice = async (b: Booking) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Booking Invoice", 14, 20);

    doc.setFontSize(12);
    doc.text(`Booking ID: ${b.id}`, 14, 30);
    doc.text(`Name: ${b.full_name}`, 14, 37);
    doc.text(`Email: ${b.email}`, 14, 44);
    doc.text(`Mobile: ${b.mobile}`, 14, 51);
    doc.text(
      `Date & Time: ${new Date(b.date).toLocaleDateString()} ${b.time}`,
      14,
      58
    );
    doc.text(
      `Package: ${b.package_name || "Unknown"} - ₹${b.package_price || 0}`,
      14,
      65
    );

    // Add table
    autoTable(doc, {
      startY: 80,
      head: [["Package", "Price (₹)"]],
      body: [[b.package_name || "Unknown", b.package_price || 0]],
    });

    // Generate QR
    const qrDataUrl = await QRCode.toDataURL(b.id);
    doc.addImage(qrDataUrl, "PNG", 150, 20, 40, 40);

    // Save PDF
    doc.save(`invoice_${b.id}.pdf`);

    // Send email with invoice
    const pdfBase64 = doc.output("datauristring").split(",")[1];
    await fetch("/api/send-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: b.email,
        subject: "Your Booking Invoice",
        text: `Hi ${b.full_name}, your booking invoice is attached.`,
        pdfBase64,
      }),
    });

    toast.success("Invoice downloaded & emailed!");
  };

  if (!userId)
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4">
        <p className="text-red-400 font-medium text-lg">
          Please log in to view your bookings.
        </p>
        <button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin + "/bookings" },
            });
            if (error) toast.error(error.message);
          }}
          className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:scale-105 transition-transform duration-300"
        >
          Continue with Google
        </button>
      </div>
    );

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <PiSpinner className="animate-spin text-3xl text-white" />
        <p className="text-white text-lg">Loading your bookings...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6">
      <h1 className="text-4xl font-bold mb-8 text-white text-center">
        Your Bookings
      </h1>

      {bookings.length === 0 ? (
        <p className="text-gray-400 text-center text-lg animate-fade-in">
          You have no bookings yet.
        </p>
      ) : (
        <ul ref={listRef} className="space-y-6 max-w-4xl mx-auto">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="p-6 rounded-2xl bg-[rgba(255,255,255,0.05)] backdrop-blur-md border border-gray-700 shadow-lg flex flex-col md:flex-row justify-between items-center hover:scale-105 hover:shadow-2xl transition-transform duration-300"
            >
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Date:</span>{" "}
                  {new Date(b.date).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Time:</span>{" "}
                  {b.time}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Package:</span>{" "}
                  {b.package_name}
                </p>
                <p className="text-sm text-gray-300 flex items-center gap-1">
                  <FiDollarSign />
                  <span className="font-semibold text-white">Price:</span> ₹
                  {b.package_price || 0}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Payment:</span>{" "}
                  {b.payment_verified_at ? (
                    <span className="text-green-400">Verified</span>
                  ) : (
                    <span className="text-yellow-400">Pending</span>
                  )}
                </p>
              </div>

              <div className="mt-3 md:mt-0 flex flex-col gap-2">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center ${
                    statusStyles[b.status] || "bg-gray-500 text-white"
                  }`}
                >
                  {statusIcons[b.status]}
                  {FirstLetterToUpperCase(b.status)}
                </span>

                <button
                  onClick={() => downloadInvoice(b)}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded shadow-sm transition"
                >
                  Download
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookingsPage;
