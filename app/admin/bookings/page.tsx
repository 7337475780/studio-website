"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Booking = {
  id: string;
  user_id: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      const { data, error } = await supabase.from("Bookings").select("*");
      if (error) console.error(error);
      else setBookings(data || []);
    };
    fetchBookings();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("Bookings")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status } : b))
      );
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Bookings Management</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-900 text-white rounded-lg shadow-lg">
          <thead>
            <tr className="bg-gray-800">
              <th className="py-2 px-4">User ID</th>
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Time</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-gray-700">
                <td className="py-2 px-4">{booking.user_id}</td>
                <td className="py-2 px-4">{booking.date}</td>
                <td className="py-2 px-4">{booking.time}</td>
                <td className="py-2 px-4">{booking.status}</td>
                <td className="py-2 px-4 space-x-2">
                  <button
                    onClick={() => updateStatus(booking.id, "accepted")}
                    className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateStatus(booking.id, "rejected")}
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
    </div>
  );
};

export default BookingsPage;
