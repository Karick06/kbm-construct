"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";

type Resource = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: "PDF" | "Excel" | "Word" | "PowerPoint" | "Video" | "Image" | "Other";
  uploadedBy: string;
  uploadedDate: string;
  version: string;
  tags: string;
};

const CATEGORIES = ["H&S", "Technical Standards", "Regulations & Legislation", "Guides & Manuals", "Forms & Checklists", "Case Studies", "Training Materials", "Environmental", "Quality", "Other"];
const FILE_ICONS: Record<Resource["fileType"], string> = { PDF: "📄", Excel: "📊", Word: "📝", PowerPoint: "📋", Video: "🎬", Image: "🖼️", Other: "📁" };
const FILE_COLORS: Record<Resource["fileType"], string> = { PDF: "text-red-400", Excel: "text-green-400", Word: "text-blue-400", PowerPoint: "text-orange-400", Video: "text-purple-400", Image: "text-pink-400", Other: "text-gray-400" };

const defaultResources: Resource[] = [
  { id: "RES-001", title: "CDM Regulations 2015 Guide", description: "Comprehensive guide to Construction Design and Management Regulations 2015 requirements.", category: "Regulations & Legislation", fileType: "PDF", uploadedBy: "Tom Bridges", uploadedDate: "2026-01-10", version: "v1.0", tags: "CDM, H&S, compliance, legal" },
  { id: "RES-002", title: "Site Safety Inspection Checklist", description: "Weekly site safety inspection checklist for all site supervisors.", category: "Forms & Checklists", fileType: "Word", uploadedBy: "Sarah Holt", uploadedDate: "2026-02-05", version: "v2.1", tags: "safety, inspection, weekly" },
  { id: "RES-003", title: "Working at Height Guidelines", description: "Best practice guidelines for working at height including scaffold and MEWP use.", category: "H&S", fileType: "PDF", uploadedBy: "Tom Bridges", uploadedDate: "2026-02-14", version: "v1.3", tags: "WAH, scaffold, MEWP, height" },
  { id: "RES-004", title: "COSHH Assessment Template", description: "Template for Control of Substances Hazardous to Health assessments.", category: "Forms & Checklists", fileType: "Excel", uploadedBy: "Dave Walsh", uploadedDate: "2026-03-01", version: "v1.0", tags: "COSHH, chemicals, hazardous" },
];

export default function LibraryResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [form, setForm] = useState<Omit<Resource, "id">>({ title: "", description: "", category: CATEGORIES[0], fileType: "PDF", uploadedBy: "", uploadedDate: new Date().toISOString().split("T")[0], version: "v1.0", tags: "" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_library_resources");
    setResources(stored ? JSON.parse(stored) : defaultResources);
  }, []);

  const save = (updated: Resource[]) => { setResources(updated); localStorage.setItem("kbm_library_resources", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ title: "", description: "", category: CATEGORIES[0], fileType: "PDF", uploadedBy: "", uploadedDate: new Date().toISOString().split("T")[0], version: "v1.0", tags: "" }); setShowModal(true); };
  const openEdit = (r: Resource) => { setEditing(r); setForm({ title: r.title, description: r.description, category: r.category, fileType: r.fileType, uploadedBy: r.uploadedBy, uploadedDate: r.uploadedDate, version: r.version, tags: r.tags }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editing) save(resources.map(r => r.id === editing.id ? { ...editing, ...form } : r));
    else save([...resources, { id: `RES-${String(resources.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Remove this resource?")) save(resources.filter(r => r.id !== id)); };

  const filtered = resources.filter(r => {
    const q = search.toLowerCase();
    return (r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.toLowerCase().includes(q)) &&
      (categoryFilter === "All" || r.category === categoryFilter) &&
      (typeFilter === "All" || r.fileType === typeFilter);
  });

  return (
    <PermissionGuard permission="documents">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Library</p>
            <h1 className="text-2xl font-bold text-white">Resource Library</h1>
          </div>
          <button onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Add Resource</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Total Resources", value: resources.length, icon: "📚" }, { label: "H&S Resources", value: resources.filter(r => r.category === "H&S").length, icon: "🦺" }, { label: "Forms & Checklists", value: resources.filter(r => r.category === "Forms & Checklists").length, icon: "📋" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search resources or tags..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Types</option>
            {(["PDF","Excel","Word","PowerPoint","Video","Image","Other"] as Resource["fileType"][]).map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 py-16 text-center text-gray-400">
            <p className="text-5xl mb-3">📚</p>
            <p>{search || categoryFilter !== "All" ? "No resources match your filters" : "No resources yet — add your first"}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(r => (
              <div key={r.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-3xl ${FILE_COLORS[r.fileType]}`}>{FILE_ICONS[r.fileType]}</span>
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.fileType} · {r.version}</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{r.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="rounded bg-gray-700/60 px-2 py-0.5 text-xs text-gray-300">{r.category}</span>
                  {r.tags.split(",").filter(Boolean).slice(0, 2).map(tag => (
                    <span key={tag} className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">{tag.trim()}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">By {r.uploadedBy} · {r.uploadedDate}</p>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(r)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-700/50 bg-gray-900 p-6 shadow-2xl">
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Resource" : "Add Resource"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Resource title" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Brief description..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">File Type</label>
                  <select value={form.fileType} onChange={e => setForm({ ...form, fileType: e.target.value as Resource["fileType"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {(["PDF","Excel","Word","PowerPoint","Video","Image","Other"] as Resource["fileType"][]).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Uploaded By</label>
                  <input value={form.uploadedBy} onChange={e => setForm({ ...form, uploadedBy: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Version</label>
                  <input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="v1.0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="H&S, scaffold, compliance" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? "Save Changes" : "Add Resource"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
