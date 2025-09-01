"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { toast } from "react-hot-toast";
import gsap from "gsap";

export interface Service {
  id: string;
  title: string;
  description: string;
}

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch services");
      console.error(error);
    } else {
      setServices(data || []);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: -50, scale: 0.9 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (deleteTarget && deleteModalRef.current) {
      gsap.fromTo(
        deleteModalRef.current,
        { opacity: 0, y: -50 },
        { opacity: 1, y: 0, duration: 0.3 }
      );
    }
  }, [deleteTarget]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    try {
      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update({ title, description })
          .eq("id", editingService.id);
        if (error) throw error;

        setServices((prev) =>
          prev.map((s) =>
            s.id === editingService.id ? { ...s, title, description } : s
          )
        );
        toast.success("Service updated successfully!");
      } else {
        const { data, error } = await supabase
          .from("services")
          .insert([{ title, description }])
          .select();
        if (error) throw error;

        setServices((prev) => [...(data || []), ...prev]);
        toast.success("Service added successfully!");
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Error saving service");
    } finally {
      setLoading(false);
      setIsOpen(false);
      setEditingService(null);
    }
  };

  const confirmDelete = (service: Service) => setDeleteTarget(service);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) {
      toast.error("Failed to delete service");
      console.error(error);
    } else {
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      toast.success("Service deleted successfully!");
    }
    setDeleteTarget(null);
  };

  const filteredServices = useMemo(
    () =>
      services.filter(
        (s) =>
          s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.description.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [services, searchTerm]
  );

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
          Services Management
        </h1>
        <button
          onClick={() => {
            setEditingService(null);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 bg-green-600 text-white text-2xl p-2 rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
        >
          <FaPlus />
        </button>
      </div>

      <div className="relative w-full sm:w-1/3 mb-6">
        <FaSearch className="absolute top-4 left-3 text-gray-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[70vh]  pr-2">
        {filteredServices.length === 0 && (
          <p className="text-gray-400 col-span-full text-center mt-6">
            No services found.
          </p>
        )}
        {filteredServices.map((service, index) => (
          <div
            key={service.id}
            className="bg-gray-900 rounded-2xl shadow-lg p-6 flex flex-col justify-between text-white"
          >
            <div>
              <h2 className="text-2xl font-semibold">{service.title}</h2>
              <p className="mt-2 line-clamp-3">{service.description}</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingService(service);
                  setIsOpen(true);
                }}
                className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors"
              >
                <FaEdit /> Edit
              </button>
              <button
                onClick={() => confirmDelete(service)}
                className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
              >
                <FaTrash /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-md z-50">
          <div
            ref={modalRef}
            className="bg-gray-800 p-6 rounded-3xl shadow-2xl w-full max-w-md transform scale-95 opacity-0"
          >
            <h2 className="text-2xl font-extrabold mb-5 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              {editingService ? "Edit Service" : "Add Service"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                name="title"
                placeholder="Service Title"
                defaultValue={editingService?.title || ""}
                className="w-full p-3 border rounded-xl bg-gray-900 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none transition"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                defaultValue={editingService?.description || ""}
                className="w-full p-3 border rounded-xl bg-gray-900 text-white placeholder-gray-400 focus:ring-2  focus:ring-purple-500 focus:outline-none transition"
                rows={3}
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-md transition transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 py-2 rounded-xl text-white shadow-md transition transform hover:scale-105 ${
                    loading
                      ? "bg-gray-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-purple-600 hover:to-indigo-600"
                  }`}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,.4)] z-50">
          <div
            ref={deleteModalRef}
            className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm"
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Delete "{deleteTarget.title}"?
            </h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this service? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
