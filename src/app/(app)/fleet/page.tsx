"use client";

import PermissionGuard from "@/components/PermissionGuard";
import Link from "next/link";
import {
  createNextFleetVehicleId,
  FLEET_STATUS_OPTIONS,
  FleetVehicle,
  getFleetVehiclesFromStorage,
  saveFleetVehiclesToStorage,
  VEHICLE_TYPE_OPTIONS,
} from "@/lib/fleet-data";

import { useEffect, useMemo, useRef, useState } from "react";

const REGISTRATION_LOOKUP: Record<string, { brand: string; model: string; type: string }> = {
  TS24KBM: { brand: "Ford", model: "Transit", type: "Panel Van" },
  TS24OPS: { brand: "Ford", model: "Transit", type: "Panel Van" },
  TS24BDV: { brand: "BMW", model: "X3", type: "SUV / 4x4" },
  TS24MGT: { brand: "BMW", model: "3 Series", type: "Saloon Car" },
};

function normalizeRegistration(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

function formatRegistration(value: string): string {
  const normalized = normalizeRegistration(value);
  if (normalized.length <= 4) return normalized;
  return `${normalized.slice(0, normalized.length - 3)} ${normalized.slice(-3)}`;
}

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

const STATUS_COLORS: Record<FleetVehicle["status"], string> = {
  "In Use": "bg-green-500",
  Available: "bg-blue-500",
  Maintenance: "bg-yellow-500",
  Reserved: "bg-gray-500",
};

export default function FleetPage() {
  const [activeVehicles, setActiveVehicles] = useState<FleetVehicle[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<FleetVehicle | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLookingUpRegistration, setIsLookingUpRegistration] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newVehicle, setNewVehicle] = useState<FleetVehicleForm>(defaultVehicleForm);

  useEffect(() => {
    const syncVehicles = () => {
      setActiveVehicles(getFleetVehiclesFromStorage());
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
    saveFleetVehiclesToStorage(activeVehicles);
  }, [activeVehicles, isHydrated]);

  useEffect(() => {
    return () => {
      if (lookupTimerRef.current) {
        clearTimeout(lookupTimerRef.current);
      }
    };
  }, []);

  const totalVehicles = activeVehicles.length;
  const inUseCount = activeVehicles.filter((vehicle) => vehicle.status === "In Use").length;
  const availableCount = activeVehicles.filter((vehicle) => vehicle.status === "Available").length;
  const reservedCount = activeVehicles.filter((vehicle) => vehicle.status === "Reserved").length;

  const utilisationRate = totalVehicles === 0 ? 0 : Math.round(((inUseCount + reservedCount) / totalVehicles) * 100);
  const totalFleetValue = activeVehicles.reduce((total, vehicle) => total + estimateVehicleValue(vehicle.type), 0);
  const maintenanceDueSoonCount = activeVehicles.filter((vehicle) => {
    const days = daysUntilService(vehicle.nextService);
    return days !== null && days >= 0 && days <= 14;
  }).length;

  const fleetStats = [
    {
      label: "Total Vehicles",
      value: String(totalVehicles),
      change: `${inUseCount} currently in use`,
      icon: "🚗",
    },
    {
      label: "Available",
      value: String(availableCount),
      change: `${utilisationRate}% utilisation`,
      icon: "✓",
    },
    {
      label: "Maintenance Due",
      value: String(maintenanceDueSoonCount),
      change: "Schedule within 2 weeks",
      icon: "🔧",
    },
    {
      label: "Total Fleet Value",
      value: toCurrency(totalFleetValue),
      change: `${totalVehicles > 0 ? Math.round(totalFleetValue / totalVehicles) : 0} avg value / vehicle`,
      icon: "💷",
    },
  ];

  const utilizationData = useMemo(() => {
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
    const base = [0.72, 0.76, 0.79, 0.81, 0.83];
    const currentRatio = totalVehicles === 0 ? 0 : (inUseCount + reservedCount) / totalVehicles;
    const ratios = [...base, currentRatio];

    return months.map((month, index) => {
      const used = Math.round(totalVehicles * ratios[index]);
      return { month, value: Math.max(used, 0), label: `${used} Used` };
    });
  }, [inUseCount, reservedCount, totalVehicles]);

  const maxUtilization = Math.max(...utilizationData.map((item) => item.value), 1);

  const vehicleStatus = [
    { status: "In Use" as const, count: inUseCount, color: STATUS_COLORS["In Use"] },
    { status: "Available" as const, count: availableCount, color: STATUS_COLORS.Available },
    {
      status: "Maintenance" as const,
      count: activeVehicles.filter((vehicle) => vehicle.status === "Maintenance").length,
      color: STATUS_COLORS.Maintenance,
    },
    { status: "Reserved" as const, count: reservedCount, color: STATUS_COLORS.Reserved },
  ];

  const vehicles = useMemo(() => {
    const grouped = activeVehicles.reduce<Record<string, { count: number; active: number; value: number }>>((acc, vehicle) => {
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
      .map(([type, group]) => ({
        type,
        count: group.count,
        utilisation: `${Math.round((group.active / group.count) * 100)}%`,
        value: toCurrency(group.value),
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeVehicles]);

  const maintenanceAlerts = useMemo(() => {
    return activeVehicles
      .map((vehicle) => {
        const days = daysUntilService(vehicle.nextService);
        if (days === null) return null;

        const priority = days <= 7 ? "High" : days <= 14 ? "Medium" : "Low";
        return {
          vehicle: vehicle.reg,
          issue: days < 0 ? "Service Overdue" : "Service Due",
          date: formatServiceDate(vehicle.nextService),
          priority,
          days,
        };
      })
      .filter((alert): alert is { vehicle: string; issue: string; date: string; priority: string; days: number } => alert !== null)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);
  }, [activeVehicles]);

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

  const handleAddVehicle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newVehicle.reg.trim() || !newVehicle.brand.trim() || !newVehicle.model.trim()) return;

    const nextId = createNextFleetVehicleId(activeVehicles);
    const vehicle: FleetVehicle = {
      id: nextId,
      reg: formatRegistration(newVehicle.reg.trim()),
      brand: newVehicle.brand.trim(),
      model: newVehicle.model.trim(),
      type: newVehicle.type,
      status: newVehicle.status,
      allocated: newVehicle.allocated.trim() || "Unallocated",
      mileage: newVehicle.mileage.trim() || "0",
      nextService: newVehicle.nextService || "TBC",
    };

    setActiveVehicles((current) => [vehicle, ...current]);
    setNewVehicle(defaultVehicleForm);
    setLookupMessage("");
    setShowAddVehicleModal(false);
  };

  const handleUpdateVehicle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingVehicle) return;

    setActiveVehicles((current) =>
      current.map((vehicle) => (vehicle.id === editingVehicle.id ? { ...editingVehicle, reg: formatRegistration(editingVehicle.reg) } : vehicle)),
    );
    setEditingVehicle(null);
  };

  const handleDeleteVehicle = () => {
    if (!vehicleToDelete) return;
    setActiveVehicles((current) => current.filter((vehicle) => vehicle.id !== vehicleToDelete.id));
    setVehicleToDelete(null);
  };

  return (
    <PermissionGuard permission="fleet">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowAddVehicleModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 inline-flex items-center"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fleetStats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {stat.label}
              </p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.change}</p>
          </div>
        ))}
      </section>

      {/* Utilization Trend & Status */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Utilization Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fleet Utilisation</p>
                <h2 className="mt-1 text-xl font-bold text-white">Last 6 Months</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{utilisationRate}%</p>
                <p className="text-xs text-green-400">based on live fleet status</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-3 h-48 mt-12">
            {utilizationData.map((item) => (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-2">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:from-orange-400 hover:to-orange-300"
                    style={{ height: `${(item.value / maxUtilization) * 180}px` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.month}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

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

      {/* Active Vehicles & Fleet Breakdown */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Active Vehicles */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Vehicles</p>
              <h2 className="mt-1 text-xl font-bold text-white">Fleet Status</h2>
            </div>
            <Link href="/fleet-overview" className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Registration</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Vehicle</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Next Service</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {activeVehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{vehicle.id}</td>
                    <td className="py-3 text-sm text-gray-300">{vehicle.reg}</td>
                    <td className="py-3 text-sm text-white">{vehicle.brand} {vehicle.model}</td>
                    <td className="py-3 text-sm text-white">{vehicle.type}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        vehicle.status === 'In Use' ? 'bg-green-900/30 text-green-400' :
                        vehicle.status === 'Available' ? 'bg-blue-900/30 text-blue-400' :
                        vehicle.status === 'Maintenance' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-gray-900/30 text-gray-300'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{formatServiceDate(vehicle.nextService)}</td>
                    <td className="py-3 text-right text-sm">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => setEditingVehicle(vehicle)}
                          className="rounded border border-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setVehicleToDelete(vehicle)}
                          className="rounded border border-red-700/60 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Types */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Types</p>
            <h2 className="mt-1 text-xl font-bold text-white">Fleet Composition</h2>
          </div>
          <div className="space-y-4">
            {vehicles.length === 0 && <p className="text-sm text-gray-400">No fleet vehicles yet.</p>}
            {vehicles.map((vehicle) => (
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
      </section>

      {/* Maintenance & Performance */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Maintenance</p>
            <h2 className="mt-1 text-xl font-bold text-white">Upcoming Service</h2>
          </div>
          <div className="space-y-3">
            {maintenanceAlerts.length === 0 && <p className="text-sm text-gray-400">No upcoming maintenance alerts.</p>}
            {maintenanceAlerts.map((alert) => (
              <div key={alert.vehicle} className="flex items-start justify-between p-3 rounded-lg bg-gray-700/30 border border-gray-700/50">
                <div>
                  <p className="text-sm font-semibold text-white">{alert.vehicle}</p>
                  <p className="text-xs text-gray-400">{alert.issue} • Due {alert.date}</p>
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
              <p className="text-sm text-gray-400">Utilisation Rate</p>
              <p className="text-lg font-semibold text-white">{utilisationRate}%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Assets In Use</p>
              <p className="text-lg font-semibold text-orange-400">{inUseCount}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Maintenance Compliance</p>
              <p className="text-lg font-semibold text-green-400">{Math.max(0, 100 - maintenanceDueSoonCount * 3)}%</p>
            </div>
          </div>
        </div>
      </section>

      {showAddVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-700/60 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Add Vehicle</h3>
            <p className="mt-1 text-sm text-gray-400">Register a new fleet asset for allocation and maintenance tracking.</p>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleAddVehicle}>
              <input
                value={newVehicle.reg}
                onChange={(event) => handleRegistrationChange(event.target.value)}
                placeholder="Registration (e.g. AB12 CDE)"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                {isLookingUpRegistration
                  ? "Looking up registration..."
                  : lookupMessage || "Brand/model will auto-fill for known registrations"}
              </div>
              <input
                value={newVehicle.brand}
                onChange={(event) => setNewVehicle((current) => ({ ...current, brand: event.target.value }))}
                placeholder="Brand (e.g. Ford, BMW)"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <input
                value={newVehicle.model}
                onChange={(event) => setNewVehicle((current) => ({ ...current, model: event.target.value }))}
                placeholder="Model (e.g. Transit, 3 Series)"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <select
                value={newVehicle.type}
                onChange={(event) => setNewVehicle((current) => ({ ...current, type: event.target.value }))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {VEHICLE_TYPE_OPTIONS.map((vehicleType) => (
                  <option key={vehicleType}>{vehicleType}</option>
                ))}
              </select>
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
                  onClick={() => setShowAddVehicleModal(false)}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-700/60 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Edit Vehicle</h3>
            <p className="mt-1 text-sm text-gray-400">Update allocation, status and servicing details.</p>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleUpdateVehicle}>
              <input
                value={editingVehicle.reg}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, reg: event.target.value } : current))}
                placeholder="Registration"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <input
                value={editingVehicle.type}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, type: event.target.value } : current))}
                placeholder="Type"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <input
                value={editingVehicle.brand}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, brand: event.target.value } : current))}
                placeholder="Brand"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <input
                value={editingVehicle.model}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, model: event.target.value } : current))}
                placeholder="Model"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                required
              />
              <select
                value={editingVehicle.status}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, status: event.target.value as FleetVehicle["status"] } : current))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {FLEET_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                value={editingVehicle.allocated}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, allocated: event.target.value } : current))}
                placeholder="Allocated site"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                value={editingVehicle.mileage}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, mileage: event.target.value } : current))}
                placeholder="Mileage"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="date"
                value={/^\d{4}-\d{2}-\d{2}$/.test(editingVehicle.nextService) ? editingVehicle.nextService : ""}
                onChange={(event) => setEditingVehicle((current) => (current ? { ...current, nextService: event.target.value } : current))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />

              <div className="mt-2 flex gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vehicleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700/60 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete Vehicle</h3>
            <p className="mt-2 text-sm text-gray-300">
              Remove <span className="font-semibold text-white">{vehicleToDelete.reg}</span> ({vehicleToDelete.brand} {vehicleToDelete.model}) from fleet records?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setVehicleToDelete(null)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVehicle}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Vehicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
