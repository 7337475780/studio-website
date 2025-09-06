"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import ReviewModal from "./ReviewModal";

export interface Testimonial {
  id: string; // changed from number -> uuid
  name: string;
  feedback: string;
  rating: number;
  photo?: string | null;
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get initials from name
  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0).toUpperCase() +
      parts[parts.length - 1].charAt(0).toUpperCase()
    );
  };

  // Fetch reviews
  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("reviews")
        .select("id, name, feedback, rating, photo")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching testimonials:", error.message);
      } else {
        setTestimonials(data || []);
      }
      setLoading(false);
    };

    fetchTestimonials();

    // Realtime insert listener
    const channel = supabase
      .channel("realtime-reviews")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reviews" },
        (payload) => {
          setTestimonials((prev) => [payload.new as Testimonial, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="py-20 bg-gradient-to-b from-black via-gray-900 to-black text-white relative">
      <div className="container mx-auto px-6 text-center">
        {/* Title */}
        <h2 className="text-4xl md:text-5xl font-bold mb-12 tracking-wide">
          What Our Clients Say
        </h2>

        {/* Testimonials */}
        {loading ? (
          <p className="text-gray-400">Loading reviews...</p>
        ) : testimonials.length === 0 ? (
          <div className="text-gray-400">
            <p>No reviews yet. Be the first to share!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
            >
              Write a Review
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-gray-800/60 backdrop-blur-lg border border-gray-700 rounded-2xl p-6 shadow-xl hover:scale-105 transform transition duration-300"
              >
                {/* Profile */}
                <div className="flex items-center mb-4">
                  {testimonial.photo ? (
                    <Image
                      src={testimonial.photo}
                      alt={testimonial.name}
                      width={56}
                      height={56}
                      className="rounded-full mr-4 object-cover border-2 border-gray-600"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-4 flex items-center justify-center text-lg font-bold text-white shadow-md">
                      {getInitials(testimonial.name)}
                    </div>
                  )}

                  <div className="text-left">
                    <h3 className="font-semibold text-lg">
                      {testimonial.name}
                    </h3>
                    {/* Star Rating */}
                    <div className="flex space-x-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`transition-transform duration-200 ${
                            i < testimonial.rating
                              ? "text-yellow-400 hover:scale-110"
                              : "text-gray-500"
                          } text-lg`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <p className="text-gray-300 text-left italic leading-relaxed">
                  “{testimonial.feedback}”
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Review Modal Trigger */}
        {testimonials.length > 0 && (
          <div className="mt-12">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-lg font-semibold transition"
            >
              Write a Review
            </button>
          </div>
        )}

        {/* Review Modal */}
        <ReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </section>
  );
}
