"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { IoMenuSharp, IoClose, IoNotificationsOutline } from "react-icons/io5";
import gsap from "gsap";
import Cookies from "js-cookie";
import { useAuth } from "@/components/AuthProvider";
import { NavbarItems } from "@/lib/data";
import NotificationsList from "@/app/admin/dashboard/NotificationList";
import { useNotifications } from "@/components/NotificationProvider";

const Navbar = () => {
  const { user, login, logout } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(() => Cookies.get("role") || null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const desktopLinksRef = useRef<HTMLDivElement>(null);
  const desktopUnderlineRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const mobileUnderlineRef = useRef<HTMLDivElement>(null);

  // Keep role synced with cookie
  useEffect(() => {
    const interval = setInterval(() => {
      const cookieRole = Cookies.get("role") || null;
      if (cookieRole !== role) setRole(cookieRole);
    }, 1000);
    return () => clearInterval(interval);
  }, [role]);

  // Mobile menu animation
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

  // Active link underline animation
  useEffect(() => {
    const animateUnderline = (
      container: HTMLDivElement | null,
      underline: HTMLDivElement | null
    ) => {
      if (!container || !underline) return;
      const activeLink = Array.from(container.children).find(
        (child: any) => child.dataset?.path === pathname
      ) as HTMLElement;

      if (activeLink) {
        gsap.to(underline, {
          width: activeLink.offsetWidth,
          x: activeLink.offsetLeft,
          duration: 0.3,
          ease: "power3.out",
        });
      } else {
        gsap.to(underline, { width: 0, duration: 0.2 });
      }
    };

    animateUnderline(desktopLinksRef.current, desktopUnderlineRef.current);
    animateUnderline(linksRef.current, mobileUnderlineRef.current);
  }, [pathname, isOpen]);

  // Mark notifications as read when opening notification list
  const handleShowNotifications = () => {
    setShowNotifications((prev) => !prev);
    setShowProfileDropdown(false);
    setIsOpen(false);

    // Mark all unread notifications as read immediately
    notifications.forEach((n) => {
      if (!n.is_read) markAsRead(n.id);
    });
  };

  return (
    <nav className="bg-[rgba(0,0,0,0.4)] sticky top-0 z-50 backdrop-blur-md text-white p-2 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image src="/images/logo.png" alt="Logo" width={32} height={32} />
        <h1 className="text-2xl hidden md:flex font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-gray-400">
          Suresh Digitals
        </h1>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden md:flex items-center gap-4 relative">
        <div className="relative flex items-center gap-4" ref={desktopLinksRef}>
          {NavbarItems.map(({ label, path }) => (
            <Link
              key={label}
              href={path}
              data-path={path}
              className="relative py-1 px-2 text-white hover:text-blue-400"
            >
              {label}
            </Link>
          ))}
          <div
            ref={desktopUnderlineRef}
            className="absolute bottom-0 left-0 h-[2px] bg-blue-500 w-0"
          />
        </div>

        {/* Notifications */}
        {role === "admin" && (
          <div className="relative">
            <button
              onClick={handleShowNotifications}
              className="relative p-2 rounded-full hover:bg-gray-700"
            >
              <IoNotificationsOutline size={24} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 max-h-[70vh] rounded-lg shadow-lg bg-white dark:bg-gray-900 p-2">
                <NotificationsList />
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
            <button
              onClick={() => {
                setShowProfileDropdown((prev) => !prev);
                setShowNotifications(false);
                setIsOpen(false);
              }}
            >
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

      {/* Mobile */}
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
          <button
            onClick={handleShowNotifications}
            className="relative p-2 cursor-pointer rounded-full hover:bg-gray-700 transition"
          >
            <IoNotificationsOutline size={24} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
        )}

        {user?.user_metadata?.avatar_url && (
          <button
            onClick={() => {
              setShowProfileDropdown((prev) => !prev);
              setShowNotifications(false);
              setIsOpen(false);
            }}
          >
            <Image
              src={user.user_metadata.avatar_url}
              alt="Profile Picture"
              width={32}
              height={32}
              className="rounded-full object-cover cursor-pointer"
            />
          </button>
        )}

        {!user && (
          <button
            onClick={login}
            className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700 transition"
          >
            Login
          </button>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
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
          className="absolute top-full right-0 w-[40%] rounded bg-[rgba(0,0,0,0.4)] backdrop-blur-md flex flex-col items-center md:hidden relative"
        >
          {NavbarItems.map(({ label, path }) => (
            <Link
              key={label}
              href={path}
              data-path={path}
              className="py-3 font-medium text-white w-full text-center border-b-2 border-transparent hover:bg-blue-600"
            >
              {label}
            </Link>
          ))}
          <div
            ref={mobileUnderlineRef}
            className="absolute bottom-0 left-0 h-[2px] bg-blue-500 w-0"
          />
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
          <NotificationsList fullScreen />
        </div>
      )}
    </nav>
  );
};

export default Navbar;
