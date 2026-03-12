"use client";

import { useState, useEffect } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import StatusPill from "@/components/StatusPill";
import PageHeader from "@/components/PageHeader";
import type { StatusTone } from "@/components/StatusPill";

type Payment = {
  id: string;
  supplier: string;
  invoiceRef: string;
  description: string;
  amount: number;
  paymentDate: string;
  method: "BACS" | "Cheque" | "Card" | "Cash";
  status: "Pending" | "Approved" | "Paid" | "Rejected";
};

const defaultPayments: Payment[] = [
  { id: "PAY-001", supplier: "ArcBuild Groundworks Ltd", invoiceRef: "INV-3021", description: "Groundworks Phase 1 - Riverside", amount: 14500, paymentDate: "2026-03-10", method: "BACS", status: "Paid" },
  { id: "PAY-002", supplier: "Peak Plant Hire", invoiceRef: "INV-P445", description: "JCB hire - March 1-8", amount: 2800, paymentDate: "2026-03-15", method: "BACS", status: "Approved" },
  { id: "PAY-003", supplier: "Northern Steel Fabricators", invoiceRef: "INV-NS072", description: "Steel frame delivery - Cedar House", amount: 9200, paymentDate: "2026-03-20", method: "BACS", status: "Pending" },
  { id: "PAY-004", supplier: "Hartwood Joinery", invoiceRef: "INV-HJ019", description: "Door sets - City Centre Tower", amount: 4650, paymentDate: "2026-03-08", method: "BACS", status: "Paid" },
];

const statusTone: Record<Payment["status"], StatusTone> = { Pending: "risk", Approved: "on-track", Paid: "paid", Rejected: "late" };
const fmt = (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [form, setForm] = useState<Omit<Payment, "id">>({ supplier: "", invoiceRef: "", description: "", amount: 0, paymentDate: "", method: "BACS", status: "Pending" });

  useEffect(() => {
    const stored = localStorage.getItem("kbm_payments");
    setPayments(stored ? JSON.parse(stored) : defaultPayments);
  }, []);

  const save = (updated: Payment[]) => { setPayments(updated); localStorage.setItem("kbm_payments", JSON.stringify(updated)); };
  const openAdd = () => { setEditing(null); setForm({ supplier: "", invoiceRef: "", description: "", amount: 0, paymentDate: "", method: "BACS", status: "Pending" }); setShowModal(true); };
  const openEdit = (p: Payment) => { setEditing(p); setForm({ supplier: p.supplier, invoiceRef: p.invoiceRef, description: p.description, amount: p.amount, paymentDate: p.paymentDate, method: p.method, status: p.status }); setShowModal(true); };

  const handleSubmit = () => {
    if (!form.supplier.trim()) return;
    if (editing) save(payments.map(p => p.id === editing.id ? { ...editing, ...form } : p));
    else save([...payments, { id: `PAY-${String(payments.length + 1).padStart(3, "0")}`, ...form }]);
    setShowModal(false);
  };

  const handleDelete = (id: string) => { if (confirm("Delete this payment record?")) save(payments.filter(p => p.id !== id)); };

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return (p.supplier.toLowerCase().includes(q) || p.invoiceRef.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) &&
      (statusFilter === "All" || p.status === statusFilter);
  });

  const totalPaid = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "Pending" || p.status === "Approved").reduce((s, p) => s + p.amount, 0);

  return (
    <PermissionGuard permission="payments">
      <div className="space-y-6">
        <PageHeader
          title="Payment Records"
          subtitle="Finance"
          actions={<button onClick={openAdd} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">+ New Payment</button>}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {[{ label: "Total Payments", value: payments.length.toString(), icon: "💳" }, { label: "Total Paid", value: fmt(totalPaid), icon: "✅" }, { label: "Outstanding", value: fmt(totalPending), icon: "⏳" }].map(stat => (
            <div key={stat.label} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4 flex items-center gap-4">
              <span className="text-3xl">{stat.icon}</span>
              <div><p className="text-xs text-gray-400">{stat.label}</p><p className="text-xl font-bold text-white">{stat.value}</p></div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input type="text" placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white">
            <option value="All">All Statuses</option><option>Pending</option><option>Approved</option><option>Paid</option><option>Rejected</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-700/50">
                <tr>
                  {["Supplier", "Invoice Ref", "Description", "Amount", "Date", "Method", "Status", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-400">
                    <p className="text-4xl mb-2">💳</p>
                    <p>{search || statusFilter !== "All" ? "No payments match your filters" : "No payments recorded yet"}</p>
                  </td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm font-semibold text-white">{p.supplier}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 font-mono">{p.invoiceRef}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-[200px] truncate">{p.description}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.paymentDate}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{p.method}</td>
                    <td className="px-4 py-3"><StatusPill label={p.status} tone={statusTone[p.status]} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="text-xs text-blue-400 hover:text-blue-300">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
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
            <h2 className="mb-5 text-xl font-bold text-white">{editing ? "Edit Payment" : "New Payment"}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Supplier</label>
                <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="Supplier name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Invoice Reference</label>
                  <input value={form.invoiceRef} onChange={e => setForm({ ...form, invoiceRef: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="INV-XXXX" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Amount (£)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="What was this payment for?" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Date</label>
                  <input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Method</label>
                  <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value as Payment["method"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>BACS</option><option>Cheque</option><option>Card</option><option>Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Payment["status"] })} className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white">
                    <option>Pending</option><option>Approved</option><option>Paid</option><option>Rejected</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Cancel</button>
              <button onClick={handleSubmit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">{editing ? "Save Changes" : "Add Payment"}</button>
            </div>
          </div>
        </div>
      )}
    </PermissionGuard>
  );
}
