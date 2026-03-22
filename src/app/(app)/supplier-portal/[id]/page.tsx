"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";

type LineResponse = {
  itemId: string;
  unitRate: number;
  total: number;
  notes?: string;
};

type SupplierResponse = {
  id: string;
  supplierName: string;
  supplierEmail: string;
  submittedAt: string;
  leadTime?: string;
  validityDays?: number;
  notes?: string;
  lineItems: LineResponse[];
  grandTotal: number;
};

type Enquiry = {
  id: string;
  reference: string;
  title: string;
  status: "draft" | "sent" | "closed";
  category: "labour" | "plant" | "materials" | "subcontract";
  linkedRecordName?: string;
  requiredBy?: string;
  createdAt: string;
  items: Array<{ id: string; description: string; unit: string; quantity: number; itemCode?: string }>;
  documents: Array<{ id: string; fileName: string; dataUrl: string }>;
  invites: Array<{ id: string; supplierName: string; supplierEmail: string; status: "pending" | "viewed" | "responded" }>;
  responses: SupplierResponse[];
};

type Supplier = {
  id: string;
  name: string;
  email: string;
  status: "Active" | "On Hold" | "Inactive";
};

const defaultSuppliers: Supplier[] = [
  { id: "SUP-001", name: "ArcBuild Groundworks Ltd", email: "dave@arcbuild.co.uk", status: "Active" },
  { id: "SUP-002", name: "Northern Steel Fabricators", email: "sarah@northsteel.co.uk", status: "Active" },
  { id: "SUP-003", name: "Crestline MEP Solutions", email: "tom@crestlinemep.co.uk", status: "Active" },
  { id: "SUP-005", name: "Peak Plant Hire", email: "mike@peakplant.co.uk", status: "Active" },
];

function formatCurrency(value: number) {
  return value.toLocaleString("en-GB", { style: "currency", currency: "GBP" });
}

function statusBadgeClass(status: string) {
  if (status === "complete") return "bg-green-900/30 text-green-300";
  if (status === "partial") return "bg-yellow-900/30 text-yellow-300";
  if (status === "overdue") return "bg-red-900/30 text-red-300";
  if (status === "draft") return "bg-gray-700/50 text-gray-300";
  if (status === "archived") return "bg-gray-800/70 text-gray-400";
  return "bg-blue-900/30 text-blue-300";
}

