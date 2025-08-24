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

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications and subscribe to realtime updates
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

    return () => supabase.removeChannel(channel);
  }, [role]);

  const openMenu = () => setIsOpen(true);

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

  const handleNotificationsToggle = () => setShowNotifications((prev) => !prev);

  const handleLogin = async () =>
    supabase.auth.signInWithOAuth({ provider: "google" });
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="bg-[rgba(0,0,0,0.4)] sticky top-0 z-50 backdrop-blur-md text-white p-2 flex justify-between items-center">
      {/* Logo */}
      <div className="flex items-center justify-center">
        <Link
          href="/"
          className="flex items-center justify-center text-2xl gap-2"
        >
          <Image
            src="/images/logo.png"
            width={32}
            height={32}
            className="rounded"
            alt="Suresh Digitals Logo"
          />
          <h1 className="text-2xl sm:text-3xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-gray-400">
            Suresh Digitals
          </h1>
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex space-x-4 gap-2 items-center relative">
        {NavbarItems.map(({ label, path }) => {
          const isActive = pathname === path;
          return (
            <Link
              className={`relative py-0.5 font-medium text-white
                before:absolute before:bottom-0 before:left-0 before:h-[2px] 
                before:w-0 before:bg-blue-400 before:transition-all before:duration-300
                hover:before:w-full ${
                  isActive ? "before:w-full" : "before:w-0"
                }`}
              key={label}
              href={path}
            >
              {label}
            </Link>
          );
        })}

        {/* Bell Icon for Notifications */}
        {role === "admin" && (
          <div className="relative ">
            <button
              onClick={handleNotificationsToggle}
              className="relative p-2 cursor-pointer rounded-full hover:bg-gray-700 transition"
            >
              <IoNotificationsOutline size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-full sm:w-96 max-h-[70vh] overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-900 p-2">
                <NotificationsList initialNotifications={notifications} />
              </div>
            )}
          </div>
        )}

        {/* Admin Dashboard Link */}
        {role === "admin" && (
          <Link
            href="/admin/dashboard"
            className="ml-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition font-medium"
          >
            Admin
          </Link>
        )}

        {/* Login/Logout */}
        {user ? (
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1 bg-red-600 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="ml-2 px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        )}
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <button
          onClick={isOpen ? closeMenu : openMenu}
          aria-label="Menu"
          disabled={isAnimating}
        >
          {isOpen ? (
            <IoClose className="text-white cursor-pointer" size={24} />
          ) : (
            <IoMenuSharp className="text-white cursor-pointer" size={24} />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div
          ref={linksRef}
          className="absolute top-full right-0 w-[70%] rounded bg-[rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col items-center md:hidden"
        >
          {NavbarItems.map(({ label, path }) => {
            const isActive = pathname === path;
            return (
              <Link
                className={`py-3 font-medium text-white w-full text-center border-b border-gray-700 ${
                  isActive ? "bg-blue-500" : "hover:bg-blue-600"
                }`}
                key={label}
                href={path}
                onClick={closeMenu}
              >
                {label}
              </Link>
            );
          })}

          {/* Admin Dashboard */}
          {role === "admin" && (
            <Link
              href="/admin/dashboard"
              className="py-3 font-medium text-white w-full text-center border-b border-gray-700 hover:bg-blue-600"
              onClick={closeMenu}
            >
              Admin
            </Link>
          )}

          {/* Login/Logout */}
          {user ? (
            <button
              onClick={() => {
                handleLogout();
                closeMenu();
              }}
              className="py-3 font-medium text-white w-full text-center border-b border-gray-700 hover:bg-red-700"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => {
                handleLogin();
                closeMenu();
              }}
              className="py-3 font-medium text-white w-full text-center border-b border-gray-700 hover:bg-blue-700"
            >
              Login
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
