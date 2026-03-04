"use client";

import { useState, useEffect } from "react";
import {
  type ConstructionProject,
} from "@/lib/operations-models";
import {
  getProjectsFromStorage,
  type SurveyRecord,
  getSurveyRecordsFromStorage,
  saveSurveyRecordsToStorage,
} from "@/lib/operations-data";

export default function SurveyRecordsPage() {
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showNewSurveyModal, setShowNewSurveyModal] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    setProjects(getProjectsFromStorage());
    setSurveys(getSurveyRecordsFromStorage());
  }, []);

  const filteredSurveys = selectedProject
    ? surveys.filter(s => s.projectId === selectedProject)
    : surveys;

  const typeFilteredSurveys = filterType === "all"
    ? filteredSurveys
    : filteredSurveys.filter(s => s.surveyType === filterType);

  // Statistics
  const stats = {
    totalSurveys: surveys.length,
    settingOut: surveys.filter(s => s.surveyType === "setting-out").length,
    asBuilt: surveys.filter(s => s.surveyType === "as-built").length,
    levelChecks: surveys.filter(s => s.surveyType === "level-check").length,
    thisWeek: surveys.filter(s => {
      const surveyDate = new Date(s.surveyDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return surveyDate >= weekAgo;
    }).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📐</span>
            Setting Out & Survey Records
          </h1>
          <p className="mt-1 text-sm text-gray-400">Track survey data and setting out records</p>
        </div>
        <button
          onClick={() => setShowNewSurveyModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
        >
          + New Survey
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Surveys
            </p>
            <span className="text-xl">📊</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalSurveys}</p>
          <p className="text-xs text-gray-400">All records</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Setting Out
            </p>
            <span className="text-xl">📍</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.settingOut}</p>
          <p className="text-xs text-gray-400">Initial surveys</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-purple-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              As-Built
            </p>
            <span className="text-xl">📏</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.asBuilt}</p>
          <p className="text-xs text-gray-400">Completed surveys</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-yellow-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Level Checks
            </p>
            <span className="text-xl">📉</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.levelChecks}</p>
          <p className="text-xs text-gray-400">Verification</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              This Week
            </p>
            <span className="text-xl">🗓️</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.thisWeek}</p>
          <p className="text-xs text-gray-400">Recent surveys</p>
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
            { key: "setting-out", label: "Setting Out" },
            { key: "as-built", label: "As-Built" },
            { key: "level-check", label: "Level Check" },
            { key: "volume-calc", label: "Volume" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                filterType === tab.key
                  ? "bg-orange-500 text-white"
                  : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Survey Records List */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Survey Records</h2>
          <p className="mt-1 text-sm text-gray-400">
            {typeFilteredSurveys.length} survey{typeFilteredSurveys.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {typeFilteredSurveys.length === 0 ? (
          <div className="rounded-lg bg-gray-700/30 p-12 text-center">
            <p className="text-gray-400">No survey records found</p>
            <button
              onClick={() => setShowNewSurveyModal(true)}
              className="mt-4 rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Record First Survey
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {typeFilteredSurveys.map((survey) => {
              const project = projects.find(p => p.id === survey.projectId);
              
              const typeColors: Record<SurveyRecord["surveyType"], string> = {
                "setting-out": "bg-green-900/30 text-green-400",
                "as-built": "bg-purple-900/30 text-purple-400",
                "level-check": "bg-yellow-900/30 text-yellow-400",
                "volume-calc": "bg-blue-900/30 text-blue-400",
                "dimension-check": "bg-orange-900/30 text-orange-400",
              };

              const typeLabels: Record<SurveyRecord["surveyType"], string> = {
                "setting-out": "Setting Out",
                "as-built": "As-Built",
                "level-check": "Level Check",
                "volume-calc": "Volume Calculation",
                "dimension-check": "Dimension Check",
              };

              return (
                <div
                  key={survey.id}
                  className="rounded-lg border border-gray-700/50 bg-gray-800 p-5 hover:border-orange-500 transition"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{survey.description}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${typeColors[survey.surveyType]}`}>
                          {typeLabels[survey.surveyType]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-400">{survey.location}</p>
                      <p className="text-xs text-gray-500">{project?.projectName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Survey Date</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(survey.surveyDate).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 rounded border border-gray-700/30 bg-gray-900/50 p-3 text-sm mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Surveyor</p>
                      <p className="mt-1 font-semibold text-white">{survey.surveyedBy}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Benchmark</p>
                      <p className="mt-1 font-mono text-sm text-white">{survey.benchmarkUsed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Coordinates</p>
                      <p className="mt-1 font-semibold text-white">{survey.coordinates.length} points</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Accuracy</p>
                      <p className="mt-1 font-semibold text-blue-400">±{survey.accuracy}mm</p>
                    </div>
                  </div>

                  {/* Coordinates Table */}
                  {survey.coordinates.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="py-2 px-3 text-left text-gray-400 font-semibold">Point</th>
                            <th className="py-2 px-3 text-right text-gray-400 font-semibold">Easting (m)</th>
                            <th className="py-2 px-3 text-right text-gray-400 font-semibold">Northing (m)</th>
                            <th className="py-2 px-3 text-right text-gray-400 font-semibold">Level (m)</th>
                            <th className="py-2 px-3 text-left text-gray-400 font-semibold">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {survey.coordinates.slice(0, 5).map((coord, idx) => (
                            <tr key={idx} className="border-b border-gray-800/50">
                              <td className="py-2 px-3 text-gray-300 font-mono">{coord.point}</td>
                              <td className="py-2 px-3 text-right text-white font-mono">{coord.easting.toFixed(3)}</td>
                              <td className="py-2 px-3 text-right text-white font-mono">{coord.northing.toFixed(3)}</td>
                              <td className="py-2 px-3 text-right text-white font-mono">{coord.level.toFixed(3)}</td>
                              <td className="py-2 px-3 text-gray-400">{coord.description || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {survey.coordinates.length > 5 && (
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          + {survey.coordinates.length - 5} more points
                        </p>
                      )}
                    </div>
                  )}

                  {survey.equipmentUsed && (
                    <div className="mb-3 text-xs text-gray-400">
                      Equipment: <span className="font-semibold text-gray-300">{survey.equipmentUsed}</span>
                    </div>
                  )}

                  {survey.witnessedBy && (
                    <div className="mb-3 text-xs text-gray-400">
                      Witnessed by: <span className="font-semibold text-gray-300">{survey.witnessedBy}</span>
                    </div>
                  )}

                  {survey.drawingReference && (
                    <div className="mb-3 text-xs text-gray-400">
                      Drawing: <span className="font-mono text-gray-300">{survey.drawingReference}</span>
                    </div>
                  )}

                  {survey.notes && (
                    <div className="rounded border border-gray-700/40 bg-gray-900/40 p-3 text-xs text-gray-300">
                      <p className="font-semibold text-gray-400 mb-1">Notes</p>
                      {survey.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Survey Modal */}
      {showNewSurveyModal && (
        <NewSurveyModal
          projects={projects}
          onClose={() => setShowNewSurveyModal(false)}
          onSave={(newSurvey) => {
            const updated = [...surveys, newSurvey];
            setSurveys(updated);
            saveSurveyRecordsToStorage(updated);
            setShowNewSurveyModal(false);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// NEW SURVEY MODAL
// =============================================================================

function NewSurveyModal({
  projects,
  onClose,
  onSave,
}: {
  projects: ConstructionProject[];
  onClose: () => void;
  onSave: (survey: SurveyRecord) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [surveyType, setSurveyType] = useState<SurveyRecord["surveyType"]>("setting-out");
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().split("T")[0]);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [benchmarkUsed, setBenchmarkUsed] = useState("");
  const [accuracy, setAccuracy] = useState("5");
  const [equipmentUsed, setEquipmentUsed] = useState("");
  const [witnessedBy, setWitnessedBy] = useState("");
  const [drawingReference, setDrawingReference] = useState("");
  const [notes, setNotes] = useState("");
  
  // Coordinate entry
  const [coordPoint, setCoordPoint] = useState("");
  const [coordEasting, setCoordEasting] = useState("");
  const [coordNorthing, setCoordNorthing] = useState("");
  const [coordLevel, setCoordLevel] = useState("");
  const [coordDesc, setCoordDesc] = useState("");
  const [coordinates, setCoordinates] = useState<SurveyRecord["coordinates"]>([]);

  const handleAddCoordinate = () => {
    if (!coordPoint || !coordEasting || !coordNorthing || !coordLevel) {
      alert("Please fill in point, easting, northing, and level");
      return;
    }

    setCoordinates([
      ...coordinates,
      {
        point: coordPoint,
        easting: parseFloat(coordEasting),
        northing: parseFloat(coordNorthing),
        level: parseFloat(coordLevel),
        description: coordDesc || undefined,
      }
    ]);

    // Reset coordinate inputs
    setCoordPoint("");
    setCoordEasting("");
    setCoordNorthing("");
    setCoordLevel("");
    setCoordDesc("");
  };

  const handleRemoveCoordinate = (index: number) => {
    setCoordinates(coordinates.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!projectId || !surveyType || !surveyDate || !location || !description || !benchmarkUsed) {
      alert("Please fill in all required fields");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Survey Team"}');

    const newSurvey: SurveyRecord = {
      id: `SURVEY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      surveyType,
      surveyDate,
      location,
      description,
      surveyedBy: currentUser.name,
      benchmarkUsed,
      coordinates,
      accuracy: parseInt(accuracy),
      equipmentUsed: equipmentUsed || undefined,
      witnessedBy: witnessedBy || undefined,
      drawingReference: drawingReference || undefined,
      notes: notes || undefined,
    };

    onSave(newSurvey);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-lg border border-gray-700/50 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>📐</span>
              Record Survey
            </h3>
            <p className="mt-1 text-sm text-gray-400">Log survey data and coordinates</p>
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
              <label className="block text-sm font-semibold text-gray-300 mb-2">Survey Date *</label>
              <input
                type="date"
                value={surveyDate}
                onChange={(e) => setSurveyDate(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Survey Type *</label>
              <select
                value={surveyType}
                onChange={(e) => setSurveyType(e.target.value as any)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="setting-out">Setting Out</option>
                <option value="as-built">As-Built</option>
                <option value="level-check">Level Check</option>
                <option value="volume-calc">Volume Calculation</option>
                <option value="dimension-check">Dimension Check</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Plot 7, Grid C3"
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
              placeholder="e.g., Foundation corner positions"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Benchmark Used *</label>
              <input
                type="text"
                value={benchmarkUsed}
                onChange={(e) => setBenchmarkUsed(e.target.value)}
                placeholder="e.g., BM01"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Accuracy (mm)</label>
              <input
                type="number"
                value={accuracy}
                onChange={(e) => setAccuracy(e.target.value)}
                placeholder="5"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Equipment Used</label>
              <input
                type="text"
                value={equipmentUsed}
                onChange={(e) => setEquipmentUsed(e.target.value)}
                placeholder="e.g., Total Station"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
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
              <label className="block text-sm font-semibold text-gray-300 mb-2">Drawing Reference</label>
              <input
                type="text"
                value={drawingReference}
                onChange={(e) => setDrawingReference(e.target.value)}
                placeholder="e.g., DRG-001"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Coordinate Entry */}
          <div className="rounded-lg border border-orange-500/30 bg-orange-900/10 p-4">
            <h4 className="text-sm font-bold text-white mb-3">Add Coordinates</h4>
            <div className="grid grid-cols-5 gap-2">
              <input
                type="text"
                value={coordPoint}
                onChange={(e) => setCoordPoint(e.target.value)}
                placeholder="Point (e.g., A1)"
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                step="0.001"
                value={coordEasting}
                onChange={(e) => setCoordEasting(e.target.value)}
                placeholder="Easting (m)"
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                step="0.001"
                value={coordNorthing}
                onChange={(e) => setCoordNorthing(e.target.value)}
                placeholder="Northing (m)"
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="number"
                step="0.001"
                value={coordLevel}
                onChange={(e) => setCoordLevel(e.target.value)}
                placeholder="Level (m)"
                className="rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCoordinate}
                className="rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Add
              </button>
            </div>
            <input
              type="text"
              value={coordDesc}
              onChange={(e) => setCoordDesc(e.target.value)}
              placeholder="Description (optional)"
              className="mt-2 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
            />

            {/* Coordinates List */}
            {coordinates.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-2 px-2 text-left text-gray-400">Point</th>
                      <th className="py-2 px-2 text-right text-gray-400">Easting</th>
                      <th className="py-2 px-2 text-right text-gray-400">Northing</th>
                      <th className="py-2 px-2 text-right text-gray-400">Level</th>
                      <th className="py-2 px-2 text-left text-gray-400">Description</th>
                      <th className="py-2 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {coordinates.map((coord, idx) => (
                      <tr key={idx} className="border-b border-gray-800">
                        <td className="py-2 px-2 text-white font-mono">{coord.point}</td>
                        <td className="py-2 px-2 text-right text-white font-mono">{coord.easting.toFixed(3)}</td>
                        <td className="py-2 px-2 text-right text-white font-mono">{coord.northing.toFixed(3)}</td>
                        <td className="py-2 px-2 text-right text-white font-mono">{coord.level.toFixed(3)}</td>
                        <td className="py-2 px-2 text-gray-400">{coord.description || "—"}</td>
                        <td className="py-2 px-2">
                          <button
                            onClick={() => handleRemoveCoordinate(idx)}
                            className="text-red-400 hover:text-red-300"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional survey notes..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Save Survey
          </button>
        </div>
      </div>
    </div>
  );
}
