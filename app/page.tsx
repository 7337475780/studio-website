"use client";
import Gallery from "@/components/Gallery";
import HeroSection from "@/components/HeroSection";
import Services, { Service } from "@/components/ServiceCard";
import Testimonials from "@/components/Testimonials";
import { testimonials } from "@/lib/data";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import ContactSection from "./contact/page";
import Footer from "@/components/Footer";

interface Photo {
  id: number;
  title?: string;
  image_url: string;
}

const Page = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setPhotos(data || []);
      }
    };

    fetchPhotos();
  }, []);

  return (
    <div>
      <HeroSection />
      <Gallery photos={photos} /> {/* only pass photos */}
      <Services />
      <Testimonials testimonials={testimonials} />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Page;
