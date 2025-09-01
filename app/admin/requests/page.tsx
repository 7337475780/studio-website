"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader } from "@/components/Card";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaBox,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

type Booking = {
  id: string;
  date: string;
  time: string;
  status: string;
  full_name: string;
  email: string;
  mobile: string;
  location: string | null;
  package_id: string | null;
  Packages?: { name: string } | null;
  readableLocation?: string;
};

type Package = {
  id: string;
  name: string;
};

export default function BookingRequestsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

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
        bookings_package_id_fkey (name)
      `
      )
      .eq("status", "pending") // only pending requests
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error.message);
      toast.error("Failed to load booking requests");
    } else {
      const normalized = (data || []).map((b: any) => ({
        ...b,
        Packages: b.bookings_package_id_fkey || null,
      }));

      const withLocation = await Promise.all(
        normalized.map(async (b) => ({
          ...b,
          readableLocation: await getReadableLocation(b.location),
        }))
      );

      setBookings(withLocation);
    }

    setLoading(false);
  };

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
            "User-Agent": "BookingRequestsApp/1.0 (your-email@example.com)",
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

  const handleUpdateStatus = async (
    id: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      const { error } = await supabase
        .from("Bookings")
        .update({ status })
        .eq("id", id);

      if (error) {
        toast.error("Failed to update status");
        console.error(error);
      } else {
        setBookings((prev) => prev.filter((b) => b.id !== id)); // remove from requests
        toast.success(`Booking ${status}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  if (loading) {
    return (
      <p className="text-center py-10 text-gray-400">
        Loading booking requests...
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <p className="text-center py-10 text-gray-400">
        No pending booking requests.
      </p>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 drop-shadow">
        Booking Requests
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.map((booking) => (
          <Card
            key={booking.id}
            className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/50 backdrop-blur-xl shadow-lg shadow-blue-500/10 rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse blur-2xl" />

            <CardHeader className="relative flex justify-between items-center z-10">
              <h3 className="text-lg font-semibold text-white drop-shadow">
                {booking.full_name}
              </h3>
              <span className="px-3 py-1 rounded-full text-sm font-medium shadow-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                Pending
              </span>
            </CardHeader>

            <CardContent className="relative z-10">
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center">
                  <FaEnvelope className="mr-2 text-blue-400" />
                  {booking.email}
                </div>
                <div className="flex items-center">
                  <FaPhone className="mr-2 text-green-400" />
                  {booking.mobile}
                </div>
                <div className="flex items-center">
                  <FaBox className="mr-2 text-purple-400" />
                  {booking.Packages?.name || "N/A"}
                </div>
                <div className="flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-red-400" />
                  {booking.readableLocation || "N/A"}
                </div>
                <div className="flex items-center">
                  <FaCalendarAlt className="mr-2 text-indigo-400" />
                  {booking.date}
                </div>
                <div className="flex items-center">
                  <FaClock className="mr-2 text-yellow-400" />
                  {booking.time}
                </div>
              </div>

              {/* Accept / Reject Buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleUpdateStatus(booking.id, "accepted")}
                  className="px-3 cursor-pointer py-2 w-full rounded-lg bg-green-500 text-white hover:bg-green-600 transition shadow-md hover:shadow-lg"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleUpdateStatus(booking.id, "rejected")}
                  className="px-3 cursor-pointer w-full py-2 rounded-lg bg-red-500 text-white  hover:bg-red-600 transition shadow-md hover:shadow-lg"
                >
                  Reject
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
