"use client";

import { useState } from "react";

const fleetStats = [
  { label: "Total Vehicles", value: "28", change: "+2 this quarter", icon: "🚗" },
  { label: "Available", value: "24", change: "86% utilisation", icon: "✓" },
  { label: "Maintenance Due", value: "3", change: "Schedule within 2 weeks", icon: "🔧" },
  { label: "Total Fleet Value", value: "£1.2M", change: "Average age 4.2 yrs", icon: "💷" },
];

const activeVehicles = [
  { id: "VH-001", reg: "TS24 KBM", type: "Transit Van", status: "In Use", allocated: "Thames Site", mileage: "45,230", nextService: "18 Feb" },
  { id: "VH-002", reg: "TS24 OPS", type: "Transit Van", status: "In Use", allocated: "Premier Site", mileage: "32,450", nextService: "25 Feb" },
  { id: "VH-003", reg: "TS24 BDV", type: "Captur", status: "Available", allocated: "Unallocated", mileage: "28,120", nextService: "10 Mar" },
  { id: "VH-004", reg: "TS24 MGT", type: "Insignia", status: "In Use", allocated: "HQ", mileage: "12,340", nextService: "20 Feb" },
];

const vehicles = [
  { type: "Transit Van", count: 14, utilisation: "89%", value: "£560k" },
  { type: "Captur/SUV", count: 8, utilisation: "82%", value: "£360k" },
  { type: "Insignia/Sedan", count: 4, utilisation: "75%", value: "£220k" },
  { type: "Specialist", count: 2, utilisation: "95%", value: "£60k" },
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
  const maxUtilization = Math.max(...utilizationData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
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
            <button className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">ID</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Registration</th>
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
    </div>
  );
}
