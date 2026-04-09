"use client";

import Link from "next/link";
import PermissionGuard from "@/components/PermissionGuard";
import OverviewStatGrid from "@/components/OverviewStatGrid";
import OverviewTrendChart from "@/components/OverviewTrendChart";
import {
  createNextFleetVehicleId,
  FLEET_STATUS_OPTIONS,
  FleetVehicle,
  getFleetVehiclesFromStorage,
  saveFleetVehiclesToStorage,
  VEHICLE_TYPE_OPTIONS,
} from "@/lib/fleet-data";
import { useEffect, useMemo, useRef, useState } from "react";

type FleetVehicleForm = {
  reg: string;
  brand: string;
  model: string;
  type: string;
  status: FleetVehicle["status"];
  allocated: string;
  mileage: string;
  nextService: string;
};

const defaultVehicleForm: FleetVehicleForm = {
  reg: "",
  brand: "",
  model: "",
  type: "Panel Van",
  status: "Available",
  allocated: "Unallocated",
  mileage: "",
  nextService: "",
};

const REGISTRATION_LOOKUP: Record<string, { brand: string; model: string; type: string }> = {
  TS24KBM: { brand: "Ford", model: "Transit", type: "Panel Van" },
  TS24OPS: { brand: "Ford", model: "Transit", type: "Panel Van" },
  TS24BDV: { brand: "BMW", model: "X3", type: "SUV / 4x4" },
  TS24MGT: { brand: "BMW", model: "3 Series", type: "Saloon Car" },
};

