"use client";

import Link from "next/link";
import PermissionGuard from "@/components/PermissionGuard";
import OverviewStatGrid from "@/components/OverviewStatGrid";
import OverviewTrendChart from "@/components/OverviewTrendChart";

import { formatDate } from "@/lib/date-utils";

const hsStats = [
  { label: "Days Without Incident", value: "45", change: "Best on record", icon: "🛡️" },
  { label: "Total Incidents YTD", value: "2", change: "↓ 60% vs last year", icon: "📊" },
  { label: "Compliance Score", value: "98%", change: "Exceeds targets", icon: "✓" },
  { label: "Training Due", value: "8", change: "Schedule before 28 Feb", icon: "📚" },
];

const recentIncidents = [
  { id: "INC-001", date: "05 Feb", location: "Thames Site", type: "Near Miss", severity: "Low", description: "Loose cable on floor", status: "Closed" },
  { id: "INC-002", date: "12 Jan", location: "Premier Site", type: "Accident", severity: "Medium", description: "Minor cut from sharp edge", status: "Closed" },
];

const riskAreas = [
  { area: "Site A - Thames", hazards: 3, controls: "In Place", lastAudit: "08 Feb", rating: "Good" },
  { area: "Site B - Premier", hazards: 2, controls: "In Place", lastAudit: "01 Feb", rating: "Good" },
  { area: "Head Office", hazards: 1, controls: "In Place", lastAudit: "15 Jan", rating: "Excellent" },
];

const incidentData = [
  { month: "Aug", value: 1, label: "1" },
  { month: "Sep", value: 0, label: "0" },
  { month: "Oct", value: 2, label: "2" },
  { month: "Nov", value: 1, label: "1" },
  { month: "Dec", value: 0, label: "0" },
  { month: "Jan", value: 2, label: "2" },
];

const incidentStatus = [
  { type: "Near Miss", count: 8, color: "bg-yellow-500" },
  { type: "Accident", count: 2, color: "bg-red-500" },
  { type: "Resolved", count: 10, color: "bg-green-500" },
];

const trainingStatus = [
  { course: "CSCS Card Renewal", due: 3, completed: 18, percentage: "86%" },
  { course: "Manual Handling", due: 2, completed: 22, percentage: "92%" },
  { course: "Working at Height", due: 3, completed: 19, percentage: "86%" },
];

export default function HSOverviewPage() {
  return (
    <PermissionGuard permission="compliance">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        <Link href="/compliance" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700">
          Compliance
        </Link>
        <Link href="/incidents" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          + Report Incident
        </Link>
      </div>

      {/* Key Metrics */}
      <OverviewStatGrid items={hsStats} />

      {/* Incident Trend & Type */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Incident Trend Chart */}
        <OverviewTrendChart
          eyebrow="Incident Trend"
          title="Last 6 Months"
          summaryValue="8"
          summaryChange="→ 2 reported this month"
          summaryToneClassName="text-red-400"
          points={incidentData}
        />

        {/* Incident Type Breakdown */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Incidents</p>
            <h2 className="mt-1 text-xl font-bold text-white">Type Breakdown</h2>
          </div>
          <div className="space-y-3">
            {incidentStatus.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <p className="text-sm text-gray-400">{item.type}</p>
                </div>
                <p className="text-sm font-semibold text-white">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Incidents & Training */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Recent Incidents */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Incidents</p>
              <h2 className="mt-1 text-xl font-bold text-white">Recent Activity</h2>
            </div>
            <Link href="/incidents" className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Incident</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Location</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Severity</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {recentIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{inc.id}</td>
                    <td className="py-3 text-sm text-gray-300">{inc.location}</td>
                    <td className="py-3 text-sm text-white">{inc.type}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        inc.severity === 'Low' ? 'bg-yellow-900/30 text-yellow-400' :
                        inc.severity === 'Medium' ? 'bg-orange-900/30 text-orange-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{formatDate(inc.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Areas */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Sites</p>
            <h2 className="mt-1 text-xl font-bold text-white">Risk Assessment</h2>
          </div>
          <div className="space-y-4">
            {riskAreas.map((area) => (
              <div key={area.area} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{area.area}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                    area.rating === 'Excellent' ? 'bg-green-900/30 text-green-400' :
                    'bg-blue-900/30 text-blue-400'
                  }`}>
                    {area.rating}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{area.hazards} hazards • {area.controls} • Audited {area.lastAudit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Status & Metrics */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Training</p>
            <h2 className="mt-1 text-xl font-bold text-white">Certification Status</h2>
          </div>
          <div className="space-y-3">
            {trainingStatus.map((training) => (
              <div key={training.course} className="flex items-start justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{training.course}</p>
                  <div className="mt-2 h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: training.percentage }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{training.completed}/{training.completed + training.due} certified • {training.due} due</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Performance</p>
            <h2 className="mt-1 text-xl font-bold text-white">Key Indicators</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Compliance Score</p>
              <p className="text-lg font-semibold text-green-400">98%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">LTI Frequency Rate</p>
              <p className="text-lg font-semibold text-white">0.0</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Audit Coverage</p>
              <p className="text-lg font-semibold text-orange-400">100%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PermissionGuard>
  );
}
