"use client";

import { useState } from "react";
import { formatDate } from "@/lib/date-utils";

const projectsByStatus = {
  mobilizing: [
    { id: "PRJ-2024-051", name: "Commercial Office Refurbishment", client: "Greenwich Properties", estimateId: "EST-2024-038", startDate: "2026-02-28", duration: "8 months", team: 0, budget: "£580K", risk: "low", manager: "Awaiting assignment", mobilizationProgress: 25 },
    { id: "PRJ-2024-052", name: "Residential Housing Development", client: "Fortis Developments", estimateId: "EST-2024-039", startDate: "2026-03-10", duration: "16 months", team: 0, budget: "£3.2M", risk: "medium", manager: "Awaiting assignment", mobilizationProgress: 15 },
  ],
  planned: [
    { id: "PRJ-2606", name: "North District Complex", client: "Bellway", startDate: "2026-03-15", duration: "18 months", team: 12, budget: "£3.2M", risk: "medium", manager: "Sarah Mitchell" },
    { id: "PRJ-2607", name: "Shopping District", client: "Hammerson", startDate: "2026-04-01", duration: "14 months", team: 10, budget: "£2.8M", risk: "low", manager: "James Bradford" },
  ],
  active: [
    { id: "PRJ-2501", name: "Thames Retail Park", client: "Westfield", progress: 68, team: 18, budget: "£4.2M", end: "2026-06-15", risk: "low", manager: "Emma Patel" },
    { id: "PRJ-2502", name: "Premier Mixed Use", client: "Berkeley Group", progress: 52, team: 22, budget: "£6.8M", end: "2026-08-20", risk: "high", manager: "Michael Chen" },
    { id: "PRJ-2503", name: "Central Warehouse", client: "DHL", progress: 85, team: 15, budget: "£2.1M", end: "2026-04-01", risk: "low", manager: "David Johnson" },
    { id: "PRJ-2504", name: "Tech Campus Phase 1", client: "Google", progress: 91, team: 20, budget: "£5.5M", end: "2026-03-15", risk: "low", manager: "Lisa Wong" },
  ],
  review: [
    { id: "PRJ-2505", name: "Riverside Park", client: "Barratt", progress: 98, team: 14, budget: "£3.9M", end: "2026-02-28", risk: "low", manager: "Sarah Mitchell" },
    { id: "PRJ-2506", name: "Office Complex Tower B", client: "Canary Wharf", progress: 95, team: 16, budget: "£4.5M", end: "2026-03-05", risk: "low", manager: "James Bradford" },
  ],
  completed: [
    { id: "PRJ-2601", name: "Market Square Renovation", client: "Local Authority", completedDate: "2026-01-20", team: 12, budget: "£1.8M", manager: "Emma Patel" },
    { id: "PRJ-2602", name: "Industrial Estate Phase 2", client: "Panattoni", completedDate: "2026-01-15", team: 14, budget: "£3.2M", manager: "Michael Chen" },
    { id: "PRJ-2603", name: "Residential Development A", client: "Taylor Wimpey", completedDate: "2026-01-10", team: 10, budget: "£2.4M", manager: "David Johnson" },
  ],
};

const riskColors = {
  low: "bg-green-900/30 border-green-700/50 text-green-400",
  medium: "bg-yellow-900/30 border-yellow-700/50 text-yellow-400",
  high: "bg-red-900/30 border-red-700/50 text-red-400",
};

