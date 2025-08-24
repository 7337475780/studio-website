"use client";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";

const supabase = createClientComponentClient();

export default function AdminRequests() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    let { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("status", "pending");
    if (!error && data) setRequests(data);
  };

  const handleUpdate = async (id: string, status: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    if (!error) {
      toast.success(`Booking ${status}!`);
      fetchRequests();
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">📩 Booking Requests</h1>
      <table className="w-full border border-gray-700">
        <thead>
          <tr className="bg-gray-800">
            <th className="p-2">Name</th>
            <th className="p-2">Date</th>
            <th className="p-2">Service</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.id} className="border-t border-gray-700">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.date}</td>
              <td className="p-2">{r.service}</td>
              <td className="p-2 flex gap-2">
                <button
                  onClick={() => handleUpdate(r.id, "confirmed")}
                  className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleUpdate(r.id, "rejected")}
                  className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
