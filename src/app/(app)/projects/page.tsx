"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/date-utils";
import { formatCurrency, type ConstructionProject } from "@/lib/operations-models";
import { getProjectsFromStorage, sampleProjects, saveProjectsToStorage } from "@/lib/operations-data";
import MobileCard from "@/components/MobileCard";
import FloatingActionButton from "@/components/FloatingActionButton";
import PullToRefresh from "@/components/PullToRefresh";

type BoardProject = {
  id: string;
  name: string;
  client: string;
  estimateId?: string;
  stage: ConstructionProject["stage"];
  startDate?: string;
  end?: string;
  completedDate?: string;
  duration?: string;
  team: number;
  budget: string;
  risk: "low" | "medium" | "high";
  manager: string;
  progress?: number;
  mobilisationProgress?: number;
  orderNumber?: string;
  paymentTerms?: string;
};

const normalizeRisk = (risk: ConstructionProject["riskLevel"]): "low" | "medium" | "high" => {
  if (risk === "critical") return "high";
  return risk;
};

const mapProjectToBoard = (project: ConstructionProject): BoardProject => {
  const durationWeeks = project.contractDuration || 0;
  const durationMonths = durationWeeks ? `${Math.max(1, Math.round(durationWeeks / 4))} months` : "TBD";
  const isCompleted = project.stage === "complete";

  return {
    id: project.id,
    name: project.projectName,
    client: project.client,
    estimateId: project.estimateId,
    stage: project.stage,
    startDate: project.contractStartDate,
    end: project.contractCompletionDate,
    completedDate: project.completedAt || (isCompleted ? project.contractCompletionDate : undefined),
    duration: durationMonths,
    team: project.team?.length || 0,
    budget: formatCurrency(project.contractValue),
    risk: normalizeRisk(project.riskLevel),
    manager: project.projectManager || "Awaiting assignment",
    progress: project.overallProgress,
    mobilisationProgress: Math.min(100, Math.max(10, project.overallProgress || 0)),
    orderNumber: project.orderNumber,
    paymentTerms: project.paymentTerms,
  };
};

const riskColors = {
  low: "bg-green-900/30 border-green-700/50 text-green-400",
  medium: "bg-yellow-900/30 border-yellow-700/50 text-yellow-400",
  high: "bg-red-900/30 border-red-700/50 text-red-400",
};

