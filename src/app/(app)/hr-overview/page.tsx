"use client";

import Link from "next/link";
import PermissionGuard from "@/components/PermissionGuard";
import OverviewStatGrid from "@/components/OverviewStatGrid";
import OverviewTrendChart from "@/components/OverviewTrendChart";

import { formatDate } from "@/lib/date-utils";

const hrStats = [
  { label: "Total Staff", value: "156", change: "+3 this quarter", icon: "👥" },
  { label: "Available", value: "142", change: "91% capacity", icon: "✓" },
  { label: "On Leave", value: "12", change: "4 sick days scheduled", icon: "📅" },
  { label: "Pending Hire", value: "8", change: "3 offers accepted", icon: "📝" },
];

const staffByTeam = [
  { id: "STF-001", name: "Sarah Mitchell", team: "Operations", role: "Project Manager", status: "On Site", capacity: "95%", startDate: "12 Jan 2024" },
  { id: "STF-002", name: "James Bradford", team: "Construction", role: "Site Foreman", status: "On Site", capacity: "100%", startDate: "08 Feb 2023" },
  { id: "STF-003", name: "Emma Patel", team: "Finance", role: "Accountant", status: "Office", capacity: "80%", startDate: "15 Mar 2023" },
  { id: "STF-004", name: "Michael Chen", team: "HR", role: "HR Manager", status: "Office", capacity: "100%", startDate: "01 Jun 2022" },
];

const departments = [
  { name: "Construction", staff: 48, capacity: "96%", value: "On Site" },
  { name: "Operations", staff: 38, capacity: "92%", value: "Mixed" },
  { name: "Administration", staff: 22, capacity: "85%", value: "Office" },
  { name: "Finance", staff: 18, capacity: "88%", value: "Office" },
  { name: "HR", staff: 6, capacity: "100%", value: "Office" },
  { name: "Management", staff: 24, capacity: "91%", value: "Mixed" },
];

const staffData = [
  { month: "Aug", value: 142, label: "142" },
  { month: "Sep", value: 145, label: "145" },
  { month: "Oct", value: 148, label: "148" },
  { month: "Nov", value: 150, label: "150" },
  { month: "Dec", value: 154, label: "154" },
  { month: "Jan", value: 156, label: "156" },
];

const leaveStatus = [
  { status: "Approved", count: 24, color: "bg-green-500" },
  { status: "Pending", count: 5, color: "bg-yellow-500" },
  { status: "Scheduled", count: 12, color: "bg-blue-500" },
  { status: "Available", count: 142, color: "bg-gray-600" },
];

const trainingPrograms = [
  { program: "Health & Safety Level 3", participants: 18, completion: "72%", dueDate: "15 Mar" },
  { program: "CSCS Card Renewal", participants: 12, completion: "58%", dueDate: "28 Feb" },
  { program: "Leadership Development", participants: 8, completion: "85%", dueDate: "20 Apr" },
];

export default function HROverviewPage() {
  return (
    <PermissionGuard permission="leave">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        <Link href="/team" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700">
          Team
        </Link>
        <Link href="/staff" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          + New Hire
        </Link>
      </div>

      {/* Key Metrics */}
      <OverviewStatGrid items={hrStats} />

      {/* Staffing Trend & Leave Status */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Staffing Chart */}
        <OverviewTrendChart
          eyebrow="Headcount"
          title="Last 6 Months"
          summaryValue="156"
          summaryChange="↑ 14 employees this period"
          summaryToneClassName="text-green-400"
          points={staffData}
        />

        {/* Leave Status Breakdown */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Leave</p>
            <h2 className="mt-1 text-xl font-bold text-white">Status Breakdown</h2>
          </div>
          <div className="space-y-3">
            {leaveStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <p className="text-sm text-gray-400">{item.status}</p>
                </div>
                <p className="text-sm font-semibold text-white">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Staff Directory & Department Breakdown */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Staff Directory */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Directory</p>
              <h2 className="mt-1 text-xl font-bold text-white">Staff Overview</h2>
            </div>
            <button className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Team</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Role</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {staffByTeam.map((staff) => (
                  <tr key={staff.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{staff.name}</td>
                    <td className="py-3 text-sm text-gray-300">{staff.team}</td>
                    <td className="py-3 text-sm text-white">{staff.role}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        staff.status === 'On Site' ? 'bg-green-900/30 text-green-400' :
                        'bg-blue-900/30 text-blue-400'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{staff.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Breakdown */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Teams</p>
            <h2 className="mt-1 text-xl font-bold text-white">By Department</h2>
          </div>
          <div className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.name} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{dept.name}</p>
                  <p className="text-sm font-semibold text-orange-400">{dept.staff}</p>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: dept.capacity }} />
                </div>
                <p className="text-xs text-gray-400">{dept.capacity} capacity • {dept.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training & Performance */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Development</p>
            <h2 className="mt-1 text-xl font-bold text-white">Training Programs</h2>
          </div>
          <div className="space-y-3">
            {trainingPrograms.map((program) => (
              <div key={program.program} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{program.program}</p>
                  <p className="text-xs font-semibold text-orange-400">{program.completion}</p>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: program.completion }} />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{program.participants} participants</p>
                  <p className="text-xs text-gray-500">Due {formatDate(program.dueDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Metrics</p>
            <h2 className="mt-1 text-xl font-bold text-white">Workforce Health</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Capacity Utilisation</p>
              <p className="text-lg font-semibold text-white">91%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Avg. Tenure</p>
              <p className="text-lg font-semibold text-orange-400">4.8 years</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Turnover Rate</p>
              <p className="text-lg font-semibold text-green-400">8.2%</p>
            </div>
            <hr className="border-gray-700/50" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Reporting Compliance</p>
              <p className="text-lg font-semibold text-green-400">98%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PermissionGuard>
  );
}
