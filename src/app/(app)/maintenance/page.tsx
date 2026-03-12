"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";

type MaintenanceJob = {
  id: string;
  asset: string;
  assetType: "Vehicle" | "Plant" | "Equipment" | "Tool";
  type: "Service" | "Repair" | "Inspection" | "MOT" | "LOLER";
  dueDate: string;
  completedDate?: string;
  status: "Scheduled" | "In Progress" | "Completed" | "Overdue";
  technician: string;
  notes: string;
  cost?: string;
};

const ASSET_TYPES: MaintenanceJob["assetType"][] = ["Vehicle", "Plant", "Equipment", "Tool"];
const JOB_TYPES: MaintenanceJob["type"][] = ["Service", "Repair", "Inspection", "MOT", "LOLER"];
const today = new Date().toISOString().split("T")[0];

const defaultJobs: MaintenanceJob[] = [
  { id: "MNT-001", asset: "Ford Transit - KM21 ABC", assetType: "Vehicle", type: "Service", dueDate: "2026-03-20", status: "Scheduled", technician: "Kwik Fit Leeds", notes: "Full service + oil change", cost: "£320" },
  { id: "MNT-002", asset: "JCB 3CX Backhoe", assetType: "Plant", type: "LOLER", dueDate: "2026-03-15", status: "Overdue", technician: "SafeLift Inspections", notes: "Annual LOLER thorough examination", cost: "£180" },
  { id: "MNT-003", asset: "Hilti TE 60 Breaker", assetType: "Equipment", type: "Inspection", dueDate: "2026-04-01", status: "Scheduled", technician: "Internal", notes: "PAT test + visual check", cost: "£0" },
  { id: "MNT-004", asset: "Mercedes Sprinter - KM70 XYZ", assetType: "Vehicle", type: "MOT", dueDate: "2026-03-08", completedDate: "2026-03-08", status: "Completed", technician: "KwikFit Bradford", notes: "Passed first time", cost: "£54.85" },
];

const statusTone: Record<MaintenanceJob["status"], string> = { Scheduled: "on-track", "In Progress": "risk", Completed: "complete", Overdue: "overdue" };

export default function MaintenancePage() {
  const [jobs, setJobs] = useState<MaintenanceJob[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MaintenanceJob | null>(null);
  const [form, setForm] = useState<Omit<MaintenanceJob, "id">>({ asset: "", assetType: "Vehicle", type: "Service", dueDate: today, status: "Scheduled", technician: "", notes: "", cost: "" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_maintenance");
    setJobs(stored ? JSON.parse(stored) : defaultJobs);
  }, []);

  const save = (updated: MaintenanceJob[]) => { setJobs(updated); localStorage.setItem("kbm_maintenance", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ asset: "", assetType: "Vehicle", type: "Service", dueDate: today, status: "Scheduled", technician: "", notes: "", cost: "" }); setShowModal(true); };
  const openEdit = (j: MaintenanceJob) => { setEditing(j); setForm({ asset: j.asset, assetType: j.assetType, type: j.type, dueDate: j.dueDate, completedDate: j.completedDate, status: j.status, technician: j.technician, notes: j.notes, cost: j.cost }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.asset.trim()) return;
    if (editing) save(jobs.map(j => j.id === editing.id ? { ...editing, ...form } : j));
    else save([...jobs, { id: `MNT-${String(jobs.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this maintenance record?")) save(jobs.filter(j => j.id !== id)); };

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return (j.asset.toLowerCase().includes(q) || j.technician.toLowerCase().includes(q) || j.type.toLowerCase().includes(q)) &&
      (statusFilter === "All" || j.status === statusFilter);
  });

  const overdue = jobs.filter(j => j.status === "Overdue").length;
  const scheduled = jobs.filter(j => j.status === "Scheduled").length;
  const completed = jobs.filter(j => j.status === "Completed").length;

  return (
    <PermissionGuard permission="fleet">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fleet & Plant</p>
            <h1 className="text-2xl font-bold text-white">Maintenance Schedule</h1>
          </div>
          <button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Schedule Maintenance</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Overdue", value: overdue, icon: "🔴" }, { label: "Scheduled", value: scheduled, icon: "📅" }, { label: "Completed", value: completed, icon: "✅" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search assets or technician..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Statuses</option><option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Overdue</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Asset", "Type", "Job Type", "Due Date", "Technician", "Cost", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">🔧</p>
                    <p>{search || statusFilter !== "All" ? "No jobs match your filters" : "No maintenance scheduled"}</p>
                  </td></tr>
                ) : filtered.map(job => (
                  <tr key={job.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3"><p className="text-sm font-semibold text-white">{job.asset}</p><p className="text-xs text-gray-500">{job.id} · {job.assetType}</p></td>
                    <td className="px-4 py-3 text-sm text-gray-300">{job.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{job.assetType}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{job.dueDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{job.technician}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{job.cost || "—"}</td>
                    <td className="px-4 py-3"><StatusPill label={job.status} tone={statusTone[job.status] as any} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(job)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => handleDelete(job.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Job" : "Schedule Maintenance"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Asset / Vehicle</label>
                <input value={form.asset} onChange={e => setForm({ ...form, asset: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Ford Transit - KM21 ABC" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Asset Type</label>
                  <select value={form.assetType} onChange={e => setForm({ ...form, assetType: e.target.value as MaintenanceJob["assetType"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Job Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as MaintenanceJob["type"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {JOB_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Due Date</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as MaintenanceJob["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Scheduled</option><option>In Progress</option><option>Completed</option><option>Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Technician / Garage</label>
                <input value={form.technician} onChange={e => setForm({ ...form, technician: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Technician or garage name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Estimated Cost</label>
                  <input value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="£0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Additional notes..." />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Schedule"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
