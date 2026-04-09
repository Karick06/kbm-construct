"use client";

import PermissionGuard from "@/components/PermissionGuard";
import Link from "next/link";

import { useState } from "react";

type FleetVehicle = {
  id: string;
  reg: string;
  brand: string;
  model: string;
  type: string;
  status: "In Use" | "Available" | "Maintenance" | "Reserved";
  allocated: string;
  mileage: string;
  nextService: string;
};

const VEHICLE_TYPE_OPTIONS = [
  "Small Car",
  "Saloon Car",
  "Estate Car",
  "SUV / 4x4",
  "Panel Van",
  "Crew Van",
  "Pickup",
  "Minibus",
  "Rigid Lorry",
  "Articulated Lorry",
  "Specialist HGV",
] as const;

const REGISTRATION_LOOKUP: Record<string, { brand: string; model: string; type: string }> = {
  TS24KBM: { brand: "Ford", model: "Transit", type: "Panel Van" },
  TS24OPS: { brand: "Ford", model: "Transit", type: "Panel Van" },
  TS24BDV: { brand: "BMW", model: "X3", type: "SUV / 4x4" },
  TS24MGT: { brand: "BMW", model: "3 Series", type: "Saloon Car" },
};

function normalizeRegistration(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

const fleetStats = [
  { label: "Total Vehicles", value: "28", change: "+2 this quarter", icon: "🚗" },
  { label: "Available", value: "24", change: "86% utilisation", icon: "✓" },
  { label: "Maintenance Due", value: "3", change: "Schedule within 2 weeks", icon: "🔧" },
  { label: "Total Fleet Value", value: "£1.2M", change: "Average age 4.2 yrs", icon: "💷" },
];

const initialActiveVehicles: FleetVehicle[] = [
  { id: "VH-001", reg: "TS24 KBM", brand: "Ford", model: "Transit", type: "Panel Van", status: "In Use", allocated: "Thames Site", mileage: "45,230", nextService: "18 Feb" },
  { id: "VH-002", reg: "TS24 OPS", brand: "Ford", model: "Transit", type: "Panel Van", status: "In Use", allocated: "Premier Site", mileage: "32,450", nextService: "25 Feb" },
  { id: "VH-003", reg: "TS24 BDV", brand: "BMW", model: "X3", type: "SUV / 4x4", status: "Available", allocated: "Unallocated", mileage: "28,120", nextService: "10 Mar" },
  { id: "VH-004", reg: "TS24 MGT", brand: "BMW", model: "3 Series", type: "Saloon Car", status: "In Use", allocated: "HQ", mileage: "12,340", nextService: "20 Feb" },
];

const vehicles = [
  { type: "Panel Van", count: 14, utilisation: "89%", value: "£560k" },
  { type: "SUV / 4x4", count: 8, utilisation: "82%", value: "£360k" },
  { type: "Saloon Car", count: 4, utilisation: "75%", value: "£220k" },
  { type: "Rigid Lorry", count: 2, utilisation: "95%", value: "£60k" },
];

const utilizationData = [
  { month: "Aug", value: 18, label: "18 Used" },
  { month: "Sep", value: 21, label: "21 Used" },
  { month: "Oct", value: 23, label: "23 Used" },
  { month: "Nov", value: 24, label: "24 Used" },
  { month: "Dec", value: 22, label: "22 Used" },
  { month: "Jan", value: 24, label: "24 Used" },
];

const vehicleStatus = [
  { status: "In Use", count: 18, color: "bg-green-500" },
  { status: "Available", count: 6, color: "bg-blue-500" },
  { status: "Maintenance", count: 3, color: "bg-yellow-500" },
  { status: "Reserved", count: 1, color: "bg-gray-500" },
];

const maintenanceAlerts = [
  { vehicle: "TS24 KBM", issue: "Service Due", date: "18 Feb", priority: "Medium" },
  { vehicle: "TS24 OPS", issue: "Tyre Inspection", date: "20 Feb", priority: "Low" },
  { vehicle: "TS24 BDV", issue: "MOT Due", date: "15 Mar", priority: "High" },
];

export default function FleetPage() {
  const [activeVehicles, setActiveVehicles] = useState<FleetVehicle[]>(initialActiveVehicles);
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [newVehicle, setNewVehicle] = useState({
    reg: "",
    brand: "",
    model: "",
    type: "Panel Van",
    status: "Available" as FleetVehicle["status"],
    allocated: "Unallocated",
    mileage: "",
    nextService: "",
  });

  const maxUtilization = Math.max(...utilizationData.map(d => d.value));

  const handleRegistrationChange = (value: string) => {
    const normalized = normalizeRegistration(value);
    const lookup = REGISTRATION_LOOKUP[normalized];

    if (lookup) {
      setNewVehicle((current) => ({
        ...current,
        reg: value,
        brand: current.brand || lookup.brand,
        model: current.model || lookup.model,
        type: lookup.type,
      }));
      setLookupMessage(`Auto-filled: ${lookup.brand} ${lookup.model}`);
      return;
    }

    setNewVehicle((current) => ({ ...current, reg: value }));
    setLookupMessage("");
  };

  const handleAddVehicle = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newVehicle.reg.trim() || !newVehicle.brand.trim() || !newVehicle.model.trim()) return;

    const nextId = `VH-${String(activeVehicles.length + 1).padStart(3, "0")}`;
    const vehicle: FleetVehicle = {
      id: nextId,
      reg: normalizeRegistration(newVehicle.reg.trim()),
      brand: newVehicle.brand.trim(),
      model: newVehicle.model.trim(),
      type: newVehicle.type,
      status: newVehicle.status,
      allocated: newVehicle.allocated.trim() || "Unallocated",
      mileage: newVehicle.mileage.trim() || "0",
      nextService: newVehicle.nextService || "TBC",
    };

    setActiveVehicles((current) => [vehicle, ...current]);
    setNewVehicle({
      reg: "",
      brand: "",
      model: "",
      type: "Panel Van",
      status: "Available",
      allocated: "Unallocated",
      mileage: "",
      nextService: "",
    });
    setLookupMessage("");
    setShowAddVehicleModal(false);
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
                <p className="text-2xl font-bold text-white">86%</p>
                <p className="text-xs text-green-400">↑ 4% vs previous period</p>
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
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{vehicle.nextService}</td>
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
              <p className="text-lg font-semibold text-white">86%</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Avg. Fleet Age</p>
              <p className="text-lg font-semibold text-orange-400">4.2 years</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Maintenance Compliance</p>
              <p className="text-lg font-semibold text-green-400">100%</p>
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
                {lookupMessage || "Brand/model will auto-fill for known registrations"}
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
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Reserved">Reserved</option>
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
    </div>
    </PermissionGuard>
  );
}
