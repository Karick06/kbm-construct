"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PermissionGuard from "@/components/PermissionGuard";
import PageHeader from "@/components/PageHeader";

type Enquiry = {
  id: string;
  reference: string;
  title: string;
  category: "labour" | "plant" | "materials" | "subcontract";
  linkedRecordName?: string;
  requiredBy?: string;
  status: "draft" | "sent" | "closed";
  invites: Array<{ id: string; status: "pending" | "viewed" | "responded" }>;
  responses: Array<{ id: string }>;
  createdAt: string;
};

type DerivedStatus = "draft" | "sent" | "partial" | "complete" | "overdue" | "archived";

function getDerivedStatus(enquiry: Enquiry): DerivedStatus {
  if (enquiry.status === "closed") return "archived";
  if (enquiry.status === "draft") return "draft";

  const inviteCount = enquiry.invites.length;
  const responseCount = enquiry.responses.length;
  const isOverdue = enquiry.requiredBy
    ? new Date(enquiry.requiredBy).getTime() < Date.now() && responseCount < Math.max(inviteCount, 1)
    : false;

  if (inviteCount > 0 && responseCount >= inviteCount) return "complete";
  if (responseCount > 0) return "partial";
  if (isOverdue) return "overdue";
  return "sent";
}

function statusBadgeClass(status: DerivedStatus) {
  if (status === "complete") return "bg-green-900/30 text-green-300";
  if (status === "partial") return "bg-yellow-900/30 text-yellow-300";
  if (status === "overdue") return "bg-red-900/30 text-red-300";
  if (status === "draft") return "bg-gray-700/50 text-gray-300";
  if (status === "archived") return "bg-gray-800/70 text-gray-400";
  return "bg-blue-900/30 text-blue-300";
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function SupplierPortalListPage() {
  const router = useRouter();

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DerivedStatus>("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | Enquiry["category"]>("all");

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/supplier-enquiries", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setEnquiries(data);
    })();
  }, []);

  const withStatus = useMemo(
    () => enquiries.map((enquiry) => ({ ...enquiry, derivedStatus: getDerivedStatus(enquiry) })),
    [enquiries]
  );

  const kpis = useMemo(() => {
    const count = (status: DerivedStatus) => withStatus.filter((entry) => entry.derivedStatus === status).length;
    return {
      draft: count("draft"),
      sent: count("sent"),
      partial: count("partial"),
      complete: count("complete"),
      overdue: count("overdue"),
    };
  }, [withStatus]);

  const projectOptions = useMemo(() => {
    const set = new Set(withStatus.map((entry) => entry.linkedRecordName).filter(Boolean));
    return Array.from(set) as string[];
  }, [withStatus]);

  const filtered = useMemo(() => {
    return withStatus.filter((entry) => {
      if (statusFilter !== "all" && entry.derivedStatus !== statusFilter) return false;
      if (projectFilter !== "all" && (entry.linkedRecordName || "") !== projectFilter) return false;
      if (typeFilter !== "all" && entry.category !== typeFilter) return false;

      const query = search.trim().toLowerCase();
      if (!query) return true;

      return [entry.reference, entry.title, entry.linkedRecordName, entry.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [withStatus, search, statusFilter, projectFilter, typeFilter]);

  const tabs: Array<{ key: "all" | DerivedStatus; label: string; count: number }> = [
    { key: "all", label: "All", count: withStatus.length },
    { key: "sent", label: "Sent", count: kpis.sent },
    { key: "partial", label: "Partial", count: kpis.partial },
    { key: "complete", label: "Complete", count: kpis.complete },
    { key: "draft", label: "Draft", count: kpis.draft },
    { key: "archived", label: "Archived", count: withStatus.filter((entry) => entry.derivedStatus === "archived").length },
  ];

  return (
    <PermissionGuard permission="procurement">
      <div className="space-y-6">
        <PageHeader
          title="Supplier Enquiries"
          subtitle="Request quotes from multiple suppliers"
          actions={
            <div className="flex gap-2">
              <button className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700">
                Templates
              </button>
              <button
                onClick={() => router.push("/supplier-portal/new")}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                + New Enquiry
              </button>
            </div>
          }
        />

        <section className="grid gap-3 md:grid-cols-5">
          <div className="rounded-xl border border-gray-700/50 bg-gray-800/80 p-4">
            <p className="text-xs uppercase text-gray-400">Draft</p>
            <p className="mt-1 text-3xl font-bold text-white">{kpis.draft}</p>
            <p className="text-xs text-gray-500">Not yet sent</p>
          </div>
          <div className="rounded-xl border border-blue-700/50 bg-blue-900/10 p-4">
            <p className="text-xs uppercase text-blue-300">Sent</p>
            <p className="mt-1 text-3xl font-bold text-white">{kpis.sent}</p>
            <p className="text-xs text-blue-200/70">Awaiting response</p>
          </div>
          <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/10 p-4">
            <p className="text-xs uppercase text-yellow-300">Partial</p>
            <p className="mt-1 text-3xl font-bold text-white">{kpis.partial}</p>
            <p className="text-xs text-yellow-200/70">Some quotes received</p>
          </div>
          <div className="rounded-xl border border-green-700/50 bg-green-900/10 p-4">
            <p className="text-xs uppercase text-green-300">Complete</p>
            <p className="mt-1 text-3xl font-bold text-white">{kpis.complete}</p>
            <p className="text-xs text-green-200/70">All quotes received</p>
          </div>
          <div className="rounded-xl border border-red-700/50 bg-red-900/10 p-4">
            <p className="text-xs uppercase text-red-300">Overdue</p>
            <p className="mt-1 text-3xl font-bold text-white">{kpis.overdue}</p>
            <p className="text-xs text-red-200/70">Past due date</p>
          </div>
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/80 p-3">
          <div className="grid gap-2 md:grid-cols-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  statusFilter === tab.key ? "bg-orange-500 text-white" : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tab.label} <span className="opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-700/50 bg-gray-800/80 p-3">
          <div className="grid gap-3 md:grid-cols-12">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search enquiries..."
              className="md:col-span-4 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white"
            />
            <select
              value={projectFilter}
              onChange={(event) => setProjectFilter(event.target.value)}
              className="md:col-span-3 rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-white"
            >
              <option value="all">All Projects</option>
              {projectOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <div className="md:col-span-5 flex flex-wrap gap-2">
              {([
                { key: "all", label: "All Types" },
                { key: "materials", label: "Material" },
                { key: "plant", label: "Plant" },
                { key: "subcontract", label: "Subcontract" },
                { key: "labour", label: "Labour" },
              ] as const).map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => setTypeFilter(chip.key)}
                  className={`rounded-full px-3 py-2 text-sm transition ${
                    typeFilter === chip.key ? "bg-orange-500 text-white" : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-10 text-center text-gray-400">
              No enquiries found for the current filters.
            </div>
          ) : (
            filtered.map((entry) => {
              const progressText = `${entry.responses.length}/${Math.max(entry.invites.length, 1)} quotes`;
              const progressPercent = entry.invites.length > 0 ? Math.round((entry.responses.length / entry.invites.length) * 100) : 0;

              return (
                <button
                  key={entry.id}
                  onClick={() => router.push(`/supplier-portal/${entry.id}`)}
                  className="w-full rounded-xl border border-gray-700/50 bg-gray-800/80 p-5 text-left transition hover:border-orange-500 hover:bg-gray-800"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{entry.linkedRecordName ? "LINKED" : "UNLINKED"}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{entry.title}</h3>
                      <p className="text-sm text-gray-400">{toTitleCase(entry.category)}</p>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(entry.derivedStatus)}`}>
                          {toTitleCase(entry.derivedStatus)}
                        </span>
                        <span className="rounded-full bg-gray-700/60 px-3 py-1 text-xs text-gray-300">{toTitleCase(entry.category)}</span>
                      </div>
                      <div className="w-48">
                        <div className="mb-1 text-xs text-gray-500">{progressText}</div>
                        <div className="h-2 rounded-full bg-gray-700">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: `${progressPercent}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <p>Due: {entry.requiredBy ? new Date(entry.requiredBy).toLocaleDateString("en-GB") : "Not set"}</p>
                      <p className="mt-2 text-xs text-gray-500">{entry.reference}</p>
                      <p className="text-xs text-gray-500">Created: {new Date(entry.createdAt).toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </section>
      </div>
    </PermissionGuard>
  );
}
