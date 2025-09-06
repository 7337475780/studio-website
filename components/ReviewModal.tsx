"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReviewModal({ isOpen, onClose }: ReviewModalProps) {
  const { user, profile } = useAuth();
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const launchConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setSubmitted(false);
      onClose();
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("You must be logged in to submit a review.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("reviews").insert([
      {
        user_id: user.id,
        name: profile?.full_name || user.email,
        feedback,
        rating,
      },
    ]);

    if (error) {
      console.error("Error submitting review:", error.message);
      toast.error("Failed to submit review. Please try again!");
    } else {
      setSubmitted(true);
      setFeedback("");
      setRating(5);
      launchConfetti();
    }

    setLoading(false);
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50 p-4"
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-md p-8 rounded-3xl shadow-2xl relative transform transition-all ${
          isClosing ? "animate-fadeOutDown" : "animate-fadeInUp"
        } bg-gradient-to-br from-gray-900/90 via-gray-800/80 to-gray-900/90 backdrop-blur-lg border border-gray-700`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition text-xl"
        >
          ✕
        </button>

        {!submitted ? (
          <>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-center text-white tracking-tight">
              Share Your Experience
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Feedback */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Your Review
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  rows={5}
                  placeholder="Write your feedback..."
                  className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 resize-none placeholder-gray-400 transition"
                />
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Your Rating
                </label>
                <div className="flex justify-center space-x-3 text-3xl md:text-4xl">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseEnter={() => setHoverRating(i + 1)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(i + 1)}
                      className={`transition-transform duration-200 ${
                        (hoverRating ?? rating) > i
                          ? "text-yellow-400 scale-125"
                          : "text-gray-500"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg transition flex items-center justify-center disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-fadeInUp">
            <div className="text-7xl md:text-8xl text-green-400 animate-pulse">
              🎉
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white text-center">
              Thank you for your review!
            </h3>
            <p className="text-gray-300 text-center">
              Your feedback helps us improve and grow.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-lg transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
