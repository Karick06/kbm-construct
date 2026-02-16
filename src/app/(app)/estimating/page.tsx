"use client";

import { useState } from "react";

const estimatingStats = [
  { label: "Total Estimates", value: "47", change: "This year", icon: "📊" },
  { label: "Won Value", value: "£1.8M", change: "38% conversion", icon: "✅" },
  { label: "Pending", value: "12", change: "Awaiting response", icon: "⏳" },
  { label: "Avg Estimate Time", value: "2.3 hrs", change: "Per estimate", icon: "⏱️" },
];

const recentEstimates = [
  { id: "EST-2024-047", client: "Thames Construction", value: "£285,000", status: "Won", date: "12 Feb" },
  { id: "EST-2024-046", client: "Premier Developments", value: "£420,000", status: "Pending", date: "11 Feb" },
  { id: "EST-2024-045", client: "Central Engineering", value: "£156,200", status: "Won", date: "10 Feb" },
  { id: "EST-2024-044", client: "Metro Infrastructure", value: "£238,500", status: "Lost", date: "08 Feb" },
];

const topProjects = [
  { name: "Thames Construction - Retail Park", estimates: 3, value: "£285k", rate: "85% win", conversion: "3/3" },
  { name: "Premier Developments - Mixed Use", estimates: 2, value: "£420k", rate: "50% win", conversion: "1/2" },
  { name: "Central Engineering - Warehouse", estimates: 4, value: "£156.2k", rate: "75% win", conversion: "3/4" },
];

const estimateData = [
  { month: "Aug", value: 285, label: "£285k" },
  { month: "Sep", value: 410, label: "£410k" },
  { month: "Oct", value: 365, label: "£365k" },
  { month: "Nov", value: 520, label: "£520k" },
  { month: "Dec", value: 480, label: "£480k" },
  { month: "Jan", value: 565, label: "£565k" },
];

const estimateStatus = [
  { status: "Won", count: 18, color: "bg-green-500" },
  { status: "Pending", count: 12, color: "bg-blue-500" },
  { status: "Lost", count: 15, color: "bg-red-500" },
  { status: "Draft", count: 2, color: "bg-gray-500" },
];

export default function EstimatingPage() {
  const maxEstimate = Math.max(...estimateData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Estimating Overview</h1>
          <p className="mt-1 text-sm text-gray-400">Real-time estimate tracking, conversion analysis, and performance metrics</p>
        </div>
        <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          + New Estimate
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {estimatingStats.map((stat) => (
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

      {/* Estimate Value Trend & Status */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Estimate Value Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estimate Value</p>
                <h2 className="mt-1 text-xl font-bold text-white">Last 6 Months</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">£2.62M</p>
                <p className="text-xs text-green-400">↑ 8% vs previous period</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-3 h-48 mt-12">
            {estimateData.map((item) => (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-2">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:from-orange-400 hover:to-orange-300"
                    style={{ height: `${(item.value / maxEstimate) * 180}px` }}
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

        {/* Estimate Status Breakdown */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estimates</p>
            <h2 className="mt-1 text-xl font-bold text-white">Status Breakdown</h2>
          </div>
          <div className="space-y-3">
            {estimateStatus.map((item) => (
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

      {/* Recent Estimates & Top Projects */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Recent Estimates */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Estimates</p>
              <h2 className="mt-1 text-xl font-bold text-white">Recent Activity</h2>
            </div>
            <button className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Estimate</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Client</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Value</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {recentEstimates.map((est) => (
                  <tr key={est.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{est.id}</td>
                    <td className="py-3 text-sm text-gray-300">{est.client}</td>
                    <td className="py-3 text-sm font-semibold text-white">{est.value}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        est.status === 'Won' ? 'bg-green-900/30 text-green-400' :
                        est.status === 'Pending' ? 'bg-blue-900/30 text-blue-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {est.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{est.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Projects */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Projects</p>
            <h2 className="mt-1 text-xl font-bold text-white">Top Clients</h2>
          </div>
          <div className="space-y-4">
            {topProjects.map((project) => (
              <div key={project.name} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <p className="text-sm font-semibold text-white">{project.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Total Value</p>
                    <p className="text-green-400 font-semibold">{project.value}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Win Rate</p>
                    <p className="text-orange-400 font-semibold">{project.rate}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{project.estimates} estimates • Converted: {project.conversion}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conversion Analysis & Performance */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Analysis</p>
            <h2 className="mt-1 text-xl font-bold text-white">Conversion Insights</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start justify-between p-3 rounded-lg bg-green-900/20 border border-green-700/50">
              <div>
                <p className="text-sm font-semibold text-green-400">Strong Conversion</p>
                <p className="text-xs text-gray-400">Thames Construction: 3/3 estimates won</p>
              </div>
              <span className="text-lg">📈</span>
            </div>
            <div className="flex items-start justify-between p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
              <div>
                <p className="text-sm font-semibold text-yellow-400">Monitor Client</p>
                <p className="text-xs text-gray-400">Premier Developments: 50% conversion rate</p>
              </div>
              <span className="text-lg">⚠️</span>
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
              <p className="text-sm text-gray-400">Overall Conversion Rate</p>
              <p className="text-lg font-semibold text-white">38%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Revenue Won This Year</p>
              <p className="text-lg font-semibold text-green-400">£1.8M</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Avg. Estimate Accuracy</p>
              <p className="text-lg font-semibold text-orange-400">94%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
