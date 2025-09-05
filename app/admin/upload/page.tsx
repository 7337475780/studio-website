"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import toast from "react-hot-toast";
import { FiEdit, FiTrash2, FiX } from "react-icons/fi";

const supabase = createClientComponentClient();

// Cloudinary optimization
const optimizeUrl = (url: string) =>
  url.replace("/upload/", "/upload/w_600,q_auto,f_auto/");

export default function AdminUpload() {
  const [uploadType, setUploadType] = useState<"gallery" | "service">(
    "gallery"
  );
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [images, setImages] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [viewMode, setViewMode] = useState<"all" | "images" | "videos">("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"edit" | "delete">("edit");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editService, setEditService] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images/videos/services
  useEffect(() => {
    if (uploadType === "service") fetchServices();
    fetchImages();
    fetchVideos();
  }, [uploadType]);

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

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setVideos(data);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase.from("services").select("title");
    if (!error && data) {
      const titles = data.map((s: any) => s.title);
      setServices(titles);
      if (titles.length > 0) setSelectedService(titles[0]);
    }
  };

  // File handling
  const handleFiles = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
  }, []);
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) =>
    e.preventDefault();
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload
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

        const isVideo = file.type.startsWith("video/");
        const endpoint = isVideo ? "video/upload" : "image/upload";

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${endpoint}`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        if (!data.secure_url) throw new Error("Cloudinary upload failed");

        let table = "";
        let payload: any = {};

        if (isVideo) {
          table = "videos";
          payload = {
            title,
            video_url: data.secure_url,
            service_title: selectedService,
          };
        } else if (uploadType === "gallery") {
          table = "photos";
          payload = { title, image_url: data.secure_url, is_active: true };
        } else if (uploadType === "service") {
          table = "service_images";
          payload = {
            service_title: selectedService,
            image_url: data.secure_url,
          };
        }

        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
      }

      toast.success("All files uploaded successfully!");
      setTitle("");
      setFiles([]);
      fetchImages();
      fetchVideos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode: "edit" | "delete", item: any) => {
    setSelectedItem(item);
    setModalMode(mode);
    setEditTitle(item.title || "");
    setEditService(item.service_title || "");
    setIsModalOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedItem) return;
    setActionLoading(true);

    const table = selectedItem.video_url
      ? "videos"
      : uploadType === "gallery"
      ? "photos"
      : "service_images";

    const { error } = await supabase
      .from(table)
      .update({
        ...(selectedItem.video_url || uploadType === "gallery"
          ? { title: editTitle }
          : {}),
        ...(uploadType === "service" || selectedItem.video_url
          ? { service_title: editService }
          : {}),
      })
      .eq("id", selectedItem.id);

    setActionLoading(false);
    if (error) toast.error("Failed to update");
    else {
      toast.success("Updated successfully");
      fetchImages();
      fetchVideos();
      setIsModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setActionLoading(true);

    const table = selectedItem.video_url
      ? "videos"
      : uploadType === "gallery"
      ? "photos"
      : "service_images";

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", selectedItem.id);

    setActionLoading(false);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Deleted successfully");
      fetchImages();
      fetchVideos();
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

  const displayedImages = useMemo(
    () => (viewMode === "all" || viewMode === "images" ? optimizedImages : []),
    [viewMode, optimizedImages]
  );
  const displayedVideos = useMemo(
    () => (viewMode === "all" || viewMode === "videos" ? videos : []),
    [viewMode, videos]
  );

  return (
    <div className="min-h-screen bg-black p-8 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-center mb-10 ">
          <span className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent drop-shadow-lg">
            Upload Images/Videos
          </span>
        </h1>

        {/* Upload Section */}
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

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Title (required)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
            />

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

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors duration-300 bg-gray-900/50 hover:bg-gray-800"
            >
              <p className="text-gray-400 text-lg mb-2 font-medium">
                Drag & Drop files here
              </p>
              <p className="text-gray-400 mb-4">or</p>

              <input
                type="file"
                accept="image/*,video/*"
                multiple
                ref={fileInputRef}
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />

              <p className="text-gray-400 text-sm mb-2 font-medium">
                Click anywhere in this box to upload files
              </p>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {files.map((file, i) => (
                  <div key={i} className="relative">
                    {file.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    )}
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
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-500 transition disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload All"}
            </button>
          </div>
        </div>

        {/* Toggle View */}
        <div className="flex justify-center gap-4 mb-6">
          {["all", "images", "videos"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={`px-4 py-2 rounded-full font-semibold transition ${
                viewMode === mode
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {mode === "all"
                ? "All"
                : mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>

        {/* Images & Videos Grids */}
        <div className="space-y-12">
          {viewMode !== "videos" && (
            <div>
              <h2 className="text-3xl font-bold mb-6 text-center text-amber-400">
                {uploadType === "gallery"
                  ? "Gallery Collection"
                  : "Service Showcase"}
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
                  {displayedImages.map((img) => (
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
            </div>
          )}

          {viewMode !== "images" && (
            <div>
              <h2 className="text-3xl font-bold mt-6 mb-6 text-center text-green-400">
                Uploaded Videos
              </h2>
              {displayedVideos.length === 0 ? (
                <div className="text-center text-gray-400">
                  No videos uploaded.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="bg-gray-900/70 rounded-xl overflow-hidden border border-gray-800 shadow-lg p-2 relative group"
                    >
                      <video
                        src={video.video_url}
                        controls
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <h3 className="mt-2 text-white font-semibold">
                        {video.title}
                      </h3>
                      {video.service_title && (
                        <p className="text-gray-400 text-sm">
                          Service: {video.service_title}
                        </p>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => openModal("edit", video)}
                          className="p-2 bg-blue-600/90 hover:bg-blue-500 rounded-full shadow-lg transition"
                          title="Edit"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => openModal("delete", video)}
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
            </div>
          )}
        </div>

        {/* Modal */}
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
                    Edit Item
                  </h3>
                  <input
                    type="text"
                    placeholder="Title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 mb-3"
                  />
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
                  <button
                    onClick={handleEdit}
                    disabled={actionLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-lg font-bold disabled:opacity-50"
                  >
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4 text-red-400">
                    Delete Item
                  </h3>
                  <p className="mb-4 text-gray-300">
                    Are you sure you want to delete this item? This action
                    cannot be undone.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={actionLoading}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-lg font-bold disabled:opacity-50"
                    >
                      {actionLoading ? "Deleting..." : "Delete"}
                    </button>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Image Preview */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <img
              src={previewImage}
              className="max-h-full max-w-full rounded-lg shadow-2xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}
