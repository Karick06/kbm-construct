"use client";

import { useState } from "react";
import { formatDate } from "@/lib/date-utils";

type Task = {
  id: string;
  title: string;
  description: string;
  project: string;
  assignee: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  dueDate: string;
  status: "backlog" | "in-progress" | "done";
  tags: string[];
};

const taskData: Task[] = [
  // Backlog
  { id: "TSK-001", title: "Site Survey - North District", description: "Complete initial site survey and soil testing", project: "North District Complex", assignee: "James Mitchell", priority: "High", dueDate: "2026-02-20", status: "backlog", tags: ["Survey", "Site Prep"] },
  { id: "TSK-002", title: "Health & Safety Plan", description: "Develop comprehensive H&S plan for Shopping District", project: "Shopping District", assignee: "Sarah Chen", priority: "High", dueDate: "2026-02-22", status: "backlog", tags: ["H&S", "Planning"] },
  { id: "TSK-003", title: "Material Quote - Thames", description: "Request quotes for structural materials", project: "Thames Retail Park", assignee: "Tom Wilson", priority: "Medium", dueDate: "2026-02-25", status: "backlog", tags: ["Procurement", "Materials"] },
  { id: "TSK-004", title: "Subcontractor Meeting", description: "Coordinate M&E subcontractors for Premier project", project: "Premier Mixed Use", assignee: "Emma Davis", priority: "Medium", dueDate: "2026-02-28", status: "backlog", tags: ["Coordination", "Subcontractors"] },
  { id: "TSK-005", title: "Traffic Management Plan", description: "Submit TMP to local council", project: "Central Warehouse", assignee: "David Brown", priority: "Low", dueDate: "2026-03-01", status: "backlog", tags: ["Planning", "Logistics"] },
  { id: "TSK-006", title: "Insurance Review", description: "Annual insurance policy review and renewal", project: "General", assignee: "Linda Foster", priority: "Medium", dueDate: "2026-03-05", status: "backlog", tags: ["Admin", "Compliance"] },
  { id: "TSK-007", title: "Client Presentation Prep", description: "Prepare Q1 progress presentation for Bellway", project: "North District Complex", assignee: "Mark Thompson", priority: "Low", dueDate: "2026-03-08", status: "backlog", tags: ["Client Relations"] },
  { id: "TSK-008", title: "Equipment Calibration", description: "Schedule calibration for surveying equipment", project: "General", assignee: "Peter Grant", priority: "Low", dueDate: "2026-03-10", status: "backlog", tags: ["Equipment", "Maintenance"] },
  { id: "TSK-009", title: "Training Session - CSCS", description: "Organize CSCS training for 12 new operatives", project: "General", assignee: "Rachel Moore", priority: "Medium", dueDate: "2026-03-12", status: "backlog", tags: ["Training", "H&S"] },
  { id: "TSK-010", title: "Site Welfare Setup", description: "Install welfare facilities at Shopping District site", project: "Shopping District", assignee: "Andrew Clark", priority: "High", dueDate: "2026-02-26", status: "backlog", tags: ["Site Setup", "Welfare"] },
  { id: "TSK-011", title: "Design Coordination", description: "Review architectural drawings with design team", project: "Tech Campus", assignee: "Sophie Anderson", priority: "Medium", dueDate: "2026-03-03", status: "backlog", tags: ["Design", "Coordination"] },
  { id: "TSK-012", title: "Invoice Processing", description: "Process outstanding supplier invoices for January", project: "General", assignee: "Karen White", priority: "Medium", dueDate: "2026-02-18", status: "backlog", tags: ["Finance", "Admin"] },

  // In Progress
  { id: "TSK-013", title: "Foundation Works Inspection", description: "Inspect foundation works at Thames Retail Park", project: "Thames Retail Park", assignee: "James Mitchell", priority: "Urgent", dueDate: "2026-02-16", status: "in-progress", tags: ["Inspection", "Quality"] },
  { id: "TSK-014", title: "Concrete Pour Schedule", description: "Coordinate concrete pours for Central Warehouse", project: "Central Warehouse", assignee: "Tom Wilson", priority: "High", dueDate: "2026-02-17", status: "in-progress", tags: ["Scheduling", "Materials"] },
  { id: "TSK-015", title: "Change Order Review", description: "Review client change order for Premier project", project: "Premier Mixed Use", assignee: "Emma Davis", priority: "High", dueDate: "2026-02-17", status: "in-progress", tags: ["Variations", "Commercial"] },
  { id: "TSK-016", title: "Weekly Progress Report", description: "Compile weekly progress reports for all active projects", project: "General", assignee: "Sarah Chen", priority: "Medium", dueDate: "2026-02-16", status: "in-progress", tags: ["Reporting", "Admin"] },
  { id: "TSK-017", title: "Plant Request - Excavator", description: "Arrange excavator delivery for Tech Campus", project: "Tech Campus", assignee: "David Brown", priority: "High", dueDate: "2026-02-18", status: "in-progress", tags: ["Plant", "Logistics"] },
  { id: "TSK-018", title: "Safety Induction", description: "Conduct safety induction for 8 new site workers", project: "Thames Retail Park", assignee: "Rachel Moore", priority: "Urgent", dueDate: "2026-02-16", status: "in-progress", tags: ["H&S", "Induction"] },
  { id: "TSK-019", title: "Quality Audit", description: "Complete monthly quality audit for Riverside Park", project: "Riverside Park", assignee: "Mark Thompson", priority: "Medium", dueDate: "2026-02-19", status: "in-progress", tags: ["Quality", "Audit"] },

  // Done
  { id: "TSK-020", title: "Method Statement Approval", description: "Approve method statement for steelwork erection", project: "Office Complex Tower B", assignee: "James Mitchell", priority: "High", dueDate: "2026-02-14", status: "done", tags: ["Method Statement", "Approval"] },
  { id: "TSK-021", title: "Supplier Payment Run", description: "Process weekly supplier payments", project: "General", assignee: "Karen White", priority: "Medium", dueDate: "2026-02-13", status: "done", tags: ["Finance", "Payments"] },
  { id: "TSK-022", title: "Site Meeting Minutes", description: "Distribute minutes from Monday site meeting", project: "Thames Retail Park", assignee: "Sarah Chen", priority: "Low", dueDate: "2026-02-15", status: "done", tags: ["Admin", "Documentation"] },
  { id: "TSK-023", title: "Scaffolding Inspection", description: "Weekly scaffolding inspection at Central Warehouse", project: "Central Warehouse", assignee: "Peter Grant", priority: "High", dueDate: "2026-02-14", status: "done", tags: ["H&S", "Inspection"] },
  { id: "TSK-024", title: "Material Delivery Confirmation", description: "Confirm delivery of brickwork materials", project: "Premier Mixed Use", assignee: "Tom Wilson", priority: "Medium", dueDate: "2026-02-13", status: "done", tags: ["Materials", "Logistics"] },
  { id: "TSK-025", title: "Staff Appraisal - Site Managers", description: "Complete Q4 appraisals for 4 site managers", project: "General", assignee: "Linda Foster", priority: "Medium", dueDate: "2026-02-12", status: "done", tags: ["HR", "Admin"] },
  { id: "TSK-026", title: "Client Site Visit", description: "Host client site visit for Riverside Park", project: "Riverside Park", assignee: "Emma Davis", priority: "High", dueDate: "2026-02-14", status: "done", tags: ["Client Relations"] },
  { id: "TSK-027", title: "Environmental Compliance Report", description: "Submit monthly environmental report", project: "General", assignee: "Sophie Anderson", priority: "Medium", dueDate: "2026-02-12", status: "done", tags: ["Compliance", "Environment"] },
  { id: "TSK-028", title: "Tool Box Talk - Working at Height", description: "Deliver weekly tool box talk on working at height", project: "Tech Campus", assignee: "Rachel Moore", priority: "Medium", dueDate: "2026-02-15", status: "done", tags: ["H&S", "Training"] },
  { id: "TSK-029", title: "Handover Documentation", description: "Prepare handover pack for Market Square completion", project: "Market Square", assignee: "Mark Thompson", priority: "High", dueDate: "2026-02-11", status: "done", tags: ["Handover", "Documentation"] },
  { id: "TSK-030", title: "IT Support Request", description: "Resolve site office network connectivity issue", project: "General", assignee: "Andrew Clark", priority: "Low", dueDate: "2026-02-13", status: "done", tags: ["IT", "Support"] },
  { id: "TSK-031", title: "Monthly Plant Maintenance", description: "Complete monthly maintenance on 4 excavators", project: "General", assignee: "David Brown", priority: "Medium", dueDate: "2026-02-14", status: "done", tags: ["Plant", "Maintenance"] },
  { id: "TSK-032", title: "Budget Variance Report", description: "Analyze budget variance for January actuals", project: "General", assignee: "Karen White", priority: "Low", dueDate: "2026-02-15", status: "done", tags: ["Finance", "Reporting"] },
  { id: "TSK-033", title: "Subcontractor Performance Review", description: "Review M&E subcontractor performance on Office Complex", project: "Office Complex Tower B", assignee: "Emma Davis", priority: "Medium", dueDate: "2026-02-13", status: "done", tags: ["Subcontractors", "Review"] },
  { id: "TSK-034", title: "Risk Register Update", description: "Update project risk register for Premier Mixed Use", project: "Premier Mixed Use", assignee: "Sarah Chen", priority: "Medium", dueDate: "2026-02-12", status: "done", tags: ["Risk", "Documentation"] },
  { id: "TSK-035", title: "New Starter Onboarding", description: "Complete onboarding for 3 new site operatives", project: "General", assignee: "Linda Foster", priority: "High", dueDate: "2026-02-14", status: "done", tags: ["HR", "Onboarding"] },
  { id: "TSK-036", title: "Waste Management Audit", description: "Conduct waste management audit at Thames site", project: "Thames Retail Park", assignee: "Sophie Anderson", priority: "Low", dueDate: "2026-02-15", status: "done", tags: ["Environment", "Audit"] },
  { id: "TSK-037", title: "Holiday Request Processing", description: "Process 12 holiday requests for March", project: "General", assignee: "Linda Foster", priority: "Low", dueDate: "2026-02-14", status: "done", tags: ["HR", "Admin"] },
  { id: "TSK-038", title: "RAMS Submission", description: "Submit RAMS for enabling works at North District", project: "North District Complex", assignee: "James Mitchell", priority: "High", dueDate: "2026-02-13", status: "done", tags: ["H&S", "Documentation"] },
];

