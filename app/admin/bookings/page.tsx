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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    fetchPackages();
    fetchBookings();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase.from("Packages").select("id,name");
    if (error) {
      console.error("Error fetching packages:", error.message);
      toast.error("Failed to load packages");
    } else {
      setPackages(data || []);
    }
  };

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
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bookings:", error.message);
      toast.error("Failed to load bookings");
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

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const searchMatch =
      searchTerm === "" ||
      b.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.mobile.toLowerCase().includes(searchTerm.toLowerCase());

    const statusMatch = statusFilter === "all" || b.status === statusFilter;
    const packageMatch =
      packageFilter === "all" || b.package_id === packageFilter;

    const dateMatch =
      (!startDate || b.date >= startDate) && (!endDate || b.date <= endDate);

    return searchMatch && statusMatch && packageMatch && dateMatch;
  });

  if (loading) {
    return (
      <p className="text-center py-10 text-gray-400">Loading bookings...</p>
    );
  }

  if (bookings.length === 0) {
    return (
      <p className="text-center py-10 text-gray-400">No bookings found.</p>
    );
  }

  return (
    <div className="p-6">
      {/* Search + Filters in a futuristic row */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        {/* Search */}
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or mobile"
          className="
            px-4 py-2 rounded-lg flex-1 min-w-[200px] 
            bg-gray-900/80 text-gray-200 border border-gray-700
            placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400
            transition-shadow duration-300 shadow-md
            hover:shadow-lg
          "
        />

        {/* Filters panel */}
        <div className="flex flex-wrap gap-3  rounded-lg p-2   shadow-inner">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="
              px-3 py-2 rounded-lg bg-gray-900/80 text-gray-200 border border-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400
              transition-shadow duration-300 shadow-md hover:shadow-lg
            "
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Package Filter */}
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="
              px-3 py-2 rounded-lg bg-gray-900/80 text-gray-200 border border-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400
              transition-shadow duration-300 shadow-md hover:shadow-lg
            "
          >
            <option value="all">All Packages</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="
              px-3 py-2 rounded-lg bg-gray-900/80 text-gray-200 border border-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400
              transition-shadow duration-300 shadow-md hover:shadow-lg
            "
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="
              px-3 py-2 rounded-lg bg-gray-900/80 text-gray-200 border border-gray-700
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400
              transition-shadow duration-300 shadow-md hover:shadow-lg
            "
          />
        </div>
      </div>

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBookings.map((booking) => (
          <Card
            key={booking.id}
            className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/50 backdrop-blur-xl shadow-lg shadow-blue-500/10 rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse blur-2xl" />

            <CardHeader className="relative flex justify-between items-center z-10">
              <h3 className="text-lg font-semibold text-white drop-shadow">
                {booking.full_name}
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium shadow-md ${
                  booking.status === "accepted"
                    ? "bg-green-500/20 text-green-300 border border-green-500/40"
                    : booking.status === "rejected"
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                }`}
              >
                {booking.status}
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
