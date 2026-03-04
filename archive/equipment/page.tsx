"use client";

import { useState } from "react";

type Equipment = {
  id: string;
  name: string;
  type: "Vehicle" | "Plant" | "Tool";
  category: string;
  manufacturer: string;
  model: string;
  registrationOrSerial: string;
  currentLocation: string;
  allocatedTo?: string;
  status: "available" | "in-use" | "maintenance" | "broken";
  utilization: number;
  dailyRate: string;
  nextMaintenance: string;
  lastInspection: string;
  value: string;
};

const equipmentData: Equipment[] = [
  // Vehicles
  { id: "VEH-001", name: "Transit Van 1", type: "Vehicle", category: "Light Commercial", manufacturer: "Ford", model: "Transit Custom", registrationOrSerial: "YT68 KLM", currentLocation: "Thames Retail Park", allocatedTo: "James Mitchell", status: "in-use", utilization: 92, dailyRate: "£85/day", nextMaintenance: "2026-03-15", lastInspection: "2026-01-10", value: "£28,500" },
  { id: "VEH-002", name: "Transit Van 2", type: "Vehicle", category: "Light Commercial", manufacturer: "Ford", model: "Transit Custom", registrationOrSerial: "YT68 PLR", currentLocation: "Premier Mixed Use", allocatedTo: "Emma Davis", status: "in-use", utilization: 88, dailyRate: "£85/day", nextMaintenance: "2026-03-20", lastInspection: "2026-01-12", value: "£28,500" },
  { id: "VEH-003", name: "Transit Van 3", type: "Vehicle", category: "Light Commercial", manufacturer: "Ford", model: "Transit Custom", registrationOrSerial: "YR69 MNB", currentLocation: "Depot", status: "available", utilization: 0, dailyRate: "£85/day", nextMaintenance: "2026-04-01", lastInspection: "2026-01-15", value: "£27,800" },
  { id: "VEH-004", name: "Tipper Truck", type: "Vehicle", category: "Heavy Goods", manufacturer: "DAF", model: "CF 8x4", registrationOrSerial: "YP17 XRT", currentLocation: "Central Warehouse", allocatedTo: "David Brown", status: "in-use", utilization: 95, dailyRate: "£180/day", nextMaintenance: "2026-02-28", lastInspection: "2026-01-20", value: "£85,000" },
  { id: "VEH-005", name: "Pickup Truck", type: "Vehicle", category: "4x4", manufacturer: "Ford", model: "Ranger", registrationOrSerial: "YM19 QWE", currentLocation: "Workshop", status: "maintenance", utilization: 0, dailyRate: "£95/day", nextMaintenance: "2026-02-25", lastInspection: "2026-01-08", value: "£32,000" },
  { id: "VEH-006", name: "Sedan 1", type: "Vehicle", category: "Car", manufacturer: "Vauxhall", model: "Insignia", registrationOrSerial: "YN20 FGH", currentLocation: "Office Complex Tower B", allocatedTo: "Mark Thompson", status: "in-use", utilization: 75, dailyRate: "£55/day", nextMaintenance: "2026-04-10", lastInspection: "2026-01-18", value: "£22,000" },
  { id: "VEH-007", name: "Van - Specialist", type: "Vehicle", category: "Specialist", manufacturer: "Mercedes", model: "Sprinter", registrationOrSerial: "YL21 TYU", currentLocation: "Tech Campus", allocatedTo: "Tom Wilson", status: "in-use", utilization: 82, dailyRate: "£120/day", nextMaintenance: "2026-03-25", lastInspection: "2026-01-22", value: "£42,000" },

  // Plant
  { id: "PLT-001", name: "360° Excavator - 13T", type: "Plant", category: "Excavator", manufacturer: "JCB", model: "JS131", registrationOrSerial: "JSN8472", currentLocation: "Tech Campus", allocatedTo: "David Brown", status: "in-use", utilization: 95, dailyRate: "£280/day", nextMaintenance: "2026-03-15", lastInspection: "2026-02-01", value: "£78,000" },
  { id: "PLT-002", name: "360° Excavator - 20T", type: "Plant", category: "Excavator", manufacturer: "Caterpillar", model: "320", registrationOrSerial: "CAT15429", currentLocation: "Thames Retail Park", allocatedTo: "James Mitchell", status: "in-use", utilization: 100, dailyRate: "£350/day", nextMaintenance: "2026-03-10", lastInspection: "2026-01-28", value: "£115,000" },
  { id: "PLT-003", name: "Mini Excavator - 3T", type: "Plant", category: "Excavator", manufacturer: "Kubota", model: "KX037-4", registrationOrSerial: "KB9438", currentLocation: "Riverside Park", allocatedTo: "Sarah Chen", status: "in-use", utilization: 78, dailyRate: "£160/day", nextMaintenance: "2026-04-05", lastInspection: "2026-02-05", value: "£32,000" },
  { id: "PLT-004", name: "Dumper - 6T", type: "Plant", category: "Dumper", manufacturer: "Thwaites", model: "6T Swivel", registrationOrSerial: "TW7523", currentLocation: "Central Warehouse", allocatedTo: "David Brown", status: "in-use", utilization: 85, dailyRate: "£120/day", nextMaintenance: "2026-02-28", lastInspection: "2026-02-02", value: "£24,000" },
  { id: "PLT-005", name: "Telehandler - 17m", type: "Plant", category: "Telehandler", manufacturer: "JCB", model: "540-170", registrationOrSerial: "JCB9821", currentLocation: "Depot", status: "available", utilization: 0, dailyRate: "£180/day", nextMaintenance: "2026-04-15", lastInspection: "2026-02-10", value: "£62,000" },
  { id: "PLT-006", name: "Tower Crane - 50m", type: "Plant", category: "Crane", manufacturer: "Liebherr", model: "63K", registrationOrSerial: "LR4829", currentLocation: "Office Complex Tower B", allocatedTo: "Mark Thompson", status: "in-use", utilization: 100, dailyRate: "£1,200/day", nextMaintenance: "2026-06-30", lastInspection: "2026-01-15", value: "£425,000" },
  { id: "PLT-007", name: "Mobile Crane - 100T", type: "Plant", category: "Crane", manufacturer: "Liebherr", model: "LTM 1100-4.2", registrationOrSerial: "LR9384", currentLocation: "Workshop", status: "maintenance", utilization: 0, dailyRate: "£850/day", nextMaintenance: "2026-02-20", lastInspection: "2026-01-25", value: "£680,000" },
  { id: "PLT-008", name: "Compressor - 400CFM", type: "Plant", category: "Compressor", manufacturer: "Atlas Copco", model: "XAHS 447", registrationOrSerial: "AC8472", currentLocation: "Thames Retail Park", allocatedTo: "James Mitchell", status: "in-use", utilization: 90, dailyRate: "£95/day", nextMaintenance: "2026-03-25", lastInspection: "2026-02-08", value: "£18,000" },
  { id: "PLT-009", name: "Generator - 100kVA", type: "Plant", category: "Generator", manufacturer: "Perkins", model: "100kVA", registrationOrSerial: "PK7259", currentLocation: "Shopping District", allocatedTo: "Sophie Anderson", status: "in-use", utilization: 80, dailyRate: "£150/day", nextMaintenance: "2026-04-15", lastInspection: "2026-02-12", value: "£22,000" },
  { id: "PLT-010", name: "Roller - 8T", type: "Plant", category: "Roller", manufacturer: "Bomag", model: "BW 213", registrationOrSerial: "BG5821", currentLocation: "Depot", status: "available", utilization: 0, dailyRate: "£145/day", nextMaintenance: "2026-03-30", lastInspection: "2026-02-01", value: "£38,000" },

  // Tools & Equipment
  { id: "TL-001", name: "Scaffolding Package - Full", type: "Tool", category: "Scaffolding", manufacturer: "Layher", model: "Allround", registrationOrSerial: "LAY-PKG-001", currentLocation: "Premier Mixed Use", allocatedTo: "Emma Davis", status: "in-use", utilization: 100, dailyRate: "£3,500/month", nextMaintenance: "2026-05-30", lastInspection: "2026-01-15", value: "£85,000" },
  { id: "TL-002", name: "Scaffolding Package - Medium", type: "Tool", category: "Scaffolding", manufacturer: "Layher", model: "Allround", registrationOrSerial: "LAY-PKG-002", currentLocation: "Depot", status: "available", utilization: 0, dailyRate: "£2,200/month", nextMaintenance: "2026-06-15", lastInspection: "2026-01-20", value: "£52,000" },
  { id: "TL-003", name: "Site Welfare Unit - Large", type: "Tool", category: "Welfare", manufacturer: "Portable Space", model: "16ft x 9ft", registrationOrSerial: "PSU-001", currentLocation: "Thames Retail Park", allocatedTo: "James Mitchell", status: "in-use", utilization: 100, dailyRate: "£180/week", nextMaintenance: "-", lastInspection: "2026-01-10", value: "£12,000" },
  { id: "TL-004", name: "Site Welfare Unit - Medium", type: "Tool", category: "Welfare", manufacturer: "Portable Space", model: "12ft x 9ft", registrationOrSerial: "PSU-002", currentLocation: "Depot", status: "available", utilization: 0, dailyRate: "£150/week", nextMaintenance: "-", lastInspection: "2026-01-18", value: "£9,500" },
  { id: "TL-005", name: "Power Tools Set - Complete", type: "Tool", category: "Hand Tools", manufacturer: "DeWalt", model: "Pro Kit", registrationOrSerial: "DW-SET-001", currentLocation: "Central Warehouse", allocatedTo: "David Brown", status: "in-use", utilization: 85, dailyRate: "£35/day", nextMaintenance: "-", lastInspection: "2026-02-01", value: "£4,200" },
  { id: "TL-006", name: "Laser Level - Rotating", type: "Tool", category: "Survey Equipment", manufacturer: "Leica", model: "Rugby 880", registrationOrSerial: "LCA-002", currentLocation: "Office Complex Tower B", allocatedTo: "Mark Thompson", status: "in-use", utilization: 70, dailyRate: "£45/day", nextMaintenance: "2026-05-01", lastInspection: "2026-01-22", value: "£2,800" },
  { id: "TL-007", name: "Concrete Mixer - Large", type: "Tool", category: "Concrete", manufacturer: "Belle", model: "Minimix 150", registrationOrSerial: "BL-MX-007", currentLocation: "Depot", status: "available", utilization: 0, dailyRate: "£28/day", nextMaintenance: "2026-03-10", lastInspection: "2026-02-05", value: "£950" },
  { id: "TL-008", name: "Vibrating Plate - Heavy", type: "Tool", category: "Compaction", manufacturer: "Wacker Neuson", model: "DPU 6555", registrationOrSerial: "WN-VP-003", currentLocation: "Tech Campus", allocatedTo: "Tom Wilson", status: "in-use", utilization: 88, dailyRate: "£42/day", nextMaintenance: "2026-03-20", lastInspection: "2026-02-08", value: "£3,200" },
];

