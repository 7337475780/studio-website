"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserProfile = {
  id: string;
  email: string;
  created_at: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (!error && data) setUsers(data);
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.id.includes(search)
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const currentUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white">
      <h1 className="text-3xl font-extrabold mb-6 text-center">👥 All Users</h1>

      {/* Search */}
      <div className="mb-6 flex justify-center">
        <input
          type="text"
          placeholder="Search by email or ID..."
          className="w-full max-w-md p-3 rounded-xl border border-white/20 bg-[#0a1528] placeholder-gray-400 focus:outline-none focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-lg border border-white/10 bg-[#0a1528] p-4">
        {currentUsers.length === 0 ? (
          <p className="text-center text-gray-400 py-10">No users found.</p>
        ) : (
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="bg-gradient-to-r from-blue-500/30 to-blue-800/30">
                <th className="p-3 rounded-tl-lg">ID</th>
                <th className="p-3">Email</th>
                <th className="p-3 rounded-tr-lg">Joined</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`border-b border-gray-700 hover:bg-white/10 transition duration-200 ${
                    idx % 2 === 0 ? "bg-white/5" : ""
                  }`}
                >
                  <td className="p-3 break-words">{user.id}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-3">
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
    </div>
  );
}
