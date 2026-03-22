"use client";

import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";

type AuditStatus = "pass" | "fail" | "na";
type ActionStatus = "open" | "in-progress" | "closed";
type Severity = "low" | "medium" | "high";

type AuditQuestion = {
  id: string;
  text: string;
};

type AuditSection = {
  id: string;
  title: string;
  questions: AuditQuestion[];
};

type QuestionResponse = {
  status: AuditStatus;
  note: string;
};

type AuditAction = {
  id: string;
  sourceQuestionId: string;
  title: string;
  severity: Severity;
  owner: string;
  dueDate: string;
  status: ActionStatus;
};

type AuditMeta = {
  siteName: string;
  projectRef: string;
  auditor: string;
  auditDate: string;
  weather: string;
};

type SavedAuditState = {
  meta: AuditMeta;
  responses: Record<string, QuestionResponse>;
  actions: AuditAction[];
};

const STORAGE_KEY = "kbm_site_audit_pro_v1";

const AUDIT_SECTIONS: AuditSection[] = [
  {
    id: "access-housekeeping",
    title: "Access & Housekeeping",
    questions: [
      { id: "safe-access-routes", text: "Safe access/egress routes are maintained and unobstructed" },
      { id: "site-housekeeping", text: "Site housekeeping standard is acceptable across workfaces" },
      { id: "welfare-access", text: "Welfare facilities are available and fit for use" },
    ],
  },
  {
    id: "plant-equipment",
    title: "Plant & Equipment",
    questions: [
      { id: "daily-plant-checks", text: "Daily plant pre-use checks are recorded" },
      { id: "plant-segregation", text: "Plant and pedestrian segregation is effective" },
      { id: "lifting-controls", text: "Lifting operations controls and exclusion zones are in place" },
    ],
  },
  {
    id: "safety-compliance",
    title: "Safety Compliance",
    questions: [
      { id: "ppe-compliance", text: "Required PPE compliance observed in audit area" },
      { id: "rams-briefings", text: "RAMS briefings are current and understood" },
      { id: "permits-available", text: "Relevant permits are in place and visible" },
    ],
  },
  {
    id: "environment",
    title: "Environmental Controls",
    questions: [
      { id: "spill-kits", text: "Spill kits and spill response controls are available" },
      { id: "waste-segregation", text: "Waste segregation and disposal controls are effective" },
      { id: "dust-noise-controls", text: "Dust/noise controls are implemented where required" },
    ],
  },
];

const EMPTY_META: AuditMeta = {
  siteName: "",
  projectRef: "",
  auditor: "",
  auditDate: new Date().toISOString().slice(0, 10),
  weather: "",
};

function buildDefaultResponses(): Record<string, QuestionResponse> {
  const entries = AUDIT_SECTIONS.flatMap((section) =>
    section.questions.map((question) => [
      question.id,
      { status: "na" as AuditStatus, note: "" },
    ])
  );
  return Object.fromEntries(entries);
}

function formatStatusLabel(value: AuditStatus): string {
  if (value === "pass") return "Pass";
  if (value === "fail") return "Fail";
  return "N/A";
}

function formatActionStatusLabel(value: ActionStatus): string {
  if (value === "in-progress") return "In Progress";
  if (value === "closed") return "Closed";
  return "Open";
}

export default function SiteAuditProPage() {
  const [meta, setMeta] = useState<AuditMeta>(EMPTY_META);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>(buildDefaultResponses);
  const [actions, setActions] = useState<AuditAction[]>([]);
  const [savedStateMessage, setSavedStateMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SavedAuditState>;
      if (parsed.meta) setMeta({ ...EMPTY_META, ...parsed.meta });
      if (parsed.responses) {
        setResponses({
          ...buildDefaultResponses(),
          ...parsed.responses,
        });
      }
      if (Array.isArray(parsed.actions)) setActions(parsed.actions);
    } catch {
      // keep defaults
    }
  }, []);

  useEffect(() => {
    const payload: SavedAuditState = { meta, responses, actions };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [meta, responses, actions]);

  const score = useMemo(() => {
    const values = Object.values(responses);
    const pass = values.filter((item) => item.status === "pass").length;
    const fail = values.filter((item) => item.status === "fail").length;
    const na = values.filter((item) => item.status === "na").length;
    const relevant = pass + fail;
    const percent = relevant > 0 ? Math.round((pass / relevant) * 100) : 0;

    return { pass, fail, na, relevant, percent };
  }, [responses]);

  const failedQuestionIds = useMemo(
    () =>
      Object.entries(responses)
        .filter(([, value]) => value.status === "fail")
        .map(([questionId]) => questionId),
    [responses]
  );

  const allQuestionsById = useMemo(() => {
    const pairs = AUDIT_SECTIONS.flatMap((section) =>
      section.questions.map(
        (question): [string, string] => [question.id, question.text]
      )
    );
    return new Map<string, string>(pairs);
  }, []);

  const updateResponse = (questionId: string, partial: Partial<QuestionResponse>) => {
    setResponses((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        ...partial,
      },
    }));
  };

  const createActionsFromFails = () => {
    if (failedQuestionIds.length === 0) {
      setSavedStateMessage("No failed items to convert into actions.");
      return;
    }

    setActions((current) => {
      const existingByQuestion = new Set(current.map((action) => action.sourceQuestionId));
      const newActions = failedQuestionIds
        .filter((questionId) => !existingByQuestion.has(questionId))
        .map((questionId) => ({
          id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          sourceQuestionId: questionId,
          title: allQuestionsById.get(questionId) || questionId,
          severity: "medium" as Severity,
          owner: "",
          dueDate: "",
          status: "open" as ActionStatus,
        }));

      if (newActions.length === 0) {
        setSavedStateMessage("All failed items already have actions.");
        return current;
      }

      setSavedStateMessage(`Created ${newActions.length} new action(s).`);
      return [...newActions, ...current];
    });
  };

  const updateAction = <K extends keyof AuditAction>(
    actionId: string,
    key: K,
    value: AuditAction[K]
  ) => {
    setActions((current) =>
      current.map((action) =>
        action.id === actionId
          ? {
              ...action,
              [key]: value,
            }
          : action
      )
    );
  };

  const removeAction = (actionId: string) => {
    setActions((current) => current.filter((action) => action.id !== actionId));
  };

  const resetAudit = () => {
    setMeta(EMPTY_META);
    setResponses(buildDefaultResponses());
    setActions([]);
    setSavedStateMessage("Audit reset.");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  const exportReport = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      meta,
      score,
      responses,
      actions,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `site-audit-${meta.projectRef || "report"}-${meta.auditDate || "today"}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    setSavedStateMessage("Audit report exported.");
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
