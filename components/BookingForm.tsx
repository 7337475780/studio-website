"use client";
import "react-calendar/dist/Calendar.css";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import Calendar from "react-calendar";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BookingForm = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("10:00");
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("Error fetching user:", error.message);
      setUserId(data?.user?.id ?? null);
      setAuthLoading(false);
    };
    getUser();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Fetch booked slots for selected date
  useEffect(() => {
    const fetchBookedSlots = async () => {
      const selectedDate = date.toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("Bookings")
        .select("time")
        .eq("date", selectedDate);

      if (error) {
        console.error("Error fetching slots:", error.message);
      } else {
        setBookedSlots(data?.map((d) => d.time) || []);
      }
    };
    fetchBookedSlots();
  }, [date]);

  // Handle booking + payment
  const handleBooking = async () => {
    if (!userId) return toast.error("Please log in to book a session");

    if (bookedSlots.includes(time)) {
      return toast.error("This time slot is already booked");
    }

    setLoading(true);

    const { data: booking, error } = await supabase
      .from("Bookings")
      .insert([
        {
          user_id: userId,
          date: date.toISOString().split("T")[0],
          time,
          status: "pending",
          package_id: 1,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Booking created! Proceeding to payment...");

    // Create Razorpay order
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 500, bookingId: booking.id }),
    });
    const order = await res.json();

    // Open Razorpay checkout
    // Inside handleBooking -> options
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: "INR",
      name: "Suresh Digitals",
      description: "Photo Session Booking",
      order_id: order.id,
      handler: async function (response: any) {
        try {
          // Send payment details to backend for verification
          const verifyRes = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bookingId: booking.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();

          if (verifyData.success) {
            toast.success("Payment successful! Booking confirmed.");
          } else {
            toast.error("Payment verification failed!");
          }
        } catch (err) {
          console.error("Verify error:", err);
          toast.error("Error verifying payment");
        }
      },
      theme: { color: "#1e3a8a" },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // UI
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Checking login status...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4">
        <p className="text-red-500 font-medium">
          Please log in to book a session.
        </p>
        <button
          onClick={async () => {
            const { error } = await supabase.auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: `${window.location.origin}/` },
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

  return (
    <div className="max-w-md mx-auto p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-center">Book a Session</h2>

      <Calendar
        value={date}
        onChange={(value) => {
          if (value instanceof Date) setDate(value);
        }}
        minDate={new Date()}
      />

      <div className="mt-4">
        <label className="block mb-2 font-medium">Select Time:</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full p-2 border rounded"
        />
        {bookedSlots.includes(time) && (
          <p className="text-red-500 text-sm mt-1">
            This time is already booked. Please choose another
          </p>
        )}
      </div>

      <button
        onClick={handleBooking}
        disabled={loading}
        className="w-full mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Booking..." : "Book Now"}
      </button>
    </div>
  );
};

export default BookingForm;
