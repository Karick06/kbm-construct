"use client";

import { useState } from "react";

const resourceStats = [
  { label: "Total Staff", value: "156", change: "+8 this year", icon: "👥" },
  { label: "Available", value: "134", change: "86% capacity", icon: "✓" },
  { label: "On Allocation", value: "142", change: "91% utilisation", icon: "📊" },
  { label: "On Leave", value: "12", change: "7 scheduled, 5 sick", icon: "🏖️" },
];

const staffByDepartment = [
  { id: "STF-001", name: "Thames Project Team", department: "Operations", staff: 12, allocated: 12, available: 11, utilisation: "92%" },
  { id: "STF-002", name: "Commercial Team", department: "Commercial", staff: 8, allocated: 7, available: 6, utilisation: "88%" },
  { id: "STF-003", name: "BD Team", department: "Business Dev", staff: 6, allocated: 5, available: 4, utilisation: "83%" },
  { id: "STF-004", name: "Support Services", department: "Admin", staff: 18, allocated: 16, available: 14, utilisation: "89%" },
];

const departments = [
  { name: "Operations", staff: 52, utilisation: "94%", available: 48, budget: "£285k" },
  { name: "Commercial", staff: 28, utilisation: "89%", available: 25, budget: "£142k" },
  { name: "Business Dev", staff: 18, utilisation: "85%", available: 15, budget: "£95k" },
  { name: "Admin & Support", staff: 42, utilisation: "88%", available: 38, budget: "£168k" },
];

const resourceData = [
  { month: "Aug", value: 142, label: "142" },
  { month: "Sep", value: 145, label: "145" },
  { month: "Oct", value: 148, label: "148" },
  { month: "Nov", value: 150, label: "150" },
  { month: "Dec", value: 148, label: "148" },
  { month: "Jan", value: 142, label: "142" },
];

const resourceStatus = [
  { status: "On Allocation", count: 142, color: "bg-green-500" },
  { status: "Available", count: 134, color: "bg-blue-500" },
  { status: "On Leave", count: 12, color: "bg-yellow-500" },
];

export default function ResourcesOverviewPage() {
  const maxResources = Math.max(...resourceData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Resources Overview</h1>
          <p className="mt-1 text-sm text-gray-400">Real-time staff allocation, project assignments, and resource management</p>
        </div>
        <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          + Allocate Resource
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {resourceStats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
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

      {/* Resource Allocation Trend & Status */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Resource Allocation Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active Allocations</p>
                <h2 className="mt-1 text-xl font-bold text-white">Last 6 Months</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">142</p>
                <p className="text-xs text-green-400">91% utilisation rate</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-3 h-48 mt-12">
            {resourceData.map((item) => (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-2">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:from-orange-400 hover:to-orange-300"
                    style={{ height: `${(item.value / maxResources) * 180}px` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.month}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resource Status */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Staff</p>
            <h2 className="mt-1 text-xl font-bold text-white">Status Summary</h2>
          </div>
          <div className="space-y-3">
            {resourceStatus.map((item) => (
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

      {/* Staff Allocation & Departments */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Staff Allocation Table */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Teams</p>
              <h2 className="mt-1 text-xl font-bold text-white">Staff Allocation</h2>
            </div>
            <button className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Team</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Department</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">Staff</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">Utilisation</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Available</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {staffByDepartment.map((team) => (
                  <tr key={team.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{team.name}</td>
                    <td className="py-3 text-sm text-gray-300">{team.department}</td>
                    <td className="py-3 text-center text-sm text-white">{team.staff}</td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-700/50 rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: team.utilisation }} />
                        </div>
                        <span className="text-xs font-semibold text-white whitespace-nowrap">{team.utilisation}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{team.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Departments */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Departments</p>
            <h2 className="mt-1 text-xl font-bold text-white">By Division</h2>
          </div>
          <div className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.name} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{dept.name}</p>
                  <p className="text-sm font-semibold text-orange-400">{dept.utilisation}</p>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: dept.utilisation }} />
                </div>
                <p className="text-xs text-gray-400">{dept.staff} staff • {dept.available} available • {dept.budget}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capacity Planning & Skills */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Planning</p>
            <h2 className="mt-1 text-xl font-bold text-white">Capacity Alerts</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
              <div>
                <p className="text-sm font-semibold text-yellow-400">High Utilisation</p>
                <p className="text-xs text-gray-400">Operations team at 94% - monitor for burnout</p>
              </div>
              <span className="text-lg">⚠️</span>
            </div>
            <div className="flex items-start justify-between p-3 rounded-lg bg-green-900/20 border border-green-700/50">
              <div>
                <p className="text-sm font-semibold text-green-400">Hiring Needed</p>
                <p className="text-xs text-gray-400">Recommend 8-10 new roles for growth targets</p>
              </div>
              <span className="text-lg">📈</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Metrics</p>
            <h2 className="mt-1 text-xl font-bold text-white">Performance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Average Utilisation</p>
              <p className="text-lg font-semibold text-white">91%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Staff Turnover YTD</p>
              <p className="text-lg font-semibold text-orange-400">3.2%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Budget Utilisation</p>
              <p className="text-lg font-semibold text-green-400">87%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
