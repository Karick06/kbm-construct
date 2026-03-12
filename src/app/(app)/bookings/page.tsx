"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";
import PageHeader from "@/components/PageHeader";
import type { StatusTone } from "@/components/StatusPill";

type Booking = {
  id: string;
  asset: string;
  assetType: "Vehicle" | "Plant" | "Equipment" | "Meeting Room";
  project: string;
  requestedBy: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Active" | "Returned" | "Cancelled";
  notes: string;
};

const PROJECTS = ["Riverside Development", "City Centre Tower", "Arbor Park", "Cedar House", "Northbank Fitout", "General / Office"];
const ASSET_TYPES: Booking["assetType"][] = ["Vehicle", "Plant", "Equipment", "Meeting Room"];

const defaultBookings: Booking[] = [
  { id: "BKG-001", asset: "Ford Transit - KM21 ABC", assetType: "Vehicle", project: "Arbor Park", requestedBy: "Tom Bridges", startDate: "2026-03-13", endDate: "2026-03-15", status: "Approved", notes: "Materials delivery run" },
  { id: "BKG-002", asset: "JCB 3CX Backhoe", assetType: "Plant", project: "Riverside Development", requestedBy: "Dave Walsh", startDate: "2026-03-14", endDate: "2026-03-20", status: "Active", notes: "Groundworks phase 2" },
  { id: "BKG-003", asset: "Hilti TE 60 Breaker", assetType: "Equipment", project: "City Centre Tower", requestedBy: "Mike Farrow", startDate: "2026-03-18", endDate: "2026-03-19", status: "Pending", notes: "Concrete breaking for penetrations" },
];

const statusTone: Record<Booking["status"], StatusTone> = { Pending: "risk", Approved: "on-track", Active: "paid", Returned: "paid", Cancelled: "late" };

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [form, setForm] = useState<Omit<Booking, "id">>({ asset: "", assetType: "Vehicle", project: PROJECTS[0], requestedBy: "", startDate: "", endDate: "", status: "Pending", notes: "" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_bookings");
    setBookings(stored ? JSON.parse(stored) : defaultBookings);
  }, []);

  const save = (updated: Booking[]) => { setBookings(updated); localStorage.setItem("kbm_bookings", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ asset: "", assetType: "Vehicle", project: PROJECTS[0], requestedBy: "", startDate: "", endDate: "", status: "Pending", notes: "" }); setShowModal(true); };
  const openEdit = (b: Booking) => { setEditing(b); setForm({ asset: b.asset, assetType: b.assetType, project: b.project, requestedBy: b.requestedBy, startDate: b.startDate, endDate: b.endDate, status: b.status, notes: b.notes }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.asset.trim()) return;
    if (editing) save(bookings.map(b => b.id === editing.id ? { ...editing, ...form } : b));
    else save([...bookings, { id: `BKG-${String(bookings.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this booking?")) save(bookings.filter(b => b.id !== id)); };

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    return (b.asset.toLowerCase().includes(q) || b.project.toLowerCase().includes(q) || b.requestedBy.toLowerCase().includes(q)) &&
      (statusFilter === "All" || b.status === statusFilter);
  });

  const active = bookings.filter(b => b.status === "Active").length;
  const pending = bookings.filter(b => b.status === "Pending").length;

  return (
    <PermissionGuard permission="fleet">
      <div className="space-y-6">
        <PageHeader
          title="Asset Bookings"
          subtitle="Fleet & Plant"
          actions={<button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ New Booking</button>}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Total Bookings", value: bookings.length, icon: "📅" }, { label: "Active", value: active, icon: "🟢" }, { label: "Pending Approval", value: pending, icon: "⏳" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Statuses</option><option>Pending</option><option>Approved</option><option>Active</option><option>Returned</option><option>Cancelled</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Asset", "Project", "Requested By", "Start", "End", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">📅</p>
                    <p>{search || statusFilter !== "All" ? "No bookings match your filters" : "No bookings yet"}</p>
                  </td></tr>
                ) : filtered.map(b => (
                  <tr key={b.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3"><p className="text-sm font-semibold text-white">{b.asset}</p><p className="text-xs text-gray-500">{b.id} · {b.assetType}</p></td>
                    <td className="px-4 py-3 text-sm text-gray-300">{b.project}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{b.requestedBy}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{b.startDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{b.endDate}</td>
                    <td className="px-4 py-3"><StatusPill label={b.status} tone={statusTone[b.status]} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(b)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => handleDelete(b.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Booking" : "New Booking"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Asset / Resource</label>
                <input value={form.asset} onChange={e => setForm({ ...form, asset: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Ford Transit - KM21 ABC" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Asset Type</label>
                  <select value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value as Booking["assetType"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Project</label>
                  <select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {PROJECTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Requested By</label>
                <input value={form.requestedBy} onChange={e => setForm({ ...form, requestedBy: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Booking["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Pending</option><option>Approved</option><option>Active</option><option>Returned</option><option>Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Purpose or additional notes..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Request Booking"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
