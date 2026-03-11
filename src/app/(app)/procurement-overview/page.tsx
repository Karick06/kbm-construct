"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-utils";

const procurementStats = [
  { label: "Active POs", value: "34", change: "+6 this month", icon: "📋" },
  { label: "Total Spend", value: "£487.3k", change: "+14% vs last month", icon: "💷" },
  { label: "Suppliers", value: "28", change: "5 new this quarter", icon: "🏢" },
  { label: "On-Time Delivery", value: "94%", change: "↑ 3% improvement", icon: "✓" },
];

const purchaseOrders = [
  { id: "PO-2891", supplier: "BuildTech Supplies", amount: "£24,500", status: "Delivered", date: "12 Feb" },
  { id: "PO-2890", supplier: "Steel & Metal Co", amount: "£156,200", status: "In Transit", date: "10 Feb" },
  { id: "PO-2889", supplier: "Cement Direct", amount: "£48,900", status: "Processing", date: "09 Feb" },
  { id: "PO-2888", supplier: "Marco Equipment", amount: "£89,400", status: "Pending", date: "08 Feb" },
];

const suppliers = [
  { name: "BuildTech Supplies", orders: 12, rating: "4.8/5", onTime: "96%", spend: "£85.2k" },
  { name: "Steel & Metal Co", orders: 8, rating: "4.6/5", onTime: "92%", spend: "£156.2k" },
  { name: "Cement Direct", orders: 15, rating: "4.9/5", onTime: "98%", spend: "£123.4k" },
];

const spendData = [
  { month: "Aug", value: 320, label: "£320k" },
  { month: "Sep", value: 385, label: "£385k" },
  { month: "Oct", value: 412, label: "£412k" },
  { month: "Nov", value: 468, label: "£468k" },
  { month: "Dec", value: 441, label: "£441k" },
  { month: "Jan", value: 487, label: "£487k" },
];

const orderStatus = [
  { status: "Delivered", count: 94, color: "bg-green-500" },
  { status: "In Transit", count: 18, color: "bg-blue-500" },
  { status: "Processing", count: 24, color: "bg-yellow-500" },
  { status: "Pending", count: 8, color: "bg-red-500" },
];

export default function ProcurementOverviewPage() {
  const router = useRouter();
  const maxSpend = Math.max(...spendData.map(d => d.value));

  return (
    <PermissionGuard permission="procurement">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button 
          onClick={() => router.push('/purchase-orders')}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + New Purchase Order
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {procurementStats.map((stat) => (
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

      {/* Spending Trend & Order Status */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Spending Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Spending Trend</p>
                <h2 className="mt-1 text-xl font-bold text-white">Last 6 Months</h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">£2.42M</p>
                <p className="text-xs text-green-400">↑ 12% vs previous period</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-end justify-between gap-3 h-48 mt-12">
            {spendData.map((item) => (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-2">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:from-orange-400 hover:to-orange-300"
                    style={{ height: `${(item.value / maxSpend) * 180}px` }}
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

        {/* Order Status Breakdown */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Orders</p>
            <h2 className="mt-1 text-xl font-bold text-white">Status Breakdown</h2>
          </div>
          <div className="space-y-3">
            {orderStatus.map((item) => (
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

      {/* Purchase Orders & Supplier Performance */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Purchase Orders</p>
              <h2 className="mt-1 text-xl font-bold text-white">Recent Orders</h2>
            </div>
            <button className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">PO ID</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Supplier</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Amount</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{po.id}</td>
                    <td className="py-3 text-sm text-gray-300">{po.supplier}</td>
                    <td className="py-3 text-sm font-semibold text-white">{po.amount}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        po.status === 'Delivered' ? 'bg-green-900/30 text-green-400' :
                        po.status === 'In Transit' ? 'bg-blue-900/30 text-blue-400' :
                        po.status === 'Processing' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-400">{formatDate(po.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Suppliers</p>
            <h2 className="mt-1 text-xl font-bold text-white">Top Performers</h2>
          </div>
          <div className="space-y-4">
            {suppliers.map((supplier) => (
              <div key={supplier.name} className="rounded-lg border border-gray-700/50 bg-gray-700/30 p-3">
                <p className="text-sm font-semibold text-white">{supplier.name}</p>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Rating</p>
                    <p className="text-yellow-400 font-semibold">{supplier.rating}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">On-Time</p>
                    <p className="text-green-400 font-semibold">{supplier.onTime}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{supplier.orders} orders • {supplier.spend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Insights */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Alerts</p>
            <h2 className="mt-1 text-xl font-bold text-white">Action Items</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-900/20 border border-yellow-700/50">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-400">2 POs Overdue</p>
                <p className="text-xs text-gray-400">PO-2888 & PO-2887 passed delivery date</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-900/20 border border-blue-700/50">
              <span className="text-xl">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-400">3 Supplier Quotes</p>
                <p className="text-xs text-gray-400">Awaiting review for project XYZ</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Metrics</p>
            <h2 className="mt-1 text-xl font-bold text-white">Performance</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Avg. Delivery Time</p>
              <p className="text-lg font-semibold text-white">4.2 days</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Cost Savings This Month</p>
              <p className="text-lg font-semibold text-green-400">£18.5k</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Supplier Satisfaction</p>
              <p className="text-lg font-semibold text-orange-400">4.7/5</p>
            </div>
          </div>
        </div>
      </section>
    </div>
    </PermissionGuard>
  );
}
