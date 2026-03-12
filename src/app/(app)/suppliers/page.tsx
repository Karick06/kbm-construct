"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";

type Supplier = {
  id: string;
  name: string;
  category: string;
  contact: string;
  phone: string;
  email: string;
  status: "Active" | "On Hold" | "Inactive";
  rating: number;
};

const CATEGORIES = ["Groundworks", "Structural", "MEP", "Joinery", "Roofing", "Plastering", "Flooring", "Glazing", "Landscaping", "Plant Hire", "Materials", "Professional Services", "Other"];

const defaultSuppliers: Supplier[] = [
  { id: "SUP-001", name: "ArcBuild Groundworks Ltd", category: "Groundworks", contact: "Dave Walsh", phone: "07712 345678", email: "dave@arcbuild.co.uk", status: "Active", rating: 5 },
  { id: "SUP-002", name: "Northern Steel Fabricators", category: "Structural", contact: "Sarah Holt", phone: "07823 456789", email: "sarah@northsteel.co.uk", status: "Active", rating: 4 },
  { id: "SUP-003", name: "Crestline MEP Solutions", category: "MEP", contact: "Tom Bridges", phone: "07934 567890", email: "tom@crestlinemep.co.uk", status: "Active", rating: 4 },
  { id: "SUP-004", name: "Hartwood Joinery", category: "Joinery", contact: "Lisa Drummond", phone: "07645 678901", email: "lisa@hartwood.co.uk", status: "On Hold", rating: 3 },
  { id: "SUP-005", name: "Peak Plant Hire", category: "Plant Hire", contact: "Mike Farrow", phone: "07756 789012", email: "mike@peakplant.co.uk", status: "Active", rating: 5 },
];

const statusTone: Record<Supplier["status"], string> = { Active: "on-track", "On Hold": "risk", Inactive: "overdue" };
const ratingStars = (r: number) => "★".repeat(r) + "☆".repeat(5 - r);

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<Omit<Supplier, "id">>({ name: "", category: CATEGORIES[0], contact: "", phone: "", email: "", status: "Active", rating: 5 });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_suppliers");
    setSuppliers(stored ? JSON.parse(stored) : defaultSuppliers);
  }, []);

  const save = (updated: Supplier[]) => {
    setSuppliers(updated);
    localStorage.setItem("kbm_suppliers", JSON.stringify(updated));
  };

  const openAdd = () => { setEditing(null); setForm({ name: "", category: CATEGORIES[0], contact: "", phone: "", email: "", status: "Active", rating: 5 }); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditing(s); setForm({ name: s.name, category: s.category, contact: s.contact, phone: s.phone, email: s.email, status: s.status, rating: s.rating }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    if (editing) {
      save(suppliers.map(s => s.id === editing.id ? { ...editing, ...form } : s));
    } else {
      save([...suppliers, { id: `SUP-${String(suppliers.length + 1).padStart(3, "0")}`, ...form }]);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this supplier?")) save(suppliers.filter(s => s.id !== id)); };

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = s.name.toLowerCase().includes(q) || s.contact.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    const matchCat = categoryFilter === "All" || s.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const active = suppliers.filter(s => s.status === "Active").length;
  const onHold = suppliers.filter(s => s.status === "On Hold").length;

  return (
    <PermissionGuard permission="procurement">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Procurement</p>
            <h1 className="text-2xl font-bold text-white">Suppliers</h1>
          </div>
          <button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Add Supplier</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Total", value: suppliers.length, icon: "🏭" }, { label: "Active", value: active, icon: "✅" }, { label: "On Hold", value: onHold, icon: "⏸️" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Supplier", "Category", "Contact", "Phone", "Email", "Rating", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">🏭</p>
                    <p>{search || categoryFilter !== "All" ? "No suppliers match your filters" : "No suppliers yet — add your first"}</p>
                  </td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3"><p className="text-sm font-semibold text-white">{s.name}</p><p className="text-xs text-gray-500">{s.id}</p></td>
                    <td className="px-4 py-3 text-sm text-gray-300">{s.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{s.contact}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{s.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{s.email}</td>
                    <td className="px-4 py-3 text-sm text-yellow-400">{ratingStars(s.rating)}</td>
                    <td className="px-4 py-3"><StatusPill label={s.status} tone={statusTone[s.status] as any} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(s)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700/50 bg-gray-900 p-6 shadow-2xl">
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Supplier" : "Add Supplier"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Company Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Company name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Supplier["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Active</option><option>On Hold</option><option>Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Contact Name</label>
                <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Contact name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="07xxx xxxxxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Email</label>
                  <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="email@company.co.uk" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(r => (
                    <button key={r} onClick={() => setForm({ ...form, rating: r })} className={`text-2xl ${r <= form.rating ? "text-yellow-400" : "text-gray-600"}`}>★</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Add Supplier"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
