"use client";

import { useState, useEffect } from "react";
import {
  type ConstructionProject,
  formatCurrency,
} from "@/lib/operations-models";
import {
  getProjectsFromStorage,
  type PlantAllocation,
  getPlantAllocationsFromStorage,
  savePlantAllocationsToStorage,
} from "@/lib/operations-data";

export default function PlantAllocationPage() {
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [allocations, setAllocations] = useState<PlantAllocation[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showNewAllocationModal, setShowNewAllocationModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    setProjects(getProjectsFromStorage());
    setAllocations(getPlantAllocationsFromStorage());
  }, []);

  const filteredAllocations = selectedProject
    ? allocations.filter(a => a.projectId === selectedProject)
    : allocations;

  const statusFilteredAllocations = filterStatus === "all"
    ? filteredAllocations
    : filteredAllocations.filter(a => a.status === filterStatus);

  // Statistics
  const stats = {
    totalAllocated: allocations.filter(a => a.status === "allocated" || a.status === "on-site").length,
    onSite: allocations.filter(a => a.status === "on-site").length,
    totalHireCost: allocations.reduce((sum, a) => {
      if (a.status === "on-site" || a.status === "allocated") {
        // Calculate days between dates
        const from = new Date(a.allocatedFrom);
        const to = new Date(a.allocatedTo);
        const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        return sum + (a.hireRate * days);
      }
      return sum;
    }, 0),
    requiresOperators: allocations.filter(a => a.operatorRequired && (a.status === "allocated" || a.status === "on-site") && !a.operatorName).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🚜</span>
            Plant & Equipment Allocation
          </h1>
          <p className="mt-1 text-sm text-gray-400">Track machinery and equipment across projects</p>
        </div>
        <button
          onClick={() => setShowNewAllocationModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
        >
          + Allocate Plant
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Allocated
            </p>
            <span className="text-xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalAllocated}</p>
          <p className="text-xs text-gray-400">Active allocations</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              On Site
            </p>
            <span className="text-xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.onSite}</p>
          <p className="text-xs text-gray-400">Currently deployed</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Hire Cost
            </p>
            <span className="text-xl">💷</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalHireCost)}</p>
          <p className="text-xs text-gray-400">Estimated total</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-red-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Needs Operator
            </p>
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.requiresOperators}</p>
          <p className="text-xs text-gray-400">Awaiting assignment</p>
        </div>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
        >
          <option value="">All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.projectName}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "allocated", label: "Allocated" },
            { key: "on-site", label: "On Site" },
            { key: "off-hired", label: "Off Hired" },
            { key: "returned", label: "Returned" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filterStatus === tab.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Allocations List */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Plant Allocations</h2>
          <p className="mt-1 text-sm text-gray-400">
            {statusFilteredAllocations.length} allocation{statusFilteredAllocations.length !== 1 ? "s" : ""}
          </p>
        </div>

        {statusFilteredAllocations.length === 0 ? (
          <div className="rounded-lg bg-gray-700/30 p-12 text-center">
            <p className="text-gray-400">No plant allocations found</p>
            <button
              onClick={() => setShowNewAllocationModal(true)}
              className="mt-4 rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Allocate First Plant
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {statusFilteredAllocations.map((allocation) => {
              const project = projects.find(p => p.id === allocation.projectId);
              const statusColors = {
                allocated: "bg-blue-900/30 text-blue-400",
                "on-site": "bg-green-900/30 text-green-400",
                "off-hired": "bg-yellow-900/30 text-yellow-400",
                returned: "bg-gray-900/30 text-gray-400",
              };

              const startDate = new Date(allocation.allocatedFrom);
              const endDate = new Date(allocation.allocatedTo);
              const today = new Date();
              const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const daysElapsed = Math.min(totalDays, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
              const totalCost = allocation.hireRate * totalDays;

              return (
                <div
                  key={allocation.id}
                  className="rounded-lg border border-gray-700/50 bg-gray-800 p-5 hover:border-orange-500 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">
                          {allocation.plantName}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[allocation.status]}`}>
                          {allocation.status.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{allocation.plantType}</p>
                      <p className="text-xs text-gray-500">{project?.projectName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded border border-gray-700/30 bg-gray-900/50 p-3 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Hire Rate</p>
                      <p className="mt-1 font-semibold text-white">{formatCurrency(allocation.hireRate)}/day</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Est. Total Cost</p>
                      <p className="mt-1 font-semibold text-orange-400">{formatCurrency(totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">From</p>
                      <p className="mt-1 font-semibold text-white">{startDate.toLocaleDateString("en-GB")}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">To</p>
                      <p className="mt-1 font-semibold text-white">{endDate.toLocaleDateString("en-GB")}</p>
                    </div>
                  </div>

                  {allocation.operatorRequired && (
                    <div className={`rounded border p-3 mb-3 ${
                      allocation.operatorName 
                        ? "border-green-700/30 bg-green-900/10" 
                        : "border-red-700/30 bg-red-900/10"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-400">Operator Required</p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {allocation.operatorName || "Not assigned"}
                          </p>
                        </div>
                        {!allocation.operatorName && (
                          <span className="text-red-400">⚠️</span>
                        )}
                      </div>
                    </div>
                  )}

                  {allocation.notes && (
                    <div className="text-xs text-gray-400 italic">
                      "{allocation.notes}"
                    </div>
                  )}

                  {/* Progress bar for allocation period */}
                  {allocation.status === "on-site" && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-400">Period Progress</span>
                        <span className="text-xs text-white">{daysElapsed} / {totalDays} days</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-600/50">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all"
                          style={{ width: `${Math.min(100, (daysElapsed / totalDays) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Allocation Modal */}
      {showNewAllocationModal && (
        <NewAllocationModal
          projects={projects}
          onClose={() => setShowNewAllocationModal(false)}
          onSave={(newAllocation) => {
            const updated = [...allocations, newAllocation];
            setAllocations(updated);
            savePlantAllocationsToStorage(updated);
            setShowNewAllocationModal(false);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// NEW ALLOCATION MODAL
// =============================================================================

function NewAllocationModal({
  projects,
  onClose,
  onSave,
}: {
  projects: ConstructionProject[];
  onClose: () => void;
  onSave: (allocation: PlantAllocation) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [plantName, setPlantName] = useState("");
  const [plantType, setPlantType] = useState("");
  const [allocatedFrom, setAllocatedFrom] = useState(new Date().toISOString().split("T")[0]);
  const [allocatedTo, setAllocatedTo] = useState("");
  const [hireRate, setHireRate] = useState("");
  const [operatorRequired, setOperatorRequired] = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!projectId || !plantName || !plantType || !allocatedFrom || !allocatedTo || !hireRate) {
      alert("Please fill in all required fields");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Operations User"}');

    const newAllocation: PlantAllocation = {
      id: `PLANT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      plantId: `P-${Date.now()}`,
      plantName,
      plantType,
      allocatedFrom,
      allocatedTo,
      status: "allocated",
      hireRate: parseFloat(hireRate),
      operatorRequired,
      operatorName: operatorRequired && operatorName ? operatorName : undefined,
      notes: notes || undefined,
      allocatedBy: currentUser.name,
      allocatedDate: new Date().toISOString(),
    };

    onSave(newAllocation);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🚜</span>
              Allocate Plant & Equipment
            </h3>
            <p className="mt-1 text-sm text-gray-400">Assign machinery to project</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Project Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Project *
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
            >
              <option value="">Select project...</option>
              {projects
                .filter(p => p.stage === "active" || p.stage === "mobilisation")
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} - {p.client}
                  </option>
                ))}
            </select>
          </div>

          {/* Plant Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Plant/Equipment Name *
              </label>
              <input
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                placeholder="e.g., 13T Excavator"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Type *
              </label>
              <select
                value={plantType}
                onChange={(e) => setPlantType(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select type...</option>
                <option value="Excavator">Excavator</option>
                <option value="Dumper">Dumper</option>
                <option value="Roller">Roller</option>
                <option value="Compactor">Compactor</option>
                <option value="Generator">Generator</option>
                <option value="Crane">Crane</option>
                <option value="Telehandler">Telehandler</option>
                <option value="Concrete Pump">Concrete Pump</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Dates and Rate */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                From Date *
              </label>
              <input
                type="date"
                value={allocatedFrom}
                onChange={(e) => setAllocatedFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                To Date *
              </label>
              <input
                type="date"
                value={allocatedTo}
                onChange={(e) => setAllocatedTo(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Hire Rate (£/day) *
              </label>
              <input
                type="number"
                value={hireRate}
                onChange={(e) => setHireRate(e.target.value)}
                placeholder="250"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Operator */}
          <div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={operatorRequired}
                onChange={(e) => setOperatorRequired(e.target.checked)}
                className="rounded border-gray-700 bg-gray-800 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm font-semibold text-gray-300">Operator Required</span>
            </label>

            {operatorRequired && (
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Operator name (optional)"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes or requirements..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          {/* Cost estimate */}
          {allocatedFrom && allocatedTo && hireRate && (
            <div className="rounded-lg border border-orange-700/50 bg-orange-900/10 p-4">
              <p className="text-sm font-semibold text-white mb-2">Estimated Cost</p>
              <p className="text-xs text-gray-400 mb-1">
                {Math.ceil((new Date(allocatedTo).getTime() - new Date(allocatedFrom).getTime()) / (1000 * 60 * 60 * 24))} days @ £{hireRate}/day
              </p>
              <p className="text-2xl font-bold text-orange-400">
                {formatCurrency(parseFloat(hireRate) * Math.ceil((new Date(allocatedTo).getTime() - new Date(allocatedFrom).getTime()) / (1000 * 60 * 60 * 24)))}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Allocate Plant
          </button>
        </div>
      </div>
    </div>
  );
}
