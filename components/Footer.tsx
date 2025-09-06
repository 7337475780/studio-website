"use client";

import React, { useEffect, useRef } from "react";
import { FaPhone, FaMapPin, FaEnvelope } from "react-icons/fa";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ModernFooter = () => {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;

    const sections = footerRef.current.querySelectorAll(".footer-section");

    ScrollTrigger.batch(sections, {
      interval: 0.1,
      batchMax: 3,
      onEnter: (batch) =>
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.2,
          duration: 1,
          ease: "power3.out",
        }),
      onLeaveBack: (batch) =>
        gsap.to(batch, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          ease: "power3.out",
        }),
      start: "top 90%",
    });
  }, []);

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-10">
      <div
        ref={footerRef}
        className="container mx-auto px-6 flex flex-col lg:flex-row justify-center items-center lg:items-start gap-12 text-center lg:text-left"
      >
        {/* Brand + About */}
        <div className="footer-section flex flex-col items-center lg:items-start space-y-4 opacity-0 translate-y-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            <span className=" bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              Suresh Digitals
            </span>
          </h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm">
            We craft stunning digital experiences that help businesses shine
            online. Your vision, our creativity.
          </p>
        </div>

        {/* Contact Info */}
        <div className="footer-section flex flex-col items-center lg:items-start space-y-4 opacity-0 translate-y-12">
          <h3 className="font-bold text-xl text-purple-400">Contact</h3>

          {/* Phone */}
          <div className="flex items-center sm:items-center gap-3 text-gray-400">
            <FaPhone className="text-purple-400" />
            <div className="flex flex-col sm:flex-row sm:gap-3 text-center sm:text-left">
              <a
                href="tel:+919948887198"
                className="hover:text-blue-400 transition"
              >
                +91 99488 87198
              </a>
              <span className="hidden sm:inline">|</span>
              <a
                href="tel:+917337475780"
                className="hover:text-blue-400 transition"
              >
                +91 73374 75780
              </a>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3 text-gray-400">
            <FaEnvelope className="text-purple-400" />
            <a
              href="mailto:sureshbabu.lingala@gmail.com"
              className="hover:text-blue-400 transition break-all"
            >
              sureshbabu.lingala@gmail.com
            </a>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 text-gray-400">
            <FaMapPin className="text-purple-400" />
            <span>Marripudi, Andhra Pradesh, India</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Suresh Digitals. All rights reserved.
      </div>
    </footer>
  );
};

export default ModernFooter;
