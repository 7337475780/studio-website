"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { usePathname, useRouter } from "next/navigation";

gsap.registerPlugin(ScrollTrigger);

export interface Service {
  title: string;
  description: string;
  image: string;
  galleryImages?: string[];
}

const Services = ({ services }: { services: Service[] }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const cardsRef = useRef<HTMLDivElement[]>([]);
  const modalRef = useRef<HTMLDivElement>(null);
  const galleryRefs = useRef<HTMLDivElement[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  // Animate cards with ScrollTrigger
  useEffect(() => {
    cardsRef.current.forEach((card) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 80, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            toggleActions: "play play reverse reverse", // animate in on scroll down, reverse on scroll up
          },
        }
      );
    });
  }, []);

  // Animate modal open
  useEffect(() => {
    if (selectedService && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
      );

      // Animate gallery images inside modal
      galleryRefs.current.forEach((img, idx) => {
        gsap.fromTo(
          img,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            delay: idx * 0.1,
            ease: "power3.out",
          }
        );
      });
    }
  }, [selectedService]);

  const handleCloseModal = () => {
    if (modalRef.current) {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.9,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => {
          setSelectedService(null);
          setLightboxIndex(null);
          galleryRefs.current = [];
        },
      });
    } else {
      setSelectedService(null);
      setLightboxIndex(null);
      galleryRefs.current = [];
    }
  };

  return (
    <section id="services" className="py-16 bg-black">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-12 text-white">Our Services</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <div
              key={idx}
              ref={(el) => {
                if (el) cardsRef.current[idx] = el;
              }}
              className="bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl border border-gray-100/40 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => setSelectedService(service)}
            >
              <Image
                src={service.image}
                alt={service.title}
                width={500}
                height={400}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-amber-400">
                  {service.title}
                </h3>
                <p className="text-blue-400 mt-2">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl bg-opacity-70 flex items-center justify-center z-50">
          <div
            ref={modalRef}
            className="rounded-lg p-6 max-w-4xl w-full relative bg-white"
          >
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-blue-600 cursor-pointer hover:text-blue-600/80"
            >
              <IoClose size={28} />
            </button>
            <h3 className="text-2xl font-bold mb-4 text-blue-600">
              {selectedService.title}
            </h3>
            <p className="mb-6 text-gray-600">{selectedService.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {selectedService.galleryImages?.map((img, idx) => (
                <Image
                  key={idx}
                  ref={(el) => {
                    if (el) galleryRefs.current[idx] = el;
                  }}
                  src={img}
                  alt={`${selectedService.title} ${idx + 1}`}
                  width={400}
                  height={300}
                  className="w-full h-32 object-cover rounded-lg hover:scale-105 transition cursor-pointer"
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white"
          >
            <IoClose size={36} />
          </button>
          <Image
            src={selectedService.galleryImages![lightboxIndex]}
            alt="Lightbox"
            width={1000}
            height={800}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>
      )}

      {pathname !== "/services" ? (
        <div className="mt-12 w-full items-center flex justify-center cursor-pointer">
          <button
            onClick={() => router.push("/services")}
            className="bg-amber-400 text-black font-semibold px-6 py-3 rounded-lg shadow-lg hover:bg-amber-500 transition"
          >
            View All Services
          </button>
        </div>
      ) : (
        <div></div>
      )}
    </section>
  );
};

export default Services;
