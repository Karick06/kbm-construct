"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ProjectHandover,
  type ConstructionProject,
  getStageLabel,
  getStageColor,
  calculateProjectHealth,
  formatCurrency,
  isProjectOverdue,
} from "@/lib/operations-models";
import {
  createProjectFromHandover,
  getHandoversFromStorage,
  getProjectsFromStorage,
  saveHandoversToStorage,
  saveProjectsToStorage,
} from "@/lib/operations-data";

export default function OperationsOverviewPage() {
  const router = useRouter();
  const [handovers, setHandovers] = useState<ProjectHandover[]>([]);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [selectedHandover, setSelectedHandover] = useState<ProjectHandover | null>(null);
  const [filterStage, setFilterStage] = useState<string>("all");

  useEffect(() => {
    setHandovers(getHandoversFromStorage());
    setProjects(getProjectsFromStorage());
  }, []);

  // Statistics
  const stats = {
    newHandovers: handovers.filter(h => h.handoverStatus === "pending").length,
    activeProjects: projects.filter(p => p.stage === "active").length,
    projectsRequiringAttention: projects.filter(p => p.requiresAttention).length,
    totalValue: projects.reduce((sum, p) => sum + p.contractValue, 0),
    totalGrossProfit: projects.reduce((sum, p) => sum + p.grossProfit, 0),
    avgProgress: Math.round(
      projects.reduce((sum, p) => sum + p.overallProgress, 0) / Math.max(1, projects.length)
    ),
  };

  const handleAcceptHandover = (handoverId: string) => {
    const handover = handovers.find(h => h.id === handoverId);
    if (!handover) return;

    const updatedHandovers = handovers.map(item =>
      item.id === handoverId
        ? {
            ...item,
            handoverStatus: "accepted" as const,
            handoverToUser: "Operations Team",
            acceptedAt: new Date().toISOString(),
          }
        : item
    );

    const existingProject = projects.find(p => p.estimateId === handover.estimateId);
    const updatedProjects = existingProject
      ? projects
      : [...projects, createProjectFromHandover(handover)];

    setHandovers(updatedHandovers);
    saveHandoversToStorage(updatedHandovers);
    setProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);
    alert("Handover accepted - Project created!");
  };

  const filteredProjects = filterStage === "all" 
    ? projects 
    : projects.filter(p => p.stage === filterStage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex gap-3">
          <button 
            onClick={() => router.push("/projects")}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition"
          >
            All Projects
          </button>
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
            + New Project
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              New Handovers
            </p>
            <span className="text-xl">🎉</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.newHandovers}</p>
          <p className="text-xs text-gray-400">From Estimating</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Projects
            </p>
            <span className="text-xl">🏗️</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeProjects}</p>
          <p className="text-xs text-gray-400">In construction</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-red-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Requires Attention
            </p>
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.projectsRequiringAttention}</p>
          <p className="text-xs text-gray-400">Projects need review</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Portfolio Value
            </p>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalValue)}</p>
          <p className="text-xs text-gray-400">
            Forecast profit: {formatCurrency(stats.totalGrossProfit)}
          </p>
        </div>
      </section>

      {/* New Handovers from Estimating */}
      {handovers.filter(h => h.handoverStatus === "pending").length > 0 && (
        <div className="rounded-lg border border-green-700/50 bg-green-900/10 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🎉 New Project Handovers
                <span className="text-sm font-normal text-gray-400">
                  ({handovers.filter(h => h.handoverStatus === "pending").length} pending)
                </span>
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Won contracts ready for mobilisation and project setup
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {handovers
              .filter(h => h.handoverStatus === "pending")
              .map((handover) => (
                <div
                  key={handover.id}
                  onClick={() => setSelectedHandover(handover)}
                  className="cursor-pointer rounded-lg border border-green-700/50 bg-gray-800/80 p-5 transition-all hover:border-green-500 hover:bg-gray-700/50"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-white">{handover.projectName}</p>
                      <p className="mt-1 text-sm text-gray-400">{handover.client}</p>
                    </div>
                    <span className="rounded-full bg-green-900/30 px-3 py-1 text-xs font-semibold text-green-400">
                      New Win
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 rounded border border-gray-700/30 bg-gray-900/50 p-3">
                    <div>
                      <p className="text-xs text-gray-500">Contract Value</p>
                      <p className="mt-1 text-sm font-semibold text-green-400">
                        {formatCurrency(handover.contractValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Start Date</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {new Date(handover.startDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {handover.duration} weeks
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">From Est.</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {handover.estimateId}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded bg-gray-700/30 px-2 py-1">
                      <div className={`h-2 w-2 rounded-full ${handover.contractSigned ? "bg-green-500" : "bg-gray-500"}`}></div>
                      <span className="text-xs text-gray-400">Contract</span>
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded bg-gray-700/30 px-2 py-1">
                      <div className={`h-2 w-2 rounded-full ${handover.insuranceInPlace ? "bg-green-500" : "bg-gray-500"}`}></div>
                      <span className="text-xs text-gray-400">Insurance</span>
                    </div>
                    <div className="flex flex-1 items-center gap-2 rounded bg-gray-700/30 px-2 py-1">
                      <div className={`h-2 w-2 rounded-full ${handover.riskAssessment ? "bg-green-500" : "bg-gray-500"}`}></div>
                      <span className="text-xs text-gray-400">RA</span>
                    </div>
                  </div>

                  {handover.handoverNotes && (
                    <div className="mt-4 rounded border border-gray-700/40 bg-gray-900/40 p-3 text-xs text-gray-300">
                      <p className="text-gray-400 mb-1">Commercial details</p>
                      <p>{handover.handoverNotes}</p>
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcceptHandover(handover.id);
                    }}
                    className="mt-4 w-full rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
                  >
                    Accept & Mobilise →
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {selectedHandover && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedHandover(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedHandover.projectName}</h3>
                <p className="text-sm text-gray-400">{selectedHandover.client}</p>
              </div>
              <button
                onClick={() => setSelectedHandover(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
                <p className="text-xs text-gray-400">Estimate</p>
                <p className="text-white font-semibold">{selectedHandover.estimateId}</p>
              </div>
              <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
                <p className="text-xs text-gray-400">Contract value</p>
                <p className="text-white font-semibold">{formatCurrency(selectedHandover.contractValue)}</p>
              </div>
              <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
                <p className="text-xs text-gray-400">Start date</p>
                <p className="text-white font-semibold">{new Date(selectedHandover.startDate).toLocaleDateString("en-GB")}</p>
              </div>
              <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
                <p className="text-xs text-gray-400">Duration</p>
                <p className="text-white font-semibold">{selectedHandover.duration} weeks</p>
              </div>
            </div>

            {selectedHandover.handoverNotes && (
              <div className="mt-4 rounded border border-gray-700/40 bg-gray-800/60 p-3 text-sm">
                <p className="text-xs text-gray-400 mb-2">Commercial details</p>
                <p className="text-gray-200">{selectedHandover.handoverNotes}</p>
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setSelectedHandover(null)}
                className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
              >
                Close
              </button>
              {selectedHandover.handoverStatus === "pending" && (
                <button
                  onClick={() => {
                    handleAcceptHandover(selectedHandover.id);
                    setSelectedHandover(null);
                  }}
                  className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Accept & Mobilise
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Project Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "All Projects", count: projects.length },
          { key: "handover", label: "Handover", count: projects.filter(p => p.stage === "handover").length },
          { key: "mobilisation", label: "Mobilisation", count: projects.filter(p => p.stage === "mobilisation").length },
          { key: "active", label: "Active", count: projects.filter(p => p.stage === "active").length },
          { key: "snagging", label: "Snagging", count: projects.filter(p => p.stage === "snagging").length },
          { key: "practical", label: "Practical Completion", count: projects.filter(p => p.stage === "practical").length },
          { key: "final", label: "Final Account", count: projects.filter(p => p.stage === "final").length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterStage(tab.key)}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
              filterStage === tab.key
                ? "bg-orange-500 text-white"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {tab.label} <span className="ml-1 text-xs opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Active Projects */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">
          {filterStage === "all" ? "All Projects" : getStageLabel(filterStage as any)}
        </h2>

        {filteredProjects.length === 0 && (
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-12 text-center">
            <p className="text-gray-400">No projects in this stage</p>
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredProjects.map((project) => {
            const health = calculateProjectHealth(project);
            const daysLeft = project.daysToCompletion;
            const isOverdue = daysLeft < 0;

            return (
              <div
                key={project.id}
                onClick={() => router.push(`/projects/${project.id}`)}
                className={`cursor-pointer rounded-lg border p-5 transition-all hover:border-orange-500 hover:bg-gray-700/30 ${
                  project.requiresAttention
                    ? "border-red-500/50 bg-red-900/10"
                    : "border-gray-700/50 bg-gray-800/80"
                }`}
              >
                {/* Header */}
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{project.projectName}</h3>
                      {project.requiresAttention && (
                        <span className="text-red-400">⚠️</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{project.client}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      getStageColor(project.stage) === "blue"
                        ? "bg-blue-900/30 text-blue-400"
                        : getStageColor(project.stage) === "purple"
                        ? "bg-purple-900/30 text-purple-400"
                        : getStageColor(project.stage) === "orange"
                        ? "bg-orange-900/30 text-orange-400"
                        : getStageColor(project.stage) === "yellow"
                        ? "bg-yellow-900/30 text-yellow-400"
                        : getStageColor(project.stage) === "green"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-gray-900/30 text-gray-400"
                    }`}
                  >
                    {project.stage.charAt(0).toUpperCase() + project.stage.slice(1)}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">Overall Progress</span>
                    <span className="text-sm font-bold text-white">{project.overallProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-600/50">
                    <div
                      className={`h-full transition-all ${
                        project.overallProgress >= 90
                          ? "bg-gradient-to-r from-green-500 to-green-400"
                          : project.overallProgress >= 50
                          ? "bg-gradient-to-r from-orange-500 to-orange-400"
                          : "bg-gradient-to-r from-blue-500 to-blue-400"
                      }`}
                      style={{ width: `${project.overallProgress}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="mb-4 grid grid-cols-3 gap-3 rounded border border-gray-700/30 bg-gray-900/50 p-3">
                  <div>
                    <p className="text-xs text-gray-500">Value</p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatCurrency(project.contractValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Profit %</p>
                    <p className={`mt-1 text-sm font-semibold ${
                      project.grossProfitPercentage >= 10 ? "text-green-400" :
                      project.grossProfitPercentage >= 5 ? "text-orange-400" :
                      "text-red-400"
                    }`}>
                      {project.grossProfitPercentage.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Days Left</p>
                    <p className={`mt-1 text-sm font-semibold ${
                      isOverdue ? "text-red-400" :
                      daysLeft < 30 ? "text-orange-400" :
                      "text-white"
                    }`}>
                      {isOverdue ? `${Math.abs(daysLeft)} over` : daysLeft}
                    </p>
                  </div>
                </div>

                {/* Team & Icons */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Project Manager</p>
                    <p className="mt-1 text-sm font-semibold text-white">{project.projectManager}</p>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <div className="flex items-center gap-1 text-gray-400">
                      <span>📄</span>
                      <span>{project.documentCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <span>📷</span>
                      <span>{project.photoCount}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <span>📝</span>
                      <span>{project.siteDiaryCount}</span>
                    </div>
                  </div>
                </div>

                {/* Health Score */}
                <div className="mt-3 flex items-center gap-2 rounded border border-gray-700/30 bg-gray-900/30 p-2">
                  <div className={`h-2 w-2 rounded-full ${
                    health.status === "excellent" ? "bg-green-500" :
                    health.status === "good" ? "bg-blue-500" :
                    health.status === "concern" ? "bg-yellow-500" :
                    "bg-red-500"
                  }`}></div>
                  <span className="text-xs text-gray-400">
                    Health: <span className={`font-semibold ${
                      health.status === "excellent" ? "text-green-400" :
                      health.status === "good" ? "text-blue-400" :
                      health.status === "concern" ? "text-yellow-400" :
                      "text-red-400"
                    }`}>{health.status.charAt(0).toUpperCase() + health.status.slice(1)}</span>
                  </span>
                  {health.issues.length > 0 && (
                    <span className="ml-auto text-xs text-gray-500">
                      {health.issues.length} issue{health.issues.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
