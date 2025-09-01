"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
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
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>(
    {}
  );

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

  // --- Image caching / preloading ---
  useEffect(() => {
    const imgCache: HTMLImageElement[] = [];
    allImages.forEach((img) => {
      const preloadedImg = new Image();
      preloadedImg.src = img.src!;
      preloadedImg.onload = () =>
        setLoadedImages((prev) => ({ ...prev, [img.src!]: true }));
      imgCache.push(preloadedImg);
    });
    return () => {
      imgCache.length = 0;
    };
  }, [allImages]);

  // --- Lightbox navigation and caching ---
  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const changeLightbox = useCallback(
    (next: boolean) => {
      if (lightboxIndex === null) return;
      setFadeAnim(true);
      setTimeout(() => {
        const newIndex = next
          ? (lightboxIndex + 1) % allImages.length
          : (lightboxIndex - 1 + allImages.length) % allImages.length;
        setLightboxIndex(newIndex);
        setFadeAnim(false);

        // Preload next and previous images
        const nextIndex = (newIndex + 1) % allImages.length;
        const prevIndex = (newIndex - 1 + allImages.length) % allImages.length;
        [nextIndex, prevIndex].forEach((i) => {
          const img = new Image();
          img.src = allImages[i].src!;
        });
      }, 200);
    },
    [lightboxIndex, allImages]
  );

  const nextImage = () => changeLightbox(true);
  const prevImage = () => changeLightbox(false);

  // --- Horizontal scroll-trigger animation only for showcase ---
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

  // --- Keyboard navigation for lightbox ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, nextImage, prevImage]);

  return (
    <>
      <h1 className="text-center text-3xl md:text-5xl font-bold my-6">
        Gallery
      </h1>

      {pathname !== "/gallery" ? (
        // Horizontal scroll showcase
        <div ref={containerRef} className="w-full h-64 overflow-hidden mb-12">
          <div ref={scrollRef} className="flex gap-4 h-full">
            {displayedImages.map((img, idx) => (
              <img
                key={`img-${idx}`}
                src={img.src}
                alt={img.title}
                loading="lazy"
                onLoad={() =>
                  setLoadedImages((prev) => ({ ...prev, [img.src!]: true }))
                }
                className={`w-60 h-full object-cover rounded-lg shadow-lg flex-shrink-0 cursor-pointer transition-opacity duration-300 ${
                  loadedImages[img.src!] ? "opacity-100" : "opacity-0"
                }`}
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
              loading="lazy"
              onLoad={() =>
                setLoadedImages((prev) => ({ ...prev, [img.src!]: true }))
              }
              className={`w-full h-40 md:h-60 object-cover rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-opacity duration-300 ${
                loadedImages[img.src!] ? "opacity-100" : "opacity-0"
              }`}
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
          aria-modal="true"
          role="dialog"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute cursor-pointer left-4 text-white text-3xl md:text-5xl font-bold z-50"
            aria-label="Previous image"
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
            aria-label="Next image"
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
            className="text-lg text-center bg-blue-600 px-4 cursor-pointer py-2 rounded-full hover:bg-blue-700 transition"
          >
            View All Images
          </button>
        </div>
      )}
    </>
  );
}
