"use client";

import { useState, useEffect } from "react";
import {
  type ConstructionProject,
} from "@/lib/operations-models";
import {
  getProjectsFromStorage,
  type MaterialDelivery,
  type MaterialStockpile,
  getMaterialDeliveriesFromStorage,
  saveMaterialDeliveriesToStorage,
  getMaterialStockpilesFromStorage,
  saveMaterialStockpilesToStorage,
} from "@/lib/operations-data";

export default function MaterialsManagementPage() {
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [deliveries, setDeliveries] = useState<MaterialDelivery[]>([]);
  const [stockpiles, setStockpiles] = useState<MaterialStockpile[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"deliveries" | "stockpiles">("deliveries");
  const [showNewDeliveryModal, setShowNewDeliveryModal] = useState(false);
  const [showNewStockpileModal, setShowNewStockpileModal] = useState(false);

  useEffect(() => {
    setProjects(getProjectsFromStorage());
    setDeliveries(getMaterialDeliveriesFromStorage());
    setStockpiles(getMaterialStockpilesFromStorage());
  }, []);

  const filteredDeliveries = selectedProject
    ? deliveries.filter(d => d.projectId === selectedProject)
    : deliveries;

  const filteredStockpiles = selectedProject
    ? stockpiles.filter(s => s.projectId === selectedProject)
    : stockpiles;

  // Statistics  
  const stats = {
    totalDeliveries: deliveries.length,
    recentDeliveries: deliveries.filter(d => {
      const deliveryDate = new Date(d.deliveryDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return deliveryDate >= weekAgo;
    }).length,
    damagedDeliveries: deliveries.filter(d => d.condition === "damaged").length,
    totalStockpiles: stockpiles.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>📦</span>
            Materials Management
          </h1>
          <p className="mt-1 text-sm text-gray-400">Track deliveries and stockpile levels</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewDeliveryModal(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            + Log Delivery
          </button>
          <button
            onClick={() => setShowNewStockpileModal(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
          >
            + Add Stockpile
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Deliveries
            </p>
            <span className="text-xl">🚚</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalDeliveries}</p>
          <p className="text-xs text-gray-400">All time</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Recent Deliveries
            </p>
            <span className="text-xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.recentDeliveries}</p>
          <p className="text-xs text-gray-400">Last 7 days</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-red-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Damaged Items
            </p>
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.damagedDeliveries}</p>
          <p className="text-xs text-gray-400">Requires attention</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Stockpiles
            </p>
            <span className="text-xl">🏗️</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalStockpiles}</p>
          <p className="text-xs text-gray-400">Being tracked</p>
        </div>
      </section>

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("deliveries")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "deliveries"
                ? "bg-orange-500 text-white"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            📋 Deliveries
          </button>
          <button
            onClick={() => setActiveTab("stockpiles")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "stockpiles"
                ? "bg-orange-500 text-white"
                : "bg-gray-700/50 text-gray-400 hover:bg-gray-700"
            }`}
          >
            📊 Stockpiles
          </button>
        </div>

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
      </div>

      {/* Content */}
      {activeTab === "deliveries" ? (
        <DeliveriesView
          deliveries={filteredDeliveries}
          projects={projects}
          onNewDelivery={() => setShowNewDeliveryModal(true)}
        />
      ) : (
        <StockpilesView
          stockpiles={filteredStockpiles}
          projects={projects}
          onNewStockpile={() => setShowNewStockpileModal(true)}
        />
      )}

      {/* Modals */}
      {showNewDeliveryModal && (
        <NewDeliveryModal
          projects={projects}
          onClose={() => setShowNewDeliveryModal(false)}
          onSave={(newDelivery) => {
            const updated = [...deliveries, newDelivery];
            setDeliveries(updated);
            saveMaterialDeliveriesToStorage(updated);
            setShowNewDeliveryModal(false);
          }}
        />
      )}

      {showNewStockpileModal && (
        <NewStockpileModal
          projects={projects}
          onClose={() => setShowNewStockpileModal(false)}
          onSave={(newStockpile) => {
            const updated = [...stockpiles, newStockpile];
            setStockpiles(updated);
            saveMaterialStockpilesToStorage(updated);
            setShowNewStockpileModal(false);
          }}
        />
      )}
    </div>
  );
}

// =============================================================================
// DELIVERIES VIEW
// =============================================================================

function DeliveriesView({
  deliveries,
  projects,
  onNewDelivery,
}: {
  deliveries: MaterialDelivery[];
  projects: ConstructionProject[];
  onNewDelivery: () => void;
}) {
  if (deliveries.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-12 text-center">
        <p className="text-gray-400">No deliveries recorded</p>
        <button
          onClick={onNewDelivery}
          className="mt-4 rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Log First Delivery
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Material Deliveries</h2>
        <p className="mt-1 text-sm text-gray-400">{deliveries.length} deliveries recorded</p>
      </div>

      <div className="space-y-3">
        {deliveries.map((delivery) => {
          const project = projects.find(p => p.id === delivery.projectId);
          const conditionColors = {
            good: "bg-green-900/30 text-green-400",
            damaged: "bg-red-900/30 text-red-400",
            partial: "bg-yellow-900/30 text-yellow-400",
          };

          return (
            <div
              key={delivery.id}
              className={`rounded-lg border p-5 transition ${
                delivery.condition === "damaged" 
                  ? "border-red-500/50 bg-red-900/10"
                  : "border-gray-700/50 bg-gray-800 hover:border-orange-500"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-white">{delivery.description}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${conditionColors[delivery.condition]}`}>
                      {delivery.condition.charAt(0).toUpperCase() + delivery.condition.slice(1)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{delivery.materialType}</p>
                  <p className="text-xs text-gray-500">{project?.projectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Delivered</p>
                  <p className="text-sm font-semibold text-white">
                    {new Date(delivery.deliveryDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 rounded border border-gray-700/30 bg-gray-900/50 p-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="mt-1 font-semibold text-white">
                    {delivery.quantity} {delivery.unit}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Supplier</p>
                  <p className="mt-1 font-semibold text-white">{delivery.supplier}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Received By</p>
                  <p className="mt-1 font-semibold text-white">{delivery.receivedBy}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="mt-1 font-semibold text-white">{delivery.location || "Not specified"}</p>
                </div>
              </div>

              {delivery.deliveryNoteNumber && (
                <div className="mt-3 text-xs text-gray-400">
                  Delivery Note: <span className="font-mono text-gray-300">{delivery.deliveryNoteNumber}</span>
                </div>
              )}

              {delivery.notes && (
                <div className="mt-3 rounded border border-gray-700/40 bg-gray-900/40 p-3 text-xs text-gray-300">
                  {delivery.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// STOCKPILES VIEW
// =============================================================================

function StockpilesView({
  stockpiles,
  projects,
  onNewStockpile,
}: {
  stockpiles: MaterialStockpile[];
  projects: ConstructionProject[];
  onNewStockpile: () => void;
}) {
  if (stockpiles.length === 0) {
    return (
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-12 text-center">
        <p className="text-gray-400">No stockpiles being tracked</p>
        <button
          onClick={onNewStockpile}
          className="mt-4 rounded-lg bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Add First Stockpile
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Material Stockpiles</h2>
        <p className="mt-1 text-sm text-gray-400">{stockpiles.length} stockpiles being tracked</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stockpiles.map((stockpile) => {
          const project = projects.find(p => p.id === stockpile.projectId);

          return (
            <div
              key={stockpile.id}
              className="rounded-lg border border-gray-700/50 bg-gray-800 p-5 hover:border-orange-500 transition"
            >
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white">{stockpile.description}</h3>
                <p className="mt-1 text-sm text-gray-400">{stockpile.materialType}</p>
                <p className="text-xs text-gray-500">{project?.projectName}</p>
              </div>

              <div className="rounded border border-gray-700/30 bg-gray-900/50 p-4 mb-4">
                <p className="text-xs text-gray-500 mb-2">Current Stock</p>
                <p className="text-3xl font-bold text-orange-400">
                  {stockpile.currentStock} <span className="text-lg text-gray-400">{stockpile.unit}</span>
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-semibold text-white">{stockpile.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Updated:</span>
                  <span className="text-gray-400">
                    {new Date(stockpile.lastUpdated).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Updated By:</span>
                  <span className="text-gray-400">{stockpile.updatedBy}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// NEW DELIVERY MODAL
// =============================================================================

function NewDeliveryModal({
  projects,
  onClose,
  onSave,
}: {
  projects: ConstructionProject[];
  onClose: () => void;
  onSave: (delivery: MaterialDelivery) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split("T")[0]);
  const [supplier, setSupplier] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState("");
  const [location, setLocation] = useState("");
  const [condition, setCondition] = useState<"good" | "damaged" | "partial">("good");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!projectId || !supplier || !materialType || !description || !quantity || !unit) {
      alert("Please fill in all required fields");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Operations User"}');

    const newDelivery: MaterialDelivery = {
      id: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      deliveryDate,
      supplier,
      materialType,
      description,
      quantity: parseFloat(quantity),
      unit,
      deliveryNoteNumber: deliveryNoteNumber || undefined,
      receivedBy: currentUser.name,
      location: location || undefined,
      condition,
      notes: notes || undefined,
    };

    onSave(newDelivery);
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
              <span>🚚</span>
              Log Material Delivery
            </h3>
            <p className="mt-1 text-sm text-gray-400">Record delivery received on site</p>
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
              <label className="block text-sm font-semibold text-gray-300 mb-2">Delivery Date *</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Supplier *</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g., BuildBase"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Material Type *</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select type...</option>
                <option value="Aggregate">Aggregate</option>
                <option value="Concrete">Concrete</option>
                <option value="Steel">Steel</option>
                <option value="Timber">Timber</option>
                <option value="Drainage">Drainage</option>
                <option value="Blocks">Blocks</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Description *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Type 1 Sub-base Material"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Quantity *</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="tonnes">tonnes</option>
                <option value="m³">m³</option>
                <option value="m">m</option>
                <option value="nr">nr (number)</option>
                <option value="loads">loads</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="good">Good</option>
                <option value="partial">Partial</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Delivery Note #</label>
              <input
                type="text"
                value={deliveryNoteNumber}
                onChange={(e) => setDeliveryNoteNumber(e.target.value)}
                placeholder="DN-12345"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Storage Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., North compound"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes about the delivery..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Log Delivery
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// NEW STOCKPILE MODAL
// =============================================================================

function NewStockpileModal({
  projects,
  onClose,
  onSave,
}: {
  projects: ConstructionProject[];
  onClose: () => void;
  onSave: (stockpile: MaterialStockpile) => void;
}) {
  const [projectId, setProjectId] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [description, setDescription] = useState("");
  const [currentStock, setCurrentStock] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("");

  const handleSubmit = () => {
    if (!projectId || !materialType || !description || !currentStock || !unit || !location) {
      alert("Please fill in all required fields");
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("kbm_user") || '{"name":"Operations User"}');

    const newStockpile: MaterialStockpile = {
      id: `STOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      materialType,
      description,
      currentStock: parseFloat(currentStock),
      unit,
      location,
      lastUpdated: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    onSave(newStockpile);
  };

  return (
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
              <span>📊</span>
              Add Material Stockpile
            </h3>
            <p className="mt-1 text-sm text-gray-400">Track material quantities on site</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Material Type *</label>
              <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select type...</option>
                <option value="Aggregate">Aggregate</option>
                <option value="Concrete">Concrete</option>
                <option value="Steel">Steel</option>
                <option value="Timber">Timber</option>
                <option value="Drainage">Drainage</option>
                <option value="Blocks">Blocks</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Location *</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., North compound"
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
              placeholder="e.g., Type 1 Sub-base Material"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Current Stock *</label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                placeholder="100"
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
              >
                <option value="">Select...</option>
                <option value="tonnes">tonnes</option>
                <option value="m³">m³</option>
                <option value="m">m</option>
                <option value="nr">nr (number)</option>
                <option value="loads">loads</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
            Cancel
          </button>
          <button onClick={handleSubmit} className="rounded bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Add Stockpile
          </button>
        </div>
      </div>
    </div>
  );
}
