"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function Modal({ isOpen, onClose, children }: ModalProps) {
  const [showModal, setShowModal] = useState(isOpen);
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShowModal(true);

      // Animate OPEN
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );

      gsap.fromTo(
        modalRef.current,
        {
          opacity: 0,
          y: 80,
          scale: 0.8,
          rotateX: -30, // start tilted back
          transformPerspective: 1000,
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1.05, // overshoot
          rotateX: 5, // tilt forward a bit
          filter: "blur(0px)",
          duration: 0.6,
          ease: "power3.out",
          onComplete: () => {
            // settle back with elastic wobble
            gsap.to(modalRef.current, {
              scale: 1,
              rotateX: 0,
              duration: 0.6,
              ease: "elastic.out(1, 0.5)",
            });
          },
        }
      );
    } else if (showModal) {
      // Animate CLOSE
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
      });

      gsap.to(modalRef.current, {
        opacity: 0,
        y: 80,
        scale: 0.85,
        rotateX: -20, // tilt back while closing
        filter: "blur(8px)",
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => setShowModal(false),
      });
    }
  }, [isOpen]);

  if (!showModal) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 w-[90%] max-w-md max-h-[80vh] p-6 rounded-2xl shadow-xl overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 dark:text-gray-300 hover:text-gray-400 cursor-pointer"
        >
          ✖
        </button>

        {children}
      </div>
    </div>,
    document.body
  );
}
