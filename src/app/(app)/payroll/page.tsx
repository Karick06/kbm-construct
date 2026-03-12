"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";
import PageHeader from "@/components/PageHeader";
import type { StatusTone } from "@/components/StatusPill";

type PayrollRun = {
  id: string;
  period: string;
  runDate: string;
  employees: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: "Draft" | "Processing" | "Submitted" | "Paid";
};

const defaultPayrollRuns: PayrollRun[] = [
  { id: "PAY-001", period: "February 2026", runDate: "2026-02-28", employees: 24, grossPay: 52400, deductions: 12100, netPay: 40300, status: "Paid" },
  { id: "PAY-002", period: "January 2026", runDate: "2026-01-31", employees: 23, grossPay: 50800, deductions: 11700, netPay: 39100, status: "Paid" },
  { id: "PAY-003", period: "March 2026", runDate: "2026-03-31", employees: 25, grossPay: 54200, deductions: 12600, netPay: 41600, status: "Draft" },
];

const statusTone: Record<PayrollRun["status"], StatusTone> = { Draft: "draft", Processing: "risk", Submitted: "open", Paid: "paid" };
const fmt = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

export default function PayrollPage() {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PayrollRun | null>(null);
  const [form, setForm] = useState<Omit<PayrollRun, "id">>({ period: "", runDate: "", employees: 0, grossPay: 0, deductions: 0, netPay: 0, status: "Draft" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_payroll");
    setRuns(stored ? JSON.parse(stored) : defaultPayrollRuns);
  }, []);

  const save = (updated: PayrollRun[]) => { setRuns(updated); localStorage.setItem("kbm_payroll", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ period: "", runDate: "", employees: 0, grossPay: 0, deductions: 0, netPay: 0, status: "Draft" }); setShowModal(true); };
  const openEdit = (r: PayrollRun) => { setEditing(r); setForm({ period: r.period, runDate: r.runDate, employees: r.employees, grossPay: r.grossPay, deductions: r.deductions, netPay: r.netPay, status: r.status }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.period.trim()) return;
    if (editing) save(runs.map(r => r.id === editing.id ? { ...editing, ...form } : r));
    else save([...runs, { id: `PAY-${String(runs.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this payroll run?")) save(runs.filter(r => r.id !== id)); };

  const filtered = runs.filter(r => r.period.toLowerCase().includes(search.toLowerCase()));
  const totalGross = runs.reduce((s, r) => s + r.grossPay, 0);

  return (
    <PermissionGuard permission="payroll">
      <div className="space-y-6">
        <PageHeader
          title="Payroll"
          subtitle="HR & Finance"
          actions={<button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ New Payroll Run</button>}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Runs", value: runs.length.toString(), icon: "📋" },
            { label: "YTD Gross Pay", value: fmt(totalGross), icon: "💰" },
            { label: "Current Headcount", value: runs.length > 0 ? runs[0].employees.toString() : "0", icon: "👥" },
          ].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <input type="text" placeholder="Search payroll period..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Period", "Run Date", "Employees", "Gross Pay", "Deductions", "Net Pay", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">💰</p>
                    <p>No payroll runs yet</p>
                  </td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-semibold text-white">{r.period}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{r.runDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{r.employees}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{fmt(r.grossPay)}</td>
                    <td className="px-4 py-3 text-sm text-red-400">{fmt(r.deductions)}</td>
                    <td className="px-4 py-3 text-sm text-green-400 font-semibold">{fmt(r.netPay)}</td>
                    <td className="px-4 py-3"><StatusPill label={r.status} tone={statusTone[r.status]} /></td>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Payroll Run" : "New Payroll Run"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Period</label>
                  <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. March 2026" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Run Date</label>
                  <input type="date" value={form.runDate} onChange={e => setForm({ ...form, runDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Number of Employees</label>
                <input type="number" value={form.employees} onChange={e => setForm({ ...form, employees: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Gross Pay (£)</label>
                  <input type="number" value={form.grossPay} onChange={e => setForm({ ...form, grossPay: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Deductions (£)</label>
                  <input type="number" value={form.deductions} onChange={e => setForm({ ...form, deductions: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Net Pay (£)</label>
                  <input type="number" value={form.netPay} onChange={e => setForm({ ...form, netPay: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PayrollRun["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                  <option>Draft</option><option>Processing</option><option>Submitted</option><option>Paid</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Create Run"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
