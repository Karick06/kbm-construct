"use client";

import { useState } from "react";

type Resource = {
  id: string;
  name: string;
  type: "Labour" | "Plant" | "Equipment" | "Subcontractor";
  role?: string;
  company?: string;
  currentProject: string;
  allocatedUntil: string;
  utilization: number;
  cost: string;
  status: "available" | "allocated" | "unavailable";
  skills?: string[];
};

const resourceData: Resource[] = [
  // Labour
  { id: "LAB-001", name: "James Mitchell", type: "Labour", role: "Site Manager", currentProject: "Thames Retail Park", allocatedUntil: "2026-04-30", utilization: 100, cost: "£850/day", status: "allocated", skills: ["CSCS", "SMSTS", "First Aid"] },
  { id: "LAB-002", name: "Sarah Chen", type: "Labour", role: "Site Engineer", currentProject: "Premier Mixed Use", allocatedUntil: "2026-05-15", utilization: 95, cost: "£650/day", status: "allocated", skills: ["CSCS", "AutoCAD", "Setting Out"] },
  { id: "LAB-003", name: "Tom Wilson", type: "Labour", role: "Quantity Surveyor", currentProject: "Central Warehouse", allocatedUntil: "2026-03-20", utilization: 80, cost: "£700/day", status: "allocated", skills: ["RICS", "CostX", "NEC"] },
  { id: "LAB-004", name: "Emma Davis", type: "Labour", role: "Site Manager", currentProject: "Office Complex Tower B", allocatedUntil: "2026-06-30", utilization: 100, cost: "£850/day", status: "allocated", skills: ["CSCS", "SMSTS", "CDM"] },
  { id: "LAB-005", name: "David Brown", type: "Labour", role: "Plant Manager", currentProject: "Tech Campus", allocatedUntil: "2026-04-10", utilization: 90, cost: "£600/day", status: "allocated", skills: ["CPCS", "Plant Ops", "Slinger"] },
  { id: "LAB-006", name: "Rachel Moore", type: "Labour", role: "H&S Advisor", currentProject: "Unassigned", allocatedUntil: "-", utilization: 0, cost: "£550/day", status: "available", skills: ["NEBOSH", "IOSH", "CDM"] },
  { id: "LAB-007", name: "Mark Thompson", type: "Labour", role: "Site Manager", currentProject: "Riverside Park", allocatedUntil: "2026-03-31", utilization: 100, cost: "£850/day", status: "allocated", skills: ["CSCS", "SMSTS", "Lean"] },
  { id: "LAB-008", name: "Sophie Anderson", type: "Labour", role: "Design Coordinator", currentProject: "Unassigned", allocatedUntil: "-", utilization: 0, cost: "£650/day", status: "available", skills: ["AutoCAD", "Revit", "BIM"] },
  { id: "LAB-009", name: "Peter Grant", type: "Labour", role: "General Foreman", currentProject: "Thames Retail Park", allocatedUntil: "2026-04-25", utilization: 100, cost: "£500/day", status: "allocated", skills: ["CSCS", "Scaffolding", "Carpentry"] },
  { id: "LAB-010", name: "Linda Foster", type: "Labour", role: "HR Manager", currentProject: "Sick Leave", allocatedUntil: "2026-02-28", utilization: 0, cost: "£600/day", status: "unavailable", skills: ["CIPD", "Payroll"] },
  { id: "LAB-011", name: "Andrew Clark", type: "Labour", role: "Site Engineer", currentProject: "Unassigned", allocatedUntil: "-", utilization: 0, cost: "£650/day", status: "available", skills: ["CSCS", "Setting Out", "Surveying"] },
  { id: "LAB-012", name: "Karen White", type: "Labour", role: "Finance Manager", currentProject: "Premier Mixed Use", allocatedUntil: "2026-05-30", utilization: 70, cost: "£700/day", status: "allocated", skills: ["ACCA", "Sage", "Excel"] },

  // Plant
  { id: "PLT-001", name: "360° Excavator - 13T", type: "Plant", currentProject: "Tech Campus", allocatedUntil: "2026-03-15", utilization: 95, cost: "£280/day", status: "allocated" },
  { id: "PLT-002", name: "360° Excavator - 20T", type: "Plant", currentProject: "Thames Retail Park", allocatedUntil: "2026-03-10", utilization: 100, cost: "£350/day", status: "allocated" },
  { id: "PLT-003", name: "Dumper - 6T", type: "Plant", currentProject: "Central Warehouse", allocatedUntil: "2026-02-28", utilization: 85, cost: "£120/day", status: "allocated" },
  { id: "PLT-004", name: "Telehandler - 17m", type: "Plant", currentProject: "Unassigned", allocatedUntil: "-", utilization: 0, cost: "£180/day", status: "available" },
  { id: "PLT-005", name: "Tower Crane - 50m", type: "Plant", currentProject: "Office Complex Tower B", allocatedUntil: "2026-06-30", utilization: 100, cost: "£1,200/day", status: "allocated" },
  { id: "PLT-006", name: "Mobile Crane - 100T", type: "Plant", currentProject: "Maintenance", allocatedUntil: "2026-02-20", utilization: 0, cost: "£850/day", status: "unavailable" },
  { id: "PLT-007", name: "Compressor - 400CFM", type: "Plant", currentProject: "Thames Retail Park", allocatedUntil: "2026-03-25", utilization: 90, cost: "£95/day", status: "allocated" },
  { id: "PLT-008", name: "Generator - 100kVA", type: "Plant", currentProject: "Shopping District", allocatedUntil: "2026-04-15", utilization: 80, cost: "£150/day", status: "allocated" },
  { id: "PLT-009", name: "Scaffolding Package", type: "Equipment", currentProject: "Premier Mixed Use", allocatedUntil: "2026-05-30", utilization: 100, cost: "£3,500/month", status: "allocated" },
  { id: "PLT-010", name: "Site Welfare Unit", type: "Equipment", currentProject: "Unassigned", allocatedUntil: "-", utilization: 0, cost: "£180/week", status: "available" },

  // Subcontractors
  { id: "SUB-001", name: "JB Electrical Ltd", type: "Subcontractor", company: "JB Electrical Ltd", currentProject: "Thames Retail Park", allocatedUntil: "2026-04-20", utilization: 100, cost: "£285k", status: "allocated" },
  { id: "SUB-002", name: "Apex Groundworks", type: "Subcontractor", company: "Apex Groundworks", currentProject: "North District Complex", allocatedUntil: "2026-03-30", utilization: 90, cost: "£185k", status: "allocated" },
  { id: "SUB-003", name: "Delta M&E Services", type: "Subcontractor", company: "Delta M&E Services", currentProject: "Office Complex Tower B", allocatedUntil: "2026-06-15", utilization: 95, cost: "£420k", status: "allocated" },
  { id: "SUB-004", name: "Precision Facades", type: "Subcontractor", company: "Precision Facades", currentProject: "Unassigned", allocatedUntil: "-", utilization: 0, cost: "TBD", status: "available" },
  { id: "SUB-005", name: "ProSteel Fabrication", type: "Subcontractor", company: "ProSteel Fabrication", currentProject: "Central Warehouse", allocatedUntil: "2026-03-25", utilization: 100, cost: "£165k", status: "allocated" },
  { id: "SUB-006", name: "Elite Roofing", type: "Subcontractor", company: "Elite Roofing", currentProject: "Premier Mixed Use", allocatedUntil: "2026-04-30", utilization: 85, cost: "£95k", status: "allocated" },
];

