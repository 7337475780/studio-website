"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { IoMenuSharp, IoClose, IoNotificationsOutline } from "react-icons/io5";
import gsap from "gsap";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/components/AuthProvider";
import { NavbarItems } from "@/lib/data";
import NotificationsList from "@/app/admin/dashboard/NotificationList";
import Cookies from "js-cookie";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, login } = useAuth();

  const [role, setRole] = useState<string | null>(
    () => Cookies.get("role") || null
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);

  // Keep role synced with cookie
  useEffect(() => {
    const interval = setInterval(() => {
      const cookieRole = Cookies.get("role") || null;
      if (cookieRole !== role) setRole(cookieRole);
    }, 1000);
    return () => clearInterval(interval);
  }, [role]);

  // Fetch notifications for admin
  useEffect(() => {
    if (role !== "admin") return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error) setNotifications(data || []);
    };

    fetchNotifications();

    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => setNotifications((prev) => [payload.new, ...prev])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel).catch(console.error);
    };
  }, [role]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Mobile menu open animation
  useEffect(() => {
    if (!isOpen || !linksRef.current) return;

    setIsAnimating(true);
    const links = Array.from(linksRef.current.children) as HTMLElement[];
    gsap.set(links, { y: -20, opacity: 0 });
    gsap.to(links, {
      y: 0,
      opacity: 1,
      stagger: 0.05,
      duration: 0.3,
      ease: "power3.out",
      onComplete: () => setIsAnimating(false),
    });
  }, [isOpen]);

  const openMenu = () => {
    setShowNotifications(false);
    setShowProfileDropdown(false);
    setIsOpen(true);
  };

  const closeMenu = () => {
    if (!linksRef.current) {
      setIsOpen(false);
      return;
    }
    setIsAnimating(true);
    const links = Array.from(linksRef.current.children) as HTMLElement[];
    gsap.to(links, {
      y: -20,
      opacity: 0,
      stagger: 0.05,
      duration: 0.2,
      ease: "power3.in",
      onComplete: () => {
        setIsOpen(false);
        setIsAnimating(false);
      },
    });
  };

  const handleNotificationsToggle = () => {
    setShowProfileDropdown(false);
    setIsOpen(false);
    setShowNotifications((prev) => !prev);
  };

  const handleProfileToggle = () => {
    setShowNotifications(false);
    setIsOpen(false);
    setShowProfileDropdown((prev) => !prev);
  };

  return (
    <nav className="bg-[rgba(0,0,0,0.4)] sticky top-0 z-50 backdrop-blur-md text-white p-2 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 text-2xl">
          <Image src="/images/logo.png" width={32} height={32} alt="Logo" />
          <h1 className="text-2xl sm:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-gray-400">
            Suresh Digitals
          </h1>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-4">
        {NavbarItems.map(({ label, path }) => (
          <Link
            key={label}
            href={path}
            className={`relative py-1 px-2 hover:text-blue-400 ${
              pathname === path ? "text-blue-400" : "text-white"
            }`}
          >
            {label}
          </Link>
        ))}

        {/* Admin Notifications */}
        {role === "admin" && (
          <div className="relative">
            <button
              onClick={handleNotificationsToggle}
              className="relative p-2 rounded-full hover:bg-gray-700"
            >
              <IoNotificationsOutline size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 max-h-[70vh]  rounded-lg shadow-lg bg-white dark:bg-gray-900 p-2">
                <NotificationsList initialNotifications={notifications} />
              </div>
            )}
          </div>
        )}

        {/* Admin Button */}
        {role === "admin" && (
          <Link
            href="/admin/dashboard"
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Admin
          </Link>
        )}

        {/* Profile */}
        {user?.user_metadata?.avatar_url ? (
          <div className="relative">
            <button onClick={handleProfileToggle}>
              <Image
                src={user.user_metadata.avatar_url}
                alt="Profile"
                width={32}
                height={32}
                className="rounded-full cursor-pointer"
              />
            </button>
            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-white text-black rounded-lg shadow-lg flex flex-col">
                <button
                  onClick={logout}
                  className="px-4 py-2 hover:bg-gray-200 text-left w-full"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={login}
            className="ml-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        )}
      </div>

      {/* Mobile Section */}
      <div className="md:hidden flex items-center gap-2">
        {role === "admin" && (
          <Link
            href="/admin/dashboard"
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition font-medium"
          >
            Admin
          </Link>
        )}

        {role === "admin" && (
          <div className="relative">
            <button
              onClick={handleNotificationsToggle}
              className="relative p-2 cursor-pointer rounded-full hover:bg-gray-700 transition"
            >
              <IoNotificationsOutline size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* Profile */}
        {user?.user_metadata?.avatar_url && (
          <div className="relative">
            <button
              onClick={handleProfileToggle}
              className="rounded-full border border-gray-100/20"
            >
              <Image
                src={user.user_metadata.avatar_url}
                alt="Profile Picture"
                width={32}
                height={32}
                className="rounded-full object-cover cursor-pointer"
              />
            </button>
          </div>
        )}

        {/* Login Button */}
        {!user && (
          <button
            onClick={login}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        )}

        {/* Hamburger Menu */}
        <button
          onClick={isOpen ? closeMenu : openMenu}
          aria-label="Menu"
          disabled={isAnimating}
        >
          {isOpen ? (
            <IoClose className="text-white cursor-pointer" size={32} />
          ) : (
            <IoMenuSharp className="text-white cursor-pointer" size={32} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          ref={linksRef}
          className="absolute top-full right-0 w-[40%] rounded bg-[rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col items-center md:hidden"
        >
          {NavbarItems.map(({ label, path }) => (
            <Link
              key={label}
              href={path}
              className={`py-3 font-medium text-white w-full text-center border-b border-gray-700 ${
                pathname === path ? "bg-blue-500" : "hover:bg-blue-600"
              }`}
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}
        </div>
      )}

      {/* Mobile Dropdowns */}
      {showProfileDropdown && user?.user_metadata?.avatar_url && (
        <div className="absolute top-16 right-2 md:hidden w-36 bg-white dark:bg-gray-900 text-black dark:text-white rounded-lg shadow-lg py-2 flex flex-col">
          <button
            onClick={logout}
            className="px-4 py-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-left w-full"
          >
            Logout
          </button>
        </div>
      )}
      {showNotifications && role === "admin" && (
        <div className="absolute top-16 right-2 md:hidden w-80 max-h-[70vh] overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-900 p-2">
          <NotificationsList initialNotifications={notifications} />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
