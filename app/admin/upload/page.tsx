"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";

const supabase = createClientComponentClient();

export default function AdminUpload() {
  const [uploadType, setUploadType] = useState<"gallery" | "service">(
    "gallery"
  );
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");

  useEffect(() => {
    fetchImages();
    fetchServices();
  }, [uploadType]);

  // Fetch existing images
  const fetchImages = async () => {
    const table = uploadType === "gallery" ? "photos" : "service_images";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setImages(data);
  };

  // Fetch service titles
  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("title");
    if (error) {
      toast.error("Failed to fetch services");
      return;
    }
    if (data) {
      const serviceTitles = data.map((s: any) => s.title);
      setServices(serviceTitles);
      if (serviceTitles.length > 0) setSelectedService(serviceTitles[0]);
    }
  };

  const handleUpload = async () => {
    if (
      !file ||
      (uploadType === "gallery" && !title) ||
      (uploadType === "service" && !selectedService)
    ) {
      toast.error("Please provide all required fields and select a file.");
      return;
    }

    setLoading(true);
    try {
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!data.secure_url) throw new Error("Cloudinary upload failed");

      // Save in Supabase
      if (uploadType === "gallery") {
        const { error } = await supabase.from("photos").insert({
          title,
          image_url: data.secure_url,
          is_active: true,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_images").insert({
          service_title: selectedService,
          image_url: data.secure_url,
        });
        if (error) throw error;
      }

      toast.success("Image uploaded successfully!");
      setTitle("");
      setFile(null);
      fetchImages();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-bold mb-6">📤 Upload Image</h1>

      {/* Upload type toggle */}
      <div className="flex gap-4 mb-4">
        <button
          className={`px-4 py-2 rounded ${
            uploadType === "gallery" ? "bg-blue-600" : "bg-gray-800"
          }`}
          onClick={() => setUploadType("gallery")}
        >
          Gallery
        </button>
        <button
          className={`px-4 py-2 rounded ${
            uploadType === "service" ? "bg-blue-600" : "bg-gray-800"
          }`}
          onClick={() => setUploadType("service")}
        >
          Service
        </button>
      </div>

      <div className="flex flex-col gap-4 max-w-md">
        {/* Gallery: input for title */}
        {uploadType === "gallery" && (
          <input
            type="text"
            placeholder="Photo Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800"
          />
        )}

        {/* Service: dropdown for selecting service */}
        {uploadType === "service" && (
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="px-4 py-2 rounded bg-gray-800 text-white"
          >
            {services.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* Uploaded Images */}
      <h2 className="text-xl font-semibold mt-8 mb-4">
        Uploaded {uploadType === "gallery" ? "Gallery" : "Service"} Images
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-gray-900 p-2 rounded-lg">
            <img
              src={img.image_url}
              alt={img.title || img.service_title}
              className="rounded"
            />
            <p className="mt-2 text-sm">{img.title || img.service_title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
