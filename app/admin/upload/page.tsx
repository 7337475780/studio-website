"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";

const supabase = createClientComponentClient();

// Cloudinary optimization helper
const optimizeUrl = (url: string) =>
  url.replace("/upload/", "/upload/w_600,q_auto,f_auto/");

export default function AdminUpload() {
  const [uploadType, setUploadType] = useState<"gallery" | "service">(
    "gallery"
  );
  const [title, setTitle] = useState(""); // only for gallery
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "delete">("edit");
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editService, setEditService] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Lightbox state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
    if (uploadType === "service") fetchServices();
  }, [uploadType]);

  // Fetch images
  const fetchImages = async () => {
    setFetching(true);
    const table = uploadType === "gallery" ? "photos" : "service_images";
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setImages(data);
    setFetching(false);
  };

  // Fetch services
  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("title");
    if (error) {
      toast.error("Failed to fetch services");
      return;
    }
    if (data) {
      const titles = data.map((s: any) => s.title);
      setServices(titles);
      if (titles.length > 0) setSelectedService(titles[0]);
    }
  };

  // Handle files selection
  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
  }, []);

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault();

  // Remove a selected file
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload all files
  const handleUpload = async () => {
    if (
      files.length === 0 ||
      (uploadType === "gallery" && !title) ||
      (uploadType === "service" && !selectedService)
    ) {
      toast.error("Please provide all required fields and select files.");
      return;
    }

    setLoading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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

        const table = uploadType === "gallery" ? "photos" : "service_images";
        const payload =
          uploadType === "gallery"
            ? { title, image_url: data.secure_url, is_active: true }
            : { service_title: selectedService, image_url: data.secure_url };

        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
      }

      toast.success("All images uploaded successfully!");
      setTitle("");
      setFiles([]);
      fetchImages();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: "edit" | "delete", img: any) => {
    setSelectedImage(img);
    setModalMode(mode);
    setEditTitle(img.title || "");
    setEditService(img.service_title || "");
    setIsModalOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedImage) return;
    setActionLoading(true);
    const table = uploadType === "gallery" ? "photos" : "service_images";
    const { error } = await supabase
      .from(table)
      .update({
        ...(uploadType === "gallery" && { title: editTitle }),
        ...(uploadType === "service" && { service_title: editService }),
      })
      .eq("id", selectedImage.id);

    setActionLoading(false);
    if (error) toast.error("Failed to update");
    else {
      toast.success("Updated successfully");
      fetchImages();
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedImage) return;
    setActionLoading(true);
    const table = uploadType === "gallery" ? "photos" : "service_images";
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", selectedImage.id);

    setActionLoading(false);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Deleted successfully");
      fetchImages();
      setIsModalOpen(false);
    }
  };

  const optimizedImages = useMemo(
    () =>
      images.map((img) => ({
        ...img,
        optimizedUrl: optimizeUrl(img.image_url),
      })),
    [images]
  );

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-center mb-10 ">
          <span className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
            Upload Images
          </span>
        </h1>

        {/* Upload Card */}
        <div className="bg-gray-900/70 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-gray-800 mb-12">
          <div className="flex gap-4 mb-8 justify-center">
            {["gallery", "service"].map((type) => (
              <button
                key={type}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  uploadType === type
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
                onClick={() => setUploadType(type as "gallery" | "service")}
              >
                {type === "gallery" ? "Gallery" : "Service"}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-4">
            {uploadType === "gallery" && (
              <input
                type="text"
                placeholder="Photo Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            )}

            {uploadType === "service" && (
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {services.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {/* Drag & Drop */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition"
            >
              <p className="text-gray-400 mb-3">Drag & Drop images here</p>
              <p className="text-gray-400 mb-3">or</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="block text-center text-gray-300 file:mr-4 file:py-2 file:px-4 
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-600 file:text-white
                  hover:file:bg-blue-500 cursor-pointer"
              />
            </div>

            {/* Preview selected files */}
            {files.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {files.map((file, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-600 p-1 rounded-full text-white hover:bg-red-500"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500 transition disabled:opacity-50 shadow-lg"
            >
              {loading ? "Uploading..." : "Upload All"}
            </button>
          </div>
        </div>

        {/* Gallery / Service Images */}
        <h2 className="text-3xl font-bold mb-6 text-center text-amber-400">
          {uploadType === "gallery" ? "Gallery Collection" : "Service Showcase"}
        </h2>

        {fetching ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 animate-pulse h-48 rounded-lg"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {optimizedImages.map((img) => (
              <div
                key={img.id}
                className="relative hover:scale-105 group rounded-xl overflow-hidden bg-gray-900/70 border border-gray-800 hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-500/20"
              >
                <img
                  src={img.optimizedUrl}
                  alt={img.title || img.service_title}
                  loading="lazy"
                  className="w-full h-48 object-cover rounded-t-xl cursor-pointer group-hover:opacity-90 transition"
                  onClick={() => setPreviewImage(img.image_url)}
                />
                {/* Service Tag */}
                {uploadType === "service" && img.service_title && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                    {img.service_title}
                  </div>
                )}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => openModal("edit", img)}
                    className="p-2 bg-blue-600/90 hover:bg-blue-500 rounded-full shadow-lg transition"
                    title="Edit"
                  >
                    <FiEdit size={16} />
                  </button>
                  <button
                    onClick={() => openModal("delete", img)}
                    className="p-2 bg-red-600/90 hover:bg-red-500 rounded-full shadow-lg transition"
                    title="Delete"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals & Lightbox */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-white"
                onClick={() => setIsModalOpen(false)}
              >
                <FiX size={20} />
              </button>

              {modalMode === "edit" ? (
                <>
                  <h3 className="text-xl font-bold mb-4 text-blue-400">
                    Edit Image
                  </h3>
                  {uploadType === "gallery" && (
                    <input
                      type="text"
                      placeholder="Image Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 mb-3"
                    />
                  )}
                  {uploadType === "service" && (
                    <select
                      value={editService}
                      onChange={(e) => setEditService(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 mb-3"
                    >
                      {services.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={handleEdit}
                    disabled={actionLoading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg mt-3 hover:bg-blue-500 transition disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4 text-red-500">
                    Delete Image
                  </h3>
                  <p className="mb-4 text-gray-300">
                    Are you sure you want to delete this image? This action
                    cannot be undone.
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-500 transition disabled:opacity-50 text-white"
                    >
                      {actionLoading ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0  bg-black/80 flex items-center justify-center z-50 cursor-pointer"
          >
            <img
              src={previewImage}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