function parseServiceDate(value: string): Date | null {
  if (!value || value === "TBC") return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(`${value} ${new Date().getFullYear()}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function daysUntilService(value: string): number | null {
  const date = parseServiceDate(value);
  if (!date) return null;

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const millis = date.getTime() - startOfToday.getTime();
  return Math.ceil(millis / (1000 * 60 * 60 * 24));
}

function formatServiceDate(value: string): string {
  if (!value || value === "TBC") return "TBC";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    }
  }

  return value;
}

function normalizeRegistration(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function formatRegistration(value: string): string {
  const normalized = normalizeRegistration(value);
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, normalized.length - 3)} ${normalized.slice(-3)}`;
}

function toCurrency(value: number): string {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${Math.round(value / 1_000)}k`;
  return `£${value}`;
}

function estimateVehicleValue(type: string): number {
  const valueMap: Record<string, number> = {
    "Small Car": 18000,
    "Saloon Car": 28000,
    "Estate Car": 30000,
    "SUV / 4x4": 42000,
    "Panel Van": 36000,
    "Crew Van": 39000,
    Pickup: 34000,
    Minibus: 48000,
    "Rigid Lorry": 115000,
    "Articulated Lorry": 165000,
    "Specialist HGV": 190000,
  };

  return valueMap[type] ?? 35000;
}

const plantEquipment = [
  { type: "Excavator (Mini)", count: 4, utilisation: "88%", value: "£240k", status: "Active" },
  { type: "Compressor", count: 3, utilisation: "85%", value: "£180k", status: "Active" },
  { type: "Generator", count: 3, utilisation: "72%", value: "£120k", status: "Active" },
  { type: "Pump", count: 2, utilisation: "91%", value: "£90k", status: "Active" },
  { type: "Scaffolding", count: 2, utilisation: "78%", value: "£70k", status: "Active" },
];

export default function FleetOverviewPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState<FleetVehicleForm>(defaultVehicleForm);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLookingUpRegistration, setIsLookingUpRegistration] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncVehicles = () => {
      setVehicles(getFleetVehiclesFromStorage());
      setIsHydrated(true);
    };

    syncVehicles();
    window.addEventListener("storage", syncVehicles);
    window.addEventListener("focus", syncVehicles);
    return () => {
      window.removeEventListener("storage", syncVehicles);
      window.removeEventListener("focus", syncVehicles);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveFleetVehiclesToStorage(vehicles);
  }, [vehicles, isHydrated]);

  useEffect(() => {
    return () => {
      if (lookupTimerRef.current) {
        clearTimeout(lookupTimerRef.current);
      }
    };
  }, []);

  const totalVehicles = vehicles.length;
  const inUseCount = vehicles.filter((vehicle) => vehicle.status === "In Use").length;
  const availableCount = vehicles.filter((vehicle) => vehicle.status === "Available").length;
  const maintenanceCount = vehicles.filter((vehicle) => vehicle.status === "Maintenance").length;
  const reservedCount = vehicles.filter((vehicle) => vehicle.status === "Reserved").length;
  const utilisationRate = totalVehicles === 0 ? 0 : Math.round(((inUseCount + reservedCount) / totalVehicles) * 100);
  const totalVehicleValue = vehicles.reduce((total, vehicle) => total + estimateVehicleValue(vehicle.type), 0);
  const maintenanceDueSoon = vehicles.filter((vehicle) => {
    const days = daysUntilService(vehicle.nextService);
    return days !== null && days >= 0 && days <= 14;
  }).length;

  const fleetStats = [
    {
      label: "Total Assets",
      value: String(totalVehicles + 14),
      change: `${totalVehicles} vehicles + 14 plant`,
      icon: "📊",
      subtitle: "Live vehicle count with plant baseline",
    },
    {
      label: "Available",
      value: String(availableCount),
      change: `${utilisationRate}% utilisation`,
      icon: "✓",
    },
    {
      label: "Maintenance Due",
      value: String(maintenanceDueSoon),
      change: "Schedule within 2 weeks",
      icon: "🔧",
    },
    {
      label: "Total Fleet Value",
      value: toCurrency(totalVehicleValue + 900000),
      change: `${toCurrency(totalVehicleValue)} vehicles + £900k plant`,
      icon: "💷",
    },
  ];

  const utilizationData = useMemo(() => {
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
    const base = [0.7, 0.73, 0.77, 0.8, 0.81];
    const currentRatio = totalVehicles === 0 ? 0 : (inUseCount + reservedCount) / totalVehicles;
    const ratios = [...base, currentRatio];

    return months.map((month, index) => {
      const used = Math.round(totalVehicles * ratios[index]);
      return { month, value: Math.max(used, 0), label: `${used} Used` };
    });
  }, [inUseCount, reservedCount, totalVehicles]);

  const vehicleStatus = [
    { status: "In Use", count: inUseCount, color: "bg-green-500" },
    { status: "Available", count: availableCount, color: "bg-blue-500" },
    { status: "Maintenance", count: maintenanceCount, color: "bg-yellow-500" },
    { status: "Reserved", count: reservedCount, color: "bg-gray-500" },
  ];

  const vehicleComposition = useMemo(() => {
    const grouped = vehicles.reduce<Record<string, { count: number; active: number; value: number }>>((acc, vehicle) => {
      if (!acc[vehicle.type]) {
        acc[vehicle.type] = { count: 0, active: 0, value: 0 };
      }

      acc[vehicle.type].count += 1;
      acc[vehicle.type].value += estimateVehicleValue(vehicle.type);
      if (vehicle.status === "In Use" || vehicle.status === "Reserved") {
        acc[vehicle.type].active += 1;
      }

      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        utilisation: `${Math.round((stats.active / stats.count) * 100)}%`,
        value: toCurrency(stats.value),
      }))
      .sort((a, b) => b.count - a.count);
  }, [vehicles]);

  const maintenanceAlerts = useMemo(() => {
    const vehicleAlerts = vehicles
      .map((vehicle) => {
        const days = daysUntilService(vehicle.nextService);
        if (days === null) return null;

        const priority = days <= 7 ? "High" : days <= 14 ? "Medium" : "Low";
        return {
          asset: vehicle.reg,
          type: vehicle.type,
          issue: days < 0 ? "Service Overdue" : "Service Due",
          date: formatServiceDate(vehicle.nextService),
          priority,
          days,
        };
      })
      .filter((alert): alert is { asset: string; type: string; issue: string; date: string; priority: string; days: number } => alert !== null)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);

    const filler = [
      { asset: "EXC-001", type: "Excavator", issue: "Hydraulic Fluid Change", date: "22 Feb", priority: "High", days: 4 },
      { asset: "GEN-002", type: "Generator", issue: "Maintenance Check", date: "25 Feb", priority: "Medium", days: 7 },
    ];

    return [...vehicleAlerts, ...filler].slice(0, 5);
  }, [vehicles]);

  const handleAddAsset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newVehicle.reg.trim() || !newVehicle.brand.trim() || !newVehicle.model.trim()) return;

    const created: FleetVehicle = {
      id: createNextFleetVehicleId(vehicles),
      reg: formatRegistration(newVehicle.reg),
      brand: newVehicle.brand.trim(),
      model: newVehicle.model.trim(),
      type: newVehicle.type,
      status: newVehicle.status,
      allocated: newVehicle.allocated.trim() || "Unallocated",
      mileage: newVehicle.mileage.trim() || "0",
      nextService: newVehicle.nextService || "TBC",
    };

    setVehicles((current) => [created, ...current]);
    setNewVehicle(defaultVehicleForm);
    setLookupMessage("");
    setShowAddAssetModal(false);
  };

  const applyLocalLookup = (registration: string) => {
    const local = REGISTRATION_LOOKUP[registration];
    if (!local) return false;

    setNewVehicle((current) => ({
      ...current,
      brand: current.brand || local.brand,
      model: current.model || local.model,
      type: local.type,
    }));
    setLookupMessage(`Auto-filled from local data: ${local.brand} ${local.model}`);
    return true;
  };

  const handleRegistrationChange = (value: string) => {
    const normalized = normalizeRegistration(value);
    setNewVehicle((current) => ({ ...current, reg: value }));
    setLookupMessage("");

    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
    }

    if (normalized.length < 5) {
      return;
    }

    lookupTimerRef.current = setTimeout(async () => {
      setIsLookingUpRegistration(true);
      try {
        const response = await fetch(`/api/fleet/vehicle-lookup?registration=${encodeURIComponent(normalized)}`, {
          cache: "no-store",
        });

        if (response.ok) {
          const data = (await response.json()) as {
            found?: boolean;
            brand?: string;
            model?: string;
            type?: string;
          };

          if (data.found && (data.brand || data.model || data.type)) {
            setNewVehicle((current) => ({
              ...current,
              brand: data.brand || current.brand,
              model: data.model || current.model,
              type: data.type || current.type,
            }));
            setLookupMessage(`Auto-filled from registration lookup${data.model ? `: ${data.brand} ${data.model}` : ""}`);
            return;
          }
        }

        if (!applyLocalLookup(normalized)) {
          setLookupMessage("No registration match found. Please enter brand/model manually.");
        }
      } catch {
        if (!applyLocalLookup(normalized)) {
          setLookupMessage("Lookup unavailable right now. Please enter brand/model manually.");
        }
      } finally {
        setIsLookingUpRegistration(false);
      }
    }, 350);
  };

  const closeAddAssetModal = () => {
    setShowAddAssetModal(false);
    setNewVehicle(defaultVehicleForm);
    setLookupMessage("");
    setIsLookingUpRegistration(false);
    if (lookupTimerRef.current) {
      clearTimeout(lookupTimerRef.current);
      lookupTimerRef.current = null;
    }
  };

  return (
    <PermissionGuard permission="fleet">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        <Link href="/maintenance" className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-700">
          Maintenance
        </Link>
        <button
          onClick={() => setShowAddAssetModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + Add Asset
        </button>
      </div>

      {/* Key Metrics */}
      <OverviewStatGrid items={fleetStats} />

      {/* Utilization Trend & Status */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Utilization Chart */}
        <OverviewTrendChart
          eyebrow="Fleet Utilisation"
          title="Last 6 Months"
          summaryValue={`${utilisationRate}%`}
          summaryChange="live from fleet statuses"
          summaryToneClassName="text-green-400"
          points={utilizationData}
        />

        {/* Vehicle Status Breakdown */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Vehicles</p>
            <h2 className="mt-1 text-xl font-bold text-white">Status Breakdown</h2>
          </div>
          <div className="space-y-3">
            {vehicleStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${item.color}`} />
                  <p className="text-sm text-gray-400">{item.status}</p>
                </div>
                <p className="text-sm font-semibold text-white">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicles & Fleet Breakdown */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Vehicle Types */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Vehicles</p>
            <h2 className="mt-1 text-xl font-bold text-white">Fleet Composition</h2>
          </div>
          <div className="space-y-4">
            {vehicleComposition.length === 0 && <p className="text-sm text-gray-400">No fleet vehicles available.</p>}
            {vehicleComposition.map((vehicle) => (
              <div key={vehicle.type} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{vehicle.type}</p>
                  <p className="text-sm font-semibold text-orange-400">{vehicle.count}</p>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: vehicle.utilisation }} />
                </div>
                <p className="text-xs text-gray-400">{vehicle.utilisation} utilised • {vehicle.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Plant Equipment Types */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Equipment</p>
            <h2 className="mt-1 text-xl font-bold text-white">Plant Composition</h2>
          </div>
          <div className="space-y-4">
            {plantEquipment.map((equipment) => (
              <div key={equipment.type} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{equipment.type}</p>
                  <p className="text-sm font-semibold text-blue-400">{equipment.count}</p>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: equipment.utilisation }} />
                </div>
                <p className="text-xs text-gray-400">{equipment.utilisation} utilised • {equipment.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Asset Summary */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Summary</p>
            <h2 className="mt-1 text-xl font-bold text-white">Total Asset Value</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Vehicles</p>
                <p className="text-sm font-semibold text-orange-400">{totalVehicles}</p>
              </div>
              <p className="text-xs text-gray-400">{toCurrency(totalVehicleValue)} • {utilisationRate}% utilised</p>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Plant/Equipment</p>
                <p className="text-sm font-semibold text-blue-400">14</p>
              </div>
              <p className="text-xs text-gray-400">£900k • 82% utilised</p>
            </div>
            <div className="rounded-lg border border-orange-700/50 bg-orange-900/20 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">Combined</p>
                <p className="text-sm font-semibold text-orange-400">{totalVehicles + 14}</p>
              </div>
              <p className="text-xs text-gray-400">{toCurrency(totalVehicleValue + 900000)} • {Math.round((utilisationRate + 82) / 2)}% utilised</p>
            </div>
          </div>
        </div>
      </section>

      {/* Maintenance & Performance */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Maintenance</p>
            <h2 className="mt-1 text-xl font-bold text-white">Upcoming Service</h2>
          </div>
          <div className="space-y-3">
            {maintenanceAlerts.map((alert) => (
              <div key={alert.asset} className="flex items-start justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
                <div>
                  <p className="text-sm font-semibold text-white">{alert.asset}</p>
                  <p className="text-xs text-gray-400">{alert.type} • {alert.issue} • Due {alert.date}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  alert.priority === 'High' ? 'bg-red-900/30 text-red-400' :
                  alert.priority === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-blue-900/30 text-blue-400'
                }`}>
                  {alert.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Metrics</p>
            <h2 className="mt-1 text-xl font-bold text-white">Performance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Vehicle Utilisation</p>
              <p className="text-lg font-semibold text-white">{utilisationRate}%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Plant Utilisation</p>
              <p className="text-lg font-semibold text-blue-400">82%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Combined Utilisation</p>
              <p className="text-lg font-semibold text-orange-400">{Math.round((utilisationRate + 82) / 2)}%</p>
            </div>
            <hr className="border-gray-700/50" />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Maintenance Compliance</p>
              <p className="text-lg font-semibold text-green-400">{Math.max(0, 100 - maintenanceDueSoon * 3)}%</p>
            </div>
          </div>
        </div>
      </section>

      {showAddAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-700/60 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Fleet Asset</h3>
            <p className="mt-1 text-sm text-gray-400">Add a new vehicle directly from the overview dashboard.</p>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleAddAsset}>
              <input
                value={newVehicle.reg}
                onChange={(event) => handleRegistrationChange(event.target.value)}
                placeholder="Registration"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                {isLookingUpRegistration
                  ? "Looking up registration..."
                  : lookupMessage || "Brand/model will auto-fill for known registrations"}
              </div>
              <select
                value={newVehicle.type}
                onChange={(event) => setNewVehicle((current) => ({ ...current, type: event.target.value }))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {VEHICLE_TYPE_OPTIONS.map((vehicleType) => (
                  <option key={vehicleType}>{vehicleType}</option>
                ))}
              </select>
              <input
                value={newVehicle.brand}
                onChange={(event) => setNewVehicle((current) => ({ ...current, brand: event.target.value }))}
                placeholder="Brand"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <input
                value={newVehicle.model}
                onChange={(event) => setNewVehicle((current) => ({ ...current, model: event.target.value }))}
                placeholder="Model"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <select
                value={newVehicle.status}
                onChange={(event) => setNewVehicle((current) => ({ ...current, status: event.target.value as FleetVehicle["status"] }))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {FLEET_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                value={newVehicle.allocated}
                onChange={(event) => setNewVehicle((current) => ({ ...current, allocated: event.target.value }))}
                placeholder="Allocated site"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                value={newVehicle.mileage}
                onChange={(event) => setNewVehicle((current) => ({ ...current, mileage: event.target.value }))}
                placeholder="Mileage"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="date"
                value={newVehicle.nextService}
                onChange={(event) => setNewVehicle((current) => ({ ...current, nextService: event.target.value }))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />

              <div className="mt-2 flex gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={closeAddAssetModal}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
