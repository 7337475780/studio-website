"use client";

import { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-2xl shadow-lg border border-gray-200 bg-white hover:shadow-xl transition ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div
      className={`px-4 py-3 border-b border-gray-100 flex justify-between items-center ${className}`}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return (
    <div className={`px-4 py-3 space-y-3 text-sm text-gray-700 ${className}`}>
      {children}
    </div>
  );
}
