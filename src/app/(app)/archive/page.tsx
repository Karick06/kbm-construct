"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useState } from "react";
import { formatDate } from "@/lib/date-utils";

type ArchivedItem = {
  id: string;
  type: "enquiry" | "estimate";
  client: string;
  projectName: string;
  value: string;
  date: string;
  reason: string;
  source: string;
  notes?: string;
};

const archivedData: ArchivedItem[] = [
  // Declined Enquiries from BD
  {
    id: "ENQ-2024-040",
    type: "enquiry",
    client: "Budget Builders",
    projectName: "Small Commercial Fit-Out",
    value: "£420K",
    date: "10 Feb 2024",
    reason: "Declined at Review",
    source: "BD Review",
    notes: "Project scope too small for current capacity, client timeline unrealistic",
  },
  {
    id: "ENQ-2024-041",
    type: "enquiry",
    client: "Quick Fix Ltd",
    projectName: "Emergency Repairs Contract",
    value: "£180K",
    date: "09 Feb 2024",
    reason: "Declined at Review",
    source: "BD Review",
    notes: "Emergency call-out requirements incompatible with current operations model",
  },
  
  // Lost Estimates
  {
    id: "EST-2024-040",
    type: "estimate",
    client: "Budget Builders",
    projectName: "Small Commercial Fit-Out",
    value: "£420K",
    date: "03 Feb 2024",
    reason: "Lost on price",
    source: "Estimating",
    notes: "Client went with competitor offering 15% lower price - likely loss leader. Estimator: Mark Thompson",
  },
  {
    id: "EST-2024-036",
    type: "estimate",
    client: "Metro Infrastructure",
    projectName: "Road Widening Project",
    value: "£1.2M",
    date: "28 Jan 2024",
    reason: "Lost - Programme concerns",
    source: "Estimating",
    notes: "Client required 3-month earlier completion than we could commit to. Estimator: Sarah Johnson",
  },
  {
    id: "EST-2024-032",
    type: "estimate",
    client: "Local Authority",
    projectName: "Community Centre Extension",
    value: "£680K",
    date: "20 Jan 2024",
    reason: "Lost - Client chose alternative",
    source: "Estimating",
    notes: "Client selected preferred contractor from framework. Estimator: James Wilson",
  },
  {
    id: "ENQ-2024-035",
    type: "enquiry",
    client: "Industrial Properties Ltd",
    projectName: "Factory Conversion",
    value: "£950K",
    date: "15 Jan 2024",
    reason: "Declined at Review",
    source: "BD Review",
    notes: "Asbestos remediation scope beyond our current certification",
  },
  {
    id: "EST-2024-028",
    type: "estimate",
    client: "Redbridge Developments",
    projectName: "Apartment Block Phase 2",
    value: "£3.5M",
    date: "12 Jan 2024",
    reason: "Lost - Withdrew after tender clarifications",
    source: "Estimating",
    notes: "Client requested significant design changes during tender period. Withdrew to protect margins. Estimator: Mark Thompson",
  },
  {
    id: "ENQ-2024-028",
    type: "enquiry",
    client: "Coast Properties",
    projectName: "Seaside Retail Development",
    value: "£2.1M",
    date: "08 Jan 2024",
    reason: "Declined at Review",
    source: "BD Review",
    notes: "Location too remote from current operational base, logistics costs prohibitive",
  },
];

const archiveStats = [
  { label: "Total Archived", value: archivedData.length.toString(), change: "Last 6 months", icon: "📁" },
  { label: "Declined Enquiries", value: archivedData.filter(i => i.type === "enquiry").length.toString(), change: "From BD", icon: "❌" },
  { label: "Lost Estimates", value: archivedData.filter(i => i.type === "estimate").length.toString(), change: "After pricing", icon: "📉" },
  { label: "Total Value", value: `£${(archivedData.reduce((acc, item) => acc + parseFloat(item.value.replace(/[£kM,]/g, '').replace('K', '000').replace('M', '000000')), 0) / 1000000).toFixed(1)}M`, change: "Archived value", icon: "💰" },
];

