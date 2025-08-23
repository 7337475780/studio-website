"use client";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Package = {
  id: string;
  name: string;
  description: string;
  price: number;
};

const PackagesAdmin = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: 0 });
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch packages
  const fetchPackages = async () => {
    const res = await fetch("/api/packages");
    const data = await res.json();
    setPackages(data);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // Add or update package
  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (editId) {
        // Update
        const res = await fetch(`/api/packages/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.ok) toast.success("Package updated!");
        else toast.error(data.error);
      } else {
        // Create
        const res = await fetch("/api/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.ok) toast.success("Package added!");
        else toast.error(data.error);
      }
      setForm({ name: "", description: "", price: 0 });
      setEditId(null);
      fetchPackages();
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Delete package
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Package deleted!");
      fetchPackages();
    } else toast.error(data.error);
  };

  // Fill form for editing
  const handleEdit = (pkg: Package) => {
    setForm({ name: pkg.name, description: pkg.description, price: pkg.price });
    setEditId(pkg.id);
  };

  return (
    <div className="w-[400px] bg-[rgba(0,0,0,0.4)] backdrop-blur-3xl mt-10 border border-gray-50/10  mx-auto p-6  rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">Manage Packages</h1>

      <div className="mb-6 flex flex-col gap-y-2 py-4 ">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 border  rounded-full mb-2"
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full p-2 border rounded-full mb-2"
        />
        <input
          type="text"
          placeholder="Price"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          className="w-full p-2 border rounded-full mb-2"
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full  bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700"
        >
          {editId ? "Update Package" : "Add Package"}
        </button>
      </div>

      <div>
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex justify-between items-center p-2 border-b"
          >
            <div>
              <p className="font-semibold">
                {pkg.name} - ₹{pkg.price}
              </p>
              <p className="text-sm">{pkg.description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(pkg)}
                className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(pkg.id)}
                className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackagesAdmin;