const resourcesByType = {
  Labour: resourceData.filter((r) => r.type === "Labour"),
  Plant: resourceData.filter((r) => r.type === "Plant"),
  Equipment: resourceData.filter((r) => r.type === "Equipment"),
  Subcontractor: resourceData.filter((r) => r.type === "Subcontractor"),
};

const resourcesByStatus = {
  available: resourceData.filter((r) => r.status === "available"),
  allocated: resourceData.filter((r) => r.status === "allocated"),
  unavailable: resourceData.filter((r) => r.status === "unavailable"),
};

const statusColors = {
  available: "bg-green-500/20 border-green-500/30 text-green-400",
  allocated: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  unavailable: "bg-red-500/20 border-red-500/30 text-red-400",
};

const typeColors = {
  Labour: "bg-blue-500/20 text-blue-400",
  Plant: "bg-orange-500/20 text-orange-400",
  Equipment: "bg-purple-500/20 text-purple-400",
  Subcontractor: "bg-green-500/20 text-green-400",
};

export default function ResourcesPage() {
  const [view, setView] = useState<"all" | "available">("all");
  const [filterType, setFilterType] = useState<"All" | "Labour" | "Plant" | "Equipment" | "Subcontractor">("All");

  const displayData = resourceData.filter((r) => {
    const statusMatch = view === "all" || r.status === "available";
    const typeMatch = filterType === "All" || r.type === filterType;
    return statusMatch && typeMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Resources</h1>
          <p className="text-gray-400 mt-1">Resource allocation & capacity planning</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700/50 font-medium focus:outline-none focus:border-green-500/50"
          >
            <option value="All">All Types</option>
            <option value="Labour">Labour</option>
            <option value="Plant">Plant</option>
            <option value="Equipment">Equipment</option>
            <option value="Subcontractor">Subcontractors</option>
          </select>
          <button
            onClick={() => setView("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "all"
                ? "bg-green-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            All Resources
          </button>
          <button
            onClick={() => setView("available")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "available"
                ? "bg-green-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            Available Only
          </button>
          <button className="px-4 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">
            + Add Resource
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Resources</p>
              <p className="text-3xl font-bold text-white mt-1">{resourceData.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center text-2xl">
              📊
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available</p>
              <p className="text-3xl font-bold text-white mt-1">{resourcesByStatus.available.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Allocated</p>
              <p className="text-3xl font-bold text-white mt-1">{resourcesByStatus.allocated.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">
              📌
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Utilization</p>
              <p className="text-3xl font-bold text-white mt-1">
                {Math.round(resourceData.reduce((acc, r) => acc + r.utilization, 0) / resourceData.length)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center text-2xl">
              📈
            </div>
          </div>
        </div>
      </div>

      {/* Resources by Type */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/80 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Labour</span>
            <span className="text-2xl">👷</span>
          </div>
          <p className="text-2xl font-bold text-white">{resourcesByType.Labour.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {resourcesByType.Labour.filter((r) => r.status === "available").length} available
          </p>
        </div>

        <div className="bg-gray-800/80 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Plant</span>
            <span className="text-2xl">🚜</span>
          </div>
          <p className="text-2xl font-bold text-white">{resourcesByType.Plant.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {resourcesByType.Plant.filter((r) => r.status === "available").length} available
          </p>
        </div>

        <div className="bg-gray-800/80 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Equipment</span>
            <span className="text-2xl">🔧</span>
          </div>
          <p className="text-2xl font-bold text-white">{resourcesByType.Equipment.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {resourcesByType.Equipment.filter((r) => r.status === "available").length} available
          </p>
        </div>

        <div className="bg-gray-800/80 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Subcontractors</span>
            <span className="text-2xl">🏢</span>
          </div>
          <p className="text-2xl font-bold text-white">{resourcesByType.Subcontractor.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {resourcesByType.Subcontractor.filter((r) => r.status === "available").length} available
          </p>
        </div>
      </div>

      {/* Resources Table */}
      <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Resource</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Current Project</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Allocated Until</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Utilization</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Cost</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {displayData.map((resource) => (
                <tr key={resource.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-400">{resource.id}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{resource.name}</p>
                      {resource.role && <p className="text-xs text-gray-400">{resource.role}</p>}
                      {resource.company && <p className="text-xs text-gray-400">{resource.company}</p>}
                      {resource.skills && (
                        <div className="flex gap-1 mt-1">
                          {resource.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="text-xs px-1.5 py-0.5 bg-gray-700/50 rounded text-gray-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${typeColors[resource.type]}`}>
                      {resource.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{resource.currentProject}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{resource.allocatedUntil}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden min-w-[60px]">
                        <div
                          className={`h-full rounded-full ${
                            resource.utilization >= 90
                              ? "bg-gradient-to-r from-orange-500 to-red-500"
                              : resource.utilization >= 70
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                              : "bg-gradient-to-r from-green-500 to-green-400"
                          }`}
                          style={{ width: `${resource.utilization}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 min-w-[35px]">{resource.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 font-medium">{resource.cost}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[resource.status]}`}>
                      {resource.status === "available" && "Available"}
                      {resource.status === "allocated" && "Allocated"}
                      {resource.status === "unavailable" && "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-xs px-3 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors">
                      Allocate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
