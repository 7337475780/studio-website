"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PiSpinner } from "react-icons/pi";

gsap.registerPlugin(ScrollTrigger);

const supabase = createClientComponentClient();

export interface PortfolioItem {
  id: string;
  title: string;
  images: string[];
  videos: string[];
}

const Portfolio = () => {
  const [services, setServices] = useState<PortfolioItem[]>([]);
  const [activeService, setActiveService] = useState("All");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxType, setLightboxType] = useState<"image" | "video">("image");
  const [loading, setLoading] = useState(true);

  const cardsRef = useRef<HTMLDivElement[]>([]);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  // Fetch services with images and videos
  const fetchPortfolio = async () => {
    const { data: servicesData, error: servicesError } = await supabase
      .from("services")
      .select("*")
      .order("id", { ascending: true });

    if (servicesError) return console.error(servicesError);
    if (!servicesData) return;

    const enrichedServices: PortfolioItem[] = await Promise.all(
      servicesData.map(async (service: any) => {
        const { data: imagesData } = await supabase
          .from("service_images")
          .select("image_url")
          .eq("service_title", service.title)
          .order("created_at", { ascending: true });

        const { data: videosData } = await supabase
          .from("videos")
          .select("video_url")
          .eq("service_title", service.title)
          .order("created_at", { ascending: true });

        const images = imagesData
          ? imagesData.map((img: any) => img.image_url)
          : [];
        const videos = videosData
          ? videosData.map((v: any) => v.video_url)
          : [];

        return { id: service.id, title: service.title, images, videos };
      })
    );

    setServices(enrichedServices);
  };

  // Fetch portfolio immediately on component load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPortfolio();
      setLoading(false);
    })();
  }, []);

  const filteredServices =
    activeService === "All"
      ? services
      : services.filter((s) => s.title === activeService);

  // Animate cards on scroll
  useEffect(() => {
    if (cardsRef.current.length === 0) return;

    gsap.fromTo(
      cardsRef.current,
      { opacity: 0, y: 60, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        stagger: 0.2,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: "#portfolio",
          start: "top 80%",
          toggleActions: "play reverse play reverse",
        },
      }
    );
  }, [filteredServices]);

  // Animate thumbnails in modal
  useEffect(() => {
    if (!thumbnailsRef.current) return;
    const thumbnails = thumbnailsRef.current.children;
    gsap.fromTo(
      thumbnails,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" }
    );
  }, [selectedItem, lightboxType]);

  const nextMedia = () => {
    if (!selectedItem) return;
    const mediaArray =
      lightboxType === "image" ? selectedItem.images : selectedItem.videos;
    setLightboxIndex((prev) => (prev + 1 < mediaArray.length ? prev + 1 : 0));
  };

  const prevMedia = () => {
    if (!selectedItem) return;
    const mediaArray =
      lightboxType === "image" ? selectedItem.images : selectedItem.videos;
    setLightboxIndex((prev) =>
      prev - 1 >= 0 ? prev - 1 : mediaArray.length - 1
    );
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (e.key === "ArrowRight") nextMedia();
      if (e.key === "ArrowLeft") prevMedia();
      if (e.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedItem, lightboxType]);

  return (
    <section id="portfolio" className="py-16 bg-black text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-8">Our Portfolio</h2>

        {loading ? (
          <div className="text-white w-full flex items-center justify-center gap-2 text-xl">
            <PiSpinner className="text-xl animate-spin" /> Loading portfolio...
          </div>
        ) : (
          <>
            {/* Service Filters - Horizontal Scroll with Floating Icons & Snap */}
            <div className="relative mb-12">
              {/* Left Fade Gradient */}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-black/80 to-transparent z-10 hidden md:block" />
              {/* Right Fade Gradient */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-black/80 to-transparent z-10 hidden md:block" />

              {/* Left Scroll Icon */}
              <button
                onClick={() => {
                  const container =
                    document.getElementById("filters-container");
                  if (container)
                    container.scrollBy({ left: -200, behavior: "smooth" });
                }}
                className="hidden cursor-pointer md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 text-white text-4xl lg:text-2xl opacity-40 hover:opacity-90 transition px-2"
              >
                ‹
              </button>

              {/* Right Scroll Icon */}
              <button
                onClick={() => {
                  const container =
                    document.getElementById("filters-container");
                  if (container)
                    container.scrollBy({ left: 200, behavior: "smooth" });
                }}
                className="hidden cursor-pointer md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 text-white text-4xl lg:text-2xl opacity-40 hover:opacity-90 transition px-2"
              >
                ›
              </button>

              <div
                id="filters-container"
                className="overflow-x-auto scrollbar-hide flex gap-4 px-4 snap-x snap-mandatory"
              >
                {["All", ...services.map((s) => s.title)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveService(cat)}
                    className={`flex-shrink-0 snap-start px-4 py-2 rounded-full cursor-pointer font-medium transition whitespace-nowrap ${
                      activeService === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-700 text-gray-200 hover:bg-blue-500"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio Grid */}
            <div className="grid md:grid-cols-3 gap-8">
              {filteredServices.map((item, idx) => (
                <div
                  key={item.id}
                  ref={(el) => {
                    if (el) cardsRef.current[idx] = el;
                  }}
                  className="bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl border border-gray-100/40 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => {
                    setSelectedItem(item);
                    setLightboxIndex(0);
                    setLightboxType("image");
                  }}
                >
                  {item.images[0] && (
                    <Image
                      src={item.images[0]}
                      alt={item.title}
                      width={500}
                      height={400}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-amber-400">
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto scrollbar-hide"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-4xl w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 right-4 text-black text-2xl font-bold hover:scale-110 transition"
            >
              <IoClose />
            </button>

            {/* Toggle Buttons */}
            <div className="absolute top-4 left-4 flex gap-2 z-50">
              {selectedItem.images.length > 0 && (
                <button
                  className={`px-4 py-1 rounded-full font-semibold ${
                    lightboxType === "image"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-black hover:bg-blue-500 hover:text-white"
                  }`}
                  onClick={() => {
                    setLightboxType("image");
                    setLightboxIndex(0);
                  }}
                >
                  Images
                </button>
              )}
              {selectedItem.videos.length > 0 && (
                <button
                  className={`px-4 py-1 rounded-full font-semibold ${
                    lightboxType === "video"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-300 text-black hover:bg-blue-500 hover:text-white"
                  }`}
                  onClick={() => {
                    setLightboxType("video");
                    setLightboxIndex(0);
                  }}
                >
                  Videos
                </button>
              )}
            </div>

            <div className="relative">
              {lightboxType === "image" && (
                <Image
                  src={selectedItem.images[lightboxIndex]}
                  alt={selectedItem.title}
                  width={1000}
                  height={800}
                  className="w-full h-64 md:h-96 object-cover rounded-t-lg"
                />
              )}
              {lightboxType === "video" && (
                <video
                  src={selectedItem.videos[lightboxIndex]}
                  controls
                  className="w-full h-64 md:h-96 object-cover rounded-t-lg"
                />
              )}
              {(selectedItem.images.length > 1 ||
                selectedItem.videos.length > 1) && (
                <>
                  <button
                    onClick={prevMedia}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold hover:scale-110 transition"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextMedia}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold hover:scale-110 transition"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="p-6 overflow-scroll w-full hide-scrollbar h-[250px] ">
              <h3 className="text-2xl font-bold mb-4 text-amber-400">
                {selectedItem.title}
              </h3>

              {/* Thumbnails */}
              <div
                ref={thumbnailsRef}
                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
              >
                {lightboxType === "image"
                  ? selectedItem.images.map((img, idx) => (
                      <Image
                        key={idx}
                        src={img}
                        alt={`${selectedItem.title} ${idx + 1}`}
                        width={400}
                        height={300}
                        className="w-full h-32 object-cover rounded-lg hover:scale-105 transition cursor-pointer"
                        onClick={() => setLightboxIndex(idx)}
                      />
                    ))
                  : selectedItem.videos.map((vid, idx) => (
                      <video
                        key={idx}
                        src={vid}
                        className="w-full h-32 object-cover rounded-lg hover:scale-105 transition cursor-pointer"
                        onClick={() => setLightboxIndex(idx)}
                        controls
                      />
                    ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Portfolio;
