"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  FaUser,
  FaPhone,
  FaCalendarAlt,
  FaEye,
  FaTrash,
  FaUserShield,
  FaBox,
} from "react-icons/fa";
import toast from "react-hot-toast";

type UserProfile = {
  id: string;
  username?: string;
  full_name?: string;
  email?: string;
  mobile?: string;
  avatar_url?: string;
  role?: string;
  created_at: string;
};

type Booking = {
  id: string;
  date: string;
  time: string;
  status: string;
  Packages?: { name: string } | null;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(
    new Set()
  );

  const [viewUser, setViewUser] = useState<UserProfile | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (!error && data) setUsers(data);
  };

  const toggleDeleteMode = () => {
    setDeleteMode((prev) => !prev);
    setSelectedForDelete(new Set());
  };

  const toggleSelectUser = (id: string) => {
    setSelectedForDelete((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAllUsers = () => {
    if (selectedForDelete.size === currentUsers.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(currentUsers.map((u) => u.id)));
    }
  };

  const handleDeleteUsers = async () => {
    if (selectedForDelete.size === 0) return toast.error("No user selected");
    const ids = Array.from(selectedForDelete);
    try {
      const { error } = await supabase.from("profiles").delete().in("id", ids);
      if (error) throw error;
      toast.success("Users deleted successfully!");
      fetchUsers();
      setSelectedForDelete(new Set());
      setDeleteMode(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete users");
    }
  };

  const toggleUserRole = async (user: UserProfile) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", user.id);
      if (error) throw error;
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  };

  const handleViewUser = async (user: UserProfile) => {
    setViewUser(user);
    try {
      const { data, error } = await supabase
        .from("Bookings")
        .select("id,date,time,status,bookings_package_id_fkey(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const normalized = (data || []).map((b: any) => ({
        ...b,
        Packages: b.bookings_package_id_fkey || null,
      }));

      setUserBookings(normalized);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch bookings");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.id.includes(search)
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold flex items-center gap-2">
          <FaUser /> Users
        </h1>
        <div className="flex gap-2">
          <button
            onClick={toggleDeleteMode}
            className={`px-4 py-2 rounded-lg ${
              deleteMode
                ? "bg-red-600 hover:bg-red-700"
                : "bg-yellow-600 hover:bg-yellow-700"
            }`}
          >
            {deleteMode ? "Cancel Delete" : "Delete Users"}
          </button>
          {deleteMode && (
            <button
              onClick={handleDeleteUsers}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
            >
              Confirm Delete
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search by name, email or ID..."
          className="w-full max-w-md p-3 rounded-xl border border-white/20 bg-[#0a1528] placeholder-gray-400 focus:outline-none focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* User Cards */}
      {currentUsers.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No users found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deleteMode && (
            <div className="col-span-full flex justify-end mb-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={selectedForDelete.size === currentUsers.length}
                  onChange={selectAllUsers}
                />
                <div className="w-5 h-5 rounded-full border-2 border-white/50 bg-gray-700 flex items-center justify-center peer-checked:bg-red-500 transition-all">
                  {selectedForDelete.size === currentUsers.length && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                Select All
              </label>
            </div>
          )}
          {currentUsers.map((user) => (
            <div
              key={user.id}
              className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/80 border border-gray-700/50 rounded-2xl p-6 shadow-lg backdrop-blur-md hover:scale-[1.03] transform transition w-full flex flex-col justify-between"
            >
              {/* Delete Checkbox */}
              {/* Delete Checkbox */}
              {deleteMode && (
                <div className="absolute top-3 right-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={selectedForDelete.has(user.id)}
                      onChange={() => toggleSelectUser(user.id)}
                    />
                    <div className="w-6 h-6 bg-gray-700 rounded-full border-2 border-white/50 peer-checked:bg-red-500 flex items-center justify-center transition-all">
                      {/* Tick Icon */}
                      {selectedForDelete.has(user.id) && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
              )}

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <img
                  src={
                    user.avatar_url ||
                    `https://ui-avatars.com/api/?name=${
                      user.full_name || user.username || "User"
                    }&background=0D8ABC&color=fff&rounded=true&size=128`
                  }
                  alt={user.username || user.full_name}
                  className="w-28 h-28 rounded-full border-2 border-white/30 object-cover"
                />
              </div>

              {/* User Info */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold flex items-center justify-center gap-1">
                  <FaUser /> {user.full_name || user.username || "User"}
                </h3>
                {user.email && (
                  <p className="text-gray-300 text-sm">{user.email}</p>
                )}
                {user.mobile && (
                  <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
                    <FaPhone /> {user.mobile}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1 flex items-center justify-center gap-1">
                  <FaCalendarAlt /> Joined:{" "}
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
                {/* Role */}
                <p
                  className={`text-sm mt-1 px-3 py-1 inline-block rounded-full ${
                    user.role === "admin"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-600 text-white"
                  }`}
                >
                  {user.role?.toUpperCase() || "USER"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-center mt-6 gap-4">
                <button
                  onClick={() => toggleUserRole(user)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-sm transition"
                >
                  <FaUserShield />{" "}
                  {user.role === "admin" ? "Make User" : "Make Admin"}
                </button>
                <button
                  onClick={() => handleViewUser(user)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm transition"
                >
                  <FaEye /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-3">
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-700"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Prev
          </button>
          <span className="px-4 py-2 rounded-lg bg-gray-800">
            {currentPage} / {totalPages}
          </span>
          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:bg-gray-700"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-lg p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewUser(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
            >
              &times;
            </button>

            <div className="flex flex-col items-center">
              <img
                src={
                  viewUser.avatar_url ||
                  `https://ui-avatars.com/api/?name=${
                    viewUser.full_name || viewUser.username || "User"
                  }&background=0D8ABC&color=fff&rounded=true&size=128`
                }
                alt={viewUser.username || viewUser.full_name}
                className="w-28 h-28 rounded-full border-2 border-white/30 object-cover mb-4"
              />

              <h2 className="text-2xl font-bold mb-1">
                {viewUser.full_name || viewUser.username}
              </h2>
              <p className="text-gray-300">{viewUser.email}</p>
              {viewUser.mobile && (
                <p className="text-gray-400 flex items-center justify-center gap-1">
                  <FaPhone /> {viewUser.mobile}
                </p>
              )}
              <p className="text-gray-500 text-sm mt-1">
                Joined: {new Date(viewUser.created_at).toLocaleDateString()}
              </p>
              <p
                className={`mt-2 px-3 py-1 inline-block rounded-full text-sm ${
                  viewUser.role === "admin"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-600 text-white"
                }`}
              >
                {viewUser.role?.toUpperCase() || "USER"}
              </p>

              {/* Bookings */}
              <div className="mt-6 w-full">
                <h3 className="text-lg font-semibold mb-2">Bookings</h3>
                {userBookings.length === 0 ? (
                  <p className="text-gray-400">No bookings found.</p>
                ) : (
                  <ul className="space-y-2 max-h-64 overflow-y-auto">
                    {userBookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex justify-between bg-gray-800 rounded-lg p-2 text-sm"
                      >
                        <span>
                          {b.Packages?.name || "Package N/A"} - {b.date}{" "}
                          {b.time}
                        </span>
                        <span
                          className={`font-semibold ${
                            b.status === "accepted"
                              ? "text-green-400"
                              : b.status === "pending"
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
