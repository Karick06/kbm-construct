"use client";

import { useState } from "react";
import { formatDate } from "@/lib/date-utils";

type ScheduleItem = {
  id: string;
  project: string;
  projectId: string;
  phase: string;
  startDate: string;
  endDate: string;
  duration: number; // in days
  progress: number; // 0-100
  status: "not-started" | "in-progress" | "completed" | "delayed";
  dependencies?: string[];
  assignedTo: string;
  milestones?: { date: string; name: string }[];
};

const scheduleData: ScheduleItem[] = [
  // Thames Retail Park
  { id: "SCH-001", project: "Thames Retail Park", projectId: "PRJ-003", phase: "Foundation Works", startDate: "2026-01-15", endDate: "2026-02-28", duration: 44, progress: 85, status: "in-progress", assignedTo: "James Mitchell", milestones: [{ date: "2026-02-20", name: "Slab Complete" }] },
  { id: "SCH-002", project: "Thames Retail Park", projectId: "PRJ-003", phase: "Structural Frame", startDate: "2026-02-25", endDate: "2026-04-20", duration: 54, progress: 15, status: "in-progress", dependencies: ["SCH-001"], assignedTo: "James Mitchell" },
  { id: "SCH-003", project: "Thames Retail Park", projectId: "PRJ-003", phase: "M&E First Fix", startDate: "2026-04-10", endDate: "2026-05-30", duration: 50, progress: 0, status: "not-started", dependencies: ["SCH-002"], assignedTo: "James Mitchell" },
  
  // Premier Mixed Use
  { id: "SCH-004", project: "Premier Mixed Use", projectId: "PRJ-004", phase: "Enabling Works", startDate: "2026-01-05", endDate: "2026-02-15", duration: 41, progress: 95, status: "in-progress", assignedTo: "Emma Davis", milestones: [{ date: "2026-02-10", name: "Site Clearance Done" }] },
  { id: "SCH-005", project: "Premier Mixed Use", projectId: "PRJ-004", phase: "Basement Construction", startDate: "2026-02-10", endDate: "2026-04-05", duration: 54, progress: 42, status: "in-progress", dependencies: ["SCH-004"], assignedTo: "Emma Davis" },
  { id: "SCH-006", project: "Premier Mixed Use", projectId: "PRJ-004", phase: "Superstructure", startDate: "2026-04-01", endDate: "2026-07-15", duration: 105, progress: 0, status: "not-started", dependencies: ["SCH-005"], assignedTo: "Emma Davis" },
  
  // Central Warehouse
  { id: "SCH-007", project: "Central Warehouse", projectId: "PRJ-005", phase: "Ground Works", startDate: "2026-01-10", endDate: "2026-02-20", duration: 41, progress: 100, status: "completed", assignedTo: "David Brown", milestones: [{ date: "2026-02-15", name: "Foundations Complete" }] },
  { id: "SCH-008", project: "Central Warehouse", projectId: "PRJ-005", phase: "Steel Frame Erection", startDate: "2026-02-18", endDate: "2026-03-25", duration: 35, progress: 78, status: "in-progress", dependencies: ["SCH-007"], assignedTo: "David Brown" },
  { id: "SCH-009", project: "Central Warehouse", projectId: "PRJ-005", phase: "Cladding & Roofing", startDate: "2026-03-20", endDate: "2026-05-10", duration: 51, progress: 0, status: "not-started", dependencies: ["SCH-008"], assignedTo: "David Brown" },
  
  // Tech Campus
  { id: "SCH-010", project: "Tech Campus", projectId: "PRJ-006", phase: "Piling Works", startDate: "2026-01-08", endDate: "2026-02-10", duration: 33, progress: 100, status: "completed", assignedTo: "Tom Wilson", milestones: [{ date: "2026-02-08", name: "Piling Complete" }] },
  { id: "SCH-011", project: "Tech Campus", projectId: "PRJ-006", phase: "Ground Floor Slab", startDate: "2026-02-12", endDate: "2026-03-05", duration: 21, progress: 88, status: "in-progress", dependencies: ["SCH-010"], assignedTo: "Tom Wilson" },
  { id: "SCH-012", project: "Tech Campus", projectId: "PRJ-006", phase: "RC Frame - Levels 1-3", startDate: "2026-03-01", endDate: "2026-04-25", duration: 55, progress: 5, status: "in-progress", dependencies: ["SCH-011"], assignedTo: "Tom Wilson" },
  
  // Office Complex Tower B
  { id: "SCH-013", project: "Office Complex Tower B", projectId: "PRJ-007", phase: "Tower Structure", startDate: "2025-11-01", endDate: "2026-02-28", duration: 119, progress: 98, status: "in-progress", assignedTo: "Mark Thompson", milestones: [{ date: "2026-02-25", name: "Top Out" }] },
  { id: "SCH-014", project: "Office Complex Tower B", projectId: "PRJ-007", phase: "Facade Installation", startDate: "2026-01-15", endDate: "2026-04-15", duration: 90, progress: 55, status: "in-progress", dependencies: ["SCH-013"], assignedTo: "Mark Thompson" },
  { id: "SCH-015", project: "Office Complex Tower B", projectId: "PRJ-007", phase: "M&E Installation", startDate: "2026-02-01", endDate: "2026-05-30", duration: 118, progress: 35, status: "in-progress", dependencies: ["SCH-013"], assignedTo: "Mark Thompson" },
  
  // Riverside Park
  { id: "SCH-016", project: "Riverside Park", projectId: "PRJ-008", phase: "Internal Fit-Out", startDate: "2026-01-10", endDate: "2026-03-15", duration: 64, progress: 92, status: "in-progress", assignedTo: "Sarah Chen", milestones: [{ date: "2026-03-10", name: "Fit-Out Complete" }] },
  { id: "SCH-017", project: "Riverside Park", projectId: "PRJ-008", phase: "Snagging & Commissioning", startDate: "2026-03-10", endDate: "2026-03-31", duration: 21, progress: 40, status: "in-progress", dependencies: ["SCH-016"], assignedTo: "Sarah Chen" },
  
  // North District Complex
  { id: "SCH-018", project: "North District Complex", projectId: "PRJ-001", phase: "Site Mobilisation", startDate: "2026-02-20", endDate: "2026-03-10", duration: 18, progress: 0, status: "not-started", assignedTo: "Andrew Clark" },
  { id: "SCH-019", project: "North District Complex", projectId: "PRJ-001", phase: "Site Investigation", startDate: "2026-03-05", endDate: "2026-03-25", duration: 20, progress: 0, status: "not-started", dependencies: ["SCH-018"], assignedTo: "Andrew Clark" },
  
  // Shopping District
  { id: "SCH-020", project: "Shopping District", projectId: "PRJ-002", phase: "Planning & Design", startDate: "2026-02-15", endDate: "2026-04-30", duration: 74, progress: 0, status: "not-started", assignedTo: "Sophie Anderson" },
];

