"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";

type Allocation = {
  id: string;
  staffName: string;
  role: string;
  project: string;
  startDate: string;
  endDate: string;
  hoursPerWeek: number;
  status: "Active" | "Upcoming" | "Completed" | "On Hold";
};

const PROJECTS = ["Riverside Development", "City Centre Tower", "Arbor Park", "Cedar House", "Northbank Fitout"];
const ROLES = ["Site Manager", "Foreman", "Labourer", "Electrician", "Plumber", "Carpenter", "Groundworker", "Engineer", "QS", "Project Manager"];

const defaultAllocations: Allocation[] = [
  { id: "ALL-001", staffName: "Tom Bridges", role: "Site Manager", project: "Riverside Development", startDate: "2026-03-01", endDate: "2026-06-30", hoursPerWeek: 40, status: "Active" },
  { id: "ALL-002", staffName: "Sarah Holt", role: "Foreman", project: "City Centre Tower", startDate: "2026-03-10", endDate: "2026-05-31", hoursPerWeek: 40, status: "Active" },
  { id: "ALL-003", staffName: "Dave Walsh", role: "Groundworker", project: "Arbor Park", startDate: "2026-04-01", endDate: "2026-04-30", hoursPerWeek: 30, status: "Upcoming" },
  { id: "ALL-004", staffName: "Lisa Drummond", role: "QS", project: "Cedar House", startDate: "2026-01-15", endDate: "2026-03-10", hoursPerWeek: 20, status: "Completed" },
];

const statusTone: Record<Allocation["status"], string> = { Active: "on-track", Upcoming: "risk", Completed: "complete", "On Hold": "overdue" };

export default function AllocationPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Allocation | null>(null);
  const [form, setForm] = useState<Omit<Allocation, "id">>({ staffName: "", role: ROLES[0], project: PROJECTS[0], startDate: "", endDate: "", hoursPerWeek: 40, status: "Active" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_allocations");
    setAllocations(stored ? JSON.parse(stored) : defaultAllocations);
  }, []);

  const save = (updated: Allocation[]) => { setAllocations(updated); localStorage.setItem("kbm_allocations", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ staffName: "", role: ROLES[0], project: PROJECTS[0], startDate: "", endDate: "", hoursPerWeek: 40, status: "Active" }); setShowModal(true); };
  const openEdit = (a: Allocation) => { setEditing(a); setForm({ staffName: a.staffName, role: a.role, project: a.project, startDate: a.startDate, endDate: a.endDate, hoursPerWeek: a.hoursPerWeek, status: a.status }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.staffName.trim()) return;
    if (editing) save(allocations.map(a => a.id === editing.id ? { ...editing, ...form } : a));
    else save([...allocations, { id: `ALL-${String(allocations.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this allocation?")) save(allocations.filter(a => a.id !== id)); };

  const filtered = allocations.filter(a => {
    const q = search.toLowerCase();
    return (a.staffName.toLowerCase().includes(q) || a.project.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) &&
      (statusFilter === "All" || a.status === statusFilter);
  });

  const totalHours = allocations.filter(a => a.status === "Active").reduce((sum, a) => sum + a.hoursPerWeek, 0);

  return (
    <PermissionGuard permission="resources">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Resources</p>
            <h1 className="text-2xl font-bold text-white">Staff Allocation</h1>
          </div>
          <button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Allocate Staff</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Active Allocations", value: allocations.filter(a => a.status === "Active").length, icon: "👷" },
            { label: "Upcoming", value: allocations.filter(a => a.status === "Upcoming").length, icon: "📅" },
            { label: "Hours Committed/wk", value: totalHours, icon: "⏱️" },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search staff or project..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Statuses</option><option>Active</option><option>Upcoming</option><option>Completed</option><option>On Hold</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Staff Member", "Role", "Project", "Start", "End", "Hrs/wk", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">📋</p>
                    <p>{search || statusFilter !== "All" ? "No allocations match your filters" : "No allocations yet"}</p>
                  </td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-semibold text-white">{a.staffName}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.project}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.startDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.endDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{a.hoursPerWeek}h</td>
                    <td className="px-4 py-3"><StatusPill label={a.status} tone={statusTone[a.status] as any} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(a)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => handleDelete(a.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Allocation" : "Allocate Staff"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Staff Member</label>
                <input value={form.staffName} onChange={e => setForm({ ...form, staffName: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Role</label>
                  <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Project</label>
                  <select value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {PROJECTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
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
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Hours per Week</label>
                  <input type="number" min={1} max={60} value={form.hoursPerWeek} onChange={e => setForm({ ...form, hoursPerWeek: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Allocation["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Active</option><option>Upcoming</option><option>Completed</option><option>On Hold</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Allocate"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
