"use client";

import { NavbarItems } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

const Navbar = () => {
  const pathname = usePathname();
  return (
    <nav
      className="bg-[rgba(0,0,0,0.4)] backdrop-blur-md
 text-white p-2 flex justify-between items-center"
    >
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
      <div className="space-x-4 gap-2">
        {NavbarItems.map(({ label, path }) => {
          const isActive = pathname === path;
          return (
            <Link
              className={`relative py-0.5 font-medium text-white
             before:absolute before:bottom-0 before:left-0 before:h-[2px] 
             before:w-0 before:bg-blue-400 before:transition-all before:duration-300
             hover:before:w-full ${isActive ? "before:w-full" : "before:w-0"}`}
              key={label}
              href={path}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