const equipmentByType = {
  Vehicle: equipmentData.filter((e) => e.type === "Vehicle"),
  Plant: equipmentData.filter((e) => e.type === "Plant"),
  Tool: equipmentData.filter((e) => e.type === "Tool"),
};

const equipmentByStatus = {
  available: equipmentData.filter((e) => e.status === "available"),
  "in-use": equipmentData.filter((e) => e.status === "in-use"),
  maintenance: equipmentData.filter((e) => e.status === "maintenance"),
  broken: equipmentData.filter((e) => e.status === "broken"),
};

const statusColors = {
  available: "bg-green-500/20 border-green-500/30 text-green-400",
  "in-use": "bg-blue-500/20 border-blue-500/30 text-blue-400",
  maintenance: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  broken: "bg-red-500/20 border-red-500/30 text-red-400",
};

const typeColors = {
  Vehicle: "bg-blue-500/20 text-blue-400",
  Plant: "bg-orange-500/20 text-orange-400",
  Tool: "bg-purple-500/20 text-purple-400",
};

export default function EquipmentPage() {
  const [view, setView] = useState<"all" | "available">("all");
  const [filterType, setFilterType] = useState<"All" | "Vehicle" | "Plant" | "Tool">("All");

  const displayData = equipmentData.filter((e) => {
    const statusMatch = view === "all" || e.status === "available";
    const typeMatch = filterType === "All" || e.type === filterType;
    return statusMatch && typeMatch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 rounded-lg bg-gray-800/80 text-gray-300 border border-gray-700/50 font-medium focus:outline-none focus:border-cyan-500/50"
          >
            <option value="All">All Types</option>
            <option value="Vehicle">Vehicles</option>
            <option value="Plant">Plant</option>
            <option value="Tool">Tools</option>
          </select>
          <button
            onClick={() => setView("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "all"
                ? "bg-cyan-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            All Equipment
          </button>
          <button
            onClick={() => setView("available")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "available"
                ? "bg-cyan-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            Available Only
          </button>
          <button className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-medium hover:bg-cyan-600 transition-colors">
            + Add Equipment
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Assets</p>
              <p className="text-3xl font-bold text-white mt-1">{equipmentData.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-700/50 rounded-lg flex items-center justify-center text-2xl">
              🔧
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Available</p>
              <p className="text-3xl font-bold text-white mt-1">{equipmentByStatus.available.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">In Use</p>
              <p className="text-3xl font-bold text-white mt-1">{equipmentByStatus["in-use"].length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center text-2xl">
              🚜
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Utilization</p>
              <p className="text-3xl font-bold text-white mt-1">
                {Math.round(equipmentData.reduce((acc, e) => acc + e.utilization, 0) / equipmentData.length)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center text-2xl">
              📊
            </div>
          </div>
        </div>
      </div>

      {/* Equipment by Type */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/80 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Vehicles</span>
            <span className="text-2xl">🚗</span>
          </div>
          <p className="text-2xl font-bold text-white">{equipmentByType.Vehicle.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {equipmentByType.Vehicle.filter((e) => e.status === "available").length} available
          </p>
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">Avg Util: {Math.round(equipmentByType.Vehicle.reduce((acc, v) => acc + v.utilization, 0) / equipmentByType.Vehicle.length)}%</p>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Plant</span>
            <span className="text-2xl">🏗️</span>
          </div>
          <p className="text-2xl font-bold text-white">{equipmentByType.Plant.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {equipmentByType.Plant.filter((e) => e.status === "available").length} available
          </p>
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">Avg Util: {Math.round(equipmentByType.Plant.reduce((acc, v) => acc + v.utilization, 0) / equipmentByType.Plant.length)}%</p>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-purple-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Tools</span>
            <span className="text-2xl">🔨</span>
          </div>
          <p className="text-2xl font-bold text-white">{equipmentByType.Tool.length}</p>
          <p className="text-xs text-gray-500 mt-1">
            {equipmentByType.Tool.filter((e) => e.status === "available").length} available
          </p>
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <p className="text-xs text-gray-500">Avg Util: {Math.round(equipmentByType.Tool.reduce((acc, v) => acc + v.utilization, 0) / equipmentByType.Tool.length)}%</p>
          </div>
        </div>
      </div>

      {/* Equipment Table */}
      <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50 border-b border-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">ID</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Equipment</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Location</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Allocated To</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Utilization</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Daily Rate</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Next Maintenance</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {displayData.map((equipment) => (
                <tr key={equipment.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-gray-400">{equipment.id}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{equipment.name}</p>
                      <p className="text-xs text-gray-400">{equipment.manufacturer} {equipment.model}</p>
                      <p className="text-xs text-gray-500 font-mono">{equipment.registrationOrSerial}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded ${typeColors[equipment.type]}`}>
                      {equipment.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{equipment.currentLocation}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{equipment.allocatedTo || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-700/50 rounded-full overflow-hidden min-w-[60px]">
                        <div
                          className={`h-full rounded-full ${
                            equipment.utilization >= 90
                              ? "bg-gradient-to-r from-orange-500 to-red-500"
                              : equipment.utilization >= 70
                              ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                              : equipment.utilization > 0
                              ? "bg-gradient-to-r from-cyan-500 to-cyan-400"
                              : "bg-gray-600"
                          }`}
                          style={{ width: `${equipment.utilization}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 min-w-[35px]">{equipment.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 font-medium">{equipment.dailyRate}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded border ${statusColors[equipment.status]}`}>
                      {equipment.status === "available" && "Available"}
                      {equipment.status === "in-use" && "In Use"}
                      {equipment.status === "maintenance" && "Maintenance"}
                      {equipment.status === "broken" && "Broken"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{equipment.nextMaintenance}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {equipment.status === "available" && (
                        <button className="text-xs px-3 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition-colors">
                          Allocate
                        </button>
                      )}
                      {equipment.status === "in-use" && (
                        <button className="text-xs px-3 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors">
                          Release
                        </button>
                      )}
                      <button className="text-xs px-3 py-1 rounded bg-gray-700/50 border border-gray-600/50 text-gray-400 hover:bg-gray-700/70 transition-colors">
                        View
                      </button>
                    </div>
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
