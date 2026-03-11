"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useEffect, useMemo, useState } from "react";

type ValuationStatus = "Under Review" | "Certified" | "Part Certified";

type Valuation = {
  ref: string;
  project: string;
  period: string;
  applied: string;
  certified: string;
  status: ValuationStatus;
};

type VariationStage = "Pending" | "Submitted" | "Approved";

type Variation = {
  ref: string;
  title: string;
  value: string;
  stage: VariationStage;
};

type TaskItem = {
  id: string;
  title: string;
  meta: string;
};

type TaskBucket = {
  title: string;
  items: TaskItem[];
};

type ProcurementItem = {
  id: string;
  package: string;
  status: string;
  due: string;
};

const kpiCards = [
  { label: "Forecast Final Account", value: "£18.6M", change: "+1.2% vs last month", accent: "border-l-orange-500", icon: "📈" },
  { label: "Gross Margin", value: "14.8%", change: "-0.6% month on month", accent: "border-l-yellow-500", icon: "💹" },
  { label: "Cost To Complete", value: "£6.4M", change: "Cost pressure on civils", accent: "border-l-blue-500", icon: "🧮" },
  { label: "Applications vs Certified", value: "£1.2M / £980k", change: "£220k pending", accent: "border-l-green-500", icon: "🧾" },
  { label: "Variations Approved/Pending", value: "£680k / £420k", change: "6 awaiting review", accent: "border-l-purple-500", icon: "🧷" },
];

const DEFAULT_TASK_BUCKETS: TaskBucket[] = [
  {
    title: "This Week",
    items: [
      { id: "T-001", title: "Prepare CVR pack for March", meta: "Due Thu" },
      { id: "T-002", title: "Review subcontractor application 05", meta: "North Depot" },
      { id: "T-003", title: "Update risk register for earthworks", meta: "A12 corridor" },
    ],
  },
  {
    title: "Awaiting Info",
    items: [
      { id: "T-004", title: "Client valuation backup", meta: "Metro Council" },
      { id: "T-005", title: "Design clarification", meta: "Station forecourt" },
      { id: "T-006", title: "Supplier rate update", meta: "Tarmac package" },
    ],
  },
  {
    title: "Upcoming",
    items: [
      { id: "T-007", title: "Monthly cost forecast", meta: "Next Monday" },
      { id: "T-008", title: "Re-measurement for piling", meta: "Block C" },
      { id: "T-009", title: "Change control workshop", meta: "12 Mar" },
    ],
  },
];

const costReport = [
  { package: "Civils", budget: "£4.2M", committed: "£3.6M", forecast: "£4.5M", variance: "+£300k" },
  { package: "Groundworks", budget: "£2.1M", committed: "£1.9M", forecast: "£2.0M", variance: "-£100k" },
  { package: "Asphalt", budget: "£1.4M", committed: "£1.1M", forecast: "£1.5M", variance: "+£100k" },
  { package: "Surfacing", budget: "£900k", committed: "£720k", forecast: "£850k", variance: "-£50k" },
  { package: "Earthworks", budget: "£3.0M", committed: "£2.8M", forecast: "£3.2M", variance: "+£200k" },
];

const DEFAULT_PROCUREMENT: ProcurementItem[] = [
  { id: "P-001", package: "Asphalt Works", status: "Tender Review", due: "18 Feb" },
  { id: "P-002", package: "Traffic Management", status: "Award", due: "22 Feb" },
  { id: "P-003", package: "Concrete Supply", status: "Shortlist", due: "26 Feb" },
];

const statusPillStyles: Record<string, string> = {
  "Under Review": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Certified": "bg-green-500/20 text-green-400 border-green-500/30",
  "Part Certified": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Pending": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Submitted": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Approved": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const DEFAULT_VALUATIONS: Valuation[] = [
  { ref: "VAL-031", project: "A12 Upgrades", period: "Feb 2026", applied: "£620k", certified: "£510k", status: "Under Review" },
  { ref: "VAL-030", project: "City Ring Road", period: "Jan 2026", applied: "£740k", certified: "£740k", status: "Certified" },
  { ref: "VAL-029", project: "North Depot", period: "Jan 2026", applied: "£380k", certified: "£300k", status: "Part Certified" },
];

