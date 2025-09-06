"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import toast from "react-hot-toast";

gsap.registerPlugin(ScrollTrigger);

interface Errors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

const ContactSection = () => {
  const formRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    _honeypot: "",
  });

  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🔎 Validation logic
  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case "name":
        if (!value.trim()) return "Name is required.";
        break;
      case "email":
        if (!value.trim()) return "Email is required.";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value))
          return "Please enter a valid email address.";
        break;
      case "phone":
        if (value.trim()) {
          const phoneRegex = /^[0-9]{7,15}$/;
          if (!phoneRegex.test(value)) return "Phone must be 7–15 digits.";
        }
        break;
      case "message":
        if (!value.trim()) return "Message cannot be empty.";
        break;
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Live validation as user types
    const errorMsg = validateField(name, value);
    setErrors({ ...errors, [name]: errorMsg });
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "_honeypot") return;
      const errorMsg = validateField(key, value);
      if (errorMsg) newErrors[key as keyof Errors] = errorMsg;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    if (formData._honeypot) {
      toast.error("Spam detected.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Message sent successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          _honeypot: "",
        });
        setErrors({});
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // GSAP animations
  useEffect(() => {
    if (!formRef.current) return;
    gsap.from(formRef.current, {
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: formRef.current,
        start: "top 85%",
        toggleActions: "play none none reverse",
      },
    });
  }, []);

  useEffect(() => {
    if (!particlesRef.current) return;
    const particles = Array.from(
      particlesRef.current.children
    ) as HTMLElement[];
    particles.forEach((p) => {
      const duration = Math.random() * 20 + 15;
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;

      gsap.set(p, {
        x,
        y,
        scale: Math.random() * 0.7 + 0.2,
        opacity: Math.random() * 0.5 + 0.2,
      });
      gsap.to(p, {
        x: `+=${Math.random() * 200 - 100}`,
        y: `+=${Math.random() * 200 - 100}`,
        repeat: -1,
        yoyo: true,
        duration,
        ease: "sine.inOut",
        opacity: Math.random() * 0.5 + 0.2,
      });
    });
  }, []);

  return (
    <section
      id="contact"
      className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black text-white overflow-hidden"
    >
      {/* Floating cinematic particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/10 rounded-full"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
            }}
          />
        ))}
      </div>

      <div className="relative container mx-auto px-6 z-10">
        <div
          ref={formRef}
          className="max-w-xl mx-auto p-12 bg-black/70 backdrop-blur-xl border border-gray-800 rounded-3xl shadow-2xl"
        >
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-500 drop-shadow-lg">
            Get in Touch
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="text"
              name="_honeypot"
              value={formData._honeypot}
              onChange={handleChange}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Name */}
            <label className="block">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-6 py-3 rounded-2xl border ${
                  errors.name ? "border-red-500" : "border-gray-700"
                } bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.name ? "focus:ring-red-500" : "focus:ring-indigo-500"
                } transition`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-2">{errors.name}</p>
              )}
            </label>

            {/* Email */}
            <label className="block">
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-6 py-3 rounded-2xl border ${
                  errors.email ? "border-red-500" : "border-gray-700"
                } bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.email ? "focus:ring-red-500" : "focus:ring-indigo-500"
                } transition`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-2">{errors.email}</p>
              )}
            </label>

            {/* Phone */}
            <label className="block">
              <input
                type="text"
                name="phone"
                placeholder="Your Phone (optional)"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-6 py-3 rounded-2xl border ${
                  errors.phone ? "border-red-500" : "border-gray-700"
                } bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.phone ? "focus:ring-red-500" : "focus:ring-indigo-500"
                } transition`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-2">{errors.phone}</p>
              )}
            </label>

            {/* Message */}
            <label className="block">
              <textarea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                className={`w-full px-6 py-3 rounded-2xl border ${
                  errors.message ? "border-red-500" : "border-gray-700"
                } bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                  errors.message
                    ? "focus:ring-red-500"
                    : "focus:ring-indigo-500"
                } transition`}
                rows={5}
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-2">{errors.message}</p>
              )}
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-2xl text-white font-bold text-lg cursor-pointer transition 
                ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-400 hover:to-blue-500"
                }`}
            >
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>

          {success && (
            <p className="text-center text-green-400 mt-6 font-semibold">
              Thank you! We’ll get back to you soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
