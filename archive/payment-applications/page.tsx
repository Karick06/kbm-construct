"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  type InvoiceApplication,
  type ConstructionProject,
  formatCurrency,
} from "@/lib/operations-models";
import {
  getProjectsFromStorage,
  getPaymentApplicationsFromStorage,
  savePaymentApplicationsToStorage,
} from "@/lib/operations-data";

export default function PaymentApplicationsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [applications, setApplications] = useState<InvoiceApplication[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showNewApplicationModal, setShowNewApplicationModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    setProjects(getProjectsFromStorage());
    setApplications(getPaymentApplicationsFromStorage());
  }, []);

  const filteredApplications = selectedProject
    ? applications.filter(a => a.projectId === selectedProject)
    : applications;

  const statusFilteredApplications = filterStatus === "all"
    ? filteredApplications
    : filteredApplications.filter(a => a.status === filterStatus);

  // Statistics
  const stats = {
    totalSubmitted: applications.filter(a => a.status === "submitted" || a.status === "certified").length,
    totalCertified: applications.filter(a => a.status === "certified").length,
    awaitingPayment: applications.filter(a => a.status === "certified" && !a.paidDate).length,
    totalValue: applications.reduce((sum, a) => sum + (a.certifiedAmount || a.thisPayment), 0),
    totalPaid: applications.filter(a => a.status === "paid").reduce((sum, a) => sum + (a.paidAmount || 0), 0),
    outstandingValue: applications.filter(a => a.status !== "paid").reduce((sum, a) => sum + (a.certifiedAmount || a.thisPayment), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>💰</span>
            Payment Applications
          </h1>
          <p className="mt-1 text-sm text-gray-400">Manage project valuations and payment submissions</p>
        </div>
        <button
          onClick={() => setShowNewApplicationModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
        >
          + New Application
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Submitted
            </p>
            <span className="text-xl">📤</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalSubmitted}</p>
          <p className="text-xs text-gray-400">Applications submitted</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Certified
            </p>
            <span className="text-xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalCertified}</p>
          <p className="text-xs text-gray-400">{formatCurrency(stats.totalValue)}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Awaiting Payment
            </p>
            <span className="text-xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.awaitingPayment}</p>
          <p className="text-xs text-gray-400">{formatCurrency(stats.outstandingValue)}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-purple-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Paid
            </p>
            <span className="text-xl">💵</span>
          </div>
          <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalPaid)}</p>
          <p className="text-xs text-gray-400">Received to date</p>
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
            { key: "draft", label: "Draft" },
            { key: "submitted", label: "Submitted" },
            { key: "certified", label: "Certified" },
            { key: "paid", label: "Paid" },
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

      {/* Applications List */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Payment Applications</h2>
          <p className="mt-1 text-sm text-gray-400">
            {statusFilteredApplications.length} application{statusFilteredApplications.length !== 1 ? "s" : ""}
          </p>
        </div>

        {statusFilteredApplications.length === 0 ? (
          <div className="rounded-lg bg-gray-700/30 p-12 text-center">
            <p className="text-gray-400">No payment applications found</p>
            <button
              onClick={() => setShowNewApplicationModal(true)}
              className="mt-4 rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Create First Application
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {statusFilteredApplications.map((app) => {
              const project = projects.find(p => p.id === app.projectId);
              const statusColors = {
                draft: "bg-gray-900/30 text-gray-400",
                submitted: "bg-blue-900/30 text-blue-400",
                certified: "bg-green-900/30 text-green-400",
                paid: "bg-purple-900/30 text-purple-400",
                disputed: "bg-red-900/30 text-red-400",
              };

              return (
                <div
                  key={app.id}
                  className="rounded-lg border border-gray-700/50 bg-gray-800 p-5 hover:border-orange-500 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">
                          Application #{app.applicationNumber}
                        </h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[app.status]}`}>
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{project?.projectName}</p>
                      <p className="text-xs text-gray-500">
                        Period: {new Date(app.period.from).toLocaleDateString("en-GB")} - {new Date(app.period.to).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">This Payment</p>
                      <p className="text-2xl font-bold text-orange-400">{formatCurrency(app.thisPayment)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 rounded border border-gray-700/30 bg-gray-900/50 p-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Gross Valuation</p>
                      <p className="mt-1 font-semibold text-white">{formatCurrency(app.grossValuation)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Retention</p>
                      <p className="mt-1 font-semibold text-red-400">-{formatCurrency(app.retentionDeducted)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Previous</p>
                      <p className="mt-1 font-semibold text-gray-400">{formatCurrency(app.previousPayments)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cumulative</p>
                      <p className="mt-1 font-semibold text-white">{formatCurrency(app.cumulativePaid)}</p>
                    </div>
                  </div>

                  {app.status === "certified" && (
                    <div className="mt-3 flex items-center justify-between rounded border border-green-700/30 bg-green-900/10 p-3">
                      <div>
                        <p className="text-xs text-gray-400">Certified by {app.certifiedBy}</p>
                        <p className="text-xs text-gray-500">on {app.certifiedDate ? new Date(app.certifiedDate).toLocaleDateString("en-GB") : "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Certified Amount</p>
                        <p className="font-bold text-green-400">{formatCurrency(app.certifiedAmount || 0)}</p>
                      </div>
                    </div>
                  )}

                  {app.status === "paid" && (
                    <div className="mt-3 flex items-center justify-between rounded border border-purple-700/30 bg-purple-900/10 p-3">
                      <div>
                        <p className="text-xs text-gray-400">Paid on {app.paidDate ? new Date(app.paidDate).toLocaleDateString("en-GB") : "N/A"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Amount Received</p>
                        <p className="font-bold text-purple-400">{formatCurrency(app.paidAmount || 0)}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Application Modal */}
      {showNewApplicationModal && (
        <NewApplicationModal
          projects={projects}
          applications={applications}
          onClose={() => setShowNewApplicationModal(false)}
          onSave={(newApp) => {
            const updated = [...applications, newApp];
            setApplications(updated);
            savePaymentApplicationsToStorage(updated);
            setShowNewApplicationModal(false);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// NEW APPLICATION MODAL
// =============================================================================

function NewApplicationModal({
  projects,
  applications,
  onClose,
  onSave,
}: {
  projects: ConstructionProject[];
  applications: InvoiceApplication[];
  onClose: () => void;
  onSave: (app: InvoiceApplication) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState(new Date().toISOString().split("T")[0]);
  const [grossValuation, setGrossValuation] = useState("");
  const [retentionPercentage, setRetentionPercentage] = useState("5");

  const projectApplications = projectId ? applications.filter(a => a.projectId === projectId) : [];
  const nextAppNumber = projectApplications.length + 1;
  const previousPayments = projectApplications.reduce((sum, a) => sum + a.thisPayment, 0);

  const grossVal = parseFloat(grossValuation) || 0;
  const retentionDeducted = (grossVal * parseFloat(retentionPercentage)) / 100;
  const thisPayment = grossVal - retentionDeducted - previousPayments;
  const cumulativePaid = previousPayments + thisPayment;

  const handleSubmit = () => {
    if (!projectId || !periodFrom || !periodTo || !grossValuation) {
      alert("Please fill in all required fields");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Operations User"}');

    const newApplication: InvoiceApplication = {
      id: `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      applicationNumber: nextAppNumber,
      period: {
        from: periodFrom,
        to: periodTo,
      },
      status: "draft",
      grossValuation: grossVal,
      retentionDeducted,
      previousPayments,
      thisPayment,
      cumulativePaid,
      supportingDocs: [],
      submittedBy: currentUser.name,
    };

    onSave(newApplication);
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
              <span>💰</span>
              New Payment Application
            </h3>
            <p className="mt-1 text-sm text-gray-400">Create valuation for interim payment</p>
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
                .filter(p => p.stage === "active" || p.stage === "snagging" || p.stage === "practical")
                .map(p => (
                  <option key={p.id} value={p.id}>
                    {p.projectName} - {p.client}
                  </option>
                ))}
            </select>
            {projectId && (
              <p className="mt-2 text-xs text-gray-400">
                Application #{nextAppNumber} | Previous payments: {formatCurrency(previousPayments)}
              </p>
            )}
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Period From *
              </label>
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Period To *
              </label>
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Valuation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Gross Valuation *
              </label>
              <input
                type="number"
                value={grossValuation}
                onChange={(e) => setGrossValuation(e.target.value)}
                placeholder="Total work value"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Retention %
              </label>
              <input
                type="number"
                value={retentionPercentage}
                onChange={(e) => setRetentionPercentage(e.target.value)}
                placeholder="5"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Calculation Summary */}
          {grossValuation && (
            <div className="rounded-lg border border-orange-700/50 bg-orange-900/10 p-4">
              <h4 className="text-sm font-semibold text-white mb-3">Payment Calculation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Gross Valuation:</span>
                  <span className="font-semibold text-white">{formatCurrency(grossVal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Less Retention ({retentionPercentage}%):</span>
                  <span className="font-semibold text-red-400">-{formatCurrency(retentionDeducted)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Less Previous Payments:</span>
                  <span className="font-semibold text-gray-400">-{formatCurrency(previousPayments)}</span>
                </div>
                <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                  <span className="font-bold text-white">This Payment:</span>
                  <span className="text-xl font-bold text-orange-400">{formatCurrency(thisPayment)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cumulative Paid:</span>
                  <span className="font-semibold text-gray-300">{formatCurrency(cumulativePaid)}</span>
                </div>
              </div>
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
            Create Application
          </button>
        </div>
      </div>
    </div>
  );
}
