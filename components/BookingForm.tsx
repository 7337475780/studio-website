"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  FaUser,
  FaMapMarkedAlt,
  FaCalendarAlt,
  FaBox,
  FaCheckCircle,
  FaCheck,
} from "react-icons/fa";
import { PiSpinner } from "react-icons/pi";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import confetti from "canvas-confetti";
import BookingCalendar from "./Calendar";
import MapPicker from "./MapPicker";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const steps = [
  { id: 1, label: "User Info", icon: <FaUser /> },
  { id: 2, label: "Location", icon: <FaMapMarkedAlt /> },
  { id: 3, label: "Date & Time", icon: <FaCalendarAlt /> },
  { id: 4, label: "Package", icon: <FaBox /> },
  { id: 5, label: "Summary", icon: <FaCheckCircle /> },
];

const BookingForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const [packages, setPackages] = useState<
    { id: string; name: string; price: number }[]
  >([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  const stepRefs = useRef<HTMLDivElement[]>([]);
  const userInfoFilled = fullName !== "" && email !== "" && mobile !== "";

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

  // Auth
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

  // Step completion animation
  useEffect(() => {
    if (stepRefs.current[step - 2]) {
      gsap.fromTo(
        stepRefs.current[step - 2],
        { scale: 1 },
        { scale: 1.3, duration: 0.2, yoyo: true, repeat: 1, ease: "power1.out" }
      );
    }
  }, [step]);

  // Booking + Payment
  const handleBooking = async () => {
    if (!userId) return toast.error("Please log in to book a session");
    if (!selectedPackage) return toast.error("Please select a package");
    if (!fullName || !email || !mobile)
      return toast.error("Please fill all fields");
    if (!location) return toast.error("Please pick a location");

    setLoading(true);

    try {
      // 1️⃣ Create booking in Supabase
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
        throw new Error(error?.message || "Booking failed");

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
      if (!res.ok)
        throw new Error(order.error || "Failed to create Razorpay order");

      // 3️⃣ Open Razorpay checkout
      const options = {
        key: order.key,
        amount: order.amount,
        currency: "INR",
        name: "Suresh Digitals",
        description: `${pkg?.name} Package`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // 4️⃣ Verify payment
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
              toast.success("Payment successful!");
              confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
              setPaymentSuccess(true);

              // ✅ Update payment_verified_at and status in Supabase
              await supabase
                .from("Bookings")
                .update({
                  payment_verified_at: new Date().toISOString(),
                  status: "accepted",
                })
                .eq("id", booking.id);

              // 5️⃣ Notify admin
              await fetch("/api/admin/notify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bookingId: booking.id,
                  message: `New booking confirmed for ${fullName} on ${selectedDate.toDateString()} at ${selectedTime}. Package: ${
                    pkg?.name
                  }`,
                }),
              });

              // 6️⃣ Browser notification
              if ("Notification" in window) {
                if (Notification.permission === "default") {
                  Notification.requestPermission();
                } else if (Notification.permission === "granted") {
                  new Notification("Booking Confirmed!", {
                    body: `Hi ${fullName}, your session is booked on ${selectedDate.toDateString()} at ${selectedTime}.`,
                    icon: "/images/logo.png",
                  });
                }
              }

              router.push("/bookings");
            } else {
              toast.error("Payment verification failed!");
            }
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

  const canProceed = () => {
    switch (step) {
      case 1:
        return userInfoFilled;
      case 2:
        return !!location;
      case 3:
        return !!selectedDate && !!selectedTime;
      case 4:
        return !!selectedPackage;
      default:
        return true;
    }
  };

  if (authLoading)
    return (
      <div className="flex justify-center gap-1 items-center h-40">
        <PiSpinner className="animate-spin text-xl" /> Checking login status...
      </div>
    );

  if (!userId)
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

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-xl shadow-2xl space-y-6 relative">
      {/* Stepper */}
      <div className="flex items-center justify-between relative mb-6">
        {steps.map((s, i) => {
          const isCompleted = step > s.id;
          const isActive = step === s.id;
          return (
            <div
              key={s.id}
              className="flex flex-col items-center relative w-20"
            >
              <div
                ref={(el) => {
                  if (el) stepRefs.current[i] = el;
                }}
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                  isCompleted
                    ? "bg-green-400 border-green-400 text-black"
                    : isActive
                    ? "bg-blue-900 border-blue-400 text-blue-300"
                    : "bg-gray-800 border-gray-600 text-gray-400"
                }`}
              >
                {s.icon}
              </div>
              <p
                className={`text-xs mt-2 ${
                  isCompleted
                    ? "text-green-400"
                    : isActive
                    ? "text-blue-400"
                    : "text-gray-400"
                }`}
              >
                {s.label}
              </p>
              {i < steps.length - 1 && (
                <div
                  className={`absolute top-5 left-[calc(50%+20px)] w-full h-1 ${
                    step > s.id ? "bg-green-400" : "bg-gray-700"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={step}
          custom={direction}
          initial={{ opacity: 0, x: direction === "forward" ? 50 : -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction === "forward" ? -50 : 50 }}
          transition={{ duration: 0.35 }}
          className="space-y-4"
        >
          {step === 1 && (
            <div className="space-y-3">
              <label>Full Name *</label>
              <input
                type="text"
                value={fullName}
                autoComplete="name"
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              />
              <label>Email *</label>
              <input
                type="email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              />
              <label>Mobile *</label>
              <input
                type="tel"
                value={mobile}
                autoComplete="tel"
                onChange={(e) => setMobile(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-gray-700"
              />
            </div>
          )}
          {step === 2 && (
            <MapPicker
              location={location || { lat: 19.076, lng: 72.8777 }}
              setLocation={setLocation}
            />
          )}
          {step === 3 && (
            <BookingCalendar
              date={selectedDate}
              setDate={setSelectedDate}
              time={selectedTime}
              setTime={setSelectedTime}
            />
          )}
          {step === 4 && (
            <select
              value={selectedPackage || ""}
              onChange={(e) => setSelectedPackage(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 border border-gray-700"
            >
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - ₹{p.price}
                </option>
              ))}
            </select>
          )}
          {step === 5 && (
            <div className="p-4 bg-gray-800 rounded border border-gray-700 space-y-1">
              <h3 className="font-semibold text-lg">Summary</h3>
              <p>Name: {fullName}</p>
              <p>Email: {email}</p>
              <p>Mobile: {mobile}</p>
              {location && (
                <p>
                  Location: Lat {location.lat.toFixed(4)}, Lng{" "}
                  {location.lng.toFixed(4)}
                </p>
              )}
              <p>
                Date: {selectedDate.toDateString()} at {selectedTime}
              </p>
              <p>
                Package:{" "}
                {packages.find((p) => p.id === selectedPackage)?.name || "N/A"}
              </p>
              <p>
                Price: ₹
                {packages.find((p) => p.id === selectedPackage)?.price || "N/A"}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-4">
        {step > 1 && (
          <button
            onClick={() => {
              setDirection("backward");
              setStep(step - 1);
            }}
            className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600"
          >
            Back
          </button>
        )}
        {step < steps.length && (
          <button
            onClick={() => {
              setDirection("forward");
              canProceed() && setStep(step + 1);
            }}
            disabled={!canProceed()}
            className={`px-4 py-2 rounded ${
              canProceed()
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 cursor-not-allowed"
            }`}
          >
            Next
          </button>
        )}
        {step === steps.length && (
          <button
            onClick={handleBooking}
            disabled={loading}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            {loading ? "Processing..." : "Confirm & Pay"}
          </button>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <PiSpinner className="animate-spin text-4xl text-white" />
        </div>
      )}

      {/* Payment Success Overlay */}
      {paymentSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-green-500 p-8 rounded flex flex-col items-center justify-center space-y-3 shadow-lg">
            <FaCheck className="text-white text-6xl animate-bounce" />
            <p className="text-white font-semibold text-lg">
              Booking Confirmed!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
