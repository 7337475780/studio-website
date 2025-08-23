"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

gsap.registerPlugin(ScrollTrigger);
interface Photo {
  id: number;
  title?: string;
  image_url: string;
}
const HeroSection = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subtextRef = useRef<HTMLParagraphElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);

  // Fetch active photos from Supabase
  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) console.error(error);
      else setPhotos(data || []);
    };
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;

    // Use gsap.context for scoped animations
    const ctx = gsap.context(() => {
      const letters = headingRef.current?.querySelectorAll("span");

      // Animate heading letters
      if (letters) {
        gsap.from(letters, {
          y: 50,
          opacity: 0,
          stagger: 0.05,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 1,
            pin: false, // Disable pin for Turbopack safety
          },
        });
      }

      // Animate subtext
      gsap.from(subtextRef.current, {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          pin: true,
        },
      });

      // Animate button
      gsap.from(buttonRef.current, {
        y: 20,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, heroRef);

    return () => ctx.revert(); // Safe cleanup on unmount
  }, []);

  // Handle redirect safely
  const handleBooking = () => {
    // Kill all active GSAP animations before navigation
    gsap.killTweensOf("*");
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    router.push("/booking");
  };

  return (
    <div>
      <section
        ref={heroRef}
        className="relative w-full h-screen bg-[url('/hero.jpg')] bg-cover bg-center flex items-center justify-center"
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 text-center px-4">
          {/* Heading with letter animation */}
          <h1
            ref={headingRef}
            className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg flex justify-center flex-wrap overflow-hidden"
          >
            {"Capture Your Moments Perfectly".split("").map((char, i) => (
              <span key={i} className="inline-block">
                {char}
              </span>
            ))}
          </h1>

          {/* Subtext */}
          <p
            ref={subtextRef}
            className="text-lg md:text-2xl mt-4 text-white drop-shadow-md"
          >
            Professional Photography Studio for Every Occasion
          </p>

          {/* CTA Button */}
          <button
            ref={buttonRef}
            onClick={handleBooking}
            className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-semibold transition transform hover:scale-105"
          >
            Book a Session
          </button>
        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-10 w-full flex justify-center animate-bounce">
          <span className="text-white text-2xl">⌄</span>
        </div>
      </section>
    </div>
  );
};

export default HeroSection;
