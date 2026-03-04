"use client";

import { useEffect, useMemo, useState } from "react";

type ContractStatus = "Draft" | "Review" | "Approved";

type RiskLevel = "Low" | "Medium" | "High";

type ContractItem = {
  id: string;
  title: string;
  client: string;
  value: string;
  termMonths: number;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  retention: string;
  status: ContractStatus;
  riskLevel: RiskLevel;
  flags: string[];
  notes: string;
  assignedTo: string;
  lastReviewed: string | null;
  nextAction: string;
};

type ReviewOutput = {
  summary: string;
  keyTerms: string[];
  riskFlags: string[];
  clauseReview: Array<{ clause: string; concern: string; suggestion: string }>;
  redlines: string[];
};

type ReviewHistoryItem = {
  id: string;
  fileName: string;
  reviewedAt: string;
  model: string;
  review: ReviewOutput;
  linkedContractId?: string;
};

const DEFAULT_CONTRACTS: ContractItem[] = [
  {
    id: "CTR-101",
    title: "A12 Upgrades NEC4",
    client: "Essex Highway Works",
    value: "£3.4M",
    termMonths: 18,
    startDate: "2026-03-01",
    endDate: "2027-09-01",
    paymentTerms: "Monthly valuation",
    retention: "3%",
    status: "Review",
    riskLevel: "High",
    flags: ["LDs at 0.1% weekly", "Unlimited PI", "Termination at convenience"],
    notes: "Seek cap on LDs and mutual termination wording.",
    assignedTo: "Sarah Mitchell",
    lastReviewed: "2026-02-12",
    nextAction: "Issue redline pack to client",
  },
  {
    id: "CTR-102",
    title: "City Ring Road Package",
    client: "Metro Infrastructure",
    value: "£1.8M",
    termMonths: 12,
    startDate: "2026-04-01",
    endDate: "2027-04-01",
    paymentTerms: "Interim valuations",
    retention: "5%",
    status: "Draft",
    riskLevel: "Medium",
    flags: ["Schedule of rates missing", "No adjudication clause"],
    notes: "Awaiting schedule of rates from client. Need dispute clause.",
    assignedTo: "Tom Wilson",
    lastReviewed: null,
    nextAction: "Chase missing schedule",
  },
  {
    id: "CTR-103",
    title: "North Depot Civils",
    client: "Northern Rail Estates",
    value: "£2.1M",
    termMonths: 10,
    startDate: "2026-02-15",
    endDate: "2026-12-15",
    paymentTerms: "Monthly",
    retention: "2.5%",
    status: "Approved",
    riskLevel: "Low",
    flags: [],
    notes: "Signed and filed. Monitor payment terms.",
    assignedTo: "Priya Desai",
    lastReviewed: "2026-02-10",
    nextAction: "Archive after kickoff",
  },
];

const STATUS_STYLES: Record<ContractStatus, string> = {
  Draft: "bg-gray-500/20 text-gray-300 border-gray-500/40",
  Review: "bg-orange-500/20 text-orange-400 border-orange-500/40",
  Approved: "bg-green-500/20 text-green-400 border-green-500/40",
};

