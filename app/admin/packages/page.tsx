"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";
import { toast } from "react-hot-toast";
import gsap from "gsap";

type Package = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  const deleteModalRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // GSAP animations
  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3 }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    if (deleteModalRef.current) {
      gsap.fromTo(
        deleteModalRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3 }
      );
    }
  }, [deleteTarget]);

  // Fetch packages
  async function fetchPackages() {
    const { data, error } = await supabase
      .from("Packages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Fetch error:", error.message);
      toast.error("Failed to fetch packages");
    } else {
      setPackages(data || []);
    }
  }

  useEffect(() => {
    fetchPackages();
  }, []);

  // Save or update package
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = Number(formData.get("price"));

    try {
      if (editingPackage) {
        const { error: updateError } = await supabase
          .from("Packages")
          .update({ name, description, price })
          .eq("id", editingPackage.id);
        if (updateError) throw updateError;

        setPackages((prev) =>
          prev.map((pkg) =>
            pkg.id === editingPackage.id
              ? { ...pkg, name, description, price }
              : pkg
          )
        );
        toast.success("Package updated successfully!");
      } else {
        const { data: newData, error: insertError } = await supabase
          .from("Packages")
          .insert([{ name, description, price }])
          .select();
        if (insertError) throw insertError;

        setPackages((prev) => [...(newData || []), ...prev]);
        toast.success("Package added successfully!");
      }
    } catch (error: any) {
      console.error("Supabase error:", error.message, error.details);
      toast.error("Error saving package. Check console for details.");
    } finally {
      setLoading(false);
      setIsOpen(false);
      setEditingPackage(null);
    }
  }

  // Open delete modal
  function confirmDelete(pkg: Package) {
    setDeleteTarget(pkg);
  }

  // Handle actual deletion
  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;

    const { error } = await supabase
      .from("Packages")
      .delete()
      .eq("id", deleteTarget.id);

    if (error) {
      console.error("Delete error:", error.message);
      toast.error("Failed to delete package");
    } else {
      setPackages((prev) => prev.filter((pkg) => pkg.id !== deleteTarget.id));
      toast.success("Package deleted successfully!");
    }

    setDeleteTarget(null);
  }

  // Filtered packages
  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      const matchesSearch =
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMin = minPrice === "" || pkg.price >= minPrice;
      const matchesMax = maxPrice === "" || pkg.price <= maxPrice;
      return matchesSearch && matchesMin && matchesMax;
    });
  }, [packages, searchTerm, minPrice, maxPrice]);

  const gradients = [
    "from-purple-400 via-pink-400 to-red-400",
    "from-green-400 via-teal-400 to-blue-500",
    "from-yellow-400 via-orange-400 to-red-500",
    "from-indigo-400 via-purple-400 to-pink-500",
    "from-pink-400 via-rose-400 to-red-500",
    "from-cyan-400 via-blue-400 to-indigo-500",
  ];

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1>
          <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
            Packages Management
          </span>
        </h1>
        <button
          onClick={() => {
            setEditingPackage(null);
            setIsOpen(true);
          }}
          className="flex items-center gap-2 cursor-pointer bg-gradient-to-r from-green-600 to-green-500 text-white text-2xl p-2 rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
        >
          <FaPlus />
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center">
        <div className="relative w-full sm:w-1/3">
          <FaSearch className="absolute top-3 left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) =>
            setMinPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full sm:w-32"
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) =>
            setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition w-full sm:w-32"
        />
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6  max-h-[70vh] pr-2">
        {filteredPackages.length === 0 && (
          <p className="text-gray-400 col-span-full text-center mt-6">
            No packages found.
          </p>
        )}
        {filteredPackages.map((pkg, index) => {
          const gradientClass = gradients[index % gradients.length];
          return (
            <div
              key={pkg.id}
              className={`bg-gradient-to-tr ${gradientClass} rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 p-6 flex flex-col justify-between text-white`}
            >
              <div>
                <h2 className="text-2xl font-semibold">{pkg.name}</h2>
                <p className="mt-2 line-clamp-3">{pkg.description}</p>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xl font-bold">₹{pkg.price}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingPackage(pkg);
                      setIsOpen(true);
                    }}
                    className="flex items-center gap-1 bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(pkg)}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.1)] backdrop-blur-md bg-opacity-50 z-50">
          <div
            ref={modalRef}
            className="bg-black p-6 rounded-2xl shadow-2xl w-full max-w-md"
          >
            <h2 className="text-2xl font-bold mb-5 text-amber-400">
              {editingPackage ? "Edit Package" : "Add Package"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Package Name"
                defaultValue={editingPackage?.name || ""}
                className="w-full p-3 border border-gray-300  rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                defaultValue={editingPackage?.description || ""}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                rows={3}
              />
              <input
                type="number"
                name="price"
                placeholder="Price"
                defaultValue={editingPackage?.price || ""}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                required
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2 bg-red-600 cursor-pointer rounded-lg hover:bg-red-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-5 cursor-pointer py-2 rounded-lg text-white ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
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
        <div className="fixed inset-0 flex items-center justify-center bg-[rgba(0,0,0,.4)]   bg-opacity-50 z-50">
          <div
            ref={deleteModalRef}
            className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm"
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Delete "{deleteTarget.name}"?
            </h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this package? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-green-600 rounded-lg hover:bg-green-700 cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 cursor-pointer bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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
