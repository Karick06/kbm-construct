"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";
import PageHeader from "@/components/PageHeader";
import type { StatusTone } from "@/components/StatusPill";

type Incident = {
  id: string;
  date: string;
  project: string;
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  reporter: string;
  status: "Open" | "Under Investigation" | "Closed";
};

const INCIDENT_TYPES = ["Near Miss", "First Aid", "RIDDOR", "Property Damage", "Environmental", "Security", "Fire", "Other"];
const PROJECTS = ["Riverside Development", "City Centre Tower", "Arbor Park", "Cedar House", "Northbank Fitout"];

const defaultIncidents: Incident[] = [
  { id: "INC-001", date: "2026-03-10", project: "Riverside Development", type: "Near Miss", severity: "Medium", description: "Worker slipped on wet scaffolding board. No injury sustained.", reporter: "Site Manager", status: "Closed" },
  { id: "INC-002", date: "2026-03-08", project: "City Centre Tower", type: "First Aid", severity: "Low", description: "Minor cut to hand from glass handling. First aid administered on site.", reporter: "Dave Walsh", status: "Closed" },
  { id: "INC-003", date: "2026-03-05", project: "Arbor Park", type: "Near Miss", severity: "High", description: "Unsecured load shifted during crane lift. Area was clear. Reviewing lift plan.", reporter: "Jane Cooper", status: "Under Investigation" },
];

const severityTone: Record<Incident["severity"], string> = { Low: "on-track", Medium: "risk", High: "overdue", Critical: "overdue" };
const severityBg = { Low: "bg-green-900/30 text-green-400", Medium: "bg-yellow-900/30 text-yellow-400", High: "bg-orange-900/30 text-orange-400", Critical: "bg-red-900/30 text-red-400" };
const statusTone: Record<Incident["status"], StatusTone> = { Open: "late", "Under Investigation": "risk", Closed: "paid" };

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Incident | null>(null);
  const [form, setForm] = useState<Omit<Incident, "id">>({ date: new Date().toISOString().split("T")[0], project: PROJECTS[0], type: INCIDENT_TYPES[0], severity: "Low", description: "", reporter: "", status: "Open" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_incidents");
    setIncidents(stored ? JSON.parse(stored) : defaultIncidents);
  }, []);

  const save = (updated: Incident[]) => { setIncidents(updated); localStorage.setItem("kbm_incidents", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ date: new Date().toISOString().split("T")[0], project: PROJECTS[0], type: INCIDENT_TYPES[0], severity: "Low", description: "", reporter: "", status: "Open" }); setShowModal(true); };
  const openEdit = (i: Incident) => { setEditing(i); setForm({ date: i.date, project: i.project, type: i.type, severity: i.severity, description: i.description, reporter: i.reporter, status: i.status }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.description.trim()) return;
    if (editing) save(incidents.map(i => i.id === editing.id ? { ...editing, ...form } : i));
    else save([...incidents, { id: `INC-${String(incidents.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this incident record?")) save(incidents.filter(i => i.id !== id)); };

  const filtered = incidents.filter(i => {
    const q = search.toLowerCase();
    return (i.description.toLowerCase().includes(q) || i.project.toLowerCase().includes(q) || i.reporter.toLowerCase().includes(q)) &&
      (statusFilter === "All" || i.status === statusFilter);
  });

  const open = incidents.filter(i => i.status === "Open").length;
  const investigating = incidents.filter(i => i.status === "Under Investigation").length;
  const critical = incidents.filter(i => i.severity === "Critical" || i.severity === "High").length;

  return (
    <PermissionGuard permission="compliance">
      <div className="space-y-6">
        <PageHeader
          title="Incident Log"
          subtitle="Health & Safety"
          actions={<button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Report Incident</button>}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Open", value: open, icon: "🔴" }, { label: "Investigating", value: investigating, icon: "🔍" }, { label: "High/Critical", value: critical, icon: "⚠️" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Statuses</option><option>Open</option><option>Under Investigation</option><option>Closed</option>
          </select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 py-12 text-center text-gray-400">
              <p className="text-4xl mb-2">⚠️</p>
              <p>{search || statusFilter !== "All" ? "No incidents match your filters" : "No incidents recorded — great work!"}</p>
            </div>
          ) : filtered.map(incident => (
            <div key={incident.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">{incident.id}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${severityBg[incident.severity]}`}>{incident.severity}</span>
                    <span className="text-xs text-gray-400">{incident.type}</span>
                  </div>
                  <p className="text-sm font-medium text-white">{incident.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{incident.project} · Reported by {incident.reporter} · {incident.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill label={incident.status} tone={statusTone[incident.status]} />
                  <button onClick={() => openEdit(incident)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                  <button onClick={() => handleDelete(incident.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700/50 bg-gray-900 p-6 shadow-2xl">
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Incident" : "Report Incident"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
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
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Severity</label>
                  <select value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value as Incident["severity"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Describe what happened..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Reported By</label>
                  <input value={form.reporter} onChange={e => setForm({ ...form, reporter: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Incident["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Open</option><option>Under Investigation</option><option>Closed</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Report Incident"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
