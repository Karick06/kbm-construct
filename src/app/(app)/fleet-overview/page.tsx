"use client";

import Link from "next/link";
import PermissionGuard from "@/components/PermissionGuard";
import OverviewStatGrid from "@/components/OverviewStatGrid";
import OverviewTrendChart from "@/components/OverviewTrendChart";
import {
  createNextPlantId,
  createNextToolId,
  createNextFleetVehicleId,
  FLEET_STATUS_OPTIONS,
  FleetVehicle,
  PlantAsset,
  ToolAsset,
  PLANT_TYPE_OPTIONS,
  TOOL_TYPE_OPTIONS,
  getFleetVehiclesFromStorage,
  getPlantAssetsFromStorage,
  getToolAssetsFromStorage,
  saveFleetVehiclesToStorage,
  savePlantAssetsToStorage,
  saveToolAssetsToStorage,
  VEHICLE_TYPE_OPTIONS,
} from "@/lib/fleet-data";
import { useEffect, useMemo, useRef, useState } from "react";

type FleetVehicleForm = {
  category: "Vehicle" | "Plant" | "Tool";
  assetNumber: string;
  reg: string;
  brand: string;
  model: string;
  type: string;
  status: FleetVehicle["status"];
  allocated: string;
  mileage: string;
  nextService: string;
};

type EditableOverviewAsset = {
  category: "Vehicle" | "Plant" | "Tool";
  id: string;
  assetNumber?: string;
  reg?: string;
  brand?: string;
  model?: string;
  name?: string;
  type: string;
  status: FleetVehicle["status"];
  allocated: string;
  nextService: string;
  mileage?: string;
  value?: string;
};