const tasksByStatus = {
  backlog: taskData.filter((t) => t.status === "backlog"),
  "in-progress": taskData.filter((t) => t.status === "in-progress"),
  done: taskData.filter((t) => t.status === "done"),
};

const priorityColors = {
  Low: "text-green-400",
  Medium: "text-yellow-400",
  High: "text-orange-400",
  Urgent: "text-red-400",
};

const priorityBgColors = {
  Low: "bg-green-500/20 border-green-500/30",
  Medium: "bg-yellow-500/20 border-yellow-500/30",
  High: "bg-orange-500/20 border-orange-500/30",
  Urgent: "bg-red-500/20 border-red-500/30",
};

export default function TasksPage() {
  const [view, setView] = useState<"board" | "list">("board");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tasks</h1>
          <p className="text-gray-400 mt-1">Task queue & assignments</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setView("board")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "board"
                ? "bg-orange-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            Board View
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "list"
                ? "bg-orange-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            List View
          </button>
          <button className="px-4 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors">
            + Add Task
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Backlog</p>
              <p className="text-3xl font-bold text-white mt-1">{tasksByStatus.backlog.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center text-2xl">
              📋
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-white mt-1">{tasksByStatus["in-progress"].length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center text-2xl">
              ⚙️
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Done</p>
              <p className="text-3xl font-bold text-white mt-1">{tasksByStatus.done.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>
      </div>

      {/* Board View */}
      {view === "board" && (
        <div className="grid grid-cols-3 gap-4">
          {/* Backlog Column */}
          <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4 min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Backlog</h3>
              <span className="text-sm text-gray-400">{tasksByStatus.backlog.length}</span>
            </div>
            <div className="space-y-3">
              {tasksByStatus.backlog.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 hover:border-gray-600/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">{task.id}</span>
                    <span className={`text-xs px-2 py-1 rounded border ${priorityBgColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-400 mb-3">{task.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{task.project}</span>
                    <span className="text-gray-400">{task.assignee}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                    <div className="flex gap-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-700/50 rounded text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Due: {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-gray-800/80 border border-orange-500/30 rounded-lg p-4 min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">In Progress</h3>
              <span className="text-sm text-gray-400">{tasksByStatus["in-progress"].length}</span>
            </div>
            <div className="space-y-3">
              {tasksByStatus["in-progress"].map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-4 hover:border-orange-500/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">{task.id}</span>
                    <span className={`text-xs px-2 py-1 rounded border ${priorityBgColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-400 mb-3">{task.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"
                        style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{task.project}</span>
                    <span className="text-gray-400">{task.assignee}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                    <div className="flex gap-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-700/50 rounded text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Due: {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Done Column */}
          <div className="bg-gray-800/80 border border-green-500/30 rounded-lg p-4 min-h-[600px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Done</h3>
              <span className="text-sm text-gray-400">{tasksByStatus.done.length}</span>
            </div>
            <div className="space-y-3">
              {tasksByStatus.done.map((task) => (
                <div
                  key={task.id}
                  className="bg-gray-900/50 border border-green-500/30 rounded-lg p-4 hover:border-green-500/50 transition-colors cursor-pointer opacity-75"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-gray-500 font-mono">{task.id}</span>
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400">
                      ✓ Done
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{task.title}</h4>
                  <p className="text-xs text-gray-400 mb-3">{task.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{task.project}</span>
                    <span className="text-gray-400">{task.assignee}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-700/50">
                    <div className="flex gap-1">
                      {task.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 bg-gray-700/50 rounded text-gray-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">Done: {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
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
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Task</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Project</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Assignee</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Priority</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Due Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {taskData.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono text-gray-400">{task.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">{task.project}</td>
                    <td className="px-4 py-3 text-sm text-gray-300">{task.assignee}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded border ${priorityBgColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {task.status === "backlog" && (
                        <span className="text-xs px-2 py-1 rounded bg-gray-500/20 border border-gray-500/30 text-gray-400">
                          Backlog
                        </span>
                      )}
                      {task.status === "in-progress" && (
                        <span className="text-xs px-2 py-1 rounded bg-orange-500/20 border border-orange-500/30 text-orange-400">
                          In Progress
                        </span>
                      )}
                      {task.status === "done" && (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400">
                          Done
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(task.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {task.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 bg-gray-700/50 rounded text-gray-300">
                            {tag}
                          </span>
                        ))}
                        {task.tags.length > 2 && (
                          <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded text-gray-300">
                            +{task.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
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
