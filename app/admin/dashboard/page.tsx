"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  FaUsers,
  FaImage,
  FaBook,
  FaClock,
  FaPlus,
  FaBell,
  FaDownload,
  FaTimes,
  FaPaperPlane,
  FaCheck,
  FaTimesCircle,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";

type Booking = {
  id: string;
  full_name: string;
  date: string;
  time: string;
  status: string;
  Packages?: { name: string } | null;
};

type MonthlyBooking = {
  month: string;
  count: number;
};

type PackageCount = {
  name: string;
  count: number;
};

export default function AdminDashboard() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [recentRequests, setRecentRequests] = useState<Booking[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [monthlyBookings, setMonthlyBookings] = useState<MonthlyBooking[]>([]);
  const [topPackages, setTopPackages] = useState<PackageCount[]>([]);
  const [notifications, setNotifications] = useState<
    { id: string; type: string; message: string; created_at: string }[]
  >([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchStats();
    fetchRecentRequests();
    fetchRecentUsers();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    generateNotifications();
  }, [recentUsers, recentRequests]);

  const fetchStats = async () => {
    try {
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch stats");
    }
  };

  const fetchRecentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("Bookings")
        .select(
          "id, full_name, date, time, status, bookings_package_id_fkey(name)"
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;

      const normalized = (data || []).map((b: any) => ({
        ...b,
        Packages: b.bookings_package_id_fkey || null,
      }));

      setRecentRequests(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch recent requests");
    }
  };

  const fetchRecentUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, created_at")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch recent users");
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data: bookings } = await supabase
        .from("Bookings")
        .select("id, date, status, bookings_package_id_fkey(name)");

      // Monthly Bookings (last 6 months)
      const monthsMap: Record<string, number> = {};
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStr = d.toLocaleString("default", { month: "short" });
        monthsMap[monthStr] = 0;
      }
      bookings?.forEach((b: any) => {
        if (b.status === "accepted") {
          const date = new Date(b.date);
          const monthStr = date.toLocaleString("default", { month: "short" });
          if (monthStr in monthsMap) monthsMap[monthStr]++;
        }
      });
      setMonthlyBookings(
        Object.entries(monthsMap).map(([month, count]) => ({ month, count }))
      );

      // Top Packages
      const packageCountMap: Record<string, number> = {};
      bookings?.forEach((b: any) => {
        if (b.status === "accepted") {
          const name = b.bookings_package_id_fkey?.name || "N/A";
          packageCountMap[name] = (packageCountMap[name] || 0) + 1;
        }
      });
      const topPackagesArray = Object.entries(packageCountMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setTopPackages(topPackagesArray);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch analytics");
    }
  };

  const generateNotifications = () => {
    const notif: {
      id: string;
      type: string;
      message: string;
      created_at: string;
    }[] = [];

    recentUsers.forEach((u) => {
      notif.push({
        id: `user-${u.id}`,
        type: "new_user",
        message: `New user signed up: ${u.username}`,
        created_at: u.created_at,
      });
    });

    recentRequests.forEach((r) => {
      notif.push({
        id: `booking-${r.id}`,
        type: "booking_request",
        message: `New booking request from ${r.full_name}`,
        created_at: new Date().toISOString(),
      });
    });

    notif.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setNotifications(notif);
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
        toast.error("Failed to update request");
      } else {
        toast.success(`Request ${status}`);
        setRecentRequests((prev) => prev.filter((r) => r.id !== id));
        setPendingRequests((prev) => prev - 1);
        fetchAnalytics(); // update charts
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

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
      page: "/gallery",
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

  const quickActions = [
    {
      title: "Add Package",
      icon: <FaPlus />,
      onClick: () => router.push("/admin/packages"),
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Send Notification",
      icon: <FaBell />,
      onClick: () => setShowModal(true),
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Export Bookings",
      icon: <FaDownload />,
      onClick: async () => {
        const { data } = await supabase.from("Bookings").select("*");
        if (!data) return toast.error("No data to export");
        const csv = [
          Object.keys(data[0]).join(","),
          ...data.map((row: any) => Object.values(row).join(",")),
        ].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `bookings_export.csv`;
        link.click();
        URL.revokeObjectURL(url);
      },
      color: "bg-green-500 hover:bg-green-600",
    },
  ];

  const sendNotification = () => {
    if (!notificationMsg.trim()) return toast.error("Message cannot be empty");
    toast.success("Notification sent: " + notificationMsg);
    setNotificationMsg("");
    setShowModal(false);
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white relative">
      <h1 className="text-4xl font-extrabold mb-8 text-center">
        Admin Dashboard
      </h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <button
            key={action.title}
            onClick={action.onClick}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold shadow-md transition transform hover:scale-105 ${action.color}`}
          >
            {action.icon} {action.title}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Recent Booking Requests */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recent Booking Requests</h2>
        {recentRequests.length === 0 && (
          <p className="text-gray-400">No pending requests</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentRequests.map((b) => (
            <div
              key={b.id}
              className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/50 backdrop-blur-xl shadow-lg shadow-blue-500/10 rounded-2xl overflow-hidden transition-transform transform hover:scale-[1.02] p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {b.full_name}
              </h3>
              <p className="text-gray-300 mb-1">
                Package: {b.Packages?.name || "N/A"}
              </p>
              <p className="text-gray-300 mb-1">
                Date: {b.date} | Time: {b.time}
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleUpdateStatus(b.id, "accepted")}
                  className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                >
                  <FaCheck /> Accept
                </button>
                <button
                  onClick={() => handleUpdateStatus(b.id, "rejected")}
                  className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
                >
                  <FaTimesCircle /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-900/70 p-6 rounded-2xl shadow-lg backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-4">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00f6ff"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900/70 p-6 rounded-2xl shadow-lg backdrop-blur-md">
          <h3 className="text-xl font-semibold mb-4">Top Packages</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topPackages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-lg relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <FaTimes />
            </button>
            <h3 className="text-lg font-semibold mb-4">Send Notification</h3>
            <textarea
              value={notificationMsg}
              onChange={(e) => setNotificationMsg(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3 rounded-lg bg-gray-800 text-white resize-none mb-4"
            />
            <button
              onClick={sendNotification}
              className="w-full bg-purple-500 hover:bg-purple-600 py-2 rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <FaPaperPlane /> Send
            </button>
          </div>
        </div>
      )}

      {/* Notifications Dropdown */}
      <div className="fixed top-5 right-5">
        <button
          onClick={() => setShowNotif((prev) => !prev)}
          className="bg-gray-800/50 p-3 rounded-full shadow-lg hover:bg-gray-700/70"
        >
          <FaBell className="text-xl text-yellow-400" />
        </button>
        {showNotif && (
          <div className="mt-2 bg-gray-900 p-4 rounded-2xl shadow-lg w-80 max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Notifications</h4>
            {notifications.length === 0 && (
              <p className="text-gray-400">No notifications</p>
            )}
            {notifications.map((n) => (
              <div
                key={n.id}
                className="mb-2 p-2 rounded-lg bg-gray-800/40 hover:bg-gray-700/50"
              >
                <p className="text-sm">{n.message}</p>
                <p className="text-xs text-gray-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