const defaultVehicleForm: FleetVehicleForm = {
  category: "Vehicle",
  assetNumber: "",
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

function normalizeAssetNumber(value: string): string {
  return value.trim().toUpperCase();
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

export default function FleetOverviewPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [plantAssets, setPlantAssets] = useState<PlantAsset[]>([]);
  const [toolAssets, setToolAssets] = useState<ToolAsset[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState<FleetVehicleForm>(defaultVehicleForm);
  const [editingAsset, setEditingAsset] = useState<EditableOverviewAsset | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<EditableOverviewAsset | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLookingUpRegistration, setIsLookingUpRegistration] = useState(false);
  const lookupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const syncVehicles = () => {
      setVehicles(getFleetVehiclesFromStorage());
      setPlantAssets(getPlantAssetsFromStorage());
      setToolAssets(getToolAssetsFromStorage());
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
    if (!isHydrated) return;
    savePlantAssetsToStorage(plantAssets);
  }, [plantAssets, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    saveToolAssetsToStorage(toolAssets);
  }, [toolAssets, isHydrated]);

  useEffect(() => {
    return () => {
      if (lookupTimerRef.current) {
        clearTimeout(lookupTimerRef.current);
      }
    };
  }, []);

  const totalVehicles = vehicles.length;
  const totalPlant = plantAssets.length;
  const totalTools = toolAssets.length;
  const totalAssets = totalVehicles + totalPlant + totalTools;
  const inUseCount = vehicles.filter((vehicle) => vehicle.status === "In Use").length;
  const availableCount = vehicles.filter((vehicle) => vehicle.status === "Available").length;
  const maintenanceCount = vehicles.filter((vehicle) => vehicle.status === "Maintenance").length;
  const reservedCount = vehicles.filter((vehicle) => vehicle.status === "Reserved").length;
  const inUsePlant = plantAssets.filter((asset) => asset.status === "In Use").length;
  const inUseTools = toolAssets.filter((asset) => asset.status === "In Use").length;
  const availablePlant = plantAssets.filter((asset) => asset.status === "Available").length;
  const availableTools = toolAssets.filter((asset) => asset.status === "Available").length;
  const totalInUse = inUseCount + inUsePlant + inUseTools;
  const totalAvailable = availableCount + availablePlant + availableTools;
  const plantUtilisation = totalPlant === 0 ? 0 : Math.round((inUsePlant / totalPlant) * 100);
  const toolUtilisation = totalTools === 0 ? 0 : Math.round((inUseTools / totalTools) * 100);

  const utilisationRate = totalAssets === 0 ? 0 : Math.round(((totalInUse + reservedCount) / totalAssets) * 100);
  const totalVehicleValue = vehicles.reduce((total, vehicle) => total + estimateVehicleValue(vehicle.type), 0);
  const totalPlantValue = plantAssets.reduce((total, asset) => total + asset.value, 0);
  const totalToolValue = toolAssets.reduce((total, asset) => total + asset.value, 0);
  const maintenanceDueSoon = [
    ...vehicles.map((asset) => asset.nextService),
    ...plantAssets.map((asset) => asset.nextService),
    ...toolAssets.map((asset) => asset.nextService),
  ].filter((serviceDate) => {
    const days = daysUntilService(serviceDate);
    return days !== null && days >= 0 && days <= 14;
  }).length;

  const fleetStats = [
    {
      label: "Total Assets",
      value: String(totalAssets),
      change: `${totalVehicles} vehicles • ${totalPlant} plant • ${totalTools} tools`,
      icon: "📊",
      subtitle: "Live mixed asset count",
    },
    {
      label: "Available",
      value: String(totalAvailable),
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
      value: toCurrency(totalVehicleValue + totalPlantValue + totalToolValue),
      change: `${toCurrency(totalVehicleValue)} vehicles + ${toCurrency(totalPlantValue)} plant + ${toCurrency(totalToolValue)} tools`,
      icon: "💷",
    },
  ];

  const utilizationData = useMemo(() => {
    const months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
    const base = [0.7, 0.73, 0.77, 0.8, 0.81];
    const currentRatio = totalAssets === 0 ? 0 : (totalInUse + reservedCount) / totalAssets;
    const ratios = [...base, currentRatio];

    return months.map((month, index) => {
      const used = Math.round(totalAssets * ratios[index]);
      return { month, value: Math.max(used, 0), label: `${used} Used` };
    });
  }, [reservedCount, totalAssets, totalInUse]);

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

  const plantComposition = useMemo(() => {
    const grouped = plantAssets.reduce<Record<string, { count: number; active: number; value: number }>>((acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = { count: 0, active: 0, value: 0 };
      }

      acc[asset.type].count += 1;
      acc[asset.type].value += asset.value;
      if (asset.status === "In Use" || asset.status === "Reserved") {
        acc[asset.type].active += 1;
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
  }, [plantAssets]);

  const toolComposition = useMemo(() => {
    const grouped = toolAssets.reduce<Record<string, { count: number; active: number; value: number }>>((acc, asset) => {
      if (!acc[asset.type]) {
        acc[asset.type] = { count: 0, active: 0, value: 0 };
      }

      acc[asset.type].count += 1;
      acc[asset.type].value += asset.value;
      if (asset.status === "In Use" || asset.status === "Reserved") {
        acc[asset.type].active += 1;
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
  }, [toolAssets]);

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

    const plantAndToolAlerts = [...plantAssets, ...toolAssets]
      .map((asset) => {
        const days = daysUntilService(asset.nextService);
        if (days === null) return null;

        const priority = days <= 7 ? "High" : days <= 14 ? "Medium" : "Low";
        return {
          asset: asset.name,
          type: asset.type,
          issue: days < 0 ? "Service Overdue" : "Service Due",
          date: formatServiceDate(asset.nextService),
          priority,
          days,
        };
      })
      .filter((alert): alert is { asset: string; type: string; issue: string; date: string; priority: string; days: number } => alert !== null)
      .sort((a, b) => a.days - b.days)
      .slice(0, 5);

    return [...vehicleAlerts, ...plantAndToolAlerts].sort((a, b) => a.days - b.days).slice(0, 6);
  }, [vehicles, plantAssets, toolAssets]);

  const handleAddAsset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const selectedType = newVehicle.type;

    if (newVehicle.category === "Vehicle") {
      if (!newVehicle.reg.trim() || !newVehicle.brand.trim() || !newVehicle.model.trim()) return;

      const created: FleetVehicle = {
        id: createNextFleetVehicleId(vehicles),
        reg: formatRegistration(newVehicle.reg),
        brand: newVehicle.brand.trim(),
        model: newVehicle.model.trim(),
        type: selectedType,
        status: newVehicle.status,
        allocated: newVehicle.allocated.trim() || "Unallocated",
        mileage: newVehicle.mileage.trim() || "0",
        nextService: newVehicle.nextService || "TBC",
      };

      setVehicles((current) => [created, ...current]);
    } else if (newVehicle.category === "Plant") {
      if (!newVehicle.model.trim()) return;

      const internalId = createNextPlantId(plantAssets);

      const created: PlantAsset = {
        id: internalId,
        assetNumber: normalizeAssetNumber(newVehicle.assetNumber) || internalId,
        name: newVehicle.model.trim(),
        type: selectedType,
        status: newVehicle.status,
        allocated: newVehicle.allocated.trim() || "Unallocated",
        nextService: newVehicle.nextService || "TBC",
        value: Number(newVehicle.mileage || "0") || 0,
      };

      setPlantAssets((current) => [created, ...current]);
    } else {
      if (!newVehicle.model.trim()) return;

      const internalId = createNextToolId(toolAssets);

      const created: ToolAsset = {
        id: internalId,
        assetNumber: normalizeAssetNumber(newVehicle.assetNumber) || internalId,
        name: newVehicle.model.trim(),
        type: selectedType,
        status: newVehicle.status,
        allocated: newVehicle.allocated.trim() || "Unallocated",
        nextService: newVehicle.nextService || "TBC",
        value: Number(newVehicle.mileage || "0") || 0,
      };

      setToolAssets((current) => [created, ...current]);
    }

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

  const handleUpdateAsset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAsset) return;

    if (editingAsset.category === "Vehicle") {
      setVehicles((current) =>
        current.map((vehicle) =>
          vehicle.id === editingAsset.id
            ? {
                ...vehicle,
                reg: formatRegistration(editingAsset.reg || vehicle.reg),
                brand: (editingAsset.brand || vehicle.brand).trim(),
                model: (editingAsset.model || vehicle.model).trim(),
                type: editingAsset.type,
                status: editingAsset.status,
                allocated: editingAsset.allocated.trim() || "Unallocated",
                mileage: editingAsset.mileage || vehicle.mileage,
                nextService: editingAsset.nextService || "TBC",
              }
            : vehicle,
        ),
      );
    } else if (editingAsset.category === "Plant") {
      const nextValue = Number(editingAsset.value || "0");
      setPlantAssets((current) =>
        current.map((asset) =>
          asset.id === editingAsset.id
            ? {
                ...asset,
              assetNumber: normalizeAssetNumber(editingAsset.assetNumber || "") || asset.assetNumber,
                name: (editingAsset.name || asset.name).trim(),
                type: editingAsset.type,
                status: editingAsset.status,
                allocated: editingAsset.allocated.trim() || "Unallocated",
                nextService: editingAsset.nextService || "TBC",
                value: Number.isFinite(nextValue) ? nextValue : 0,
              }
            : asset,
        ),
      );
    } else {
      const nextValue = Number(editingAsset.value || "0");
      setToolAssets((current) =>
        current.map((asset) =>
          asset.id === editingAsset.id
            ? {
                ...asset,
              assetNumber: normalizeAssetNumber(editingAsset.assetNumber || "") || asset.assetNumber,
                name: (editingAsset.name || asset.name).trim(),
                type: editingAsset.type,
                status: editingAsset.status,
                allocated: editingAsset.allocated.trim() || "Unallocated",
                nextService: editingAsset.nextService || "TBC",
                value: Number.isFinite(nextValue) ? nextValue : 0,
              }
            : asset,
        ),
      );
    }

    setEditingAsset(null);
  };

  const handleDeleteAsset = () => {
    if (!assetToDelete) return;

    if (assetToDelete.category === "Vehicle") {
      setVehicles((current) => current.filter((vehicle) => vehicle.id !== assetToDelete.id));
    } else if (assetToDelete.category === "Plant") {
      setPlantAssets((current) => current.filter((asset) => asset.id !== assetToDelete.id));
    } else {
      setToolAssets((current) => current.filter((asset) => asset.id !== assetToDelete.id));
    }

    setAssetToDelete(null);
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
            {plantComposition.length === 0 && <p className="text-sm text-gray-400">No plant assets available.</p>}
            {plantComposition.map((equipment) => (
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

        {/* Tool Composition */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Tools</p>
            <h2 className="mt-1 text-xl font-bold text-white">Tool Composition</h2>
          </div>
          <div className="space-y-4">
            {toolComposition.length === 0 && <p className="text-sm text-gray-400">No tools tracked yet.</p>}
            {toolComposition.map((tool) => (
              <div key={tool.type} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-white">{tool.type}</p>
                  <p className="text-sm font-semibold text-teal-400">{tool.count}</p>
                </div>
                <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: tool.utilisation }} />
                </div>
                <p className="text-xs text-gray-400">{tool.utilisation} utilised • {tool.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Register</p>
            <h2 className="mt-1 text-xl font-bold text-white">Asset Register</h2>
          </div>
          <p className="text-sm text-gray-300">{totalAssets} total assets</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Category</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Asset</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Allocation</th>
                <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {[...vehicles, ...plantAssets, ...toolAssets].length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-gray-400">
                    No assets registered yet.
                  </td>
                </tr>
              )}

              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-gray-700/30">
                  <td className="py-3 text-sm text-orange-300">Vehicle</td>
                  <td className="py-3 text-sm text-white">{vehicle.reg} • {vehicle.brand} {vehicle.model}</td>
                  <td className="py-3 text-sm text-gray-300">{vehicle.type}</td>
                  <td className="py-3 text-sm text-gray-300">{vehicle.status}</td>
                  <td className="py-3 text-sm text-gray-300">{vehicle.allocated}</td>
                  <td className="py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() =>
                          setEditingAsset({
                            category: "Vehicle",
                            id: vehicle.id,
                            reg: vehicle.reg,
                            brand: vehicle.brand,
                            model: vehicle.model,
                            type: vehicle.type,
                            status: vehicle.status,
                            allocated: vehicle.allocated,
                            nextService: /^\d{4}-\d{2}-\d{2}$/.test(vehicle.nextService) ? vehicle.nextService : "",
                            mileage: vehicle.mileage,
                          })
                        }
                        className="rounded border border-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setAssetToDelete({
                            category: "Vehicle",
                            id: vehicle.id,
                            reg: vehicle.reg,
                            brand: vehicle.brand,
                            model: vehicle.model,
                            type: vehicle.type,
                            status: vehicle.status,
                            allocated: vehicle.allocated,
                            nextService: vehicle.nextService,
                            mileage: vehicle.mileage,
                          })
                        }
                        className="rounded border border-red-700/60 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {plantAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-700/30">
                  <td className="py-3 text-sm text-blue-300">Plant</td>
                  <td className="py-3 text-sm text-white">{asset.assetNumber} • {asset.name}</td>
                  <td className="py-3 text-sm text-gray-300">{asset.type}</td>
                  <td className="py-3 text-sm text-gray-300">{asset.status}</td>
                  <td className="py-3 text-sm text-gray-300">{asset.allocated}</td>
                  <td className="py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() =>
                          setEditingAsset({
                            category: "Plant",
                            id: asset.id,
                            assetNumber: asset.assetNumber,
                            name: asset.name,
                            type: asset.type,
                            status: asset.status,
                            allocated: asset.allocated,
                            nextService: /^\d{4}-\d{2}-\d{2}$/.test(asset.nextService) ? asset.nextService : "",
                            value: String(asset.value),
                          })
                        }
                        className="rounded border border-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setAssetToDelete({
                            category: "Plant",
                            id: asset.id,
                            assetNumber: asset.assetNumber,
                            name: asset.name,
                            type: asset.type,
                            status: asset.status,
                            allocated: asset.allocated,
                            nextService: asset.nextService,
                            value: String(asset.value),
                          })
                        }
                        className="rounded border border-red-700/60 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-900/30"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {toolAssets.map((asset) => (
                <tr key={asset.id} className="hover:bg-gray-700/30">
                  <td className="py-3 text-sm text-teal-300">Tool</td>
                  <td className="py-3 text-sm text-white">{asset.assetNumber} • {asset.name}</td>
                  <td className="py-3 text-sm text-gray-300">{asset.type}</td>
                  <td className="py-3 text-sm text-gray-300">{asset.status}</td>
                  <td className="py-3 text-sm text-gray-300">{asset.allocated}</td>
                  <td className="py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() =>
                          setEditingAsset({
                            category: "Tool",
                            id: asset.id,
                            assetNumber: asset.assetNumber,
                            name: asset.name,
                            type: asset.type,
                            status: asset.status,
                            allocated: asset.allocated,
                            nextService: /^\d{4}-\d{2}-\d{2}$/.test(asset.nextService) ? asset.nextService : "",
                            value: String(asset.value),
                          })
                        }
                        className="rounded border border-gray-600 px-2 py-1 text-xs font-semibold text-gray-200 hover:bg-gray-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          setAssetToDelete({
                            category: "Tool",
                            id: asset.id,
                            assetNumber: asset.assetNumber,
                            name: asset.name,
                            type: asset.type,
                            status: asset.status,
                            allocated: asset.allocated,
                            nextService: asset.nextService,
                            value: String(asset.value),
                          })
                        }
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
              <p className="text-lg font-semibold text-blue-400">{plantUtilisation}%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Combined Utilisation</p>
              <p className="text-lg font-semibold text-orange-400">{utilisationRate}%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Tool Utilisation</p>
              <p className="text-lg font-semibold text-teal-400">{toolUtilisation}%</p>
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
            <p className="mt-1 text-sm text-gray-400">Add a vehicle, plant asset, or tool from the overview dashboard.</p>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleAddAsset}>
              <select
                value={newVehicle.category}
                onChange={(event) =>
                  setNewVehicle((current) => ({
                    ...current,
                    category: event.target.value as FleetVehicleForm["category"],
                    type:
                      event.target.value === "Plant"
                        ? PLANT_TYPE_OPTIONS[0]
                        : event.target.value === "Tool"
                          ? TOOL_TYPE_OPTIONS[0]
                          : VEHICLE_TYPE_OPTIONS[0],
                  }))
                }
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                aria-label="Asset category"
              >
                <option value="Vehicle">Vehicle</option>
                <option value="Plant">Plant</option>
                <option value="Tool">Tool</option>
              </select>

              <input
                list={
                  newVehicle.category === "Vehicle"
                    ? "vehicle-type-options-overview"
                    : newVehicle.category === "Plant"
                      ? "plant-type-options-overview"
                      : "tool-type-options-overview"
                }
                value={newVehicle.type}
                onChange={(event) => setNewVehicle((current) => ({ ...current, type: event.target.value }))}
                placeholder="Asset type"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                aria-label="Asset type"
              />
              <datalist id="vehicle-type-options-overview">
                {VEHICLE_TYPE_OPTIONS.map((typeOption) => (
                  <option key={typeOption} value={typeOption} />
                ))}
              </datalist>
              <datalist id="plant-type-options-overview">
                {PLANT_TYPE_OPTIONS.map((typeOption) => (
                  <option key={typeOption} value={typeOption} />
                ))}
              </datalist>
              <datalist id="tool-type-options-overview">
                {TOOL_TYPE_OPTIONS.map((typeOption) => (
                  <option key={typeOption} value={typeOption} />
                ))}
              </datalist>

              {newVehicle.category === "Vehicle" ? (
                <input
                  value={newVehicle.reg}
                  onChange={(event) => handleRegistrationChange(event.target.value)}
                  placeholder="Registration"
                  className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  required
                />
              ) : (
                <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                  Registration lookup only applies to vehicles.
                </div>
              )}

              {newVehicle.category === "Vehicle" ? (
                <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                  {isLookingUpRegistration
                    ? "Looking up registration..."
                    : lookupMessage || "Brand/model will auto-fill for known registrations"}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
                  {newVehicle.category} assets do not use registration lookup.
                </div>
              )}

              {newVehicle.category !== "Vehicle" && (
                <input
                  value={newVehicle.assetNumber}
                  onChange={(event) => setNewVehicle((current) => ({ ...current, assetNumber: event.target.value }))}
                  placeholder="Asset number (e.g. PL-014 / TL-022)"
                  className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                />
              )}

              {newVehicle.category === "Vehicle" ? (
                <>
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
                </>
              ) : (
                <>
                  <input
                    value={newVehicle.model}
                    onChange={(event) => setNewVehicle((current) => ({ ...current, model: event.target.value }))}
                    placeholder={newVehicle.category === "Plant" ? "Plant name" : "Tool name"}
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={newVehicle.mileage}
                    onChange={(event) => setNewVehicle((current) => ({ ...current, mileage: event.target.value }))}
                    placeholder="Asset value (£)"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </>
              )}

              {newVehicle.category === "Vehicle" && (
                <>
                  <input
                    value={newVehicle.mileage}
                    onChange={(event) => setNewVehicle((current) => ({ ...current, mileage: event.target.value }))}
                    placeholder="Mileage"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </>
              )}

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

      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-700/60 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Edit {editingAsset.category}</h3>
            <p className="mt-1 text-sm text-gray-400">Update and save this asset record.</p>

            <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={handleUpdateAsset}>
              {editingAsset.category === "Vehicle" ? (
                <>
                  <input
                    value={editingAsset.reg || ""}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, reg: event.target.value } : current))}
                    placeholder="Registration"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                  <select
                    value={editingAsset.type}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, type: event.target.value } : current))}
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  >
                    {VEHICLE_TYPE_OPTIONS.map((vehicleType) => (
                      <option key={vehicleType}>{vehicleType}</option>
                    ))}
                  </select>
                  <input
                    value={editingAsset.brand || ""}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, brand: event.target.value } : current))}
                    placeholder="Brand"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                  <input
                    value={editingAsset.model || ""}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, model: event.target.value } : current))}
                    placeholder="Model"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                  <input
                    value={editingAsset.mileage || ""}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, mileage: event.target.value } : current))}
                    placeholder="Mileage"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </>
              ) : (
                <>
                  <input
                    value={editingAsset.assetNumber || ""}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, assetNumber: event.target.value } : current))}
                    placeholder="Asset number"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                  <input
                    value={editingAsset.name || ""}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, name: event.target.value } : current))}
                    placeholder="Asset name"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                    required
                  />
                  <input
                    list={editingAsset.category === "Plant" ? "plant-type-options-edit-overview" : "tool-type-options-edit-overview"}
                    value={editingAsset.type}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, type: event.target.value } : current))}
                    placeholder="Asset type"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                  <datalist id="plant-type-options-edit-overview">
                    {PLANT_TYPE_OPTIONS.map((typeOption) => (
                      <option key={typeOption} value={typeOption} />
                    ))}
                  </datalist>
                  <datalist id="tool-type-options-edit-overview">
                    {TOOL_TYPE_OPTIONS.map((typeOption) => (
                      <option key={typeOption} value={typeOption} />
                    ))}
                  </datalist>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editingAsset.value || ""}
                    onChange={(event) => setEditingAsset((current) => (current ? { ...current, value: event.target.value } : current))}
                    placeholder="Asset value (£)"
                    className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
                  />
                </>
              )}

              <select
                value={editingAsset.status}
                onChange={(event) => setEditingAsset((current) => (current ? { ...current, status: event.target.value as FleetVehicle["status"] } : current))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              >
                {FLEET_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <input
                value={editingAsset.allocated}
                onChange={(event) => setEditingAsset((current) => (current ? { ...current, allocated: event.target.value } : current))}
                placeholder="Allocated site"
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />
              <input
                type="date"
                value={editingAsset.nextService}
                onChange={(event) => setEditingAsset((current) => (current ? { ...current, nextService: event.target.value } : current))}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none"
              />

              <div className="mt-2 flex gap-2 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
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

      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-700/60 bg-gray-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Delete {assetToDelete.category}</h3>
            <p className="mt-2 text-sm text-gray-300">
              Remove <span className="font-semibold text-white">{assetToDelete.name || assetToDelete.reg || assetToDelete.id}</span> from the register?
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAsset}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