const statusColors = {
  "not-started": "bg-gray-500/20 border-gray-500/30 text-gray-400",
  "in-progress": "bg-orange-500/20 border-orange-500/30 text-orange-400",
  "completed": "bg-green-500/20 border-green-500/30 text-green-400",
  "delayed": "bg-red-500/20 border-red-500/30 text-red-400",
};

const statusBars = {
  "not-started": "from-gray-500 to-gray-400",
  "in-progress": "from-orange-500 to-orange-400",
  "completed": "from-green-500 to-green-400",
  "delayed": "from-red-500 to-red-400",
};

export default function SchedulePage() {
  const [view, setView] = useState<"timeline" | "list">("timeline");
  const [filterProject, setFilterProject] = useState<string>("All");

  const uniqueProjects = Array.from(new Set(scheduleData.map((s) => s.project)));
  const displayData = filterProject === "All" 
    ? scheduleData 
    : scheduleData.filter((s) => s.project === filterProject);

  // Group by project for timeline view
  const groupedByProject = displayData.reduce((acc, item) => {
    if (!acc[item.project]) acc[item.project] = [];
    acc[item.project].push(item);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  // Calculate date range for timeline
  const allDates = scheduleData.map((s) => [new Date(s.startDate).getTime(), new Date(s.endDate).getTime()]).flat();
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const timelineSpan = maxDate.getTime() - minDate.getTime();

  const getPositionAndWidth = (item: ScheduleItem) => {
    const start = new Date(item.startDate).getTime();
    const end = new Date(item.endDate).getTime();
    const left = ((start - minDate.getTime()) / timelineSpan) * 100;
    const width = ((end - start) / timelineSpan) * 100;
    return { left: `${left}%`, width: `${width}%` };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex gap-3">
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-4 py-2 rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700/50 font-medium focus:outline-none focus:border-purple-500/50"
          >
            <option value="All">All Projects</option>
            {uniqueProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
          <button
            onClick={() => setView("timeline")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "timeline"
                ? "bg-purple-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "list"
                ? "bg-purple-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Phases</p>
              <p className="text-3xl font-bold text-white mt-1">{scheduleData.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center text-2xl">
              📊
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-white mt-1">
                {scheduleData.filter((s) => s.status === "in-progress").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center text-2xl">
              ⚙️
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-3xl font-bold text-white mt-1">
                {scheduleData.filter((s) => s.status === "completed").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Progress</p>
              <p className="text-3xl font-bold text-white mt-1">
                {Math.round(scheduleData.reduce((acc, s) => acc + s.progress, 0) / scheduleData.length)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-2xl">
              📈
            </div>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      {view === "timeline" && (
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Gantt Chart</h3>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{minDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
              <span>→</span>
              <span>{maxDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
            </div>
          </div>

          {/* Timeline Header - Month markers */}
          <div className="relative h-8 border-b border-gray-700/50 mb-4">
            <div className="absolute inset-0 flex">
              {Array.from({ length: 7 }, (_, i) => {
                const date = new Date(minDate);
                date.setMonth(date.getMonth() + i);
                return (
                  <div key={i} className="flex-1 text-xs text-gray-500 text-center border-l border-gray-700/30">
                    {date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Items by Project */}
          <div className="space-y-6">
            {Object.entries(groupedByProject).map(([project, items]) => (
              <div key={project} className="space-y-2">
                <h4 className="text-sm font-semibold text-white mb-3">{project}</h4>
                {items.map((item) => {
                  const { left, width } = getPositionAndWidth(item);
                  return (
                    <div key={item.id} className="relative h-16">
                      <div className="absolute left-0 top-0 w-48 pr-4">
                        <p className="text-xs font-medium text-white truncate">{item.phase}</p>
                        <p className="text-xs text-gray-500">{item.assignedTo}</p>
                      </div>
                      <div className="absolute left-48 right-0 top-0 h-full">
                        <div className="relative h-full">
                          <div
                            className="absolute top-2 h-10 bg-gray-900/50 border rounded transition-all hover:scale-105 cursor-pointer group"
                            style={{ left, width, borderColor: item.status === "in-progress" ? "#f97316" : item.status === "completed" ? "#22c55e" : "#6b7280" }}
                          >
                            <div className="h-full flex items-center justify-between px-3">
                              <span className="text-xs font-medium text-white">{item.phase}</span>
                              <span className="text-xs text-gray-400">{item.progress}%</span>
                            </div>
                            {/* Progress bar inside */}
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 rounded-b">
                              <div
                                className={`h-full bg-gradient-to-r ${statusBars[item.status]} rounded-b`}
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            {/* Tooltip on hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl whitespace-nowrap">
                                <p className="text-xs font-semibold text-white mb-1">{item.phase}</p>
                                <p className="text-xs text-gray-400">
                                  {formatDate(item.startDate)} → {formatDate(item.endDate)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{item.duration} days</p>
                                <p className="text-xs text-gray-400">Progress: {item.progress}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900/50 border-b border-gray-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">ID</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Project</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Phase</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Start Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">End Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Duration</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Progress</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {displayData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-400">{item.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{item.project}</td>
                    <td className="px-4 py-3 text-sm font-medium text-white">{item.phase}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{formatDate(item.startDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{formatDate(item.endDate)}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{item.duration} days</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden min-w-[60px]">
                          <div
                            className={`h-full bg-gradient-to-r ${statusBars[item.status]} rounded-full`}
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 min-w-[35px]">{item.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded border ${statusColors[item.status]}`}>
                        {item.status.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{item.assignedTo}</td>
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

