"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import PageHeader from "@/components/PageHeader";

type IssueSeverity = "low" | "medium" | "high";
type IssueStatus = "open" | "in-progress" | "resolved";

type AuditPhoto = {
  id: string;
  base64: string;
  caption: string;
  uploadedAt: string;
};

type AuditIssue = {
  id: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  status: IssueStatus;
  owner: string;
  dueDate: string;
  photos: AuditPhoto[];
  createdAt: string;
  updatedAt: string;
};

type AuditProject = {
  id: string;
  title: string;
  projectRef: string;
  clientName: string;
  companyName: string;
  createdAt: string;
  updatedAt: string;
  issues: AuditIssue[];
};

type ProjectFormData = {
  title: string;
  projectRef: string;
  clientName: string;
  companyName: string;
};

type IssueFormData = {
  title: string;
  description: string;
  severity: IssueSeverity;
  owner: string;
  dueDate: string;
};

const STORAGE_KEY = "kbm_site_audit_pro_projects_v2";

function buildId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sortProjects(projects: AuditProject[]): AuditProject[] {
  return [...projects].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

export default function SiteAuditProPage() {
  const [projects, setProjects] = useState<AuditProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showLogIssue, setShowLogIssue] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [issueSearch, setIssueSearch] = useState("");
  const [issueSeverityFilter, setIssueSeverityFilter] = useState<"all" | IssueSeverity>("all");
  const [issueStatusFilter, setIssueStatusFilter] = useState<"all" | IssueStatus>("all");
  const [issueSort, setIssueSort] = useState<"newest" | "oldest" | "severity">("newest");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch("/api/site-audits", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Failed to load projects");
        }

        const data = (await response.json()) as { audits?: AuditProject[] };
        const loadedProjects = sortProjects(Array.isArray(data.audits) ? data.audits : []);
        setProjects(loadedProjects);

        if (loadedProjects.length > 0) {
          setSelectedProjectId(loadedProjects[0].id);
          setMessage("Loaded projects from shared storage.");
        }
      } catch {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw) as AuditProject[];
            const localProjects = sortProjects(Array.isArray(parsed) ? parsed : []);
            setProjects(localProjects);
            if (localProjects.length > 0) {
              setSelectedProjectId(localProjects[0].id);
            }
            setMessage("Loaded local draft projects.");
          }
        } catch {
          setMessage("Unable to load saved projects.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [isLoading, projects]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  const saveProjects = async (updatedProjects: AuditProject[], successMessage?: string) => {
    const sortedProjects = sortProjects(updatedProjects);
    setProjects(sortedProjects);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedProjects));

    try {
      setIsSaving(true);
      const response = await fetch("/api/site-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: sortedProjects }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { audits?: AuditProject[] };
      const persistedProjects = sortProjects(
        Array.isArray(data.audits) ? data.audits : sortedProjects
      );
      setProjects(persistedProjects);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedProjects));
      setMessage(successMessage ?? "Saved to shared storage.");
    } catch {
      setMessage("Saved locally. Shared sync failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const createProject = (formData: ProjectFormData) => {
    const now = new Date().toISOString();
    const project: AuditProject = {
      id: buildId("proj"),
      ...formData,
      createdAt: now,
      updatedAt: now,
      issues: [],
    };

    const updatedProjects = [project, ...projects];
    setSelectedProjectId(project.id);
    setShowCreateProject(false);
    void saveProjects(updatedProjects, "Project created.");
  };

  const addIssue = (formData: IssueFormData) => {
    if (!selectedProject) return;

    const now = new Date().toISOString();
    const issue: AuditIssue = {
      id: buildId("issue"),
      title: formData.title,
      description: formData.description,
      severity: formData.severity,
      status: "open",
      owner: formData.owner,
      dueDate: formData.dueDate,
      photos: [],
      createdAt: now,
      updatedAt: now,
    };

    const updatedProjects = projects.map((project) =>
      project.id === selectedProject.id
        ? {
            ...project,
            updatedAt: now,
            issues: [issue, ...project.issues],
          }
        : project
    );

    setShowLogIssue(false);
    void saveProjects(updatedProjects, "Issue logged.");
  };

  const updateIssueStatus = (issueId: string, status: IssueStatus) => {
    if (!selectedProject) return;

    const now = new Date().toISOString();
    const updatedProjects = projects.map((project) =>
      project.id === selectedProject.id
        ? {
            ...project,
            updatedAt: now,
            issues: project.issues.map((issue) =>
              issue.id === issueId ? { ...issue, status, updatedAt: now } : issue
            ),
          }
        : project
    );

    void saveProjects(updatedProjects, "Issue updated.");
  };

  const addPhotoToIssue = (issueId: string, base64: string, caption: string) => {
    if (!selectedProject) return;

    const now = new Date().toISOString();
    const photo: AuditPhoto = {
      id: buildId("photo"),
      base64,
      caption,
      uploadedAt: now,
    };

    const updatedProjects = projects.map((project) =>
      project.id === selectedProject.id
        ? {
            ...project,
            updatedAt: now,
            issues: project.issues.map((issue) =>
              issue.id === issueId
                ? {
                    ...issue,
                    updatedAt: now,
                    photos: [photo, ...issue.photos],
                  }
                : issue
            ),
          }
        : project
    );

    void saveProjects(updatedProjects, "Photo added.");
  };

  const deleteIssue = (issueId: string) => {
    if (!selectedProject) return;

    const now = new Date().toISOString();
    const updatedProjects = projects.map((project) =>
      project.id === selectedProject.id
        ? {
            ...project,
            updatedAt: now,
            issues: project.issues.filter((issue) => issue.id !== issueId),
          }
        : project
    );

    void saveProjects(updatedProjects, "Issue deleted.");
  };

  const deleteProject = (projectId: string) => {
    const updatedProjects = projects.filter((project) => project.id !== projectId);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(updatedProjects[0]?.id ?? null);
    }
    void saveProjects(updatedProjects, "Project deleted.");
  };

  const exportReport = () => {
    if (!selectedProject) return;

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Site Audit Report - ${selectedProject.title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
      .header { border-bottom: 3px solid #f97316; padding-bottom: 16px; margin-bottom: 24px; }
      .meta { background: #f9fafb; border: 1px solid #e5e7eb; padding: 16px; margin-bottom: 24px; }
      .issue { border: 1px solid #d1d5db; padding: 16px; margin-bottom: 16px; page-break-inside: avoid; }
      .severity-high { border-left: 6px solid #dc2626; }
      .severity-medium { border-left: 6px solid #f59e0b; }
      .severity-low { border-left: 6px solid #10b981; }
      .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 12px; font-weight: bold; }
      .status-open { background: #fee2e2; color: #991b1b; }
      .status-in-progress { background: #fef3c7; color: #92400e; }
      .status-resolved { background: #dcfce7; color: #166534; }
      .photo { max-width: 320px; max-height: 220px; margin: 12px 12px 0 0; border: 1px solid #e5e7eb; }
      .photos { display: flex; flex-wrap: wrap; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Site Audit Report</h1>
      <p>Generated ${new Date().toLocaleString("en-GB")}</p>
    </div>
    <div class="meta">
      <p><strong>Project:</strong> ${selectedProject.title}</p>
      <p><strong>Reference:</strong> ${selectedProject.projectRef}</p>
      <p><strong>Client:</strong> ${selectedProject.clientName}</p>
      <p><strong>Company:</strong> ${selectedProject.companyName}</p>
      <p><strong>Total issues:</strong> ${selectedProject.issues.length}</p>
    </div>
    ${selectedProject.issues
      .map(
        (issue) => `<div class="issue severity-${issue.severity}">
          <h3>${issue.title}</h3>
          <p><strong>Severity:</strong> ${issue.severity.toUpperCase()}</p>
          <p><strong>Created:</strong> ${new Date(issue.createdAt).toLocaleString("en-GB")}</p>
          <p><span class="badge status-${issue.status}">${issue.status.toUpperCase()}</span></p>
          <p>${issue.description}</p>
          <div class="photos">
            ${issue.photos
              .map(
                (photo) => `<div>
                  <img class="photo" src="${photo.base64}" alt="${photo.caption}" />
                  <p>${photo.caption || ""}</p>
                </div>`
              )
              .join("")}
          </div>
        </div>`
      )
      .join("")}
  </body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `site-audit-${selectedProject.projectRef || selectedProject.id}.html`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Report exported.");
  };

  const projectStats = useMemo(() => {
    if (!selectedProject) {
      return { total: 0, high: 0, resolved: 0, overdue: 0 };
    }

    const nowDate = new Date().toISOString().slice(0, 10);

    return {
      total: selectedProject.issues.length,
      high: selectedProject.issues.filter((issue) => issue.severity === "high").length,
      resolved: selectedProject.issues.filter((issue) => issue.status === "resolved").length,
      overdue: selectedProject.issues.filter(
        (issue) => issue.status !== "resolved" && issue.dueDate && issue.dueDate < nowDate
      ).length,
    };
  }, [selectedProject]);

  const visibleIssues = useMemo(() => {
    if (!selectedProject) return [];

    const severityRank: Record<IssueSeverity, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const search = issueSearch.trim().toLowerCase();
    const filtered = selectedProject.issues.filter((issue) => {
      const matchesSearch =
        search.length === 0 ||
        issue.title.toLowerCase().includes(search) ||
        issue.description.toLowerCase().includes(search) ||
        issue.owner.toLowerCase().includes(search);
      const matchesSeverity =
        issueSeverityFilter === "all" || issue.severity === issueSeverityFilter;
      const matchesStatus = issueStatusFilter === "all" || issue.status === issueStatusFilter;

      return matchesSearch && matchesSeverity && matchesStatus;
    });

    return [...filtered].sort((left, right) => {
      if (issueSort === "oldest") {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      }
      if (issueSort === "severity") {
        const severityDelta = severityRank[right.severity] - severityRank[left.severity];
        if (severityDelta !== 0) return severityDelta;
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [issueSearch, issueSeverityFilter, issueSort, issueStatusFilter, selectedProject]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Site Audit Pro"
        subtitle="Create projects, log issues, attach photos and export professional reports"
        actions={
          <>
            {selectedProject ? (
              <>
                <button
                  onClick={() => setShowLogIssue(true)}
                  className="h-11 rounded-lg border border-blue-700/50 bg-blue-700/20 px-4 text-sm font-semibold text-blue-200 hover:bg-blue-700/35"
                >
                  Log issue
                </button>
                <button
                  onClick={exportReport}
                  className="h-11 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Export report
                </button>
              </>
            ) : null}
            <button
              onClick={() => setShowCreateProject(true)}
              className="h-11 rounded-lg border border-green-700/50 bg-green-700/20 px-4 text-sm font-semibold text-green-200 hover:bg-green-700/35"
            >
              New project
            </button>
          </>
        }
      />

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-300">
            {isLoading
              ? "Loading Site Audit Pro..."
              : message || "Create a project to start logging issues."}
          </p>
          <p className="text-xs text-gray-500">
            {isSaving ? "Syncing to shared storage..." : "Shared storage ready"}
          </p>
        </div>
      </section>

      {!isLoading && projects.length === 0 ? (
        <section className="rounded-lg border border-dashed border-gray-700/50 bg-gray-800/40 p-10 text-center">
          <h2 className="text-lg font-semibold text-white">No audit projects yet</h2>
          <p className="mt-2 text-sm text-gray-400">
            Create a project, then add issues with descriptions and photo evidence.
          </p>
          <button
            onClick={() => setShowCreateProject(true)}
            className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Create first project
          </button>
        </section>
      ) : null}

      {projects.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => setSelectedProjectId(project.id)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                selectedProjectId === project.id
                  ? "border-[var(--accent)] bg-gray-800"
                  : "border-gray-700/50 bg-gray-800/80 hover:bg-gray-800"
              }`}
            >
              <p className="font-semibold text-white">{project.title}</p>
              <p className="text-xs text-gray-400">{project.projectRef}</p>
              <p className="mt-3 text-xs text-gray-500">{project.issues.length} issue(s)</p>
              <p className="text-xs text-gray-600">
                Updated {new Date(project.updatedAt).toLocaleDateString("en-GB")}
              </p>
            </button>
          ))}
        </section>
      ) : null}

      {selectedProject ? (
        <>
          <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{selectedProject.title}</h2>
                <p className="text-sm text-gray-400">{selectedProject.projectRef}</p>
                <div className="mt-3 grid gap-1 text-sm text-gray-300">
                  <p>
                    <strong>Client:</strong> {selectedProject.clientName}
                  </p>
                  <p>
                    <strong>Company:</strong> {selectedProject.companyName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(selectedProject.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (window.confirm("Delete this project? This cannot be undone.")) {
                    deleteProject(selectedProject.id);
                  }
                }}
                className="rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
              >
                Delete project
              </button>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total issues" value={projectStats.total} tone="text-white" />
            <StatCard label="High severity" value={projectStats.high} tone="text-red-400" />
            <StatCard label="Resolved" value={projectStats.resolved} tone="text-green-400" />
            <StatCard label="Overdue" value={projectStats.overdue} tone="text-yellow-300" />
          </section>

          <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Issues</h3>
              <button
                onClick={() => setShowLogIssue(true)}
                className="rounded border border-blue-700/50 bg-blue-700/20 px-3 py-2 text-xs font-semibold text-blue-200 hover:bg-blue-700/35"
              >
                Add issue
              </button>
            </div>

            <div className="mb-4 grid gap-2 md:grid-cols-4">
              <input
                value={issueSearch}
                onChange={(event) => setIssueSearch(event.target.value)}
                placeholder="Search title, description or owner"
                className="rounded bg-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={issueSeverityFilter}
                onChange={(event) =>
                  setIssueSeverityFilter(event.target.value as "all" | IssueSeverity)
                }
                className="rounded bg-gray-700 px-3 py-2 text-sm text-white"
              >
                <option value="all">All severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={issueStatusFilter}
                onChange={(event) =>
                  setIssueStatusFilter(event.target.value as "all" | IssueStatus)
                }
                className="rounded bg-gray-700 px-3 py-2 text-sm text-white"
              >
                <option value="all">All statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <select
                value={issueSort}
                onChange={(event) =>
                  setIssueSort(event.target.value as "newest" | "oldest" | "severity")
                }
                className="rounded bg-gray-700 px-3 py-2 text-sm text-white"
              >
                <option value="newest">Sort: Newest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="severity">Sort: Severity</option>
              </select>
            </div>

            {visibleIssues.length === 0 ? (
              <p className="text-sm text-gray-400">
                No matching issues. Try adjusting filters or add a new issue.
              </p>
            ) : (
              <div className="space-y-3">
                {visibleIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`rounded-lg border p-4 ${
                      issue.severity === "high"
                        ? "border-red-500/40 bg-red-500/10"
                        : issue.severity === "medium"
                          ? "border-yellow-500/40 bg-yellow-500/10"
                          : "border-gray-700/50 bg-gray-700/20"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{issue.title}</p>
                          <span
                            className={`rounded px-2 py-1 text-[10px] font-semibold ${
                              issue.severity === "high"
                                ? "bg-red-500/70 text-white"
                                : issue.severity === "medium"
                                  ? "bg-yellow-500/70 text-white"
                                  : "bg-green-500/70 text-white"
                            }`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-300">{issue.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Logged {new Date(issue.createdAt).toLocaleString("en-GB")}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Owner: {issue.owner || "Unassigned"}
                          {issue.dueDate ? ` • Due ${issue.dueDate}` : ""}
                        </p>
                      </div>

                      <select
                        value={issue.status}
                        onChange={(event) =>
                          updateIssueStatus(issue.id, event.target.value as IssueStatus)
                        }
                        className="rounded bg-gray-700 px-2 py-2 text-xs text-white"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </div>

                    {issue.photos.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {issue.photos.map((photo) => (
                          <div key={photo.id} className="rounded border border-gray-700/50 bg-gray-900/40 p-2">
                            <img
                              src={photo.base64}
                              alt={photo.caption || issue.title}
                              className="h-28 w-full rounded object-cover"
                            />
                            <p className="mt-2 text-xs text-gray-400">{photo.caption || "No caption"}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setSelectedIssueId(issue.id);
                          setShowPhotoModal(true);
                        }}
                        className="rounded border border-blue-500/50 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
                      >
                        Add photo
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm("Delete this issue?")) {
                            deleteIssue(issue.id);
                          }
                        }}
                        className="rounded border border-red-500/50 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}

      {showCreateProject ? (
        <CreateProjectModal
          onClose={() => setShowCreateProject(false)}
          onSubmit={createProject}
        />
      ) : null}

      {showLogIssue ? (
        <LogIssueModal onClose={() => setShowLogIssue(false)} onSubmit={addIssue} />
      ) : null}

      {showPhotoModal && selectedIssueId ? (
        <AddPhotoModal
          fileInputRef={fileInputRef}
          onClose={() => {
            setShowPhotoModal(false);
            setSelectedIssueId(null);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          onSubmit={(caption) => {
            const file = fileInputRef.current?.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
              const result = event.target?.result;
              if (typeof result === "string") {
                addPhotoToIssue(selectedIssueId, result, caption);
                setShowPhotoModal(false);
                setSelectedIssueId(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }
            };
            reader.readAsDataURL(file);
          }}
        />
      ) : null}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
}) {
  const [formData, setFormData] = useState<ProjectFormData>({
    title: "",
    projectRef: "",
    clientName: "",
    companyName: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-700/50 bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Create audit project</h2>
        <div className="space-y-3">
          <input
            value={formData.title}
            onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            placeholder="Project title"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            value={formData.projectRef}
            onChange={(event) => setFormData((current) => ({ ...current, projectRef: event.target.value }))}
            placeholder="Project reference"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            value={formData.clientName}
            onChange={(event) => setFormData((current) => ({ ...current, clientName: event.target.value }))}
            placeholder="Client name"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            value={formData.companyName}
            onChange={(event) => setFormData((current) => ({ ...current, companyName: event.target.value }))}
            placeholder="Company name"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onSubmit(formData)}
            disabled={!formData.title.trim() || !formData.projectRef.trim()}
            className="flex-1 rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            Create
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function LogIssueModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: IssueFormData) => void;
}) {
  const [formData, setFormData] = useState<IssueFormData>({
    title: "",
    description: "",
    severity: "medium",
    owner: "",
    dueDate: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-700/50 bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Log issue</h2>
        <div className="space-y-3">
          <input
            value={formData.title}
            onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))}
            placeholder="Issue title"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <textarea
            value={formData.description}
            onChange={(event) =>
              setFormData((current) => ({ ...current, description: event.target.value }))
            }
            rows={5}
            placeholder="Describe the issue and required action"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <select
            value={formData.severity}
            onChange={(event) =>
              setFormData((current) => ({ ...current, severity: event.target.value as IssueSeverity }))
            }
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white"
          >
            <option value="low">Low severity</option>
            <option value="medium">Medium severity</option>
            <option value="high">High severity</option>
          </select>
          <input
            value={formData.owner}
            onChange={(event) => setFormData((current) => ({ ...current, owner: event.target.value }))}
            placeholder="Owner / responsible person"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="date"
            value={formData.dueDate}
            onChange={(event) => setFormData((current) => ({ ...current, dueDate: event.target.value }))}
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onSubmit(formData)}
            disabled={!formData.title.trim() || !formData.description.trim()}
            className="flex-1 rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            Save issue
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AddPhotoModal({
  fileInputRef,
  onClose,
  onSubmit,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSubmit: (caption: string) => void;
}) {
  const [caption, setCaption] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-700/50 bg-gray-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Add photo evidence</h2>
        <div className="space-y-3">
          <input ref={fileInputRef} type="file" accept="image/*" className="w-full text-sm text-gray-300" />
          <input
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            placeholder="Caption"
            className="w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => onSubmit(caption)}
            className="flex-1 rounded bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            Upload
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}