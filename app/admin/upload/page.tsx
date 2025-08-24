"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";

const supabase = createClientComponentClient();

export default function AdminUpload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    let { data, error } = await supabase
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setImages(data);
  };

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error("Please provide a title and select an image.");
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
      const { error } = await supabase.from("photos").insert({
        title,
        image_url: data.secure_url,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Photo uploaded successfully!");
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

      <div className="flex flex-col gap-4 max-w-md">
        <input
          type="text"
          placeholder="Photo Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="px-4 py-2 rounded bg-gray-800"
        />

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
      <h2 className="text-xl font-semibold mt-8 mb-4">Uploaded Photos</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((img) => (
          <div key={img.id} className="bg-gray-900 p-2 rounded-lg">
            <img src={img.image_url} alt={img.title} className="rounded" />
            <p className="mt-2 text-sm">{img.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
