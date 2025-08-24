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

  useEffect(() => {
    const fetchUsers = async () => {
      // assuming you store user data in "profiles" table
      const { data, error } = await supabase.from("profiles").select("*");
      if (!error && data) {
        setUsers(data);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Users</h1>
      <div className="bg-gray-900 rounded-lg shadow p-4">
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700">
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">{user.email}</td>
                  <td className="p-2">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
