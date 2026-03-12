"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";
import PageHeader from "@/components/PageHeader";

type SkillRecord = {
  id: string;
  staffName: string;
  skill: string;
  category: string;
  level: "Beginner" | "Competent" | "Expert";
  certified: boolean;
  expiryDate?: string;
  notes: string;
};

const SKILL_CATEGORIES = ["H&S", "Plant Operation", "Electrical", "Plumbing", "Carpentry", "Leadership", "IT", "Groundworks", "Surveying", "First Aid", "Other"];
const SKILLS_BY_CAT: Record<string, string[]> = {
  "H&S": ["CSCS Card", "SSSTS", "SMSTS", "First Aid at Work", "COSHH Awareness"],
  "Plant Operation": ["Excavator (360)", "Dumper", "Telehandler", "Forklift", "Scaffold"],
  "Electrical": ["18th Edition", "ECS Card", "Part P", "EV Charging"],
  "Plumbing": ["Gas Safe", "Unvented Hot Water", "Oil Boiler"],
  "Carpentry": ["NVQ Carpentry", "Site Joinery"],
  "Leadership": ["IOSH Managing Safely", "Team Leadership"],
  "First Aid": ["HSE First Aid", "Emergency First Aid"],
  "Other": ["Asbestos Awareness", "Manual Handling", "Working at Height"],
};

const defaultSkills: SkillRecord[] = [
  { id: "SKL-001", staffName: "Tom Bridges", skill: "SMSTS", category: "H&S", level: "Expert", certified: true, expiryDate: "2027-06-01", notes: "" },
  { id: "SKL-002", staffName: "Tom Bridges", skill: "First Aid at Work", category: "H&S", level: "Competent", certified: true, expiryDate: "2026-09-15", notes: "" },
  { id: "SKL-003", staffName: "Dave Walsh", skill: "Excavator (360)", category: "Plant Operation", level: "Expert", certified: true, expiryDate: "2028-01-01", notes: "CPCS A59" },
  { id: "SKL-004", staffName: "Sarah Holt", skill: "SSSTS", category: "H&S", level: "Competent", certified: true, expiryDate: "2027-03-20", notes: "" },
  { id: "SKL-005", staffName: "Mike Farrow", skill: "Telehandler", category: "Plant Operation", level: "Competent", certified: true, expiryDate: "2026-11-30", notes: "" },
];

const levelBg = { Beginner: "bg-blue-900/30 text-blue-400", Competent: "bg-green-900/30 text-green-400", Expert: "bg-orange-900/30 text-orange-400" };

export default function SkillsPage() {
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SkillRecord | null>(null);
  const [form, setForm] = useState<Omit<SkillRecord, "id">>({ staffName: "", skill: "", category: SKILL_CATEGORIES[0], level: "Competent", certified: false, expiryDate: "", notes: "" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_skills");
    setSkills(stored ? JSON.parse(stored) : defaultSkills);
  }, []);

  const save = (updated: SkillRecord[]) => { setSkills(updated); localStorage.setItem("kbm_skills", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ staffName: "", skill: "", category: SKILL_CATEGORIES[0], level: "Competent", certified: false, expiryDate: "", notes: "" }); setShowModal(true); };
  const openEdit = (s: SkillRecord) => { setEditing(s); setForm({ staffName: s.staffName, skill: s.skill, category: s.category, level: s.level, certified: s.certified, expiryDate: s.expiryDate, notes: s.notes }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.staffName.trim() || !form.skill.trim()) return;
    if (editing) save(skills.map(s => s.id === editing.id ? { ...editing, ...form } : s));
    else save([...skills, { id: `SKL-${String(skills.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this skill record?")) save(skills.filter(s => s.id !== id)); };

  const now = new Date().toISOString().split("T")[0];
  const filtered = skills.filter(s => {
    const q = search.toLowerCase();
    return (s.staffName.toLowerCase().includes(q) || s.skill.toLowerCase().includes(q)) &&
      (categoryFilter === "All" || s.category === categoryFilter);
  });

  const expiringSoon = skills.filter(s => s.expiryDate && s.expiryDate <= now.slice(0, 7) + "-31" && s.expiryDate >= now).length;

  return (
    <PermissionGuard permission="staff">
      <div className="space-y-6">
        <PageHeader
          title="Skills Matrix"
          subtitle="HR"
          actions={<button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ Add Skill</button>}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Total Records", value: skills.length, icon: "🎓" }, { label: "Certified", value: skills.filter(s => s.certified).length, icon: "✅" }, { label: "Expiring Soon", value: expiringSoon, icon: "⚠️" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-2xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search staff or skill..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Categories</option>
            {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Staff Member", "Skill", "Category", "Level", "Certified", "Expiry", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">🎓</p>
                    <p>{search || categoryFilter !== "All" ? "No skills match your filters" : "No skills recorded yet"}</p>
                  </td></tr>
                ) : filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-semibold text-white">{s.staffName}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{s.skill}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{s.category}</td>
                    <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${levelBg[s.level]}`}>{s.level}</span></td>
                    <td className="px-4 py-3">{s.certified ? <StatusPill label="Yes" tone="on-track" /> : <StatusPill label="No" tone="late" />}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{s.expiryDate || "—"}</td>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Skill" : "Add Skill"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Staff Member</label>
                <input value={form.staffName} onChange={e => setForm({ ...form, staffName: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value, skill: "" })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Skill</label>
                  <input value={form.skill} onChange={e => setForm({ ...form, skill: e.target.value })} list="skill-suggestions" className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Type or select skill" />
                  <datalist id="skill-suggestions">{(SKILLS_BY_CAT[form.category] || []).map(s => <option key={s} value={s} />)}</datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Level</label>
                  <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value as SkillRecord["level"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Beginner</option><option>Competent</option><option>Expert</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="certified" checked={form.certified} onChange={e => setForm({ ...form, certified: e.target.checked })} className="h-4 w-4 rounded border-gray-600 text-orange-500" />
                <label htmlFor="certified" className="text-sm text-gray-300">Holds a certification / card for this skill</label>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Notes</label>
                <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. CPCS card number" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Add Skill"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