const RISK_STYLES: Record<RiskLevel, string> = {
  Low: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STORAGE_KEY = "kbm-contract-reviewer-v1";
const REVIEW_HISTORY_KEY = "kbm-contract-reviewer-history-v1";
const MODEL_OPTIONS = ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"];

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractItem[]>(DEFAULT_CONTRACTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "All">("All");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "All">("All");
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<ContractItem | null>(null);
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewOutput | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewModel, setReviewModel] = useState<string>(MODEL_OPTIONS[0]);
  const [linkContractId, setLinkContractId] = useState<string>("");
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);

  const [newContract, setNewContract] = useState({
    title: "",
    client: "",
    value: "",
    termMonths: 12,
    startDate: "",
    endDate: "",
    paymentTerms: "",
    retention: "",
    status: "Draft" as ContractStatus,
    riskLevel: "Medium" as RiskLevel,
    flags: "",
    notes: "",
    assignedTo: "",
    nextAction: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as ContractItem[];
      if (Array.isArray(parsed)) setContracts(parsed);
    } catch {
      setContracts(DEFAULT_CONTRACTS);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedHistory = localStorage.getItem(REVIEW_HISTORY_KEY);
    if (!storedHistory) return;
    try {
      const parsed = JSON.parse(storedHistory) as ReviewHistoryItem[];
      if (Array.isArray(parsed)) setReviewHistory(parsed);
    } catch {
      setReviewHistory([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(REVIEW_HISTORY_KEY, JSON.stringify(reviewHistory));
  }, [reviewHistory]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((contract) => {
      const matchesSearch =
        contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || contract.status === statusFilter;
      const matchesRisk = riskFilter === "All" || contract.riskLevel === riskFilter;
      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [contracts, riskFilter, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const inReview = contracts.filter((c) => c.status === "Review").length;
    const highRisk = contracts.filter((c) => c.riskLevel === "High").length;
    const approvals = contracts.filter((c) => c.status === "Draft").length;
    return { total, inReview, highRisk, approvals };
  }, [contracts]);

  const handleCreateContract = () => {
    if (!newContract.title || !newContract.client || !newContract.value) return;

    const nextId = `CTR-${String(contracts.length + 101)}`;
    const flags = newContract.flags
      .split(",")
      .map((flag) => flag.trim())
      .filter(Boolean);

    setContracts((prev) => [
      {
        id: nextId,
        title: newContract.title,
        client: newContract.client,
        value: newContract.value,
        termMonths: newContract.termMonths,
        startDate: newContract.startDate,
        endDate: newContract.endDate,
        paymentTerms: newContract.paymentTerms,
        retention: newContract.retention,
        status: newContract.status,
        riskLevel: newContract.riskLevel,
        flags,
        notes: newContract.notes,
        assignedTo: newContract.assignedTo,
        lastReviewed: null,
        nextAction: newContract.nextAction,
      },
      ...prev,
    ]);

    setNewContract({
      title: "",
      client: "",
      value: "",
      termMonths: 12,
      startDate: "",
      endDate: "",
      paymentTerms: "",
      retention: "",
      status: "Draft",
      riskLevel: "Medium",
      flags: "",
      notes: "",
      assignedTo: "",
      nextAction: "",
    });
    setShowNewModal(false);
  };

  const handleUpdateStatus = (contractId: string, status: ContractStatus) => {
    const updated = contracts.map((contract) =>
      contract.id === contractId
        ? { ...contract, status, lastReviewed: new Date().toISOString().split("T")[0] }
        : contract
    );
    setContracts(updated);
  };

  const handleOpenReview = (contract: ContractItem) => {
    setSelectedContract({ ...contract });
    setShowReviewModal(true);
  };

  const handleSaveReview = () => {
    if (!selectedContract) return;

    setContracts((prev) =>
      prev.map((contract) =>
        contract.id === selectedContract.id
          ? { ...selectedContract, lastReviewed: new Date().toISOString().split("T")[0] }
          : contract
      )
    );
    setShowReviewModal(false);
    setSelectedContract(null);
  };

  const handleRunAiReview = async () => {
    if (!reviewFile) return;

    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);

    const formData = new FormData();
    formData.append("file", reviewFile);
    formData.append("model", reviewModel);

    try {
      const response = await fetch("/api/contracts/review", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "AI review failed");
      }

      const review = data.review as ReviewOutput;
      setReviewResult(review);

      const historyItem: ReviewHistoryItem = {
        id: `AI-${Date.now()}`,
        fileName: reviewFile.name,
        reviewedAt: new Date().toISOString(),
        model: data.model || reviewModel,
        review,
        linkedContractId: linkContractId || undefined,
      };

      setReviewHistory((prev) => [historyItem, ...prev].slice(0, 20));

      if (linkContractId) {
        setContracts((prev) =>
          prev.map((contract) => {
            if (contract.id !== linkContractId) return contract;

            const mergedFlags = Array.from(new Set([...contract.flags, ...review.riskFlags]));
            const nextNotes = contract.notes
              ? `${contract.notes}\n\nAI Review: ${review.summary}`
              : `AI Review: ${review.summary}`;

            return {
              ...contract,
              flags: mergedFlags,
              notes: nextNotes,
              status: contract.status === "Draft" ? "Review" : contract.status,
              lastReviewed: new Date().toISOString().split("T")[0],
              nextAction: contract.nextAction || "Review AI findings",
            };
          })
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      setReviewError(message);
    } finally {
      setReviewLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <button
          onClick={() => setShowNewModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + New Review
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-2 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Contracts</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">In Review</p>
          <p className="text-2xl font-bold text-white">{stats.inReview}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-gray-700/50 border-l-4 border-l-red-500 bg-gray-800/80 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">High Risk</p>
          <p className="text-2xl font-bold text-white">{stats.highRisk}</p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Approvals Pending</p>
          <p className="text-2xl font-bold text-white">{stats.approvals}</p>
        </div>
      </section>

      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Search by contract or client"
          />
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | "All")}
              className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Status</option>
              <option value="Draft">Draft</option>
              <option value="Review">Review</option>
              <option value="Approved">Approved</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as RiskLevel | "All")}
              className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Risk</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">AI Contract Review</h2>
            <p className="text-sm text-gray-400">Upload a PDF or DOCX to generate a review summary, risks, and redlines.</p>
          </div>
          <div className="text-xs text-gray-500">Provider: OpenAI (server-side)</div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setReviewFile(e.target.files?.[0] ?? null)}
              className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white file:mr-4 file:rounded file:border-0 file:bg-orange-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-orange-600"
            />
            <p className="mt-2 text-xs text-gray-500">Maximum 12MB. Text is processed server-side for review.</p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Model</label>
              <select
                value={reviewModel}
                onChange={(e) => setReviewModel(e.target.value)}
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Link to Contract</label>
              <select
                value={linkContractId}
                onChange={(e) => setLinkContractId(e.target.value)}
                className="w-full rounded bg-gray-900 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Do not link</option>
                {contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.id} • {contract.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRunAiReview}
              disabled={!reviewFile || reviewLoading}
              className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reviewLoading ? "Reviewing..." : "Run AI Review"}
            </button>
          </div>
        </div>

        {reviewError && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {reviewError}
          </div>
        )}

        {reviewResult && (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Summary</h3>
              <p className="text-sm text-gray-300">{reviewResult.summary}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Key Terms</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  {reviewResult.keyTerms.map((term) => (
                    <li key={term}>• {term}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Risk Flags</h3>
                <ul className="space-y-1 text-sm text-gray-300">
                  {reviewResult.riskFlags.map((flag) => (
                    <li key={flag}>• {flag}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Clause Review</h3>
              <div className="space-y-3">
                {reviewResult.clauseReview.map((item, idx) => (
                  <div key={`${item.clause}-${idx}`} className="rounded border border-gray-700/50 bg-gray-800/50 p-3">
                    <p className="text-xs font-semibold text-gray-300">{item.clause}</p>
                    <p className="text-sm text-gray-400 mt-1">Concern: {item.concern}</p>
                    <p className="text-sm text-gray-300 mt-1">Suggestion: {item.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Redline Suggestions</h3>
              <ul className="space-y-1 text-sm text-gray-300">
                {reviewResult.redlines.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {reviewHistory.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-700/50 bg-gray-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Review History</h3>
              <span className="text-xs text-gray-500">Last {reviewHistory.length} reviews</span>
            </div>
            <div className="space-y-2">
              {reviewHistory.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-700/50 bg-gray-800/40 px-3 py-2">
                  <div>
                    <p className="text-sm text-white">{item.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.reviewedAt).toLocaleString("en-GB")} • {item.model}
                      {item.linkedContractId ? ` • Linked to ${item.linkedContractId}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => setReviewResult(item.review)}
                    className="rounded border border-gray-700 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-800"
                  >
                    View Result
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {filteredContracts.map((contract) => (
          <div key={contract.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{contract.title}</p>
                <p className="text-sm text-gray-400">{contract.client} • {contract.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${STATUS_STYLES[contract.status]}`}>
                  {contract.status}
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${RISK_STYLES[contract.riskLevel]}`}>
                  {contract.riskLevel} risk
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-400">
              <div><span className="text-gray-500">Value:</span> {contract.value}</div>
              <div><span className="text-gray-500">Term:</span> {contract.termMonths} months</div>
              <div><span className="text-gray-500">Payment:</span> {contract.paymentTerms}</div>
              <div><span className="text-gray-500">Retention:</span> {contract.retention}</div>
            </div>

            {contract.flags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {contract.flags.map((flag) => (
                  <span key={flag} className="text-xs rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-red-300">
                    {flag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Last reviewed: {contract.lastReviewed ? contract.lastReviewed : "Not reviewed"}
              </div>
              <div className="flex flex-wrap gap-2">
                {contract.status === "Draft" && (
                  <button
                    onClick={() => handleUpdateStatus(contract.id, "Review")}
                    className="rounded bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                  >
                    Send to Review
                  </button>
                )}
                {contract.status !== "Approved" && (
                  <button
                    onClick={() => handleUpdateStatus(contract.id, "Approved")}
                    className="rounded bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={() => handleOpenReview(contract)}
                  className="rounded border border-gray-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
                >
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">New Contract Review</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Contract Title *</label>
                <input
                  type="text"
                  value={newContract.title}
                  onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Project / contract name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Client *</label>
                <input
                  type="text"
                  value={newContract.client}
                  onChange={(e) => setNewContract({ ...newContract, client: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Client name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Value *</label>
                <input
                  type="text"
                  value={newContract.value}
                  onChange={(e) => setNewContract({ ...newContract, value: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="£1.2M"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Term (months)</label>
                <input
                  type="number"
                  value={newContract.termMonths}
                  onChange={(e) => setNewContract({ ...newContract, termMonths: Number(e.target.value) })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newContract.startDate}
                  onChange={(e) => setNewContract({ ...newContract, startDate: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={newContract.endDate}
                  onChange={(e) => setNewContract({ ...newContract, endDate: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Payment Terms</label>
                <input
                  type="text"
                  value={newContract.paymentTerms}
                  onChange={(e) => setNewContract({ ...newContract, paymentTerms: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Monthly valuation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Retention</label>
                <input
                  type="text"
                  value={newContract.retention}
                  onChange={(e) => setNewContract({ ...newContract, retention: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="3%"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Assigned To</label>
                <input
                  type="text"
                  value={newContract.assignedTo}
                  onChange={(e) => setNewContract({ ...newContract, assignedTo: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="QS name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Status</label>
                <select
                  value={newContract.status}
                  onChange={(e) => setNewContract({ ...newContract, status: e.target.value as ContractStatus })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Review">Review</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Risk Level</label>
                <select
                  value={newContract.riskLevel}
                  onChange={(e) => setNewContract({ ...newContract, riskLevel: e.target.value as RiskLevel })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Risk Flags (comma separated)</label>
                <input
                  type="text"
                  value={newContract.flags}
                  onChange={(e) => setNewContract({ ...newContract, flags: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="LDs, PI cap, termination"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Notes</label>
                <textarea
                  value={newContract.notes}
                  onChange={(e) => setNewContract({ ...newContract, notes: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Next Action</label>
                <input
                  type="text"
                  value={newContract.nextAction}
                  onChange={(e) => setNewContract({ ...newContract, nextAction: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Next step or decision"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleCreateContract}
                disabled={!newContract.title || !newContract.client || !newContract.value}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Contract
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Review Contract</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Contract Title</label>
                <input
                  type="text"
                  value={selectedContract.title}
                  onChange={(e) => setSelectedContract({ ...selectedContract, title: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Client</label>
                <input
                  type="text"
                  value={selectedContract.client}
                  onChange={(e) => setSelectedContract({ ...selectedContract, client: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Value</label>
                <input
                  type="text"
                  value={selectedContract.value}
                  onChange={(e) => setSelectedContract({ ...selectedContract, value: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Status</label>
                <select
                  value={selectedContract.status}
                  onChange={(e) => setSelectedContract({ ...selectedContract, status: e.target.value as ContractStatus })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Review">Review</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Risk Level</label>
                <select
                  value={selectedContract.riskLevel}
                  onChange={(e) => setSelectedContract({ ...selectedContract, riskLevel: e.target.value as RiskLevel })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Risk Flags (comma separated)</label>
                <input
                  type="text"
                  value={selectedContract.flags.join(", ")}
                  onChange={(e) => setSelectedContract({ ...selectedContract, flags: e.target.value.split(",").map((flag) => flag.trim()).filter(Boolean) })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Notes</label>
                <textarea
                  value={selectedContract.notes}
                  onChange={(e) => setSelectedContract({ ...selectedContract, notes: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-1">Next Action</label>
                <input
                  type="text"
                  value={selectedContract.nextAction}
                  onChange={(e) => setSelectedContract({ ...selectedContract, nextAction: e.target.value })}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleSaveReview}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Save Review
              </button>
              <button
                onClick={() => setShowReviewModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
