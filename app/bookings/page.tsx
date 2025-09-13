"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { PiSpinner } from "react-icons/pi";
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import gsap from "gsap";

interface Booking {
  id: string;
  user_id: string;
  date: string;
  time: string;
  status: "accepted" | "pending" | "rejected";
  package_id: string | null;
  package_name?: string;
  package_price?: number;
  payment_verified_at?: string | null;
  created_at: string;
  full_name: string;
  email: string;
  mobile: string;
  location: string | null; // original coordinates
  readableLocation?: string; // human-readable address
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

// Convert image URL to base64
async function getBase64FromUrl(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

// Convert coordinates to human-readable location using Nominatim
const getReadableLocation = async (coordsText: string | null) => {
  if (!coordsText) return "N/A";

  try {
    let lat: number | null = null;
    let lng: number | null = null;

    try {
      const obj = JSON.parse(coordsText);
      if (obj.lat && obj.lng) {
        lat = parseFloat(obj.lat);
        lng = parseFloat(obj.lng);
      }
    } catch {
      const parts = coordsText.replace(/[{}]/g, "").split(",");
      if (parts.length === 2) {
        lat = parseFloat(parts[0].split(":")[1] || parts[0]);
        lng = parseFloat(parts[1].split(":")[1] || parts[1]);
      }
    }

    if (lat === null || lng === null || isNaN(lat) || isNaN(lng))
      return "Invalid coordinates";

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "User-Agent": "BookingsApp/1.0 (your-email@example.com)",
          "Accept-Language": "en",
        },
      }
    );

    if (!res.ok) return "Unknown location";

    const data = await res.json();
    return data.display_name || "Unknown location";
  } catch {
    return "Unknown location";
  }
};

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

  // Fetch bookings and resolve readable locations
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;

    const fetchBookings = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("Bookings")
        .select(
          `
          id,
          date,
          time,
          status,
          full_name,
          email,
          mobile,
          location,
          package_id,
          bookings_package_id_fkey (name, price)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching bookings:", error.message);
        toast.error("Failed to load bookings");
      } else {
        const normalized = (data || []).map((b: any) => ({
          ...b,
          package_name: b.bookings_package_id_fkey?.name || "Unknown",
          package_price: b.bookings_package_id_fkey?.price || 0,
        }));

        const withLocation = await Promise.all(
          normalized.map(async (b) => ({
            ...b,
            readableLocation: await getReadableLocation(b.location),
          }))
        );

        if (isMounted) setBookings(withLocation);
      }

      setLoading(false);
    };

    fetchBookings();

    return () => {
      isMounted = false;
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

  // Download invoice
  const downloadInvoice = async (b: Booking) => {
    const doc = new jsPDF();
    const issueDate = new Date().toLocaleDateString();

    const qrDataUrl = await QRCode.toDataURL(
      JSON.stringify({ bookingId: b.id, customer: b.full_name })
    );
    doc.addImage(qrDataUrl, "PNG", 160, 10, 35, 35);

    try {
      const base64Logo = await getBase64FromUrl("/images/logo.png");
      doc.addImage(base64Logo, "PNG", 14, 10, 30, 30);
    } catch {
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SURESH DIGITALS", 14, 25);
    }

    doc.setFont("helvetica", "italic");
    doc.setFontSize(11);
    doc.setTextColor(100);

    doc.setFillColor(41, 128, 185);
    doc.rect(0, 45, 210, 12, "F");
    doc.setFontSize(14);
    doc.setTextColor(255);
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE", 105, 53, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 14, 70);
    doc.setFont("helvetica", "normal");
    doc.text(b.full_name, 14, 78);
    doc.text(b.email, 14, 84);
    doc.text(b.mobile, 14, 90);
    doc.text(b.readableLocation || "N/A", 14, 96);

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(
      "Terms: This invoice is computer-generated and valid without signature.",
      14,
      pageHeight - 20
    );
    doc.setFont("helvetica", "italic");
    doc.text(
      "Thank you for choosing Suresh Digitals – We make your memories timeless!",
      14,
      pageHeight - 12
    );

    const base = b.package_price || 0;
    autoTable(doc, {
      startY: 110,
      head: [["Package", "Price"]],
      body: [[b.package_name || "Unknown", `₹${base.toFixed(2)}`]],
      styles: { halign: "center", font: "helvetica", fontSize: 11 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
    });

    doc.save(`invoice_${b.id}.pdf`);
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
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-white">Location:</span>{" "}
                  {b.readableLocation || "N/A"}
                </p>
              </div>

              <div className="mt-3 md:mt-0 flex flex-col gap-2">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center ${
                    statusStyles[b.status]
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
