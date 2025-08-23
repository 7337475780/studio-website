"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";

export interface Service {
  title: string;
  description: string;
  image: string;
  galleryImages?: string[];
}

const Services = ({ services }: { services: Service[] }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 🔹 Preload all gallery images
  useEffect(() => {
    services.forEach((service) => {
      service.galleryImages?.forEach((img) => {
        const preloader = new window.Image();
        preloader.src = img;
      });
    });
  }, []);

  return (
    <section id="services" className="py-16 bg-black">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-12 text-white">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.05 }}
              className="bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl border border-gray-100/40 rounded-lg shadow-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedService(service)}
            >
              <Image
                src={service.image}
                alt={service.title}
                width={500}
                height={400}
                placeholder="blur"
                blurDataURL="/images/gallery/blur-placeholder.jpg"
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-amber-400">
                  {service.title}
                </h3>
                <p className="text-blue-400 mt-2">{service.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🔹 Modal for Gallery */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[rgba(0,0,0,0.1)] backdrop-blur-3xl bg-opacity-70 flex items-center justify-center z-50"
          >
            <div className=" rounded-lg p-6 max-w-4xl w-full relative">
              <button
                onClick={() => {
                  setSelectedService(null);
                  setLightboxIndex(null);
                }}
                className="absolute top-4 right-4 text-blue-600 cursor-pointer hover:text-blue-600/80"
              >
                <IoClose size={28} />
              </button>
              <h3 className="text-2xl font-bold mb-4 text-blue-600">
                {selectedService.title}
              </h3>
              <p className="mb-6 text-gray-600">
                {selectedService.description}
              </p>

              {/* Gallery Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedService.galleryImages?.map((img, idx) => (
                  <Image
                    key={idx}
                    src={img}
                    alt={`${selectedService.title} ${idx + 1}`}
                    width={400}
                    height={300}
                    placeholder="blur"
                    blurDataURL="/images/blur-placeholder.jpg"
                    className="w-full h-32 object-cover rounded-lg hover:scale-105 transition cursor-pointer"
                    onClick={() => setLightboxIndex(idx)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🔹 Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          >
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
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Services;
