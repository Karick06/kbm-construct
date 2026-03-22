"use client";

import PermissionGuard from "@/components/PermissionGuard";

import PageHeader from "@/components/PageHeader";
import StatusPill from "@/components/StatusPill";
import type { StatusTone } from "@/components/StatusPill";
import { getPaymentApplicationsFromStorage, getProjectsFromStorage } from "@/lib/operations-data";
import type { InvoiceApplication } from "@/lib/operations-models";
import Link from "next/link";
import { getEmailActivityForRecord } from "@/lib/email-insights";
import { useEffect, useMemo, useState } from "react";

type LedgerInvoice = {
  id: string;
  client: string;
  amount: number;
  statusLabel: string;
  statusTone: StatusTone;
  due: string;
};

const formatCurrency = (value: number) =>
  value.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });

const monthYearKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth()}`;

const toStatusPresentation = (status: InvoiceApplication["status"]): { label: string; tone: StatusTone } => {
  if (status === "paid") return { label: "Paid", tone: "paid" };
  if (status === "draft") return { label: "Draft", tone: "draft" };
  if (status === "disputed") return { label: "Disputed", tone: "risk" };
  if (status === "submitted") return { label: "Submitted", tone: "open" };
  if (status === "certified") return { label: "Certified", tone: "open" };
  return { label: "Open", tone: "open" };
};

const toLedgerDueDate = (application: InvoiceApplication): string => {
  const source = application.paymentDueDate || application.period?.to;
  if (!source) return "TBC";
  const parsed = new Date(source);
  if (Number.isNaN(parsed.getTime())) return "TBC";
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

const getCycleDays = (application: InvoiceApplication): number | null => {
  if (!application.submittedDate || !application.paidDate) return null;
  const submitted = new Date(application.submittedDate).getTime();
  const paid = new Date(application.paidDate).getTime();
  if (Number.isNaN(submitted) || Number.isNaN(paid) || paid < submitted) return null;
  return Math.round((paid - submitted) / (1000 * 60 * 60 * 24));
};

export default function InvoicesPage() {
  const [projectsById, setProjectsById] = useState<Record<string, string>>({});
  const [applications, setApplications] = useState<InvoiceApplication[]>([]);

  useEffect(() => {
    const hydrate = () => {
      const projects = getProjectsFromStorage();
      setProjectsById(
        projects.reduce<Record<string, string>>((acc, project) => {
          acc[project.id] = project.projectName;
          return acc;
        }, {})
      );
      setApplications(getPaymentApplicationsFromStorage());
    };

    hydrate();
    window.addEventListener("storage", hydrate);
    window.addEventListener("focus", hydrate);

    return () => {
      window.removeEventListener("storage", hydrate);
      window.removeEventListener("focus", hydrate);
    };
  }, []);

  const outstandingApplications = useMemo(
    () => applications.filter((application) => application.status !== "paid"),
    [applications]
  );

  const outstandingAmount = useMemo(
    () => outstandingApplications.reduce((sum, application) => sum + (application.thisPayment || 0), 0),
    [outstandingApplications]
  );

  const paidThisMonth = useMemo(() => {
    const now = new Date();
    const key = monthYearKey(now);
    return applications
      .filter((application) => application.status === "paid" && application.paidDate)
      .filter((application) => monthYearKey(new Date(application.paidDate || "")) === key)
      .reduce((sum, application) => sum + (application.paidAmount || application.thisPayment || 0), 0);
  }, [applications]);

  const paidLastMonth = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const key = monthYearKey(lastMonth);
    return applications
      .filter((application) => application.status === "paid" && application.paidDate)
      .filter((application) => monthYearKey(new Date(application.paidDate || "")) === key)
      .reduce((sum, application) => sum + (application.paidAmount || application.thisPayment || 0), 0);
  }, [applications]);

  const paidDeltaText = useMemo(() => {
    if (paidLastMonth <= 0) return paidThisMonth > 0 ? "+100% vs last month" : "No change vs last month";
    const delta = Math.round(((paidThisMonth - paidLastMonth) / paidLastMonth) * 100);
    const prefix = delta > 0 ? "+" : "";
    return `${prefix}${delta}% vs last month`;
  }, [paidLastMonth, paidThisMonth]);

  const averageCycleDays = useMemo(() => {
    const cycleValues = applications
      .map((application) => getCycleDays(application))
      .filter((value): value is number => value !== null);

    if (cycleValues.length === 0) return 0;
    return Math.round(cycleValues.reduce((sum, value) => sum + value, 0) / cycleValues.length);
  }, [applications]);

  const ledgerItems = useMemo<LedgerInvoice[]>(() => {
    return applications
      .slice()
      .sort((left, right) => {
        const leftDate = new Date(left.paidDate || left.submittedDate || left.period?.to || 0).getTime();
        const rightDate = new Date(right.paidDate || right.submittedDate || right.period?.to || 0).getTime();
        return rightDate - leftDate;
      })
      .map((application) => {
        const status = toStatusPresentation(application.status);
        const invoiceId = `APP-${String(application.applicationNumber).padStart(4, "0")}`;
        return {
          id: invoiceId,
          client: projectsById[application.projectId] || application.projectId,
          amount: application.thisPayment || 0,
          statusLabel: status.label,
          statusTone: status.tone,
          due: toLedgerDueDate(application),
        };
      });
  }, [applications, projectsById]);

  return (
    <PermissionGuard permission="invoices">
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Billing and collections"
        subtitle="Invoices"
        actions={
          <>
            <Link href="/payments" className="h-11 rounded-lg border border-gray-700/50 bg-gray-700/30 px-5 text-sm font-semibold text-white hover:bg-gray-700/50 inline-flex items-center">
              Sync payments
            </Link>
            <Link href="/payment-documents" className="h-11 rounded-lg bg-[var(--accent)] px-5 text-sm font-semibold text-white hover:bg-orange-600 inline-flex items-center">
              New invoice
            </Link>
          </>
        }
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Outstanding
          </p>
          <p className="font-display text-3xl font-semibold text-white">{formatCurrency(outstandingAmount)}</p>
          <p className="text-sm text-gray-400">Across {outstandingApplications.length} invoices</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Paid this month
          </p>
          <p className="font-display text-3xl font-semibold text-white">{formatCurrency(paidThisMonth)}</p>
          <p className="text-sm text-gray-400">{paidDeltaText}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
            Average days
          </p>
          <p className="font-display text-3xl font-semibold text-white">{averageCycleDays || "—"}</p>
          <p className="text-sm text-gray-400">Payment cycle time</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
              Invoice ledger
            </p>
            <p className="font-display text-2xl font-semibold text-white">
              Recent activity
            </p>
          </div>
          <Link href="/payment-documents" className="h-10 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 text-xs font-semibold text-white hover:bg-gray-700/50 inline-flex items-center">
            Payment docs
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {ledgerItems.map((invoice) => (
            (() => {
              const emailActivity = getEmailActivityForRecord("invoice", invoice.id);
              return (
                <div
                  key={invoice.id}
                  className="grid gap-2 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 py-3 text-sm md:grid-cols-[0.6fr_1.2fr_0.6fr_0.8fr_0.8fr]"
                >
                  <p className="font-semibold text-white">{invoice.id}</p>
                  <p className="text-gray-400">{invoice.client}</p>
                  <p className="font-semibold text-white">{formatCurrency(invoice.amount)}</p>
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill label={invoice.statusLabel} tone={invoice.statusTone} />
                    <span className="text-xs text-gray-400">
                      {invoice.due}
                    </span>
                  </div>
                  <Link href={`/mail?recordType=invoice&recordId=${encodeURIComponent(invoice.id)}`} className="text-xs text-orange-300 hover:text-orange-200">
                    {emailActivity.total} emails · {emailActivity.unread} unread{emailActivity.awaitingResponse ? " · awaiting reply" : ""}
                  </Link>
                </div>
              );
            })()
          ))}
          {ledgerItems.length === 0 && (
            <p className="rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 py-3 text-sm text-gray-400">
              No payment applications have been added yet.
            </p>
          )}
        </div>
      </section>
    </div>
    </PermissionGuard>
  );
}
