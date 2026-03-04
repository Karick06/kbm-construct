"use client";

import { useState, useEffect } from "react";
import {
  type ConstructionProject,
} from "@/lib/operations-models";
import {
  getProjectsFromStorage,
  type QualityTest,
  getQualityTestsFromStorage,
  saveQualityTestsToStorage,
} from "@/lib/operations-data";

export default function QualityTestingPage() {
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [tests, setTests] = useState<QualityTest[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    setProjects(getProjectsFromStorage());
    setTests(getQualityTestsFromStorage());
  }, []);

  const filteredTests = selectedProject
    ? tests.filter(t => t.projectId === selectedProject)
    : tests;

  const statusFilteredTests = filterStatus === "all"
    ? filteredTests
    : filteredTests.filter(t => t.status === filterStatus);

  // Statistics
  const stats = {
    totalTests: tests.length,
    passed: tests.filter(t => t.status === "pass").length,
    failed: tests.filter(t => t.status === "fail").length,
    pending: tests.filter(t => t.status === "pending").length,
    passRate: tests.length > 0 ? Math.round((tests.filter(t => t.status === "pass").length / tests.length) * 100) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>🔬</span>
            Quality Testing
          </h1>
          <p className="mt-1 text-sm text-gray-400">Track quality tests and certifications</p>
        </div>
        <button
          onClick={() => setShowNewTestModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
        >
          + Record Test
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Tests
            </p>
            <span className="text-xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalTests}</p>
          <p className="text-xs text-gray-400">All time</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Passed
            </p>
            <span className="text-xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.passed}</p>
          <p className="text-xs text-gray-400">Compliant</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-red-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Failed
            </p>
            <span className="text-xl">❌</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.failed}</p>
          <p className="text-xs text-gray-400">Requires action</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-yellow-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pending
            </p>
            <span className="text-xl">⏳</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.pending}</p>
          <p className="text-xs text-gray-400">Awaiting results</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-purple-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pass Rate
            </p>
            <span className="text-xl">📈</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.passRate}%</p>
          <p className="text-xs text-gray-400">Success rate</p>
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
            { key: "pass", label: "Passed" },
            { key: "fail", label: "Failed" },
            { key: "pending", label: "Pending" },
            { key: "conditional", label: "Conditional" },
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

      {/* Tests List */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Quality Tests</h2>
          <p className="mt-1 text-sm text-gray-400">
            {statusFilteredTests.length} test{statusFilteredTests.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {statusFilteredTests.length === 0 ? (
          <div className="rounded-lg bg-gray-700/30 p-12 text-center">
            <p className="text-gray-400">No quality tests found</p>
            <button
              onClick={() => setShowNewTestModal(true)}
              className="mt-4 rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Record First Test
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {statusFilteredTests.map((test) => {
              const project = projects.find(p => p.id === test.projectId);
              const statusColors = {
                pass: "bg-green-900/30 text-green-400",
                fail: "bg-red-900/30 text-red-400",
                pending: "bg-yellow-900/30 text-yellow-400",
                conditional: "bg-orange-900/30 text-orange-400",
              };

              const testTypeLabels: Record<QualityTest["testType"], string> = {
                "concrete-cube": "Concrete Cube Test",
                "concrete-slump": "Concrete Slump Test",
                "compaction": "Compaction Test",
                "drainage-pressure": "Drainage Pressure Test",
                "drainage-camera": "Drainage CCTV Survey",
                "soil-bearing": "Soil Bearing Capacity",
                "other": "Other Test",
              };

              return (
                <div
                  key={test.id}
                  className={`rounded-lg border p-5 transition ${
                    test.status === "fail" 
                      ? "border-red-500/50 bg-red-900/10"
                      : "border-gray-700/50 bg-gray-800 hover:border-orange-500"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{testTypeLabels[test.testType]}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[test.status]}`}>
                          {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{test.description}</p>
                      <p className="text-xs text-gray-500">{project?.projectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Test Date</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(test.testDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 rounded border border-gray-700/30 bg-gray-900/50 p-3 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="mt-1 font-semibold text-white">{test.location}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Specification</p>
                      <p className="mt-1 font-semibold text-white">{test.specification}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Result</p>
                      <p className={`mt-1 font-semibold ${
                        test.status === "pass" ? "text-green-400" : 
                        test.status === "fail" ? "text-red-400" :
                        "text-yellow-400"
                      }`}>
                        {test.result}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tested By</p>
                      <p className="mt-1 font-semibold text-white">{test.testedBy}</p>
                    </div>
                  </div>

                  {test.witnessedBy && (
                    <div className="mb-3 text-xs text-gray-400">
                      Witnessed by: <span className="font-semibold text-gray-300">{test.witnessedBy}</span>
                    </div>
                  )}

                  {test.certificateNumber && (
                    <div className="mb-3 text-xs text-gray-400">
                      Certificate: <span className="font-mono text-gray-300">{test.certificateNumber}</span>
                    </div>
                  )}

                  {test.status === "fail" && test.remedialAction && (
                    <div className="rounded border border-red-700/40 bg-red-900/20 p-3">
                      <p className="text-xs font-semibold text-red-400 mb-1">Remedial Action Required</p>
                      <p className="text-xs text-gray-300">{test.remedialAction}</p>
                    </div>
                  )}

                  {test.notes && (
                    <div className="mt-3 rounded border border-gray-700/40 bg-gray-900/40 p-3 text-xs text-gray-300">
                      <p className="font-semibold text-gray-400 mb-1">Notes</p>
                      {test.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Test Modal */}
      {showNewTestModal && (
        <NewTestModal
          projects={projects}
          onClose={() => setShowNewTestModal(false)}
          onSave={(newTest) => {
            const updated = [...tests, newTest];
            setTests(updated);
            saveQualityTestsToStorage(updated);
            setShowNewTestModal(false);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// NEW TEST MODAL
// =============================================================================

function NewTestModal({
  projects,
  onClose,
  onSave,
}: {
  projects: ConstructionProject[];
  onClose: () => void;
  onSave: (test: QualityTest) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [testType, setTestType] = useState<QualityTest["testType"]>("concrete-cube");
  const [testDate, setTestDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [specification, setSpecification] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<"pass" | "fail" | "pending" | "conditional">("pending");
  const [witnessedBy, setWitnessedBy] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [remedialAction, setRemedialAction] = useState("");

  const handleSubmit = () => {
    if (!projectId || !testType || !testDate || !location || !description || !specification) {
      alert("Please fill in all required fields");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Operations User"}');

    const newTest: QualityTest = {
      id: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      testType,
      testDate,
      location,
      description,
      specification,
      result: result || "Pending",
      status,
      testedBy: currentUser.name,
      witnessedBy: witnessedBy || undefined,
      certificateNumber: certificateNumber || undefined,
      notes: notes || undefined,
      remedialAction: (status === "fail" && remedialAction) ? remedialAction : undefined,
    };

    onSave(newTest);
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
              <span>🔬</span>
              Record Quality Test
            </h3>
            <p className="mt-1 text-sm text-gray-400">Log quality testing and results</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Project *</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select project...</option>
                {projects.filter(p => p.stage === "active" || p.stage === "mobilisation").map(p => (
                  <option key={p.id} value={p.id}>{p.projectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Test Date *</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Test Type *</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="concrete-cube">Concrete Cube Test</option>
                <option value="concrete-slump">Concrete Slump Test</option>
                <option value="compaction">Compaction Test</option>
                <option value="drainage-pressure">Drainage Pressure Test</option>
                <option value="drainage-camera">Drainage CCTV Survey</option>
                <option value="soil-bearing">Soil Bearing Capacity</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Grid B2, Plot 5"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 7-day cube test for foundation slab"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Specification *</label>
              <input
                type="text"
                value={specification}
                onChange={(e) => setSpecification(e.target.value)}
                placeholder="e.g., 35 N/mm²"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Result</label>
              <input
                type="text"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="e.g., 38 N/mm²"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="pass">Pass</option>
                <option value="fail">Fail</option>
                <option value="conditional">Conditional</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Witnessed By</label>
              <input
                type="text"
                value={witnessedBy}
                onChange={(e) => setWitnessedBy(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Certificate Number</label>
              <input
                type="text"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
                placeholder="e.g., CERT-12345"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {status === "fail" && (
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Remedial Action</label>
              <textarea
                value={remedialAction}
                onChange={(e) => setRemedialAction(e.target.value)}
                rows={3}
                placeholder="Describe required remedial action..."
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes about the test..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Record Test
          </button>
        </div>
      </div>
    </div>
  );
}
