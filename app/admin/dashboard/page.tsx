"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaUsers, FaImage, FaBook, FaClock } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      setTotalUsers(usersCount || 0);

      const { count: photosCount } = await supabase
        .from("photos")
        .select("*", { count: "exact", head: true });
      setTotalPhotos(photosCount || 0);

      const { count: bookingsCount } = await supabase
        .from("Bookings")
        .select("*", { count: "exact", head: true });
      setTotalBookings(bookingsCount || 0);

      const { count: pendingCount } = await supabase
        .from("Bookings")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingRequests(pendingCount || 0);
    };

    fetchData();
  }, []);

  const stats = [
    {
      title: "Total Users",
      value: totalUsers,
      icon: <FaUsers className="text-4xl text-blue-400" />,
      gradient: "from-blue-500/30 to-blue-800/30",
      page: "/admin/users",
    },
    {
      title: "Total Photos",
      value: totalPhotos,
      icon: <FaImage className="text-4xl text-pink-400" />,
      gradient: "from-pink-500/30 to-pink-800/30",
      page: "/admin/photos",
    },
    {
      title: "All Bookings",
      value: totalBookings,
      icon: <FaBook className="text-4xl text-green-400" />,
      gradient: "from-green-500/30 to-green-800/30",
      page: "/admin/bookings",
    },
    {
      title: "Pending Requests",
      value: pendingRequests,
      icon: <FaClock className="text-4xl text-yellow-400" />,
      gradient: "from-yellow-500/30 to-yellow-800/30",
      page: "/admin/requests",
    },
  ];

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      <h1 className="text-4xl font-extrabold mb-8 text-center">
        Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            onClick={() => router.push(stat.page)}
            className={`relative group cursor-pointer bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 shadow-xl border border-white/10 backdrop-blur-md transform transition duration-300 hover:scale-105 hover:shadow-2xl`}
          >
            <div className="absolute -top-5 -right-5 bg-black/30 rounded-full p-3">
              {stat.icon}
            </div>
            <h2 className="text-lg font-semibold opacity-80">{stat.title}</h2>
            <p className="text-4xl font-extrabold mt-3">{stat.value}</p>
            <div className="mt-4 h-1 w-20 bg-gradient-to-r from-white/60 to-transparent rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
