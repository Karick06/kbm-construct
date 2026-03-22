"use client";

import { useEffect, useRef, useState } from "react";
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

const STORAGE_KEY = "kbm_site_audit_pro_projects_v2";

// (rest of file will be replaced below)

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects from server on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch("/api/site-audits", { cache: "no-store" });
        if (response.ok) {
          const data = (await response.json()) as { audits?: AuditProject[] };
          const loadedProjects = Array.isArray(data.audits) ? data.audits : [];
          setProjects(loadedProjects);
          if (loadedProjects.length > 0) {
            setSelectedProjectId(loadedProjects[0].id);
            setMessage("Loaded projects from shared storage.");
          }
        }
      } catch {
        setMessage("Using local storage (server unavailable).");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  const saveProjects = async (updated: AuditProject[]) => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/site-audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: updated }),
      });

      if (!response.ok) {
        throw new Error("Save failed");
      }

      const data = (await response.json()) as { audits?: AuditProject[] };
      const saved = Array.isArray(data.audits) ? data.audits : updated;
      setProjects(saved);
      setMessage("Saved to shared storage.");
    } catch {
      setMessage("Save failed, but data persists locally.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const createProject = (formData: ProjectFormData) => {
    const newProject: AuditProject = {
      id: `proj-${Date.now()}`,
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      issues: [],
    };

    const updated = [newProject, ...projects];
    setProjects(updated);
    setSelectedProjectId(newProject.id);
    setShowCreateProject(false);
    setMessage("Project created.");
    void saveProjects(updated);
  };

  const addIssue = (formData: { title: string; description: string; severity: IssueSeverity }) => {
    if (!selectedProject) return;

    const newIssue: AuditIssue = {
      id: `issue-${Date.now()}`,
      ...formData,
      status: "open",
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = projects.map((p) =>
      p.id === selectedProject.id
        ? {
            ...p,
            issues: [newIssue, ...p.issues],
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    setProjects(updated);
    setShowLogIssue(false);
    setMessage("Issue logged.");
    void saveProjects(updated);
  };

  const addPhotoToIssue = (issueId: string, base64: string, caption: string) => {
    if (!selectedProject) return;

    const photo: AuditPhoto = {
      id: `photo-${Date.now()}`,
      base64,
      caption,
      uploadedAt: new Date().toISOString(),
    };

    const updated = projects.map((p) =>
      p.id === selectedProject.id
        ? {
            ...p,
            issues: p.issues.map((i) =>
              i.id === issueId
                ? {
                    ...i,
                    photos: [photo, ...i.photos],
                    updatedAt: new Date().toISOString(),
                  }
                : i
            ),
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    setProjects(updated);
    setMessage("Photo added.");
    void saveProjects(updated);
  };

  const updateIssueStatus = (issueId: string, status: IssueStatus) => {
    if (!selectedProject) return;

    const updated = projects.map((p) =>
      p.id === selectedProject.id
        ? {
            ...p,
            issues: p.issues.map((i) =>
              i.id === issueId
                ? {
                    ...i,
                    status,
                    updatedAt: new Date().toISOString(),
                  }
                : i
            ),
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    setProjects(updated);
    void saveProjects(updated);
  };

  const deleteIssue = (issueId: string) => {
    if (!selectedProject) return;

    const updated = projects.map((p) =>
      p.id === selectedProject.id
        ? {
            ...p,
            issues: p.issues.filter((i) => i.id !== issueId),
            updatedAt: new Date().toISOString(),
          }
        : p
    );

    setProjects(updated);
    setMessage("Issue deleted.");
    void saveProjects(updated);
  };

  const deleteProject = (projectId: string) => {
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    if (selectedProjectId === projectId) {
      setSelectedProjectId(updated.length > 0 ? updated[0].id : null);
    }
    setMessage("Project deleted.");
    void saveProjects(updated);
  };

  const exportPDF = () => {
    if (!selectedProject) return;

    // Generate simple HTML report
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Site Audit Report - ${selectedProject.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: white; }
            .header { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
            .project-info { background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-left: 4px solid #ff6b35; }
            .issue { margin: 20px 0; padding: 15px; border: 1px solid #ddd; page-break-inside: avoid; }
            .issue.high { border-left: 4px solid #dc2626; }
            .issue.medium { border-left: 4px solid #f59e0b; }
            .issue.low { border-left: 4px solid #10b981; }
            .issue-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
            .issue-meta { font-size: 12px; color: #666; margin-bottom: 10px; }
            .issue-desc { margin: 10px 0; }
            .photo { max-width: 400px; margin: 10px 0; }
            .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-top: 8px; }
            .status.open { background: #fee2e2; color: #991b1b; }
            .status.in-progress { background: #fef3c7; color: #92400e; }
            .status.resolved { background: #dcfce7; color: #166534; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Site Audit Report</h1>
            <p>Generated: ${new Date().toLocaleString("en-GB")}</p>
          </div>
          
          <div class="project-info">
            <h2>${selectedProject.title}</h2>
            <p><strong>Project Reference:</strong> ${selectedProject.projectRef}</p>
            <p><strong>Client:</strong> ${selectedProject.clientName}</p>
            <p><strong>Company:</strong> ${selectedProject.companyName}</p>
            <p><strong>Created:</strong> ${new Date(selectedProject.createdAt).toLocaleString("en-GB")}</p>
            <p><strong>Total Issues:</strong> ${selectedProject.issues.length}</p>
          </div>

          <div style="margin-bottom: 30px;">
            ${selectedProject.issues
              .map(
                (issue) => `
              <div class="issue ${issue.severity}">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-meta">
                  <strong>Severity:</strong> ${issue.severity.toUpperCase()} | 
                  <strong>Date:</strong> ${new Date(issue.createdAt).toLocaleString("en-GB")}
                </div>
                <div class="issue-desc"><strong>Description:</strong> ${issue.description}</div>
                <div class="status ${issue.status}">${issue.status.toUpperCase()}</div>
                ${
                  issue.photos.length > 0
                    ? `<div style="margin-top: 10px;"><strong>Photos:</strong><div>${issue.photos.map((p) => `<img class="photo" src="${p.base64}" alt="${p.caption}"><p><em>${p.caption}</em></p>`).join("")}</div></div>`
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([html], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-${selectedProject.projectRef}-${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
    setMessage("Report exported.");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Site Audit Pro"
        subtitle="Run repeatable site inspections with scoring and action tracking"
        actions={
          <>
            <button
              onClick={createActionsFromFails}
              className="h-11 rounded-lg border border-gray-700/50 bg-gray-700/30 px-4 text-sm font-semibold text-white hover:bg-gray-700/50"
            >
              Create actions from fails
            </button>
            <button
              onClick={() => void saveAuditToServer()}
              disabled={isSaving || isLoadingFromServer}
              className="h-11 rounded-lg border border-green-700/50 bg-green-700/20 px-4 text-sm font-semibold text-green-200 hover:bg-green-700/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save to shared storage"}
            </button>
            <button
              onClick={exportReport}
              className="h-11 rounded-lg bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Export report
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Pass</p>
          <p className="mt-1 text-2xl font-semibold text-green-400">{score.pass}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Fail</p>
          <p className="mt-1 text-2xl font-semibold text-red-400">{score.fail}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">N/A</p>
          <p className="mt-1 text-2xl font-semibold text-gray-300">{score.na}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Relevant checks</p>
          <p className="mt-1 text-2xl font-semibold text-white">{score.relevant}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase tracking-wider text-gray-400">Audit score</p>
          <p className="mt-1 text-2xl font-semibold text-orange-400">{score.percent}%</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-300">
            {isLoadingFromServer
              ? "Loading audit from shared storage..."
              : auditId
                ? `Audit ID: ${auditId}`
                : "New unsaved audit"}
          </p>
          {updatedAt && (
            <p className="text-xs text-gray-500">
              Last saved: {new Date(updatedAt).toLocaleString("en-GB")}
            </p>
          )}
        </div>

        {recentAudits.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recentAudits.slice(0, 5).map((audit) => (
              <button
                key={audit.id}
                onClick={() => hydrateFromRecord(audit)}
                className="rounded bg-gray-700 px-2 py-1 text-xs text-gray-200 hover:bg-gray-600"
              >
                {audit.meta.projectRef || audit.meta.siteName || audit.id}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Audit details</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            value={meta.siteName}
            onChange={(event) => setMeta((current) => ({ ...current, siteName: event.target.value }))}
            placeholder="Site name"
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            value={meta.projectRef}
            onChange={(event) => setMeta((current) => ({ ...current, projectRef: event.target.value }))}
            placeholder="Project reference"
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            value={meta.auditor}
            onChange={(event) => setMeta((current) => ({ ...current, auditor: event.target.value }))}
            placeholder="Auditor"
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            type="date"
            value={meta.auditDate}
            onChange={(event) => setMeta((current) => ({ ...current, auditDate: event.target.value }))}
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <input
            value={meta.weather}
            onChange={(event) => setMeta((current) => ({ ...current, weather: event.target.value }))}
            placeholder="Weather"
            className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </section>

      <section className="space-y-4">
        {AUDIT_SECTIONS.map((section) => (
          <div key={section.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            <div className="mt-3 space-y-3">
              {section.questions.map((question) => {
                const response = responses[question.id];
                return (
                  <div key={question.id} className="rounded border border-gray-700/50 bg-gray-700/20 p-3">
                    <p className="text-sm text-gray-200">{question.text}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {(["pass", "fail", "na"] as AuditStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateResponse(question.id, { status })}
                          className={`rounded px-3 py-1 text-xs font-semibold transition-colors ${
                            response?.status === status
                              ? status === "pass"
                                ? "bg-green-500 text-white"
                                : status === "fail"
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-500 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                        >
                          {formatStatusLabel(status)}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={response?.note || ""}
                      onChange={(event) => updateResponse(question.id, { note: event.target.value })}
                      placeholder="Notes / observations"
                      className="mt-2 min-h-20 w-full rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Corrective actions</h2>
          <span className="text-xs text-gray-400">{actions.length} action(s)</span>
        </div>

        {actions.length === 0 ? (
          <p className="text-sm text-gray-400">No actions yet. Use “Create actions from fails”.</p>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => (
              <div key={action.id} className="grid gap-2 rounded border border-gray-700/50 bg-gray-700/20 p-3 md:grid-cols-12">
                <input
                  value={action.title}
                  onChange={(event) => updateAction(action.id, "title", event.target.value)}
                  className="rounded bg-gray-700 px-2 py-2 text-sm text-white md:col-span-4"
                />
                <select
                  value={action.severity}
                  onChange={(event) => updateAction(action.id, "severity", event.target.value as Severity)}
                  className="rounded bg-gray-700 px-2 py-2 text-sm text-white md:col-span-2"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <input
                  value={action.owner}
                  onChange={(event) => updateAction(action.id, "owner", event.target.value)}
                  placeholder="Owner"
                  className="rounded bg-gray-700 px-2 py-2 text-sm text-white md:col-span-2"
                />
                <input
                  type="date"
                  value={action.dueDate}
                  onChange={(event) => updateAction(action.id, "dueDate", event.target.value)}
                  className="rounded bg-gray-700 px-2 py-2 text-sm text-white md:col-span-2"
                />
                <div className="flex gap-2 md:col-span-2">
                  <select
                    value={action.status}
                    onChange={(event) => updateAction(action.id, "status", event.target.value as ActionStatus)}
                    className="w-full rounded bg-gray-700 px-2 py-2 text-sm text-white"
                  >
                    <option value="open">{formatActionStatusLabel("open")}</option>
                    <option value="in-progress">{formatActionStatusLabel("in-progress")}</option>
                    <option value="closed">{formatActionStatusLabel("closed")}</option>
                  </select>
                  <button
                    onClick={() => removeAction(action.id)}
                    className="rounded bg-red-500/80 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
        <div>
          <p className="text-sm text-gray-300">{savedStateMessage || "Draft auto-saves in this browser."}</p>
          <p className="text-xs text-gray-500">Reset only clears this browser copy.</p>
        </div>
        <button
          onClick={resetAudit}
          className="rounded border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20"
        >
          Reset audit
        </button>
      </section>
    </div>
  );
}
