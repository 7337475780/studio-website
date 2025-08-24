"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaUsers, FaImage, FaBook, FaCheck } from "react-icons/fa";

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // ✅ Users count (from profiles table if exists, else auth.users)
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      setTotalUsers(usersCount || 0);

      // ✅ Photos count
      const { count: photosCount } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true });
      setTotalPhotos(photosCount || 0);

      // ✅ Bookings count
      const { count: bookingsCount } = await supabase
        .from("Bookings")
        .select("*", { count: "exact", head: true });
      setTotalBookings(bookingsCount || 0);

      // ✅ Pending requests count
      const { count: pendingCount } = await supabase
        .from("Bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingRequests(pendingCount || 0);
    };

    fetchData();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Users */}
        <div className="bg-[#0a1528] p-6 rounded-xl shadow-lg flex flex-col items-center">
          <FaUsers className="text-3xl text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold text-white">Total Users</h2>
          <p className="text-2xl font-bold text-white">{totalUsers}</p>
        </div>

        {/* Photos */}
        <div className="bg-[#0a1528] p-6 rounded-xl shadow-lg flex flex-col items-center">
          <FaImage className="text-3xl text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold text-white">Total Photos</h2>
          <p className="text-2xl font-bold text-white">{totalPhotos}</p>
        </div>

        {/* Bookings */}
        <div className="bg-[#0a1528] p-6 rounded-xl shadow-lg flex flex-col items-center">
          <FaBook className="text-3xl text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold text-white">All Bookings</h2>
          <p className="text-2xl font-bold text-white">{totalBookings}</p>
        </div>

        {/* Pending Requests */}
        <div className="bg-[#0a1528] p-6 rounded-xl shadow-lg flex flex-col items-center">
          <FaCheck className="text-3xl text-blue-400 mb-2" />
          <h2 className="text-lg font-semibold text-white">Pending Requests</h2>
          <p className="text-2xl font-bold text-white">{pendingRequests}</p>
        </div>
      </div>
    </div>
  );
}
