"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { PiSpinner } from "react-icons/pi";
import BookingCalendar from "./Calendar";
import MapPicker from "./MapPicker";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const BookingForm = () => {
  const router = useRouter();

  // User & Auth
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Booking info
  const [packages, setPackages] = useState<
    { id: string; name: string; price: number }[]
  >([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("10:00");

  // User details
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

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

  // Handle booking & payment
  const handleBooking = async () => {
    if (!userId) return toast.error("Please log in to book a session");
    if (!selectedPackage) return toast.error("Please select a package");
    if (!fullName || !email || !mobile)
      return toast.error("Please fill out name, email, and mobile number");
    if (!location) return toast.error("Please pick a location");

    setLoading(true);

    try {
      // 1️⃣ Create booking
      const { data: booking, error } = await supabase
        .from("Bookings")
        .insert([
          {
            user_id: userId,
            date: selectedDate.toISOString().split("T")[0],
            time: selectedTime,
            status: "pending",
            package_id: selectedPackage,
            full_name: fullName,
            email,
            mobile,
            location: JSON.stringify(location),
          },
        ])
        .select()
        .single();

      if (error || !booking)
        throw new Error(error?.message || "Booking creation failed");

      toast.success("Booking created! Proceeding to payment...");

      const pkg = packages.find((p) => p.id === selectedPackage);

      // 2️⃣ Create Razorpay order
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

              await supabase
                .from("Bookings")
                .update({ status: "paid" })
                .eq("id", booking.id);

              // Notify admin
              await fetch("/api/admin/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bookingId: booking.id,
                  message: `Payment completed for ${pkg?.name} by user ${userId}`,
                }),
              });

              router.push("/bookings");
            } else toast.error("Payment verification failed!");
          } catch (err) {
            console.error(err);
            toast.error("Error verifying payment");
          }
        },
        theme: { color: "#1e3a8a" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex gap-2 justify-center items-center h-40">
        <PiSpinner className="animate-spin text-xl" />
        <p>Checking login status...</p>
      </div>
    );
  }

  // Login prompt
  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-4">
        <p className="text-white font-medium">
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
    <div className="max-w-md mx-auto p-6 rounded shadow-md bg-gray-900 text-white space-y-4">
      {/* User Details */}
      <div className="space-y-2">
        <label className="block font-medium">Full Name *</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
        />

        <label className="block font-medium">Email *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
        />

        <label className="block font-medium">Mobile Number *</label>
        <input
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="w-full p-2 border rounded bg-gray-800 border-gray-700 text-white"
        />
      </div>

      {/* Map Picker */}
      <div className="space-y-2">
        <label className="block font-medium">Pick Location *</label>
        <MapPicker
          location={location || { lat: 19.076, lng: 72.8777 }}
          setLocation={(loc) => setLocation(loc)}
        />
      </div>

      {/* Calendar */}
      <BookingCalendar
        date={selectedDate}
        setDate={setSelectedDate}
        time={selectedTime}
        setTime={setSelectedTime}
      />

      {/* Package Selector */}
      <div>
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

      {/* Booking Summary */}
      {selectedPackage && (
        <div className="p-4 bg-gray-800 rounded border border-gray-700">
          <h4 className="font-semibold text-lg">
            {packages.find((p) => p.id === selectedPackage)?.name}
          </h4>
          <p>Price: ₹{packages.find((p) => p.id === selectedPackage)?.price}</p>
          <p className="text-gray-400 text-sm mt-1">
            Selected Date: {selectedDate.toDateString()} at {selectedTime}
          </p>
          {location && (
            <p className="text-gray-400 text-sm mt-1">
              Location: Lat {location.lat.toFixed(4)}, Lng{" "}
              {location.lng.toFixed(4)}
            </p>
          )}
        </div>
      )}

      {/* Book Button */}
      <button
        onClick={handleBooking}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        {loading ? "Booking..." : "Book Now"}
      </button>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <PiSpinner className="animate-spin text-4xl text-white" />
        </div>
      )}
    </div>
  );
};

export default BookingForm;