const DEFAULT_VARIATIONS: Variation[] = [
  { ref: "VAR-118", title: "Drainage redesign", value: "£180k", stage: "Pending" },
  { ref: "VAR-117", title: "Additional piling", value: "£240k", stage: "Submitted" },
  { ref: "VAR-116", title: "Surfacing scope change", value: "£90k", stage: "Approved" },
  { ref: "VAR-115", title: "Temporary works extension", value: "£70k", stage: "Pending" },
];

const STORAGE_KEYS = {
  valuations: "kbm-commercial-qs-valuations",
  variations: "kbm-commercial-qs-variations",
  tasks: "kbm-commercial-qs-tasks",
  procurement: "kbm-commercial-qs-procurement",
};

export default function CommercialOverviewPage() {
  const [valuations, setValuations] = useState<Valuation[]>(DEFAULT_VALUATIONS);
  const [variations, setVariations] = useState<Variation[]>(DEFAULT_VARIATIONS);
  const [taskBoard, setTaskBoard] = useState<TaskBucket[]>(DEFAULT_TASK_BUCKETS);
  const [procurementItems, setProcurementItems] = useState<ProcurementItem[]>(DEFAULT_PROCUREMENT);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showVariationModal, setShowVariationModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProcurementModal, setShowProcurementModal] = useState(false);
  const [showAllValuations, setShowAllValuations] = useState(false);

  const [newValuation, setNewValuation] = useState({
    project: "",
    period: "",
    applied: "",
    certified: "",
    status: "Under Review" as ValuationStatus,
  });

  const [newVariation, setNewVariation] = useState({
    title: "",
    value: "",
    stage: "Pending" as VariationStage,
  });

  const [newTask, setNewTask] = useState({
    title: "",
    meta: "",
    bucket: DEFAULT_TASK_BUCKETS[0].title,
  });

  const [newProcurement, setNewProcurement] = useState({
    package: "",
    status: "Tender Review",
    due: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedValuations = localStorage.getItem(STORAGE_KEYS.valuations);
    if (storedValuations) {
      try {
        const parsed = JSON.parse(storedValuations) as Valuation[];
        if (Array.isArray(parsed)) {
          setValuations(parsed);
        }
      } catch {
        setValuations(DEFAULT_VALUATIONS);
      }
    }

    const storedVariations = localStorage.getItem(STORAGE_KEYS.variations);
    if (storedVariations) {
      try {
        const parsed = JSON.parse(storedVariations) as Variation[];
        if (Array.isArray(parsed)) {
          setVariations(parsed);
        }
      } catch {
        setVariations(DEFAULT_VARIATIONS);
      }
    }

    const storedTasks = localStorage.getItem(STORAGE_KEYS.tasks);
    if (storedTasks) {
      try {
        const parsed = JSON.parse(storedTasks) as TaskBucket[];
        if (Array.isArray(parsed)) {
          setTaskBoard(parsed);
        }
      } catch {
        setTaskBoard(DEFAULT_TASK_BUCKETS);
      }
    }

    const storedProcurement = localStorage.getItem(STORAGE_KEYS.procurement);
    if (storedProcurement) {
      try {
        const parsed = JSON.parse(storedProcurement) as ProcurementItem[];
        if (Array.isArray(parsed)) {
          setProcurementItems(parsed);
        }
      } catch {
        setProcurementItems(DEFAULT_PROCUREMENT);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.valuations, JSON.stringify(valuations));
  }, [valuations]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.variations, JSON.stringify(variations));
  }, [variations]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(taskBoard));
  }, [taskBoard]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.procurement, JSON.stringify(procurementItems));
  }, [procurementItems]);

  const valuationRows = useMemo(() => {
    if (showAllValuations) return valuations;
    return valuations.slice(0, 3);
  }, [showAllValuations, valuations]);

  const handleAddValuation = () => {
    if (!newValuation.project || !newValuation.period || !newValuation.applied) return;

    const nextRef = `VAL-${String(valuations.length + 1).padStart(3, "0")}`;
    setValuations((prev) => [
      {
        ref: nextRef,
        project: newValuation.project,
        period: newValuation.period,
        applied: newValuation.applied,
        certified: newValuation.certified || "£0",
        status: newValuation.status,
      },
      ...prev,
    ]);

    setNewValuation({ project: "", period: "", applied: "", certified: "", status: "Under Review" });
    setShowValuationModal(false);
  };

  const handleAddVariation = () => {
    if (!newVariation.title || !newVariation.value) return;

    const nextRef = `VAR-${String(variations.length + 1).padStart(3, "0")}`;
    setVariations((prev) => [
      {
        ref: nextRef,
        title: newVariation.title,
        value: newVariation.value,
        stage: newVariation.stage,
      },
      ...prev,
    ]);

    setNewVariation({ title: "", value: "", stage: "Pending" });
    setShowVariationModal(false);
  };

  const handleAddTask = () => {
    if (!newTask.title || !newTask.bucket) return;

    const nextId = `T-${String(Date.now()).slice(-6)}`;
    setTaskBoard((prev) =>
      prev.map((bucket) =>
        bucket.title === newTask.bucket
          ? {
              ...bucket,
              items: [{ id: nextId, title: newTask.title, meta: newTask.meta || "" }, ...bucket.items],
            }
          : bucket
      )
    );

    setNewTask({ title: "", meta: "", bucket: taskBoard[0]?.title || "This Week" });
    setShowTaskModal(false);
  };

  const handleAddProcurement = () => {
    if (!newProcurement.package || !newProcurement.status || !newProcurement.due) return;

    const nextId = `P-${String(Date.now()).slice(-6)}`;
    setProcurementItems((prev) => [
      {
        id: nextId,
        package: newProcurement.package,
        status: newProcurement.status,
        due: newProcurement.due,
      },
      ...prev,
    ]);

    setNewProcurement({ package: "", status: "Tender Review", due: "" });
    setShowProcurementModal(false);
  };

  return (
    <PermissionGuard permission="invoices">
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowValuationModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            + New Valuation
          </button>
          <button
            onClick={() => setShowVariationModal(true)}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Log Variation
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpiCards.map((stat) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 ${stat.accent} bg-gray-800/80 px-4 py-4`}
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{stat.label}</p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.change}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Cost Report (CVR Snapshot)</h2>
            <span className="text-xs text-gray-400">Placeholder data</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                  <th className="pb-2">Package</th>
                  <th className="pb-2">Budget</th>
                  <th className="pb-2">Committed</th>
                  <th className="pb-2">Forecast</th>
                  <th className="pb-2">Variance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {costReport.map((row) => (
                  <tr key={row.package} className="hover:bg-gray-700/30">
                    <td className="py-3 text-white font-medium">{row.package}</td>
                    <td className="py-3 text-gray-300">{row.budget}</td>
                    <td className="py-3 text-gray-300">{row.committed}</td>
                    <td className="py-3 text-white font-semibold">{row.forecast}</td>
                    <td className="py-3 text-orange-400 font-semibold">{row.variance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">QS Task Board</h2>
            <button
              onClick={() => setShowTaskModal(true)}
              className="rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              + Add Task
            </button>
          </div>
          <div className="space-y-4">
            {taskBoard.map((bucket) => (
              <div key={bucket.title} className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{bucket.title}</p>
                <div className="space-y-2">
                  {bucket.items.map((item) => (
                    <div key={item.title} className="rounded bg-gray-800 px-3 py-2">
                      <p className="text-sm text-white">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.meta}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Valuations & Applications</h2>
            <button
              onClick={() => setShowAllValuations((prev) => !prev)}
              className="text-sm font-medium text-orange-400 hover:text-orange-300"
            >
              {showAllValuations ? "Show less" : "View all →"}
            </button>
          </div>
          <div className="space-y-3">
            {valuationRows.map((item) => (
              <div key={item.ref} className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.project}</p>
                    <p className="text-xs text-gray-400">{item.ref} • {item.period}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${statusPillStyles[item.status]}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-gray-400">
                  <div><span className="text-gray-500">Applied:</span> {item.applied}</div>
                  <div><span className="text-gray-500">Certified:</span> {item.certified}</div>
                  <div><span className="text-gray-500">Delta:</span> {item.status === "Certified" ? "£0" : "Pending"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Procurement Pipeline</h2>
            <button
              onClick={() => setShowProcurementModal(true)}
              className="rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              + Add Package
            </button>
          </div>
          <div className="space-y-3">
            {procurementItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
                <p className="text-sm font-semibold text-white">{item.package}</p>
                <p className="text-xs text-gray-400">Status: {item.status}</p>
                <p className="text-xs text-gray-500">Due: {item.due}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Variation Register</h2>
          <div className="space-y-3">
            {variations.map((item) => (
              <div key={item.ref} className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-gray-400">{item.ref}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${statusPillStyles[item.stage]}`}>
                    {item.stage}
                  </span>
                </div>
                <p className="mt-2 text-sm text-orange-400 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <h2 className="text-xl font-bold text-white mb-4">Actions & Next Steps</h2>
          <div className="space-y-3">
            <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <p className="text-sm font-semibold text-white">Submit March applications</p>
              <p className="text-xs text-gray-400">Compile supporting measures and backup by 28 Feb.</p>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <p className="text-sm font-semibold text-white">Hold subcontractor tender review</p>
              <p className="text-xs text-gray-400">Confirm shortlisted pricing and issue recommendation.</p>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <p className="text-sm font-semibold text-white">Issue change control log</p>
              <p className="text-xs text-gray-400">Publish latest variation tracker to PM team.</p>
            </div>
          </div>
        </div>
      </section>

      {showValuationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">New Valuation</h2>
              <button
                onClick={() => setShowValuationModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Project *</label>
                <input
                  type="text"
                  value={newValuation.project}
                  onChange={(e) => setNewValuation({ ...newValuation, project: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Period *</label>
                <input
                  type="text"
                  value={newValuation.period}
                  onChange={(e) => setNewValuation({ ...newValuation, period: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., Mar 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Applied *</label>
                  <input
                    type="text"
                    value={newValuation.applied}
                    onChange={(e) => setNewValuation({ ...newValuation, applied: e.target.value })}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="£450k"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Certified</label>
                  <input
                    type="text"
                    value={newValuation.certified}
                    onChange={(e) => setNewValuation({ ...newValuation, certified: e.target.value })}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="£0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Status</label>
                <select
                  value={newValuation.status}
                  onChange={(e) => setNewValuation({ ...newValuation, status: e.target.value as ValuationStatus })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="Certified">Certified</option>
                  <option value="Part Certified">Part Certified</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleAddValuation}
                disabled={!newValuation.project || !newValuation.period || !newValuation.applied}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Valuation
              </button>
              <button
                onClick={() => setShowValuationModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showVariationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Log Variation</h2>
              <button
                onClick={() => setShowVariationModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Variation Title *</label>
                <input
                  type="text"
                  value={newVariation.title}
                  onChange={(e) => setNewVariation({ ...newVariation, title: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Describe the change"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Value *</label>
                <input
                  type="text"
                  value={newVariation.value}
                  onChange={(e) => setNewVariation({ ...newVariation, value: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="£85k"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Stage</label>
                <select
                  value={newVariation.stage}
                  onChange={(e) => setNewVariation({ ...newVariation, stage: e.target.value as VariationStage })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleAddVariation}
                disabled={!newVariation.title || !newVariation.value}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Variation
              </button>
              <button
                onClick={() => setShowVariationModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Task</h2>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter task"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={newTask.meta}
                  onChange={(e) => setNewTask({ ...newTask, meta: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Due date or context"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Bucket</label>
                <select
                  value={newTask.bucket}
                  onChange={(e) => setNewTask({ ...newTask, bucket: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {taskBoard.map((bucket) => (
                    <option key={bucket.title} value={bucket.title}>
                      {bucket.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleAddTask}
                disabled={!newTask.title}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Task
              </button>
              <button
                onClick={() => setShowTaskModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showProcurementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Procurement Package</h2>
              <button
                onClick={() => setShowProcurementModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Package *</label>
                <input
                  type="text"
                  value={newProcurement.package}
                  onChange={(e) => setNewProcurement({ ...newProcurement, package: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Package name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Status *</label>
                <input
                  type="text"
                  value={newProcurement.status}
                  onChange={(e) => setNewProcurement({ ...newProcurement, status: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tender Review"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Due Date *</label>
                <input
                  type="text"
                  value={newProcurement.due}
                  onChange={(e) => setNewProcurement({ ...newProcurement, due: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 18 Feb"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleAddProcurement}
                disabled={!newProcurement.package || !newProcurement.status || !newProcurement.due}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Package
              </button>
              <button
                onClick={() => setShowProcurementModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
