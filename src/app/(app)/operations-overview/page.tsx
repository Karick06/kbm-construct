"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  type ProjectHandover,
  type ConstructionProject,
  type SiteDiaryEntry,
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
  getBillOfQuantitiesForProject,
  getProjectBoQLineItemsFromStorage,
  saveHandoversToStorage,
  saveProjectBoQLineItemsToStorage,
  saveProjectsToStorage,
  addSiteDiaryEntry,
  addSitePhoto,
  createProjectBoQLineItems,
  createBillOfQuantitiesFromBoQItems,
  createOrUpdateBillOfQuantities,
} from "@/lib/operations-data";
import { getEstimateJobsFromStorage } from "@/lib/enquiries-store";
import { createProjectGeofence } from "@/lib/geofence";

type ViewMode = "dashboard" | "kanban" | "gantt" | "map";

export default function OperationsOverviewPage() {
  const router = useRouter();
  const [handovers, setHandovers] = useState<ProjectHandover[]>([]);
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [selectedHandover, setSelectedHandover] = useState<ProjectHandover | null>(null);
  const [filterStage, setFilterStage] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [showSiteDiaryModal, setShowSiteDiaryModal] = useState(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ConstructionProject | null>(null);

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
    let newProject = existingProject || createProjectFromHandover(handover);
    
    // If this is a new project, create BoQ items from handover (or fallback demo items)
    if (!existingProject) {
      const sampleBoQItems = [
        {
          id: `item-1-${handover.projectId}`,
          itemNumber: "A/01",
          description: "Mobilisation & Site Setup",
          unit: "Item",
          quantity: 1,
          rate: 28000,
          amount: 28000,
          standard: "SMM7" as const,
        },
        {
          id: `item-2-${handover.projectId}`,
          itemNumber: "C/01",
          description: "Excavation - General",
          unit: "m³",
          quantity: 450,
          rate: 18.50,
          amount: 8325,
          standard: "SMM7" as const,
        },
        {
          id: `item-3-${handover.projectId}`,
          itemNumber: "D/01",
          description: "Concrete - Basis/Pads E28",
          unit: "m³",
          quantity: 120,
          rate: 185.00,
          amount: 22200,
          standard: "SMM7" as const,
        },
        {
          id: `item-4-${handover.projectId}`,
          itemNumber: "F/01",
          description: "Reinforcement - Fabric A393",
          unit: "m²",
          quantity: 450,
          rate: 8.50,
          amount: 3825,
          standard: "SMM7" as const,
        },
        {
          id: `item-5-${handover.projectId}`,
          itemNumber: "F/02",
          description: "Structural Steelwork",
          unit: "Tonne",
          quantity: 85,
          rate: 950.00,
          amount: 80750,
          standard: "SMM7" as const,
        },
      ];

      const estimateJob = getEstimateJobsFromStorage().find(j => j.id === handover.estimateId);
      const estimateBoqItems = (estimateJob?.boqItems || []).map((item, index) => ({
        id: item.id,
        itemNumber: `ITEM-${String(index + 1).padStart(3, "0")}`,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.total,
        standard: "SMM7" as const,
      }));

      const handoverBoqItems = handover.boqItems && handover.boqItems.length > 0
        ? handover.boqItems
        : estimateBoqItems.length > 0
          ? estimateBoqItems
          : sampleBoQItems;

      // Create BillOfQuantities from handover/source items
      const boq = createBillOfQuantitiesFromBoQItems(
        newProject.id,
        newProject.projectName,
        handoverBoqItems
      );
      
      // Save BillOfQuantities
      createOrUpdateBillOfQuantities(boq);
      
      // Link project to BoQ
      newProject = { ...newProject, boqId: boq.id };
      
      // Create ProjectBoQLineItems for tracking claims
      createProjectBoQLineItems(newProject.id, handoverBoqItems);
    }

    const updatedProjects = existingProject
      ? projects
      : [...projects, newProject];

    setHandovers(updatedHandovers);
    saveHandoversToStorage(updatedHandovers);
    setProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);

    if (!existingProject) {
      void createProjectGeofence({
        id: newProject.id,
        projectName: newProject.projectName,
        siteAddress: newProject.siteAddress,
      }).catch((error) => {
        console.error("Failed to create project geofence:", error);
      });
    }

    alert("Handover accepted - Project created with BoQ items!");
  };

  const filteredProjects = filterStage === "all" 
    ? projects 
    : projects.filter(p => p.stage === filterStage);

  const handleBackfillBoqFromEstimates = () => {
    if (!confirm("Backfill BOQ items from Estimating for existing Operations projects? This will replace current Operations BOQ line items for matched projects.")) {
      return;
    }

    const estimateJobs = getEstimateJobsFromStorage();
    const existingProjectLineItems = getProjectBoQLineItemsFromStorage();
    const updatedProjectLineItems = [...existingProjectLineItems];
    let migrated = 0;
    let skipped = 0;
    let linkedProjectCount = 0;

    const projectsWithBoq = projects.map(project => {
      const estimateJob = estimateJobs.find(job => job.id === project.estimateId);
      const sourceBoqItems = estimateJob?.boqItems || [];

      if (sourceBoqItems.length === 0) {
        skipped += 1;
        return project;
      }

      const mappedBoqItems = sourceBoqItems.map((item, index) => ({
        id: item.id,
        itemNumber: `ITEM-${String(index + 1).padStart(3, "0")}`,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.total,
        standard: "SMM7" as const,
      }));

      const existingBoq = getBillOfQuantitiesForProject(project.id);
      if (existingBoq) {
        const subtotal = mappedBoqItems.reduce((sum, item) => sum + item.amount, 0);
        const contingencyPercent = existingBoq.contingencyPercent ?? 5;
        const contingency = (subtotal * contingencyPercent) / 100;

        createOrUpdateBillOfQuantities({
          ...existingBoq,
          items: mappedBoqItems,
          subtotal,
          contingency,
          total: subtotal + contingency,
        });
      } else {
        const createdBoq = createBillOfQuantitiesFromBoQItems(project.id, project.projectName, mappedBoqItems);
        createOrUpdateBillOfQuantities(createdBoq);
        project = { ...project, boqId: createdBoq.id };
        linkedProjectCount += 1;
      }

      for (let index = updatedProjectLineItems.length - 1; index >= 0; index--) {
        if (updatedProjectLineItems[index].projectId === project.id) {
          updatedProjectLineItems.splice(index, 1);
        }
      }

      mappedBoqItems.forEach((item) => {
        updatedProjectLineItems.push({
          id: `boq-item-${project.id}-${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          projectId: project.id,
          boqItemId: item.id,
          itemNumber: item.itemNumber,
          description: item.description,
          unit: item.unit,
          originalQuantity: item.quantity,
          rate: item.rate,
          originalAmount: item.amount,
          quantityClaimed: 0,
          amountClaimed: 0,
          percentageComplete: 0,
          amountClaimedByPercentage: 0,
          variations: [],
        });
      });

      migrated += 1;
      return project;
    });

    saveProjectBoQLineItemsToStorage(updatedProjectLineItems);

    if (linkedProjectCount > 0) {
      setProjects(projectsWithBoq);
      saveProjectsToStorage(projectsWithBoq);
    }

    alert(`BOQ backfill complete. Migrated: ${migrated}, Skipped (no estimate BOQ): ${skipped}`);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions Bar */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-orange-500/30 bg-orange-900/10 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚡</span>
          <div>
            <h3 className="text-sm font-bold text-white">Quick Actions</h3>
            <p className="text-xs text-gray-400">Common operations tasks</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setShowSiteDiaryModal(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            <span>📝</span>
            <span>Site Diary</span>
          </button>
          <button 
            onClick={() => setShowPhotoUploadModal(true)}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition"
          >
            <span>📷</span>
            <span>Upload Photos</span>
          </button>
          <button 
            onClick={() => router.push("/geofences")}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition"
          >
            <span>📍</span>
            <span>Geofences</span>
          </button>
          <button 
            onClick={() => router.push("/projects")}
            className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition"
          >
            All Projects
          </button>
          <button
            onClick={handleBackfillBoqFromEstimates}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 transition"
          >
            Sync BOQ from Estimating
          </button>
          <button
            onClick={() => router.push("/projects")}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            + New Project
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: "dashboard" as ViewMode, label: "Dashboard", icon: "📊" },
            { key: "kanban" as ViewMode, label: "Kanban", icon: "📋" },
            { key: "gantt" as ViewMode, label: "Timeline", icon: "📅" },
            { key: "map" as ViewMode, label: "Map", icon: "🗺️" },
          ].map((view) => (
            <button
              key={view.key}
              onClick={() => setViewMode(view.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                viewMode === view.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span>{view.icon}</span>
              <span>{view.label}</span>
            </button>
          ))}
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

      {/* View Content */}
      {viewMode === "dashboard" && (
        <DashboardView 
          handovers={handovers}
          projects={projects}
          filterStage={filterStage}
          filteredProjects={filteredProjects}
          setFilterStage={setFilterStage}
          setSelectedHandover={setSelectedHandover}
          handleAcceptHandover={handleAcceptHandover}
          router={router}
        />
      )}

      {viewMode === "kanban" && (
        <KanbanView projects={projects} />
      )}

      {viewMode === "gantt" && (
        <GanttView projects={projects} />
      )}

      {viewMode === "map" && (
        <MapView projects={projects} />
      )}

      {/* Modals */}
      {selectedHandover && (
        <HandoverModal
          handover={selectedHandover}
          onClose={() => setSelectedHandover(null)}
          onAccept={() => {
            handleAcceptHandover(selectedHandover.id);
            setSelectedHandover(null);
          }}
        />
      )}

      {showSiteDiaryModal && (
        <SiteDiaryModal
          projects={projects}
          onSaved={() => setProjects(getProjectsFromStorage())}
          onClose={() => setShowSiteDiaryModal(false)}
        />
      )}

      {showPhotoUploadModal && (
        <PhotoUploadModal
          projects={projects}
          onSaved={() => setProjects(getProjectsFromStorage())}
          onClose={() => setShowPhotoUploadModal(false)}
        />
      )}
    </div>
  );
}

// =============================================================================
// DASHBOARD VIEW
// =============================================================================

function DashboardView({
  handovers,
  projects,
  filterStage,
  filteredProjects,
  setFilterStage,
  setSelectedHandover,
  handleAcceptHandover,
  router,
}: {
  handovers: ProjectHandover[];
  projects: ConstructionProject[];
  filterStage: string;
  filteredProjects: ConstructionProject[];
  setFilterStage: (stage: string) => void;
  setSelectedHandover: (handover: ProjectHandover | null) => void;
  handleAcceptHandover: (id: string) => void;
  router: any;
}) {
  return (
    <>
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
    </>
  );
}

// =============================================================================
// KANBAN VIEW
// =============================================================================

function KanbanView({ projects }: { projects: ConstructionProject[] }) {
  const columns = [
    { stage: "handover" as const, label: "Handover", color: "blue" },
    { stage: "mobilisation" as const, label: "Mobilisation", color: "purple" },
    { stage: "active" as const, label: "Active", color: "orange" },
    { stage: "snagging" as const, label: "Snagging", color: "yellow" },
    { stage: "practical" as const, label: "Practical", color: "green" },
  ];

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Project Pipeline</h2>
        <p className="mt-1 text-sm text-gray-400">Drag projects between stages</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnProjects = projects.filter(p => p.stage === column.stage);
          
          return (
            <div key={column.stage} className="flex flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-700/30 px-3 py-2">
                <span className="text-sm font-semibold text-white">{column.label}</span>
                <span className="rounded-full bg-gray-600 px-2 py-0.5 text-xs text-white">
                  {columnProjects.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnProjects.map((project) => (
                  <div
                    key={project.id}
                    className="cursor-move rounded-lg border border-gray-700/50 bg-gray-800 p-3 hover:border-orange-500 transition"
                  >
                    <p className="text-sm font-semibold text-white">{project.projectName}</p>
                    <p className="mt-1 text-xs text-gray-400">{project.client}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">{project.overallProgress}%</span>
                      <span className="text-xs text-gray-500">{formatCurrency(project.contractValue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// GANTT VIEW
// =============================================================================

function GanttView({ projects }: { projects: ConstructionProject[] }) {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setMonth(today.getMonth() - 2);
  const endDate = new Date(today);
  endDate.setMonth(today.getMonth() + 6);

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Project Timeline</h2>
        <p className="mt-1 text-sm text-gray-400">Gantt chart view of all projects</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Timeline Header */}
          <div className="mb-4 flex gap-2">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex-1 grid grid-cols-8 gap-1">
              {Array.from({ length: 8 }).map((_, i) => {
                const monthDate = new Date(startDate);
                monthDate.setMonth(startDate.getMonth() + i);
                return (
                  <div key={i} className="text-center text-xs text-gray-400">
                    {monthDate.toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project Rows */}
          <div className="space-y-2">
            {projects.slice(0, 10).map((project) => {
              const projectStart = new Date(project.contractStartDate);
              const projectEnd = new Date(project.contractCompletionDate);
              
              const startOffset = Math.max(0, (projectStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
              const duration = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
              
              const leftPercent = (startOffset / totalDays) * 100;
              const widthPercent = (duration / totalDays) * 100;

              return (
                <div key={project.id} className="flex gap-2">
                  <div className="w-64 flex-shrink-0">
                    <p className="text-sm font-semibold text-white truncate">{project.projectName}</p>
                    <p className="text-xs text-gray-400">{project.client}</p>
                  </div>
                  <div className="flex-1 relative h-12 bg-gray-700/20 rounded">
                    {/* Today indicator */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                      style={{ left: `${((today.getTime() - startDate.getTime()) / (totalDays * 24 * 60 * 60 * 1000)) * 100}%` }}
                    ></div>
                    
                    {/* Project bar */}
                    <div
                      className="absolute top-1 bottom-1 rounded bg-gradient-to-r from-orange-500 to-orange-600 flex items-center px-2"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {project.overallProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAP VIEW
// =============================================================================

function MapView({ projects }: { projects: ConstructionProject[] }) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Project Locations</h2>
          <p className="mt-1 text-sm text-gray-400">Geographic view of all active sites</p>
        </div>
      </div>

      <div className="rounded-lg bg-gray-700/30 p-8 text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-blue-900/30 p-6">
            <span className="text-4xl">🗺️</span>
          </div>
        </div>
        <p className="text-lg font-semibold text-white mb-2">Interactive Map View</p>
        <p className="text-sm text-gray-400 mb-6">
          Map integration coming soon - will show all project locations with status indicators
        </p>

        {/* Project list with locations */}
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {projects
            .filter(p => p.siteAddress.lat && p.siteAddress.lng)
            .slice(0, 6)
            .map((project) => (
              <div
                key={project.id}
                className="rounded-lg border border-gray-700/50 bg-gray-800 p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">{project.projectName}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {project.siteAddress.line1}, {project.siteAddress.postcode}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        project.stage === "active" ? "bg-orange-500" :
                        project.stage === "mobilisation" ? "bg-purple-500" :
                        project.stage === "practical" ? "bg-green-500" :
                        "bg-gray-500"
                      }`}></span>
                      <span className="text-xs text-gray-400">{project.stage}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HANDOVER MODAL
// =============================================================================

function HandoverModal({
  handover,
  onClose,
  onAccept,
}: {
  handover: ProjectHandover;
  onClose: () => void;
  onAccept: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">{handover.projectName}</h3>
            <p className="text-sm text-gray-400">{handover.client}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
            <p className="text-xs text-gray-400">Estimate</p>
            <p className="text-white font-semibold">{handover.estimateId}</p>
          </div>
          <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
            <p className="text-xs text-gray-400">Contract value</p>
            <p className="text-white font-semibold">{formatCurrency(handover.contractValue)}</p>
          </div>
          <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
            <p className="text-xs text-gray-400">Start date</p>
            <p className="text-white font-semibold">{new Date(handover.startDate).toLocaleDateString("en-GB")}</p>
          </div>
          <div className="rounded border border-gray-700/40 bg-gray-800/60 p-3">
            <p className="text-xs text-gray-400">Duration</p>
            <p className="text-white font-semibold">{handover.duration} weeks</p>
          </div>
        </div>

        {handover.handoverNotes && (
          <div className="mt-4 rounded border border-gray-700/40 bg-gray-800/60 p-3 text-sm">
            <p className="text-xs text-gray-400 mb-2">Commercial details</p>
            <p className="text-gray-200">{handover.handoverNotes}</p>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
          >
            Close
          </button>
          {handover.handoverStatus === "pending" && (
            <button
              onClick={onAccept}
              className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Accept & Mobilise
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SITE DIARY MODAL
// =============================================================================

function SiteDiaryModal({
  projects,
  onSaved,
  onClose,
}: {
  projects: ConstructionProject[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [weather, setWeather] = useState<"dry" | "rain" | "snow" | "wind" | "frost">("dry");
  const [temperature, setTemperature] = useState("");
  const [ownStaff, setOwnStaff] = useState("");
  const [subcontractors, setSubcontractors] = useState("");
  const [workCarriedOut, setWorkCarriedOut] = useState("");

  const handleSubmit = () => {
    if (!selectedProjectId || !workCarriedOut) {
      alert("Please select a project and describe work carried out");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Operations User"}');

    addSiteDiaryEntry({
      projectId: selectedProjectId,
      date,
      weather: {
        condition: weather,
        temperature: temperature ? Number(temperature) : undefined,
      },
      labour: {
        ownStaff: Number(ownStaff) || 0,
        subcontractors: Number(subcontractors) || 0,
        visitors: 0,
      },
      plant: {
        onSite: [],
        offSite: [],
      },
      workCarriedOut,
      photosAttached: [],
      enteredBy: currentUser.name,
    });

    alert("Site diary entry saved successfully!");
    onSaved();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-lg border border-gray-700/50 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📝</span>
              New Site Diary Entry
            </h3>
            <p className="mt-1 text-sm text-gray-400">Daily construction record</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Project and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Project *
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
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

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Weather */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Weather Condition
              </label>
              <select
                value={weather}
                onChange={(e) => setWeather(e.target.value as any)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="dry">☀️ Dry</option>
                <option value="rain">🌧️ Rain</option>
                <option value="snow">❄️ Snow</option>
                <option value="wind">💨 Wind</option>
                <option value="frost">🧊 Frost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Temperature °C
              </label>
              <input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="e.g., 12"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Labour */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Own Staff
              </label>
              <input
                type="number"
                value={ownStaff}
                onChange={(e) => setOwnStaff(e.target.value)}
                placeholder="Number of employees on site"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Subcontractors
              </label>
              <input
                type="number"
                value={subcontractors}
                onChange={(e) => setSubcontractors(e.target.value)}
                placeholder="Number of subcontractor staff"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Work Carried Out */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Work Carried Out *
            </label>
            <textarea
              value={workCarriedOut}
              onChange={(e) => setWorkCarriedOut(e.target.value)}
              rows={6}
              placeholder="Describe the work completed today, including locations, quantities, and any notable events..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>
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
            Save Entry
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PHOTO UPLOAD MODAL
// =============================================================================

function PhotoUploadModal({
  projects,
  onSaved,
  onClose,
}: {
  projects: ConstructionProject[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(e.target.files);
  };

  const handleSubmit = async () => {
    if (!selectedProjectId || !selectedFiles || selectedFiles.length === 0) {
      alert("Please select a project and at least one photo");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Operations User"}');

    // Convert files to base64 and save
    const filePromises = Array.from(selectedFiles).map((file) => {
      return new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          addSitePhoto({
            projectId: selectedProjectId,
            title: title || file.name,
            description,
            fileName: file.name,
            fileSize: file.size,
            takenBy: currentUser.name,
            takenDate: new Date().toISOString(),
            tags: [],
            thumbnail: reader.result as string, // Store base64 data
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    await Promise.all(filePromises);
    alert(`${selectedFiles.length} photo(s) uploaded successfully!`);
    onSaved();
    onClose();
  };

  return (
    <PermissionGuard permission="projects">
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-900 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📷</span>
              Upload Site Photos
            </h3>
            <p className="mt-1 text-sm text-gray-400">Add progress photos to project records</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Project *
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
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

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Foundation excavation - Plot 12"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description of what the photos show..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Photos *
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none file:mr-4 file:rounded file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
            />
            {selectedFiles && selectedFiles.length > 0 && (
              <p className="mt-2 text-sm text-gray-400">
                {selectedFiles.length} file(s) selected
              </p>
            )}
          </div>
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
            Upload Photos
          </button>
        </div>
      </div>
    </div>
    </PermissionGuard>
  );
}
