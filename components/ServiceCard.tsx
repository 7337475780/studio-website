"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { IoClose } from "react-icons/io5";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

export interface Service {
  id: string;
  title: string;
  description: string;
}

export interface ServiceImage {
  id: string;
  service_title: string;
  image_url: string;
}

const ServiceCard = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [gallery, setGallery] = useState<ServiceImage[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Fetch services
  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("id, title, description");
    if (error) return console.error(error);
    if (data) setServices(data);
  };

  // Fetch all service images
  const fetchAllImages = async () => {
    const { data, error } = await supabase
      .from("service_images")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return console.error(error);
    if (data) setServiceImages(data);
  };

  useEffect(() => {
    fetchServices();
    fetchAllImages();
  }, []);

  // Set gallery for selected service
  useEffect(() => {
    if (selectedService) {
      const images = serviceImages.filter(
        (img) => img.service_title === selectedService.title
      );
      setGallery(images);
    }
  }, [selectedService, serviceImages]);

  return (
    <section className="py-16 bg-black text-white">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-4xl font-bold mb-12">Our Services</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => {
            const mainImage = serviceImages.find(
              (img) => img.service_title === service.title
            );
            return (
              <div
                key={service.id}
                className="bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl border border-gray-100/40 rounded-lg shadow-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => setSelectedService(service)}
              >
                {mainImage && (
                  <Image
                    src={mainImage.image_url}
                    alt={service.title}
                    width={500}
                    height={400}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-amber-400">
                    {service.title}
                  </h3>
                  <p className="text-blue-400 mt-2">{service.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl w-full relative">
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 text-gray-900 dark:text-white"
            >
              <IoClose size={28} />
            </button>

            <h3 className="text-2xl font-bold mb-4 text-blue-600">
              {selectedService.title}
            </h3>
            <p className="mb-6 text-gray-600">{selectedService.description}</p>

            {/* Gallery */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.length > 0 ? (
                gallery.map((img, idx) => (
                  <div key={img.id} className="relative">
                    <Image
                      src={img.image_url}
                      alt={selectedService.title}
                      width={400}
                      height={300}
                      className="w-full h-64 object-cover rounded-lg hover:scale-105 transition cursor-pointer"
                      onClick={() => setLightboxIndex(idx)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-500 col-span-full">
                  No images for this service.
                </p>
              )}
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
            src={gallery[lightboxIndex].image_url}
            alt="Lightbox"
            width={1000}
            height={800}
            className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
          />
        </div>
      )}
    </section>
  );
};

export default ServiceCard;
