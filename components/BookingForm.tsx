"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { PiSpinner } from "react-icons/pi";
import BookingCalendar from "./Calendar"; // Dark-themed calendar

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BookingForm = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [packages, setPackages] = useState<
    { id: string; name: string; price: number }[]
  >([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("10:00");

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      const res = await fetch("/api/packages");
      const data = await res.json();
      setPackages(data);
      if (data.length > 0) setSelectedPackage(data[0].id);
    };
    fetchPackages();
  }, []);

  // Get logged-in user
  useEffect(() => {
    const getUser = async () => {
      setAuthLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error.message);
      setUserId(data?.user?.id ?? null);
      setAuthLoading(false);
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUserId(session?.user?.id ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // Handle booking + payment
  const handleBooking = async () => {
    if (!userId) return toast.error("Please log in to book a session");
    if (!selectedPackage) return toast.error("Please select a package");

    setLoading(true);

    const { data: booking, error } = await supabase
      .from("Bookings")
      .insert([
        {
          user_id: userId,
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          status: "pending",
          package_id: selectedPackage,
        },
      ])
      .select()
      .single();

    setLoading(false);

    if (error || !booking) {
      toast.error(error?.message || "Error creating booking");
      return;
    }

    toast.success("Booking created! Proceeding to payment...");

    // Create Razorpay order
    const pkg = packages.find((p) => p.id === selectedPackage);
    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: pkg?.price || 500,
        bookingId: booking.id,
      }),
    });
    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: "INR",
      name: "Suresh Digitals",
      description: `${pkg?.name} Package`,
      order_id: order.id,
      handler: async (response: any) => {
        try {
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

  // Auth loading / login UI
  if (authLoading) {
    return (
      <div className="flex gap-1 justify-center items-center h-40">
        <PiSpinner className="animate-spin text-xl" />
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
              options: { redirectTo: window.location.origin },
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
    <div className="max-w-md mx-auto p-4 rounded shadow-md bg-gray-900 text-white">
      <BookingCalendar
        date={selectedDate}
        setDate={setSelectedDate}
        time={selectedTime}
        setTime={setSelectedTime}
      />

      <div className="mt-4">
        <label className="block mb-2 font-medium">Select Package:</label>
        <select
          value={selectedPackage ?? ""}
          onChange={(e) => setSelectedPackage(e.target.value)}
          className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
        >
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} - ₹{pkg.price}
            </option>
          ))}
        </select>
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
