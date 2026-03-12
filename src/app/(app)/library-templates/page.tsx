"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";

type Template = {
  id: string;
  title: string;
  description: string;
  category: string;
  fileType: "Word" | "Excel" | "PDF" | "PowerPoint" | "Other";
  author: string;
  lastUpdated: string;
  version: string;
  tags: string;
  uses: number;
};

const CATEGORIES = ["Site Management", "H&S", "Commercial", "HR", "Quality", "Environmental", "Client Facing", "Procurement", "Estimating", "Other"];
const FILE_ICONS: Record<Template["fileType"], string> = { Word: "📝", Excel: "📊", PDF: "📄", PowerPoint: "📋", Other: "📁" };
const FILE_COLORS: Record<Template["fileType"], string> = { Word: "text-blue-400", Excel: "text-green-400", PDF: "text-red-400", PowerPoint: "text-orange-400", Other: "text-gray-400" };

const defaultTemplates: Template[] = [
  { id: "TPL-001", title: "Method Statement Template", description: "Generic method statement with all required sections for site activities.", category: "H&S", fileType: "Word", author: "Tom Bridges", lastUpdated: "2026-02-10", version: "v3.0", tags: "method statement, H&S, RAMS", uses: 47 },
  { id: "TPL-002", title: "Risk Assessment Template", description: "Site-specific risk assessment template with hazard register.", category: "H&S", fileType: "Word", author: "Tom Bridges", lastUpdated: "2026-02-10", version: "v2.2", tags: "risk, RAMS, H&S", uses: 52 },
  { id: "TPL-003", title: "Site Handover Report", description: "End of project handover documentation template for clients.", category: "Client Facing", fileType: "Word", author: "Sarah Holt", lastUpdated: "2026-01-20", version: "v1.1", tags: "handover, completion, client", uses: 12 },
  { id: "TPL-004", title: "Subcontractor Order Template", description: "Standard subcontract order and schedule of works template.", category: "Commercial", fileType: "Word", author: "Dave Walsh", lastUpdated: "2026-03-01", version: "v1.4", tags: "subcontract, order, commercial", uses: 28 },
  { id: "TPL-005", title: "Weekly Programme Template", description: "Two-week look-ahead programme in Excel with resource tracking.", category: "Site Management", fileType: "Excel", author: "Sarah Holt", lastUpdated: "2026-02-28", version: "v2.0", tags: "programme, schedule, planning", uses: 35 },
];

export default function LibraryTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [form, setForm] = useState<Omit<Template, "id">>({ title: "", description: "", category: CATEGORIES[0], fileType: "Word", author: "", lastUpdated: new Date().toISOString().split("T")[0], version: "v1.0", tags: "", uses: 0 });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_library_templates");
    setTemplates(stored ? JSON.parse(stored) : defaultTemplates);
  }, []);

  const save = (updated: Template[]) => { setTemplates(updated); localStorage.setItem("kbm_library_templates", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ title: "", description: "", category: CATEGORIES[0], fileType: "Word", author: "", lastUpdated: new Date().toISOString().split("T")[0], version: "v1.0", tags: "", uses: 0 }); setShowModal(true); };
  const openEdit = (t: Template) => { setEditing(t); setForm({ title: t.title, description: t.description, category: t.category, fileType: t.fileType, author: t.author, lastUpdated: t.lastUpdated, version: t.version, tags: t.tags, uses: t.uses }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    if (editing) save(templates.map(t => t.id === editing.id ? { ...editing, ...form } : t));
    else save([...templates, { id: `TPL-${String(templates.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Remove this template?")) save(templates.filter(t => t.id !== id)); };

  const filtered = templates.filter(t => {
    const q = search.toLowerCase();
    return (t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.tags.toLowerCase().includes(q)) &&
      (categoryFilter === "All" || t.category === categoryFilter);
  });

  const totalUses = templates.reduce((s, t) => s + t.uses, 0);

  return (
    <PermissionGuard permission="documents">
      <div className="space-y-6">
        <PageHeader
          title="Document Templates"
          subtitle="Library"
          actions={<button onClick={openAdd} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">+ Add Template</button>}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Total Templates", value: templates.length, icon: "📄" }, { label: "Total Uses", value: totalUses, icon: "📈" }, { label: "Categories", value: new Set(templates.map(t => t.category)).size, icon: "🗂️" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search templates or tags..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 py-16 text-center text-gray-400">
            <p className="text-5xl mb-3">📄</p>
            <p>{search || categoryFilter !== "All" ? "No templates match your filters" : "No templates yet — add your first"}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(t => (
              <div key={t.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 hover:border-blue-500/50 transition-colors group">
                <div className="flex items-start gap-3 mb-3">
                  <span className={`text-3xl ${FILE_COLORS[t.fileType]}`}>{FILE_ICONS[t.fileType]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white leading-tight">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.fileType} · {t.version} · {t.uses} uses</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3 line-clamp-2">{t.description}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  <span className="rounded bg-gray-700/60 px-2 py-0.5 text-xs text-gray-300">{t.category}</span>
                  {t.tags.split(",").filter(Boolean).slice(0, 2).map(tag => (
                    <span key={tag} className="rounded bg-blue-900/30 px-2 py-0.5 text-xs text-blue-400">{tag.trim()}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">By {t.author} · {t.lastUpdated}</p>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(t)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Template" : "Add Template"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Template title" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="What is this template for?" />
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
                  <select value={form.fileType} onChange={e => setForm({ ...form, fileType: e.target.value as Template["fileType"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {(["Word","Excel","PDF","PowerPoint","Other"] as Template["fileType"][]).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Author</label>
                  <input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Version</label>
                  <input value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="v1.0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="H&S, method statement, RAMS" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">{editing ? "Save Changes" : "Add Template"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
