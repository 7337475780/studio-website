"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import "react-image-gallery/styles/css/image-gallery.css";

gsap.registerPlugin(ScrollTrigger);

interface Photo {
  id: number;
  original?: string;
  image_url?: string;
  title?: string;
  description?: string;
}

interface GalleryProps {
  photos: Photo[]; // full-screen lightbox images
  normalImages?: Photo[]; // normal images shown in grid
}

export default function Gallery({ photos, normalImages }: GalleryProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [fadeAnim, setFadeAnim] = useState(false);

  // Open lightbox
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  // Close lightbox
  const closeLightbox = () => {
    setLightboxIndex(null);
  };

  // Navigate lightbox
  const nextImage = () => {
    if (lightboxIndex === null) return;
    setFadeAnim(true);
    setTimeout(() => {
      setLightboxIndex((prev) =>
        prev !== null ? (prev + 1) % allImages.length : null
      );
      setFadeAnim(false);
    }, 200);
  };

  const prevImage = () => {
    if (lightboxIndex === null) return;
    setFadeAnim(true);
    setTimeout(() => {
      setLightboxIndex((prev) =>
        prev !== null ? (prev - 1 + allImages.length) % allImages.length : null
      );
      setFadeAnim(false);
    }, 200);
  };

  // GSAP stagger animation
  useEffect(() => {
    if (!galleryRef.current) return;

    const ctx = gsap.context(() => {
      const letters = headingRef.current?.querySelectorAll("span");
      if (letters) {
        gsap.from(letters, {
          y: 50,
          opacity: 0,
          stagger: 0.05,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: galleryRef.current,
            start: "top 80%",
            end: "bottom top",
            scrub: 1,
          },
        });
      }

      gsap.from(galleryRef.current.children, {
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: galleryRef.current,
          start: "top 90%",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, galleryRef);

    return () => ctx.revert();
  }, [photos, normalImages]);

  // Normalize images for lightbox
  const allImages = [
    ...(photos || []).map((img) => ({
      src: img.original || img.image_url,
      title: img.title || img.description || "Photo",
    })),
    ...(normalImages || []).map((img) => ({
      src: img.original || img.image_url,
      title: img.title || img.description || "Photo",
    })),
  ];

  return (
    <>
      <h1
        ref={headingRef}
        className="text-center text-3xl md:text-5xl font-bold my-6"
      >
        Gallery
      </h1>

      <div
        ref={galleryRef}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl mx-auto mb-12"
      >
        {allImages.map((img, idx) => (
          <img
            key={`img-${idx}`}
            src={img.src}
            alt={img.title}
            className="w-full h-40 md:h-60 object-cover rounded-lg shadow-lg cursor-pointer hover:scale-105 transition"
            onClick={() => openLightbox(idx)}
          />
        ))}
      </div>

      {/* Lightbox Overlay */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute cursor-pointer left-4 text-white text-3xl md:text-5xl font-bold z-50"
          >
            ‹
          </button>

          <img
            key={allImages[lightboxIndex].src}
            src={allImages[lightboxIndex].src}
            alt={allImages[lightboxIndex].title}
            className={`max-w-[90%] max-h-[90%] rounded-lg shadow-2xl transition-opacity duration-200 ${
              fadeAnim ? "opacity-0" : "opacity-100"
            }`}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute cursor-pointer right-4 text-white text-3xl md:text-5xl font-bold z-50"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
