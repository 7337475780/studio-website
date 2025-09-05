"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

gsap.registerPlugin(ScrollTrigger);

const supabase = createClientComponentClient();

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description: string;
  galleryImages: string[];
}

const Portfolio = () => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const cardsRef = useRef<HTMLDivElement[]>([]);
  const thumbnailsRef = useRef<HTMLDivElement>(null);

  const categories = [
    "All",
    "Drone",
    "Prewedding",
    "Event",
    "Marriage",
    "Passport",
    "Fashion",
  ];

  // Fetch portfolio items with images from Supabase
  const fetchPortfolio = async () => {
    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolio")
      .select("*")
      .order("id", { ascending: true });
    console.log(portfolioData);

    if (portfolioError) return console.error(portfolioError);
    if (!portfolioData) return;

    const enrichedItems: PortfolioItem[] = await Promise.all(
      portfolioData.map(async (item: any) => {
        const { data: imagesData } = await supabase
          .from("service_images")
          .select("image_url")
          .eq("service_title", item.title)
          .order("created_at", { ascending: true });
        console.log(imagesData);

        const galleryImages = imagesData
          ? imagesData.map((img: any) => img.image_url)
          : [];
        return { ...item, galleryImages };
      })
    );

    setItems(enrichedItems);
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const filteredItems =
    activeCategory === "All"
      ? items
      : items.filter((item) => item.category === activeCategory);

  // GSAP animation for cards
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
  }, [filteredItems]);

  // Animate thumbnails in modal
  useEffect(() => {
    if (!thumbnailsRef.current) return;

    const thumbnails = thumbnailsRef.current.children;
    gsap.fromTo(
      thumbnails,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.5, ease: "power3.out" }
    );
  }, [selectedItem]);

  const nextImage = () => {
    if (!selectedItem?.galleryImages) return;
    setLightboxIndex((prev) =>
      prev + 1 < selectedItem.galleryImages.length ? prev + 1 : 0
    );
  };

  const prevImage = () => {
    if (!selectedItem?.galleryImages) return;
    setLightboxIndex((prev) =>
      prev - 1 >= 0 ? prev - 1 : selectedItem.galleryImages.length - 1
    );
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "Escape") setSelectedItem(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedItem]);

  return (
    <section id="portfolio" className="py-16 bg-black text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-8">Our Portfolio</h2>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full cursor-pointer font-medium transition ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-200 hover:bg-blue-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Portfolio Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              ref={(el) => {
                if (el) cardsRef.current[idx] = el;
              }}
              className="bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl border border-gray-100/40 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => {
                setSelectedItem(item);
                setLightboxIndex(0);
              }}
            >
              {item.galleryImages[0] && (
                <Image
                  src={item.galleryImages[0]}
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
                <p className="text-blue-400 mt-2">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 overflow-auto"
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

            {/* Main Image */}
            <div className="relative">
              <Image
                src={selectedItem.galleryImages[lightboxIndex]}
                alt={selectedItem.title}
                width={1000}
                height={800}
                className="w-full h-64 md:h-96 object-cover rounded-t-lg"
              />
              {selectedItem.galleryImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold hover:scale-110 transition"
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white text-3xl font-bold hover:scale-110 transition"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold mb-4 text-amber-400">
                {selectedItem.title}
              </h3>
              <p className="text-gray-700 mb-4">{selectedItem.description}</p>

              {/* Gallery Thumbnails */}
              {selectedItem.galleryImages.length > 0 && (
                <div
                  ref={thumbnailsRef}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                  {selectedItem.galleryImages.map((img, idx) => (
                    <Image
                      key={idx}
                      src={img}
                      alt={`${selectedItem.title} ${idx + 1}`}
                      width={400}
                      height={300}
                      className="w-full h-32 object-cover rounded-lg hover:scale-105 transition cursor-pointer"
                      onClick={() => setLightboxIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Portfolio;
