"use client";

import { NavbarItems } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { IoMenuSharp, IoClose } from "react-icons/io5";
import gsap from "gsap";

const Navbar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);

  const openMenu = () => {
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

  useEffect(() => {
    if (isOpen && linksRef.current) {
      const links = Array.from(linksRef.current.children) as HTMLElement[];

      gsap.fromTo(
        links,
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.1,
          duration: 0.3,
          ease: "power3.out",
        }
      );
    }
  }, [isOpen]);

  return (
    <nav className="bg-[rgba(0,0,0,0.4)] sticky top-0 z-50 backdrop-blur-md text-white p-2 flex justify-between items-center">
      {/* Logo */}
      <div>
        <Link href="/">
          <Image
            src="/images/logo.png"
            width={42}
            height={42}
            className="rounded"
            alt="Suresh Digitals's logo"
          />
        </Link>
      </div>

      {/* Desktop Menu */}
      <div className="hidden md:flex space-x-4 gap-2">
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
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
        <button
          onClick={() => {
            if (isOpen) closeMenu();
            else openMenu();
          }}
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
          className="absolute top-full right-0 w-[40%] rounded bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl flex flex-col items-center md:hidden"
        >
          {NavbarItems.map(({ label, path }) => {
            const isActive = pathname === path;
            return (
              <Link
                className={`py-3 font-medium text-white w-full text-center border-b border-gray-700
                 ${isActive ? "bg-blue-500" : "hover:bg-blue-600"}`}
                key={label}
                href={path}
                onClick={closeMenu}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
