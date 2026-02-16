"use client";

import { useState } from "react";

type WonJob = {
  id: string;
  estimateId: string;
  client: string;
  projectName: string;
  value: string;
  status: "new-win" | "mobilizing" | "active" | "review" | "completed";
  manager?: string;
  startDate?: string;
  progress?: number;
  team?: number;
  notes?: string;
};

const wonJobsData: WonJob[] = [
  // New Wins from Estimating
  {
    id: "PRJ-2024-051",
    estimateId: "EST-2024-038",
    client: "Greenwich Properties",
    projectName: "Commercial Office Refurbishment",
    value: "£580K",
    status: "new-win",
    notes: "Contract awarded, LOI received. Ready for mobilization.",
  },
  {
    id: "PRJ-2024-052",
    estimateId: "EST-2024-039",
    client: "Fortis Developments",
    projectName: "Residential Housing Development",
    value: "£3.2M",
    status: "new-win",
    notes: "Contract signed, awaiting project manager assignment.",
  },
];

const operationsStats = [
  { label: "New Wins", value: "2", change: "From Estimating", icon: "🎉" },
  { label: "Active Projects", value: "12", change: "+2 this month", icon: "🏗️" },
  { label: "Pending Tasks", value: "24", change: "8 requiring approval", icon: "📋" },
  { label: "Resource Utilisation", value: "92%", change: "Very strong", icon: "👥" },
];

const workflowSections = [
  { id: "projects", name: "Projects", icon: "🏗️", description: "Kanban workflow board", count: 12, color: "blue" },
  { id: "tasks", name: "Tasks", icon: "✓", description: "Task queue & assignments", count: 24, color: "orange" },
  { id: "approvals", name: "Approvals", icon: "👀", description: "Pending reviews", count: 8, color: "yellow" },
  { id: "resources", name: "Resources", icon: "👥", description: "Allocation & capacity", count: 156, color: "green" },
  { id: "schedule", name: "Schedule", icon: "📅", description: "Project timeline", count: 12, color: "purple" },
  { id: "equipment", name: "Equipment", icon: "🔧", description: "Fleet & plant mgmt", count: 42, color: "cyan" },
];

