"use client";
import Gallery, { Photo } from "@/components/Gallery";
import { portfolio } from "@/lib/data";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";

const page = () => {
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
      <Gallery photos={photos} />
    </div>
  );
};

export default page;
