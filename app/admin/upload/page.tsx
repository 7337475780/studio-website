"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";

const supabase = createClientComponentClient();

export default function AdminUpload() {
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Update preview whenever file changes
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    // Clean up memory when component unmounts or file changes
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

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
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!data.secure_url) throw new Error("Cloudinary upload failed");

      // Insert into Supabase
      const { error } = await supabase.from("photos").insert({
        title,
        image_url: data.secure_url,
        is_active: true,
      });

      if (error) throw error;

      toast.success("Photo uploaded successfully!");
      setTitle("");
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      console.error(err);
      toast.error("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4">
      <h1 className="text-3xl font-bold mb-6 text-white">Admin Photo Upload</h1>

      <input
        type="text"
        placeholder="Photo Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-4 px-4 py-2 border rounded w-full max-w-md"
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4"
      />

      {/* Preview */}
      {preview && (
        <div className="mb-4">
          <p className="text-white mb-2">Preview:</p>
          <img
            src={preview}
            alt="Preview"
            className="max-w-md rounded shadow-lg border"
          />
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={loading}
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Photo"}
      </button>
    </div>
  );
}
