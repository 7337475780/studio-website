"use client";

import React, { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { usePathname, useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

export interface Photo {
  id: number;
  original?: string;
  image_url?: string;
  title?: string;
  description?: string;
}

interface GalleryProps {
  photos: Photo[];
  normalImages?: Photo[];
  previewCount?: number;
}

export default function Gallery({
  photos,
  normalImages,
  previewCount = 9,
}: GalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [fadeAnim, setFadeAnim] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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

  const displayedImages =
    pathname !== "/gallery" ? allImages.slice(0, previewCount) : allImages;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

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

  // Horizontal scroll-trigger animation only for showcase
  useEffect(() => {
    if (!containerRef.current || pathname === "/gallery") return;

    const totalWidth = scrollRef.current?.scrollWidth || 0;
    const viewportWidth = scrollRef.current?.clientWidth || 0;

    const ctx = gsap.context(() => {
      gsap.to(scrollRef.current, {
        x: -(totalWidth - viewportWidth),
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top center",
          end: () => `+=${totalWidth - viewportWidth + window.innerHeight}`,
          scrub: true,
          anticipatePin: 1,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [displayedImages, pathname]);

  return (
    <>
      <h1 className="text-center text-3xl md:text-5xl font-bold my-6">
        Gallery
      </h1>

      {pathname !== "/gallery" ? (
        // Horizontal scroll showcase with animation
        <div ref={containerRef} className="w-full h-64 overflow-hidden mb-12">
          <div ref={scrollRef} className="flex gap-4 h-full">
            {displayedImages.map((img, idx) => (
              <img
                key={`img-${idx}`}
                src={img.src}
                alt={img.title}
                className="w-60 h-full object-cover rounded-lg shadow-lg flex-shrink-0 cursor-pointer"
                onClick={() => openLightbox(idx)}
              />
            ))}
          </div>
        </div>
      ) : (
        // Grid layout for /gallery
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-6xl mx-auto mb-12">
          {displayedImages.map((img, idx) => (
            <img
              key={`img-${idx}`}
              src={img.src}
              alt={img.title}
              className="w-full h-40 md:h-60 object-cover rounded-lg shadow-lg cursor-pointer hover:scale-105 transition"
              onClick={() => openLightbox(idx)}
            />
          ))}
        </div>
      )}

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

      {/* View All button */}
      {pathname !== "/gallery" && allImages.length > previewCount && (
        <div className="w-full justify-center items-center flex mb-12">
          <button
            onClick={() => router.push("/gallery")}
            className="text-lg text-center bg-blue-600 px-4 cursor-pointer py-2 rounded-full hover:bg-blue-700"
          >
            View All Images
          </button>
        </div>
      )}
    </>
  );
}