export default function OperationsOverviewPage() {
  const [activeWorkflow, setActiveWorkflow] = useState("projects");
  const [selectedWin, setSelectedWin] = useState<WonJob | null>(null);

  const handleMobilize = (jobId: string, manager: string) => {
    console.log(`Mobilizing project ${jobId} with manager ${manager}`);
    // In real app: update job status to mobilizing and assign manager
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Operations Hub</h1>
          <p className="mt-1 text-sm text-gray-400">
            Won jobs from Estimating → Mobilization → Active delivery
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {operationsStats.map((stat) => (
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

      {/* Workflow Menu */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
        <h2 className="mb-6 text-xl font-bold text-white">Workflow Sections</h2>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workflowSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveWorkflow(section.id)}
              className={`group rounded-lg border-2 p-6 text-left transition-all ${
                activeWorkflow === section.id
                  ? "border-orange-500 bg-orange-900/20"
                  : "border-gray-700/50 bg-gray-700/30 hover:bg-gray-700/50 hover:border-gray-700"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{section.icon}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  section.color === "blue" ? "bg-blue-900/30 text-blue-400" :
                  section.color === "orange" ? "bg-orange-900/30 text-orange-400" :
                  section.color === "yellow" ? "bg-yellow-900/30 text-yellow-400" :
                  section.color === "green" ? "bg-green-900/30 text-green-400" :
                  section.color === "purple" ? "bg-purple-900/30 text-purple-400" :
                  "bg-cyan-900/30 text-cyan-400"
                }`}>
                  {section.count}
                </span>
              </div>
              <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">{section.name}</h3>
              <p className="text-xs text-gray-400 mt-1">{section.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* New Wins Section */}
      {wonJobsData.filter(j => j.status === "new-win").length > 0 && (
        <div className="rounded-lg border border-green-700/50 bg-green-900/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎉 New Wins from Estimating
                <span className="text-sm font-normal text-gray-400">
                  ({wonJobsData.filter(j => j.status === "new-win").length})
                </span>
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Successful quotes ready for mobilization
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {wonJobsData.filter(j => j.status === "new-win").map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedWin(job)}
                className="cursor-pointer rounded-lg border border-green-700/50 bg-gray-800/80 p-4 transition-all hover:border-green-500 hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{job.client}</p>
                    <p className="text-xs text-gray-400 mt-1">{job.projectName}</p>
                  </div>
                  <span className="rounded-full bg-green-900/30 px-2 py-1 text-xs font-semibold text-green-400">
                    New Win
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-green-400">{job.value}</span>
                  <span className="text-xs text-gray-500">Est: {job.estimateId}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2 line-clamp-1">{job.notes}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMobilize(job.id, "Sarah Mitchell");
                  }}
                  className="mt-3 w-full rounded bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  Begin Mobilization →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Workflow */}
      {activeWorkflow === "projects" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="mb-6 text-xl font-bold text-white">Project Workflows</h2>
          
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Planned Column */}
            <div className="flex flex-col rounded-lg border-2 border-blue-700/50 bg-blue-500/20 p-4">
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">📋 Planned <span className="text-sm text-gray-400 ml-auto">2</span></h3>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { id: "PRJ-2606", name: "North District Complex", client: "Bellway", date: "2026-03-15" },
                  { id: "PRJ-2607", name: "Shopping District", client: "Hammerson", date: "2026-04-01" },
                ].map(p => (
                  <div key={p.id} className="rounded-lg bg-gray-700/40 p-3 hover:bg-gray-700/60 cursor-move border border-gray-700/50">
                    <span className="text-xs font-semibold text-blue-400">{p.id}</span>
                    <h4 className="text-sm font-semibold text-white mt-1">{p.name}</h4>
                    <p className="text-xs text-gray-400 mt-2">{p.client}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress Column */}
            <div className="flex flex-col rounded-lg border-2 border-orange-700/50 bg-orange-500/20 p-4">
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">🔄 Active <span className="text-sm text-gray-400 ml-auto">4</span></h3>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { id: "PRJ-2501", name: "Thames Retail Park", progress: "68%" },
                  { id: "PRJ-2502", name: "Premier Mixed Use", progress: "52%", risk: "high" },
                  { id: "PRJ-2503", name: "Central Warehouse", progress: "85%" },
                  { id: "PRJ-2504", name: "Tech Campus Phase 1", progress: "91%" },
                ].map(p => (
                  <div key={p.id} className={`rounded-lg p-3 hover:bg-gray-700/60 cursor-move border border-gray-700/50 ${p.risk ? "bg-red-900/40" : "bg-gray-700/40"}`}>
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-xs font-semibold text-orange-400">{p.id}</span>
                      {p.risk && <span className="text-xs px-2 py-0.5 rounded bg-red-900/30 text-red-400">High</span>}
                    </div>
                    <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                    <div className="mt-2 text-xs text-gray-400">{p.progress}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Column */}
            <div className="flex flex-col rounded-lg border-2 border-purple-700/50 bg-purple-500/20 p-4">
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">👀 Review <span className="text-sm text-gray-400 ml-auto">2</span></h3>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { id: "PRJ-2505", name: "Riverside Park", progress: "98%" },
                  { id: "PRJ-2506", name: "Office Complex Tower B", progress: "95%" },
                ].map(p => (
                  <div key={p.id} className="rounded-lg bg-gray-700/40 p-3 hover:bg-gray-700/60 cursor-move border border-gray-700/50">
                    <span className="text-xs font-semibold text-purple-400">{p.id}</span>
                    <h4 className="text-sm font-semibold text-white mt-1">{p.name}</h4>
                    <div className="mt-2 text-xs text-gray-400">{p.progress}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Column */}
            <div className="flex flex-col rounded-lg border-2 border-green-700/50 bg-green-500/20 p-4">
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white flex items-center gap-2">✓ Done <span className="text-sm text-gray-400 ml-auto">3</span></h3>
              </div>
              <div className="space-y-3 flex-1">
                {[
                  { id: "PRJ-2601", name: "Market Square", date: "2026-01-20" },
                  { id: "PRJ-2602", name: "Industrial Estate Phase 2", date: "2026-01-15" },
                  { id: "PRJ-2603", name: "Residential Development A", date: "2026-01-10" },
                ].map(p => (
                  <div key={p.id} className="rounded-lg bg-gray-700/40 p-3 hover:bg-gray-700/60 cursor-move border border-gray-700/50">
                    <span className="text-xs font-semibold text-green-400">{p.id}</span>
                    <h4 className="text-sm font-semibold text-white mt-1">{p.name}</h4>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Workflow */}
      {activeWorkflow === "tasks" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="mb-6 text-xl font-bold text-white">Task Queue</h2>
          
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Backlog */}
            <div className="flex flex-col rounded-lg border-2 border-gray-700/50 bg-gray-700/30 p-4">
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white">Backlog <span className="text-xs text-gray-400 ml-2">12</span></h3>
              </div>
              <div className="space-y-2 flex-1 text-sm">
                <div className="p-2 rounded bg-gray-700/20 border border-gray-700/50 text-gray-300">Survey site boundaries</div>
                <div className="p-2 rounded bg-gray-700/20 border border-gray-700/50 text-gray-300">Obtain utility locates</div>
                <div className="p-2 rounded bg-gray-700/20 border border-gray-700/50 text-gray-300">Schedule subcontractor meeting</div>
                <div className="text-center text-xs text-gray-500 py-2">+ 9 more</div>
              </div>
            </div>

            {/* In Progress */}
            <div className="flex flex-col rounded-lg border-2 border-orange-700/50 bg-orange-500/20 p-4">
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white">In Progress <span className="text-xs text-gray-400 ml-2">7</span></h3>
              </div>
              <div className="space-y-2 flex-1">
                <div className="p-2 rounded bg-orange-900/30 border border-orange-700/50">
                  <p className="text-sm font-semibold text-white">Foundations inspection</p>
                  <p className="text-xs text-gray-300 mt-1">Sarah Mitchell - Due today</p>
                </div>
                <div className="p-2 rounded bg-orange-900/30 border border-orange-700/50">
                  <p className="text-sm font-semibold text-white">Safety induction training</p>
                  <p className="text-xs text-gray-300 mt-1">James Bradford - 2 days</p>
                </div>
                <div className="text-center text-xs text-gray-500 py-2">+ 5 more</div>
              </div>
            </div>

            {/* Done */}
            <div className="flex flex-col rounded-lg border-2 border-green-700/50 bg-green-500/20 p-4">
              <div className="mb-4 pb-4 border-b border-gray-700/50">
                <h3 className="font-bold text-white">Done <span className="text-xs text-gray-400 ml-2">18</span></h3>
              </div>
              <div className="space-y-2 flex-1 text-sm">
                <div className="p-2 rounded bg-gray-700/20 border border-gray-700/50 text-gray-300">✓ Planning approval received</div>
                <div className="p-2 rounded bg-gray-700/20 border border-gray-700/50 text-gray-300">✓ Site mobilization complete</div>
                <div className="p-2 rounded bg-gray-700/20 border border-gray-700/50 text-gray-300">✓ Equipment delivery confirmed</div>
                <div className="text-center text-xs text-gray-500 py-2">+ 15 more this week</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approvals Workflow */}
      {activeWorkflow === "approvals" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="mb-6 text-xl font-bold text-white">Approval Workflows</h2>
          
          <div className="space-y-4">
            {[
              { type: "Change Order", project: "Thames Retail Park", value: "£45,600", submitter: "Sarah Mitchell", status: "awaiting" },
              { type: "Variation Request", project: "Premier Mixed Use", value: "£22,300", submitter: "James Bradford", status: "awaiting" },
              { type: "Safety Report", project: "Central Warehouse", value: "—", submitter: "Emma Patel", status: "review" },
              { type: "Budget Adjustment", project: "Tech Campus", value: "£18,900", submitter: "Michael Chen", status: "approved" },
              { type: "Resource Request", project: "Operations", value: "6 staff", submitter: "David Johnson", status: "pending" },
              { type: "Site Closure Plan", project: "Riverside Park", value: "—", submitter: "Lisa Wong", status: "approved" },
              { type: "Contract Amendment", project: "Market Square", value: "£5,200", submitter: "Sarah Mitchell", status: "awaiting" },
              { type: "Insurance Claim", project: "Mixed Use", value: "£12,500", submitter: "James Bradford", status: "review" },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-lg border border-gray-700/50 ${
                  item.status === "awaiting" ? "bg-yellow-900/20 border-yellow-700/50" :
                  item.status === "review" ? "bg-orange-900/20 border-orange-700/50" :
                  "bg-green-900/20 border-green-700/50"
                }`}
              >
                <div>
                  <p className="font-semibold text-white">{item.type}</p>
                  <p className="text-sm text-gray-400">{item.project} • {item.value}</p>
                  <p className="text-xs text-gray-500 mt-1">Submitted by {item.submitter}</p>
                </div>
                <div className="flex gap-2">
                  {item.status === "awaiting" || item.status === "review" ? (
                    <>
                      <button className="px-3 py-1 rounded text-xs font-semibold bg-green-900/30 text-green-400 hover:bg-green-900/50">Approve</button>
                      <button className="px-3 py-1 rounded text-xs font-semibold bg-red-900/30 text-red-400 hover:bg-red-900/50">Reject</button>
                    </>
                  ) : (
                    <span className={`text-xs font-semibold px-3 py-1 rounded ${item.status === "approved" ? "bg-green-900/30 text-green-400" : "bg-blue-900/30 text-blue-400"}`}>
                      {item.status === "approved" ? "✓ Approved" : "Pending"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources Workflow */}
      {activeWorkflow === "resources" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="mb-6 text-xl font-bold text-white">Resource Allocation</h2>
          
          <div className="grid gap-6">
            {[
              { type: "Labour Headcount", available: 145, allocated: 134, utilisation: "92%", alert: false },
              { type: "Plant & Equipment", available: 87, allocated: 80, utilisation: "92%", alert: false },
              { type: "Sub-contractors", available: 23, allocated: 19, utilisation: "83%", alert: false },
            ].map(resource => (
              <div key={resource.type} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">{resource.type}</h3>
                  <span className={`text-lg font-bold ${resource.utilisation === "92%" ? "text-orange-400" : "text-green-400"}`}>
                    {resource.utilisation}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Allocated</span>
                    <span className="text-white font-semibold">{resource.allocated} / {resource.available}</span>
                  </div>
                  <div className="h-2 bg-gray-600/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400" 
                      style={{ width: `${(resource.allocated/resource.available)*100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Workflow */}
      {activeWorkflow === "schedule" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="mb-6 text-xl font-bold text-white">Project Schedule</h2>
          
          <div className="space-y-3">
            {[
              { name: "Thames Retail Park", start: "2025-04-01", end: "2026-06-15", progress: 68 },
              { name: "Premier Mixed Use", start: "2025-06-15", end: "2026-08-20", progress: 52 },
              { name: "Central Warehouse", start: "2025-10-01", end: "2026-04-01", progress: 85 },
              { name: "Tech Campus Phase 1", start: "2025-12-01", end: "2026-03-15", progress: 91 },
            ].map((proj, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-gray-700/30 border border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white">{proj.name}</p>
                  <p className="text-sm font-bold text-orange-400">{proj.progress}%</p>
                </div>
                <p className="text-xs text-gray-400 mb-3">{proj.start} → {proj.end}</p>
                <div className="h-6 bg-gray-600/50 rounded-lg overflow-hidden border border-gray-700/50 flex items-center">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400" 
                    style={{ width: `${proj.progress}%` }}
                  />
                  <span className="absolute text-xs font-bold text-white drop-shadow ml-2">{proj.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipment Workflow */}
      {activeWorkflow === "equipment" && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="mb-6 text-xl font-bold text-white">Equipment & Fleet</h2>
          
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              { type: "Vehicles", total: 28, available: 24, utilised: 86 },
              { type: "Plant/Equipment", total: 14, available: 11, utilised: 82 },
            ].map(category => (
              <div key={category.type} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-4">
                <h3 className="font-bold text-white mb-4">{category.type}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Total Assets</p>
                    <p className="text-2xl font-bold text-white">{category.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Available Now</p>
                    <p className="text-xl font-bold text-green-400">{category.available}</p>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-sm text-gray-400">Utilisation</p>
                      <p className="text-sm font-bold text-orange-400">{category.utilised}%</p>
                    </div>
                    <div className="h-2 bg-gray-600/50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500" 
                        style={{ width: `${category.utilised}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Won Job Detail Modal */}
      {selectedWin && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedWin(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedWin.client}</h3>
                <p className="text-sm text-gray-400">{selectedWin.projectName}</p>
              </div>
              <span className="rounded-full bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-400">
                New Win
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Project ID
                </p>
                <p className="mt-1 text-sm text-white">{selectedWin.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Estimate ID
                </p>
                <p className="mt-1 text-sm text-white">{selectedWin.estimateId}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Contract Value
                </p>
                <p className="mt-1 text-sm font-semibold text-green-400">
                  {selectedWin.value}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Status
                </p>
                <p className="mt-1 text-sm text-white">Ready for Mobilization</p>
              </div>
            </div>

            {selectedWin.notes && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Notes
                </p>
                <p className="mt-2 text-sm text-gray-300">{selectedWin.notes}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedWin(null)}
                className="flex-1 rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleMobilize(selectedWin.id, "Sarah Mitchell");
                  setSelectedWin(null);
                }}
                className="flex-1 rounded bg-orange-500 px-4 py-2 font-medium text-white hover:bg-orange-600 transition-colors"
              >
                Begin Mobilization →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