export default function ProjectsPage() {
  const [view, setView] = useState("board");
  const [projects, setProjects] = useState<ConstructionProject[]>(sampleProjects);
  const [editingProject, setEditingProject] = useState<ConstructionProject | null>(null);
  const [orderNumber, setOrderNumber] = useState("");
  const [contractFileName, setContractFileName] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [mobileFilter, setMobileFilter] = useState<string>("all");

  useEffect(() => {
    setProjects(getProjectsFromStorage());
  }, []);

  const projectsByStatus = useMemo(() => {
    const buckets = {
      mobilizing: [] as BoardProject[],
      planned: [] as BoardProject[],
      active: [] as BoardProject[],
      review: [] as BoardProject[],
      completed: [] as BoardProject[],
    };

    projects.forEach(project => {
      const mapped = mapProjectToBoard(project);
      switch (project.stage) {
        case "mobilisation":
          buckets.mobilizing.push(mapped);
          break;
        case "handover":
          buckets.planned.push(mapped);
          break;
        case "active":
          buckets.active.push(mapped);
          break;
        case "snagging":
        case "practical":
        case "final":
          buckets.review.push(mapped);
          break;
        case "complete":
          buckets.completed.push(mapped);
          break;
        default:
          buckets.planned.push(mapped);
          break;
      }
    });

    return buckets;
  }, [projects]);

  const openEditModal = (projectId: string) => {
    const project = projects.find(item => item.id === projectId);
    if (!project) return;
    setEditingProject(project);
    setOrderNumber(project.orderNumber || "");
    setContractFileName(project.contractFileName || "");
    setInvoiceAddress(project.invoiceAddress || "");
    setPaymentTerms(project.paymentTerms || "");
  };

  const closeEditModal = () => {
    setEditingProject(null);
    setOrderNumber("");
    setContractFileName("");
    setInvoiceAddress("");
    setPaymentTerms("");
  };

  const saveCommercialSetup = () => {
    if (!editingProject) return;
    const updatedProjects = projects.map(project =>
      project.id === editingProject.id
        ? {
            ...project,
            orderNumber: orderNumber.trim() || undefined,
            contractFileName: contractFileName.trim() || undefined,
            invoiceAddress: invoiceAddress.trim() || undefined,
            paymentTerms: paymentTerms.trim() || undefined,
            updatedAt: new Date().toISOString(),
          }
        : project
    );
    setProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);
    closeEditModal();
  };

  const handleRefresh = async () => {
    setProjects(getProjectsFromStorage());
  };

  const allProjects = useMemo(() => {
    return [...projectsByStatus.mobilizing, ...projectsByStatus.planned, ...projectsByStatus.active, ...projectsByStatus.review, ...projectsByStatus.completed];
  }, [projectsByStatus]);

  const filteredMobileProjects = useMemo(() => {
    if (mobileFilter === "all") return allProjects;
    if (mobileFilter === "mobilizing") return projectsByStatus.mobilizing;
    if (mobileFilter === "planned") return projectsByStatus.planned;
    if (mobileFilter === "active") return projectsByStatus.active;
    if (mobileFilter === "review") return projectsByStatus.review;
    if (mobileFilter === "completed") return projectsByStatus.completed;
    return allProjects;
  }, [mobileFilter, allProjects, projectsByStatus]);

  return (
    <PermissionGuard permission="projects">
    <div className="space-y-6">
      {/* Mobile View - Only visible on mobile */}
      <div className="lg:hidden">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="space-y-4 pb-24">
            {/* Mobile Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-[var(--sidebar-text)]">Projects</h1>
                <p className="text-sm text-[var(--sidebar-muted)] mt-1">
                  {allProjects.length} active projects
                </p>
              </div>
            </div>

            {/* Mobile Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2" style={{ scrollbarWidth: 'none' }}>
              {[
                { key: "all", label: "All", count: allProjects.length },
                { key: "mobilizing", label: "Mobilizing", count: projectsByStatus.mobilizing.length },
                { key: "active", label: "Active", count: projectsByStatus.active.length },
                { key: "review", label: "Review", count: projectsByStatus.review.length },
                { key: "completed", label: "Done", count: projectsByStatus.completed.length },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setMobileFilter(tab.key)}
                  className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                    mobileFilter === tab.key
                      ? "bg-[var(--accent)] text-white"
                      : "bg-[var(--surface)] text-[var(--sidebar-muted)] active:scale-95"
                  }`}
                >
                  {tab.label} {tab.count > 0 && `(${tab.count})`}
                </button>
              ))}
            </div>

            {/* Mobile Project Cards */}
            <div className="space-y-3">
              {filteredMobileProjects.map(p => (
                <MobileCard key={p.id} onClick={() => openEditModal(p.id)}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[var(--sidebar-text)] mb-1">
                        {p.name}
                      </h3>
                      <p className="text-sm text-[var(--sidebar-muted)]">{p.client}</p>
                    </div>
                    <span className={`flex-shrink-0 ml-3 text-xs px-2 py-1 rounded font-semibold border ${riskColors[p.risk as keyof typeof riskColors]}`}>
                      {p.risk}
                    </span>
                  </div>

                  {/* Project Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-3 py-3 border-y border-[var(--line)]">
                    <div>
                      <p className="text-xs text-[var(--sidebar-muted)]">Budget</p>
                      <p className="text-sm font-bold text-[var(--accent)] mt-0.5">{p.budget}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--sidebar-muted)]">Team</p>
                      <p className="text-sm font-bold text-[var(--sidebar-text)] mt-0.5">{p.team}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--sidebar-muted)]">Progress</p>
                      <p className="text-sm font-bold text-[var(--sidebar-text)] mt-0.5">
                        {typeof p.progress === 'number' ? `${p.progress}%` : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {typeof p.progress === 'number' && (
                    <div className="mb-3">
                      <div className="h-2 bg-[var(--line)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)]" 
                          style={{ width: `${p.progress}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--sidebar-muted)]">Manager</span>
                      <span className="text-[var(--sidebar-text)] font-medium">{p.manager}</span>
                    </div>
                    {p.startDate && (
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--sidebar-muted)]">Start Date</span>
                        <span className="text-[var(--sidebar-text)] font-medium">{formatDate(p.startDate)}</span>
                      </div>
                    )}
                    {p.orderNumber && (
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--sidebar-muted)]">Order #</span>
                        <span className="text-[var(--sidebar-text)] font-medium">{p.orderNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 pt-3 border-t border-[var(--line)]">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      p.stage === "complete"
                        ? "bg-green-900/30 text-green-400"
                        : p.stage === "snagging" || p.stage === "practical" || p.stage === "final"
                        ? "bg-purple-900/30 text-purple-400"
                        : p.stage === "active"
                        ? "bg-orange-900/30 text-orange-400"
                        : p.stage === "mobilisation"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-blue-900/30 text-blue-400"
                    }`}>
                      {p.stage === "complete"
                        ? "Completed"
                        : p.stage === "snagging" || p.stage === "practical" || p.stage === "final"
                        ? "In Review"
                        : p.stage === "active"
                        ? "Active"
                        : p.stage === "mobilisation"
                        ? "Mobilizing"
                        : "Planned"}
                    </span>
                  </div>
                </MobileCard>
              ))}

              {filteredMobileProjects.length === 0 && (
                <MobileCard className="py-12 text-center">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="text-[var(--sidebar-muted)]">No projects in this category</p>
                </MobileCard>
              )}
            </div>
          </div>
        </PullToRefresh>

        <FloatingActionButton 
          onClick={() => undefined}
          label="New"
          icon="+"
        />
      </div>

      {/* Desktop View - Hidden on mobile */}
      <div className="hidden lg:block space-y-6">
      {/* 

  const allProjects = useMemo(() => {
    return [...projectsByStatus.mobilizing, ...projectsByStatus.planned, ...projectsByStatus.active, ...projectsByStatus.review, ...projectsByStatus.completed];
  }, [projectsByStatus]);

  const filteredMobileProjects = useMemo(() => {
    if (mobileFilter === "all") return allProjects;
    if (mobileFilter === "mobilizing") return projectsByStatus.mobilizing;
    if (mobileFilter === "planned") return projectsByStatus.planned;
    if (mobileFilter === "active") return projectsByStatus.active;
    if (mobileFilter === "review") return projectsByStatus.review;
    if (mobileFilter === "completed") return projectsByStatus.completed;
    return allProjects;
  }, [mobileFilter, allProjects, projectsByStatus]);closeEditModal();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
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
          <p className="mt-2 text-2xl font-bold text-green-400">{projectsByStatus.mobilizing.length}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Planned</p>
          <p className="mt-2 text-2xl font-bold text-blue-400">{projectsByStatus.planned.length}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Active</p>
          <p className="mt-2 text-2xl font-bold text-orange-400">{projectsByStatus.active.length}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">In Review</p>
          <p className="mt-2 text-2xl font-bold text-purple-400">{projectsByStatus.review.length}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Completed</p>
          <p className="mt-2 text-2xl font-bold text-gray-400">{projectsByStatus.completed.length}</p>
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
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(p.id);
                        }}
                        className="text-xs text-gray-300 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mb-3">{p.client}</p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Setup</span>
                        <span className="text-xs font-semibold text-white">{p.mobilisationProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-600/50 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400" style={{ width: `${p.mobilisationProgress}%` }} />
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
                    {(p.orderNumber || p.paymentTerms) && (
                      <div className="mt-3 rounded border border-gray-700/50 bg-gray-800/60 p-2 text-xs text-gray-300">
                        {p.orderNumber && (
                          <p>
                            <span className="text-gray-400">Order #:</span> {p.orderNumber}
                          </p>
                        )}
                        {p.paymentTerms && (
                          <p>
                            <span className="text-gray-400">Terms:</span> {p.paymentTerms}
                          </p>
                        )}
                      </div>
                    )}
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
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(p.id);
                        }}
                        className="text-xs text-gray-300 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
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
                    {(p.orderNumber || p.paymentTerms) && (
                      <div className="mt-3 rounded border border-gray-700/50 bg-gray-800/60 p-2 text-xs text-gray-300">
                        {p.orderNumber && (
                          <p>
                            <span className="text-gray-400">Order #:</span> {p.orderNumber}
                          </p>
                        )}
                        {p.paymentTerms && (
                          <p>
                            <span className="text-gray-400">Terms:</span> {p.paymentTerms}
                          </p>
                        )}
                      </div>
                    )}
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
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(p.id);
                        }}
                        className="text-xs text-gray-300 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
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
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(p.id);
                        }}
                        className="text-xs text-gray-300 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
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
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white">{p.name}</h4>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(p.id);
                        }}
                        className="text-xs text-gray-300 hover:text-white"
                      >
                        Edit
                      </button>
                    </div>
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
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Order #</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Terms</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Edit</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Progress</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {[...projectsByStatus.mobilizing, ...projectsByStatus.planned, ...projectsByStatus.active, ...projectsByStatus.review, ...projectsByStatus.completed].map(p => (
                  <tr key={p.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{p.id}</td>
                    <td className="py-3 text-sm text-white">{p.name}</td>
                    <td className="py-3 text-sm text-gray-400">{p.client}</td>
                    <td className="py-3 text-sm text-gray-300">{p.manager}</td>
                    <td className="py-3 text-sm text-gray-300">{p.orderNumber || "—"}</td>
                    <td className="py-3 text-sm text-gray-300">{p.paymentTerms || "—"}</td>
                    <td className="py-3 text-sm text-gray-300">
                      <button
                        onClick={() => openEditModal(p.id)}
                        className="rounded bg-gray-700 px-2 py-1 text-xs text-white hover:bg-gray-600"
                      >
                        Edit
                      </button>
                    </td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        p.stage === "complete"
                          ? "bg-green-900/30 text-green-400"
                          : p.stage === "snagging" || p.stage === "practical" || p.stage === "final"
                          ? "bg-purple-900/30 text-purple-400"
                          : p.stage === "active"
                          ? "bg-orange-900/30 text-orange-400"
                          : p.stage === "mobilisation"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-blue-900/30 text-blue-400"
                      }`}>
                        {p.stage === "complete"
                          ? "Completed"
                          : p.stage === "snagging" || p.stage === "practical" || p.stage === "final"
                          ? "Review"
                          : p.stage === "active"
                          ? "Active"
                          : p.stage === "mobilisation"
                          ? "Mobilizing"
                          : "Planned"}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400">{typeof p.progress === 'number' ? `${p.progress}%` : '—'}</td>
                    <td className="py-3 text-right text-sm font-semibold text-orange-400">{p.budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </div>
      {/* End Desktop View */}

      {editingProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeEditModal}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-gray-700/50 bg-gray-900 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Edit Commercial Setup</h3>
                <p className="text-sm text-gray-400">{editingProject.projectName}</p>
              </div>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Order Number</label>
                <input
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Contract File</label>
                <input
                  value={contractFileName}
                  onChange={(event) => setContractFileName(event.target.value)}
                  className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Invoice Address</label>
                <textarea
                  value={invoiceAddress}
                  onChange={(event) => setInvoiceAddress(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Terms</label>
                <input
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={saveCommercialSetup}
                className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
