"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";

type TrainingRecord = {
  id: string;
  staffName: string;
  course: string;
  provider: string;
  category: string;
  completionDate: string;
  expiryDate?: string;
  status: "Upcoming" | "Completed" | "Expired" | "In Progress";
  certificate: boolean;
  cost?: string;
};

const CATEGORIES = ["H&S", "Plant Operation", "Leadership & Management", "Compliance", "Technical", "First Aid", "Environmental", "Other"];

const defaultTraining: TrainingRecord[] = [
  { id: "TRN-001", staffName: "Tom Bridges", course: "SMSTS", provider: "CITB", category: "H&S", completionDate: "2022-06-01", expiryDate: "2027-06-01", status: "Completed", certificate: true, cost: "£480" },
  { id: "TRN-002", staffName: "Sarah Holt", course: "SSSTS", provider: "CITB", category: "H&S", completionDate: "2022-03-20", expiryDate: "2027-03-20", status: "Completed", certificate: true, cost: "£240" },
  { id: "TRN-003", staffName: "Dave Walsh", course: "Excavator CPCS A59", provider: "Construction Plant Hire Assoc.", category: "Plant Operation", completionDate: "2021-01-01", expiryDate: "2028-01-01", status: "Completed", certificate: true, cost: "£850" },
  { id: "TRN-004", staffName: "Lisa Drummond", course: "IOSH Managing Safely", provider: "IOSH", category: "H&S", completionDate: "2026-04-10", expiryDate: "", status: "Upcoming", certificate: false, cost: "£350" },
  { id: "TRN-005", staffName: "Mike Farrow", course: "First Aid at Work (3-day)", provider: "St John Ambulance", category: "First Aid", completionDate: "2023-09-15", expiryDate: "2026-09-15", status: "Completed", certificate: true, cost: "£165" },
];

const statusTone: Record<TrainingRecord["status"], string> = { Upcoming: "risk", Completed: "complete", Expired: "overdue", "In Progress": "on-track" };

export default function TrainingPage() {
  const [records, setRecords] = useState<TrainingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TrainingRecord | null>(null);
  const [form, setForm] = useState<Omit<TrainingRecord, "id">>({ staffName: "", course: "", provider: "", category: CATEGORIES[0], completionDate: "", expiryDate: "", status: "Upcoming", certificate: false, cost: "" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_training");
    setRecords(stored ? JSON.parse(stored) : defaultTraining);
  }, []);

  const save = (updated: TrainingRecord[]) => { setRecords(updated); localStorage.setItem("kbm_training", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ staffName: "", course: "", provider: "", category: CATEGORIES[0], completionDate: "", expiryDate: "", status: "Upcoming", certificate: false, cost: "" }); setShowModal(true); };
  const openEdit = (r: TrainingRecord) => { setEditing(r); setForm({ staffName: r.staffName, course: r.course, provider: r.provider, category: r.category, completionDate: r.completionDate, expiryDate: r.expiryDate, status: r.status, certificate: r.certificate, cost: r.cost }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.staffName.trim() || !form.course.trim()) return;
    if (editing) save(records.map(r => r.id === editing.id ? { ...editing, ...form } : r));
    else save([...records, { id: `TRN-${String(records.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this training record?")) save(records.filter(r => r.id !== id)); };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    return (r.staffName.toLowerCase().includes(q) || r.course.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q)) &&
      (categoryFilter === "All" || r.category === categoryFilter) &&
      (statusFilter === "All" || r.status === statusFilter);
  });

  const expired = records.filter(r => r.status === "Expired").length;
  const upcoming = records.filter(r => r.status === "Upcoming").length;

  return (
    <PermissionGuard permission="training">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">HR & Compliance</p>
            <h1 className="text-2xl font-bold text-white">Training Records</h1>
          </div>
          <button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Add Training</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Total Records", value: records.length, icon: "📚" }, { label: "Upcoming", value: upcoming, icon: "📅" }, { label: "Expired", value: expired, icon: "⚠️" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search staff, course, or provider..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Statuses</option><option>Upcoming</option><option>In Progress</option><option>Completed</option><option>Expired</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Staff Member", "Course", "Provider", "Category", "Completed", "Expiry", "Cert", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">📚</p>
                    <p>{search || categoryFilter !== "All" ? "No records match your filters" : "No training records yet"}</p>
                  </td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-semibold text-white">{r.staffName}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{r.course}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{r.provider}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{r.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{r.completionDate || "—"}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{r.expiryDate || "—"}</td>
                    <td className="px-4 py-3">{r.certificate ? <span className="text-green-400">✓</span> : <span className="text-gray-600">—</span>}</td>
                    <td className="px-4 py-3"><StatusPill label={r.status} tone={statusTone[r.status] as any} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(r)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Training Record" : "Add Training Record"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Staff Member</label>
                <input value={form.staffName} onChange={e => setForm({ ...form, staffName: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Full name" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Course Name</label>
                <input value={form.course} onChange={e => setForm({ ...form, course: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. SMSTS, IOSH Managing Safely" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Provider</label>
                  <input value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. CITB" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Completion Date</label>
                  <input type="date" value={form.completionDate} onChange={e => setForm({ ...form, completionDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TrainingRecord["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Upcoming</option><option>In Progress</option><option>Completed</option><option>Expired</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Cost</label>
                  <input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none" placeholder="£0.00" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="cert-check" checked={form.certificate} onChange={e => setForm({ ...form, certificate: e.target.checked })} className="h-4 w-4 rounded border-gray-600 text-orange-500" />
                <label htmlFor="cert-check" className="text-sm text-gray-300">Certificate obtained</label>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Add Record"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
