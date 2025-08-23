"use client";

import React, { useEffect, useRef } from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaPhone,
  FaMapPin,
} from "react-icons/fa";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ModernFooter = () => {
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!footerRef.current) return;

    const sections = footerRef.current.querySelectorAll(".footer-section");
    const socialIcons = footerRef.current.querySelectorAll(".social-icon");

    // Animate sections
    sections.forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section,
          start: "top 90%",
          end: "bottom 10%",
          toggleActions: "play reverse play reverse",
        },
      });
    });

    // Animate social icons
    gsap.from(socialIcons, {
      opacity: 0,
      scale: 0,
      stagger: 0.2,
      duration: 0.5,
      ease: "back.out(1.7)",
      scrollTrigger: {
        trigger: footerRef.current,
        start: "top 80%",
        end: "bottom 10%",
        toggleActions: "play reverse play reverse",
      },
    });
  }, []);

  return (
    <footer ref={footerRef} className="bg-gray-900 text-white pt-16 pb-10">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
        {/* Brand */}
        <div className="footer-section flex flex-col items-center md:items-start space-y-4">
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Suresh Digitals
          </h2>
          <p className="text-gray-400 text-sm sm:text-base leading-relaxed max-w-sm">
            We craft stunning digital experiences that help businesses shine
            online. Your vision, our creativity.
          </p>
        </div>

        {/* Contact */}
        <div className="footer-section flex flex-col items-center md:items-start space-y-3">
          <h3 className="font-bold text-xl text-purple-400 mb-2">Contact</h3>
          <p className="text-gray-400">
            <FaPhone className="inline mr-2 text-purple-400" />
            <a
              href="tel:+919948887198"
              className="hover:text-blue-500 transition-colors"
            >
              +91 99488 87198
            </a>{" "}
            |{" "}
            <a
              href="tel:+917337475780"
              className="hover:text-blue-500 transition-colors"
            >
              +91 73374 75780
            </a>
          </p>
          <p className="text-gray-400">
            <FaMapPin className="inline mr-2 text-purple-400" />
            Marripudi, Andhra Pradesh, India
          </p>
          <p className="text-gray-400">
            Email:{" "}
            <a
              href="mailto:sureshbabu.lingala@gmail.com"
              className="hover:text-white transition-colors"
            >
              sureshbabu.lingala@gmail.com
            </a>
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="mt-12 border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Suresh Digitals. All rights reserved.
      </div>
    </footer>
  );
};

export default ModernFooter;