export default function ProjectsPage() {
  const [view, setView] = useState("board");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="mt-1 text-sm text-gray-400">Kanban workflow board for all projects</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("board")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              view === "board" ? "bg-orange-500 text-white" : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Board View
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              view === "list" ? "bg-orange-500 text-white" : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            List View
          </button>
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            + New Project
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <section className="grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mobilizing</p>
          <p className="mt-2 text-2xl font-bold text-green-400">2</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Planned</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">2</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active</p>
          <p className="mt-2 text-2xl font-bold text-orange-400">4</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">In Review</p>
          <p className="mt-2 text-2xl font-bold text-purple-400">2</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Completed</p>
          <p className="mt-2 text-2xl font-bold text-gray-400">3</p>
        </div>
      </section>

      {/* Board View */}
      {view === "board" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Mobilizing Column */}
            <div className="flex flex-col rounded-lg border-2 border-green-700/50 bg-green-500/20 p-4" style={{ minHeight: "600px" }}>
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  🎉 Mobilizing <span className="text-sm text-gray-400 ml-auto">{projectsByStatus.mobilizing.length}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">Won jobs from Estimating</p>
              </div>
              <div className="space-y-3 flex-1">
                {projectsByStatus.mobilizing.map(p => (
                  <div key={p.id} className="rounded-lg bg-gray-700/40 p-4 hover:bg-gray-700/60 cursor-move border border-gray-700/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-green-400">{p.id}</span>
                      <span className="text-xs px-2 py-1 rounded font-semibold bg-green-900/30 border-green-700/50 text-green-400">
                        New Win
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{p.name}</h4>
                    <p className="text-xs text-gray-400 mb-3">{p.client}</p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Setup</span>
                        <span className="text-xs font-semibold text-white">{p.mobilizationProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${p.mobilizationProgress}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700/30 text-xs">
                      <div>
                        <p className="text-gray-500">From Est</p>
                        <p className="font-semibold text-white">{p.estimateId}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-semibold text-green-400">{p.budget}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700/30 text-xs">
                      <p className="text-gray-500">Start: <span className="text-white font-semibold">{formatDate(p.startDate)}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Planned Column */}
            <div className="flex flex-col rounded-lg border-2 border-blue-700/50 bg-blue-500/20 p-4" style={{ minHeight: "600px" }}>
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  📋 Planned <span className="text-sm text-gray-400 ml-auto">{projectsByStatus.planned.length}</span>
                </h3>
              </div>
              <div className="space-y-3 flex-1">
                {projectsByStatus.planned.map(p => (
                  <div key={p.id} className="rounded-lg bg-gray-700/40 p-4 hover:bg-gray-700/60 cursor-move border border-gray-700/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-blue-400">{p.id}</span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold border ${riskColors[p.risk as keyof typeof riskColors]}`}>
                        {p.risk.charAt(0).toUpperCase() + p.risk.slice(1)}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{p.name}</h4>
                    <p className="text-xs text-gray-400 mb-3">{p.client}</p>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700/30 text-xs">
                      <div>
                        <p className="text-gray-500">Team</p>
                        <p className="font-semibold text-white">{p.team}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-semibold text-blue-400">{p.budget}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700/30 text-xs">
                      <p className="text-gray-500">Start: <span className="text-white font-semibold">{formatDate(p.startDate)}</span></p>
                      <p className="text-gray-500 mt-1">Manager: <span className="text-white font-semibold">{p.manager}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Column */}
            <div className="flex flex-col rounded-lg border-2 border-orange-700/50 bg-orange-500/20 p-4" style={{ minHeight: "600px" }}>
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  🔄 Active <span className="text-sm text-gray-400 ml-auto">{projectsByStatus.active.length}</span>
                </h3>
              </div>
              <div className="space-y-3 flex-1">
                {projectsByStatus.active.map(p => (
                  <div key={p.id} className={`rounded-lg p-4 hover:bg-gray-700/60 cursor-move border border-gray-700/50 transition-all ${p.risk === "high" ? "bg-red-900/40" : "bg-gray-700/40"}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-orange-400">{p.id}</span>
                      <span className={`text-xs px-2 py-1 rounded font-semibold border ${riskColors[p.risk as keyof typeof riskColors]}`}>
                        {p.risk.charAt(0).toUpperCase() + p.risk.slice(1)}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{p.name}</h4>
                    <p className="text-xs text-gray-400 mb-3">{p.client}</p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Progress</span>
                        <span className="text-xs font-semibold text-white">{p.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-orange-400" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700/30 text-xs">
                      <div>
                        <p className="text-gray-500">Team</p>
                        <p className="font-semibold text-white">{p.team}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-semibold text-orange-400">{p.budget}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700/30 text-xs">
                      <p className="text-gray-500">End: <span className="text-white font-semibold">{p.end}</span></p>
                      <p className="text-gray-500 mt-1">Manager: <span className="text-white font-semibold">{p.manager}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Column */}
            <div className="flex flex-col rounded-lg border-2 border-purple-700/50 bg-purple-500/20 p-4" style={{ minHeight: "600px" }}>
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  👀 Review <span className="text-sm text-gray-400 ml-auto">{projectsByStatus.review.length}</span>
                </h3>
              </div>
              <div className="space-y-3 flex-1">
                {projectsByStatus.review.map(p => (
                  <div key={p.id} className="rounded-lg bg-gray-700/40 p-4 hover:bg-gray-700/60 cursor-move border border-gray-700/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-purple-400">{p.id}</span>
                      <span className="text-xs px-2 py-1 rounded font-semibold bg-green-900/30 border-green-700/50 text-green-400">
                        {p.progress}%
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{p.name}</h4>
                    <p className="text-xs text-gray-400 mb-3">{p.client}</p>
                    <div className="mb-3">
                      <div className="h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700/30 text-xs">
                      <div>
                        <p className="text-gray-500">Team</p>
                        <p className="font-semibold text-white">{p.team}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-semibold text-purple-400">{p.budget}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700/30 text-xs">
                      <p className="text-gray-500">End: <span className="text-white font-semibold">{p.end}</span></p>
                      <p className="text-gray-500 mt-1">Manager: <span className="text-white font-semibold">{p.manager}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Column */}
            <div className="flex flex-col rounded-lg border-2 border-green-700/50 bg-green-500/20 p-4" style={{ minHeight: "600px" }}>
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">
                  ✓ Completed <span className="text-sm text-gray-400 ml-auto">{projectsByStatus.completed.length}</span>
                </h3>
              </div>
              <div className="space-y-3 flex-1">
                {projectsByStatus.completed.map(p => (
                  <div key={p.id} className="rounded-lg bg-gray-700/40 p-4 hover:bg-gray-700/60 cursor-pointer border border-gray-700/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-semibold text-green-400">{p.id}</span>
                      <span className="text-xs px-2 py-1 rounded font-semibold bg-green-900/30 border-green-700/50 text-green-400">
                        ✓ Done
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-2">{p.name}</h4>
                    <p className="text-xs text-gray-400 mb-3">{p.client}</p>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700/30 text-xs">
                      <div>
                        <p className="text-gray-500">Team</p>
                        <p className="font-semibold text-white">{p.team}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Budget</p>
                        <p className="font-semibold text-green-400">{p.budget}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-700/30 text-xs">
                      <p className="text-gray-500">Completed: <span className="text-green-400 font-semibold">{formatDate(p.completedDate)}</span></p>
                      <p className="text-gray-500 mt-1">Manager: <span className="text-white font-semibold">{p.manager}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Project</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Client</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Manager</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Progress</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {[...projectsByStatus.planned, ...projectsByStatus.active, ...projectsByStatus.review, ...projectsByStatus.completed].map(p => (
                  <tr key={p.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{p.id}</td>
                    <td className="py-3 text-sm text-white">{p.name}</td>
                    <td className="py-3 text-sm text-gray-400">{p.client}</td>
                    <td className="py-3 text-sm text-gray-300">{p.manager}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        'completedDate' in p ? 'bg-green-900/30 text-green-400' :
                        'progress' in p && p.progress >= 90 ? 'bg-purple-900/30 text-purple-400' :
                        'progress' in p ? 'bg-orange-900/30 text-orange-400' :
                        'bg-blue-900/30 text-blue-400'
                      }`}>
                        {'completedDate' in p ? 'Completed' : 'progress' in p && p.progress >= 90 ? 'Review' : 'progress' in p ? 'Active' : 'Planned'}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400">{'progress' in p ? `${p.progress}%` : '—'}</td>
                    <td className="py-3 text-right text-sm font-semibold text-orange-400">{p.budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
