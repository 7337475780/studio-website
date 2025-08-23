"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { PiSpinner } from "react-icons/pi";
import gsap from "gsap";

interface Booking {
  id: string;
  date: string;
  time: string;
  status: string;
  package_id: string;
  created_at: string;
}

const BookingsPage = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        toast.error("Error fetching user");
        console.error(error);
      } else {
        setUserId(data?.user?.id ?? null);
      }
    };
    fetchUser();
  }, []);

  // Fetch bookings & subscribe to real-time updates
  useEffect(() => {
    if (!userId) return;

    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from<Booking>("Bookings")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Error fetching bookings");
        console.error(error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    };

    fetchBookings();

    // ✅ Supabase v2 Realtime channel
    const bookingChannel = supabase
      .channel(`realtime-bookings-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Booking }) => {
          setBookings((prev) => [payload.new, ...prev]);
          toast.success("New booking added!");
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "Bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { new: Booking }) => {
          setBookings((prev) =>
            prev.map((b) => (b.id === payload.new.id ? payload.new : b))
          );
          toast(`Booking updated: ${payload.new.date} at ${payload.new.time}`);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "Bookings",
          filter: `user_id=eq.${userId}`,
        },
        (payload: { old: Booking }) => {
          setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
          toast.error("Booking cancelled");
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      bookingChannel.unsubscribe();
    };
  }, [userId]);

  // GSAP animation on bookings list
  useLayoutEffect(() => {
    if (listRef.current && bookings.length > 0) {
      gsap.from(listRef.current.children, {
        opacity: 0,
        y: 20,
        stagger: 0.1,
        duration: 0.6,
        ease: "power3.out",
      });
    }
  }, [bookings]);

  // User not logged in
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4">
        <p className="text-red-500 font-medium">
          Please log in to view your bookings.
        </p>
        <button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: window.location.origin + "/bookings" },
            });
            if (error) toast.error(error.message);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex gap-2 justify-center items-center h-40">
        <PiSpinner className="animate-spin text-xl" />
        <p>Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">Your Bookings</h1>
      {bookings.length === 0 ? (
        <p className="text-gray-300 animate-fade-in">
          You have no bookings yet.
        </p>
      ) : (
        <ul ref={listRef} className="space-y-4">
          {bookings.map((b) => (
            <li
              key={b.id}
              className="p-4 border rounded bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl text-white flex justify-between items-center"
            >
              <div>
                <p>
                  <strong>Date:</strong> {b.date}
                </p>
                <p>
                  <strong>Time:</strong> {b.time}
                </p>
                <p>
                  <strong>Package ID:</strong> {b.package_id}
                </p>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    b.status === "paid"
                      ? "bg-green-600 text-white"
                      : b.status === "pending"
                      ? "bg-yellow-500 text-black"
                      : "bg-red-600 text-white"
                  }`}
                >
                  {b.status.toUpperCase()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BookingsPage;