export default function SupplierEnquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const enquiryId = params?.id;

  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddSuppliers, setShowAddSuppliers] = useState(false);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  const suppliers = useMemo(() => {
    if (typeof window === "undefined") return defaultSuppliers;
    const stored = localStorage.getItem("kbm_suppliers");
    const parsed = stored ? (JSON.parse(stored) as Supplier[]) : defaultSuppliers;
    return parsed.filter((supplier) => supplier.status === "Active");
  }, []);

  const loadEnquiry = async () => {
    if (!enquiryId) return;
    setLoading(true);
    const response = await fetch(`/api/supplier-enquiries/${enquiryId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) {
      setEnquiry(null);
      setLoading(false);
      return;
    }
    setEnquiry(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadEnquiry();
  }, [enquiryId]);

  const derivedStatus = useMemo(() => {
    if (!enquiry) return "draft";
    if (enquiry.status === "closed") return "archived";
    if (enquiry.status === "draft") return "draft";
    const isOverdue = enquiry.requiredBy
      ? new Date(enquiry.requiredBy).getTime() < Date.now() && enquiry.responses.length < Math.max(enquiry.invites.length, 1)
      : false;
    if (enquiry.invites.length > 0 && enquiry.responses.length >= enquiry.invites.length) return "complete";
    if (enquiry.responses.length > 0) return "partial";
    if (isOverdue) return "overdue";
    return "sent";
  }, [enquiry]);

  const quoteComparison = useMemo(() => {
    if (!enquiry) return [];
    return enquiry.responses
      .map((response) => {
        const itemsPriced = response.lineItems.filter((line) => line.unitRate > 0).length;
        return {
          ...response,
          itemsPriced,
        };
      })
      .sort((a, b) => a.grandTotal - b.grandTotal);
  }, [enquiry]);

  const bestResponseId = quoteComparison[0]?.id;
  const responsePercent = enquiry
    ? enquiry.invites.length > 0
      ? Math.round((enquiry.responses.length / enquiry.invites.length) * 100)
      : 0
    : 0;

  const cancelEnquiry = async () => {
    if (!enquiry) return;
    if (!confirm("Cancel this enquiry?")) return;

    const response = await fetch(`/api/supplier-enquiries/${enquiry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });

    if (!response.ok) {
      alert("Failed to cancel enquiry");
      return;
    }

    await loadEnquiry();
  };

  const resendToAll = async () => {
    if (!enquiry) return;
    const recipients = enquiry.invites.map((invite) => ({
      supplierName: invite.supplierName,
      supplierEmail: invite.supplierEmail,
    }));

    if (recipients.length === 0) {
      alert("No suppliers to resend");
      return;
    }

    const response = await fetch(`/api/supplier-enquiries/${enquiry.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients }),
    });

    if (!response.ok) {
      alert("Failed to resend");
      return;
    }

    await loadEnquiry();
  };

  const addSuppliers = async () => {
    if (!enquiry) return;
    const recipients = suppliers
      .filter((supplier) => selectedSupplierIds.includes(supplier.id))
      .map((supplier) => ({
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
      }));

    if (recipients.length === 0) {
      alert("Select at least one supplier");
      return;
    }

    const response = await fetch(`/api/supplier-enquiries/${enquiry.id}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipients }),
    });

    if (!response.ok) {
      alert("Failed to add suppliers");
      return;
    }

    setShowAddSuppliers(false);
    setSelectedSupplierIds([]);
    await loadEnquiry();
  };

  if (loading) {
    return <div className="p-8 text-gray-300">Loading enquiry...</div>;
  }

  if (!enquiry) {
    return (
      <div className="p-8 text-gray-300">
        <p>Enquiry not found.</p>
        <button onClick={() => router.push("/supplier-portal")} className="mt-3 rounded bg-gray-700 px-3 py-2 text-sm text-white">Back to Supplier Portal</button>
      </div>
    );
  }

  return (
    <PermissionGuard permission="procurement">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title={enquiry.reference}
          subtitle={enquiry.title}
          actions={
            <div className="flex gap-2">
              <button onClick={() => router.push("/supplier-portal")} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800">Back</button>
              {derivedStatus !== "archived" && (
                <button onClick={cancelEnquiry} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Cancel Enquiry</button>
              )}
              <button onClick={() => setShowAddSuppliers((previous) => !previous)} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800">Add Suppliers</button>
              <button onClick={resendToAll} className="rounded-lg border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800">Resend to All</button>
            </div>
          }
        />

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(derivedStatus)}`}>
                {derivedStatus.charAt(0).toUpperCase() + derivedStatus.slice(1)}
              </span>
              <span className="text-xs text-gray-400">{enquiry.category.toUpperCase()}</span>
            </div>
            <p className="text-sm text-gray-400">{enquiry.responses.length}/{Math.max(enquiry.invites.length, 1)} quotes received</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-700">
            <div className="h-2 rounded-full bg-green-500" style={{ width: `${responsePercent}%` }} />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4"><p className="text-xs text-gray-400">Items</p><p className="text-2xl font-bold text-white">{enquiry.items.length}</p></div>
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4"><p className="text-xs text-gray-400">Suppliers</p><p className="text-2xl font-bold text-white">{enquiry.invites.length}</p></div>
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4"><p className="text-xs text-gray-400">Attachments</p><p className="text-2xl font-bold text-white">{enquiry.documents.length}</p></div>
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4"><p className="text-xs text-gray-400">Quotes Received</p><p className="text-2xl font-bold text-white">{enquiry.responses.length}</p></div>
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4"><p className="text-xs text-gray-400">Due Date</p><p className="text-2xl font-bold text-white">{enquiry.requiredBy ? new Date(enquiry.requiredBy).toLocaleDateString("en-GB") : "—"}</p></div>
        </section>

        {showAddSuppliers && (
          <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-4 space-y-3">
            <h2 className="text-lg font-semibold text-white">Add Suppliers</h2>
            <div className="grid gap-2 md:grid-cols-2">
              {suppliers.map((supplier) => (
                <label key={supplier.id} className="flex items-center gap-2 rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedSupplierIds.includes(supplier.id)}
                    onChange={(event) =>
                      setSelectedSupplierIds((previous) =>
                        event.target.checked ? [...previous, supplier.id] : previous.filter((id) => id !== supplier.id)
                      )
                    }
                  />
                  <span>{supplier.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <button onClick={addSuppliers} className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">Send to selected suppliers</button>
            </div>
          </section>
        )}

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-3">
          <h2 className="text-xl font-semibold text-white">Supplier Invite Status</h2>
          {enquiry.invites.length === 0 ? (
            <p className="text-sm text-gray-400">No supplier invites sent yet.</p>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {enquiry.invites.map((invite) => (
                <div key={invite.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">{invite.supplierName}</p>
                      <p className="text-xs text-gray-400">{invite.supplierEmail}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        invite.status === "responded"
                          ? "bg-green-900/30 text-green-300"
                          : invite.status === "viewed"
                            ? "bg-yellow-900/30 text-yellow-300"
                            : "bg-blue-900/30 text-blue-300"
                      }`}
                    >
                      {invite.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-3">
          <h2 className="text-xl font-semibold text-white">Quote Comparison</h2>
          {quoteComparison.length === 0 ? (
            <p className="text-sm text-gray-400">No supplier responses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-2 text-left text-gray-400">Supplier</th>
                    <th className="py-2 text-left text-gray-400">Total Price</th>
                    <th className="py-2 text-left text-gray-400">Items priced</th>
                    <th className="py-2 text-left text-gray-400">Delivery</th>
                    <th className="py-2 text-left text-gray-400">Valid Until</th>
                    <th className="py-2 text-left text-gray-400">Status</th>
                    <th className="py-2 text-right text-gray-400">Create PO</th>
                  </tr>
                </thead>
                <tbody>
                  {quoteComparison.map((response) => (
                    <tr key={response.id} className={`${response.id === bestResponseId ? "bg-green-900/20" : ""}`}>
                      <td className="py-3 text-white font-semibold">{response.supplierName} {response.id === bestResponseId ? <span className="ml-2 text-xs text-green-300">Best overall</span> : null}</td>
                      <td className="py-3 text-green-400 font-semibold">{formatCurrency(response.grandTotal)}</td>
                      <td className="py-3 text-gray-300">{response.itemsPriced} / {enquiry.items.length}</td>
                      <td className="py-3 text-gray-300">{response.leadTime || "—"}</td>
                      <td className="py-3 text-gray-300">{response.validityDays ? `${response.validityDays} days` : "—"}</td>
                      <td className="py-3 text-gray-300">Submitted</td>
                      <td className="py-3 text-right">
                        <button onClick={() => router.push("/purchase-orders")} className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white hover:bg-orange-600">Create PO</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Supplier Responses</h2>
            {bestResponseId && (
              <button onClick={() => router.push("/purchase-orders")} className="rounded border border-gray-600 px-4 py-2 text-sm text-gray-200 hover:bg-gray-800">
                Create 1 Best-Price PO
              </button>
            )}
          </div>

          {quoteComparison.length === 0 ? (
            <p className="text-sm text-gray-400">Awaiting supplier responses.</p>
          ) : (
            quoteComparison.map((response) => (
              <div key={response.id} className="rounded-lg border border-gray-700 bg-gray-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{response.supplierName}</p>
                    <p className="text-xs text-gray-400">Submitted {new Date(response.submittedAt).toLocaleString("en-GB")}</p>
                  </div>
                  <p className="font-bold text-orange-400">{formatCurrency(response.grandTotal)}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="py-2 text-left text-gray-400">Item</th>
                        <th className="py-2 text-left text-gray-400">Qty</th>
                        <th className="py-2 text-left text-gray-400">Unit</th>
                        <th className="py-2 text-left text-gray-400">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enquiry.items.map((item) => {
                        const line = response.lineItems.find((entry) => entry.itemId === item.id);
                        return (
                          <tr key={item.id}>
                            <td className="py-2 text-gray-200">{item.description}</td>
                            <td className="py-2 text-gray-300">{item.quantity}</td>
                            <td className="py-2 text-gray-300">{item.unit}</td>
                            <td className="py-2 text-gray-200">{line ? formatCurrency(line.unitRate) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-5">
          <h2 className="text-lg font-semibold text-white">Documents & Attachments</h2>
          {enquiry.documents.length === 0 ? (
            <p className="mt-2 text-sm text-gray-400">No attachments uploaded.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {enquiry.documents.map((document) => (
                <a key={document.id} href={document.dataUrl} download={document.fileName} className="rounded border border-gray-600 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700">
                  {document.fileName}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </PermissionGuard>
  );
}
