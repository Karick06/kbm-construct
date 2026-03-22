"use client";

import { useEffect, useMemo, useState } from "react";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";
import { getEmailApprovalsFromStorage, syncEmailApprovalsFromServer, updateEmailApprovalStatus, type EmailApprovalItem } from "@/lib/email-approvals";
import { formatDate } from "@/lib/date-utils";

export default function ApprovalsPage() {
  const [items, setItems] = useState<EmailApprovalItem[]>([]);

  useEffect(() => {
    setItems(getEmailApprovalsFromStorage());
    void syncEmailApprovalsFromServer().then(setItems);

    const refresh = () => setItems(getEmailApprovalsFromStorage());
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const pending = useMemo(() => items.filter((item) => item.status === "pending"), [items]);
  const approved = useMemo(() => items.filter((item) => item.status === "approved"), [items]);
  const rejected = useMemo(() => items.filter((item) => item.status === "rejected"), [items]);

  const handleStatus = async (id: string, status: "approved" | "rejected") => {
    await updateEmailApprovalStatus(id, status);
    setItems(getEmailApprovalsFromStorage());
  };

  return (
    <PermissionGuard permission="procurement">
      <div className="space-y-6">
        <PageHeader title="Approvals" subtitle="Email-driven approval queue for invoices and purchase orders" />

        <section className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Pending", value: pending.length, tone: "text-amber-300" },
            { label: "Approved", value: approved.length, tone: "text-emerald-300" },
            { label: "Rejected", value: rejected.length, tone: "text-red-300" },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">{card.label}</p>
              <p className={`mt-2 text-3xl font-semibold ${card.tone}`}>{card.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/60 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Queue</p>
              <h2 className="mt-1 text-xl font-semibold text-white">Open approval items</h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-600 p-8 text-center text-sm text-gray-400">
                No email approvals queued yet.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-700 bg-gray-900/35 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">{item.type}</p>
                      <p className="mt-1 text-lg font-semibold text-white">{item.recordLabel}</p>
                      <p className="mt-1 text-sm text-gray-400">{item.messageSubject}</p>
                      <p className="mt-2 text-xs text-gray-500">Created {formatDate(item.createdAt)} · Approver: {item.approver || "TBC"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "approved" ? "bg-emerald-500/15 text-emerald-200" : item.status === "rejected" ? "bg-red-500/15 text-red-200" : "bg-amber-500/15 text-amber-100"}`}>
                      {item.status}
                    </span>
                  </div>

                  {item.status === "pending" && (
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => void handleStatus(item.id, "approved")} className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600">
                        Approve
                      </button>
                      <button onClick={() => void handleStatus(item.id, "rejected")} className="rounded-lg border border-red-500/40 px-3 py-2 text-xs text-red-200 hover:bg-red-500/10">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </PermissionGuard>
  );
}
