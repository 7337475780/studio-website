"use client";
import Gallery from "@/components/Gallery";
import HeroSection from "@/components/HeroSection";
import Services from "@/components/ServiceCard";
import { services } from "@/lib/data";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";

interface Photo {
  id: number;
  title?: string;
  image_url: string;
}

const Page = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);

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
      <Services services={services} />
    </div>
  );
};

export default Page;