export default function ArchivePage() {
  const [filter, setFilter] = useState<"all" | "enquiry" | "estimate">("all");
  const [selectedItem, setSelectedItem] = useState<ArchivedItem | null>(null);

  const filteredData = filter === "all" 
    ? archivedData 
    : archivedData.filter(item => item.type === filter);

  return (
    <PermissionGuard permission="estimates">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "all" ? "bg-orange-500 text-white" : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            All ({archivedData.length})
          </button>
          <button
            onClick={() => setFilter("enquiry")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "enquiry" ? "bg-orange-500 text-white" : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Declined ({archivedData.filter(i => i.type === "enquiry").length})
          </button>
          <button
            onClick={() => setFilter("estimate")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              filter === "estimate" ? "bg-orange-500 text-white" : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Lost ({archivedData.filter(i => i.type === "estimate").length})
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {archiveStats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-red-500 bg-gray-800/80 px-5 py-4"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {stat.label}
              </p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.change}</p>
          </div>
        ))}
      </section>

      {/* Archive Table */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Client</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Project</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Value</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Reason</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredData.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="cursor-pointer hover:bg-gray-700/30"
                >
                  <td className="py-3 text-sm font-medium text-white">{item.id}</td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.type === "enquiry"
                          ? "bg-red-900/30 text-red-400"
                          : "bg-orange-900/30 text-orange-400"
                      }`}
                    >
                      {item.type === "enquiry" ? "Declined" : "Lost"}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-300">{item.client}</td>
                  <td className="py-3 text-sm text-white">{item.projectName}</td>
                  <td className="py-3 text-sm font-semibold text-gray-400">{item.value}</td>
                  <td className="py-3 text-sm text-gray-400">{item.reason}</td>
                  <td className="py-3 text-right text-sm text-gray-400">{formatDate(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loss Reasons Analysis */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Analysis</p>
            <h2 className="mt-1 text-xl font-bold text-white">Common Decline Reasons</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
              <p className="text-sm text-gray-300">Scope/Capacity Mismatch</p>
              <p className="text-lg font-bold text-red-400">3</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
              <p className="text-sm text-gray-300">Location/Logistics</p>
              <p className="text-lg font-bold text-red-400">1</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Analysis</p>
            <h2 className="mt-1 text-xl font-bold text-white">Common Loss Reasons</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
              <p className="text-sm text-gray-300">Lost on Price</p>
              <p className="text-lg font-bold text-orange-400">2</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
              <p className="text-sm text-gray-300">Programme/Timeline Issues</p>
              <p className="text-lg font-bold text-orange-400">1</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
              <p className="text-sm text-gray-300">Client Preference/Framework</p>
              <p className="text-lg font-bold text-orange-400">1</p>
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedItem.client}</h3>
                <p className="text-sm text-gray-400">{selectedItem.projectName}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedItem.type === "enquiry"
                    ? "bg-red-900/30 text-red-400"
                    : "bg-orange-900/30 text-orange-400"
                }`}
              >
                {selectedItem.type === "enquiry" ? "Declined Enquiry" : "Lost Estimate"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  ID
                </p>
                <p className="mt-1 text-sm text-white">{selectedItem.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Source
                </p>
                <p className="mt-1 text-sm text-white">{selectedItem.source}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Value
                </p>
                <p className="mt-1 text-sm font-semibold text-gray-400">
                  {selectedItem.value}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Date
                </p>
                <p className="mt-1 text-sm text-white">{formatDate(selectedItem.date)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Reason
                </p>
                <p className="mt-1 text-sm text-white">{selectedItem.reason}</p>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Notes
                </p>
                <p className="mt-2 text-sm text-gray-300">{selectedItem.notes}</p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
