"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import { dashboardStats, projects, invoices, reports } from "@/lib/sample-data";
import { seedAllModules, checkDataExists } from "@/lib/seed-data";

const revenueDataSets = {
  "6months": [
    { month: "Aug", value: 285, label: "£285k" },
    { month: "Sep", value: 310, label: "£310k" },
    { month: "Oct", value: 420, label: "£420k" },
    { month: "Nov", value: 385, label: "£385k" },
    { month: "Dec", value: 465, label: "£465k" },
    { month: "Jan", value: 520, label: "£520k" },
  ],
  "12months": [
    { month: "Feb", value: 245, label: "£245k" },
    { month: "Mar", value: 268, label: "£268k" },
    { month: "Apr", value: 295, label: "£295k" },
    { month: "May", value: 310, label: "£310k" },
    { month: "Jun", value: 275, label: "£275k" },
    { month: "Jul", value: 290, label: "£290k" },
    { month: "Aug", value: 285, label: "£285k" },
    { month: "Sep", value: 310, label: "£310k" },
    { month: "Oct", value: 420, label: "£420k" },
    { month: "Nov", value: 385, label: "£385k" },
    { month: "Dec", value: 465, label: "£465k" },
    { month: "Jan", value: 520, label: "£520k" },
  ],
  "ytd": [
    { month: "Jan", value: 520, label: "£520k" },
    { month: "Feb", value: 485, label: "£485k" },
  ],
};

const activityFeed = [
  { action: "Invoice INV-4025 sent", details: "Riverside Living - £24,500", time: "5 mins ago", icon: "💰" },
  { action: "Project milestone reached", details: "Cedar House - Framing Complete", time: "1 hour ago", icon: "✅" },
  { action: "New quote requested", details: "Harborline Interiors - Kitchen Refit", time: "2 hours ago", icon: "📋" },
  { action: "Safety inspection passed", details: "Arbor Park - Weekly Inspection", time: "3 hours ago", icon: "🛡️" },
  { action: "Material delivery confirmed", details: "Northbank - Steel & Timber", time: "Yesterday", icon: "🚚" },
];

const upcomingMilestones = [
  { project: "Arbor Park", milestone: "Electrical rough-in", date: "15 Feb", priority: "high" },
  { project: "Cedar House", milestone: "Final inspection", date: "18 Feb", priority: "medium" },
  { project: "Northbank fitout", milestone: "Client walkthrough", date: "22 Feb", priority: "medium" },
];

export default function DashboardPage() {
  const [period, setPeriod] = useState<"6months" | "12months" | "ytd">("6months");
  const [seedLoading, setSeedLoading] = useState(false);
  const revenueData = revenueDataSets[period];
  const maxRevenue = Math.max(...revenueData.map(d => d.value));
  
  // Calculate total revenue based on selected period
  const totalRevenue = revenueData.reduce((sum, item) => sum + item.value, 0);
  const formattedRevenue = totalRevenue >= 1000 
    ? `£${(totalRevenue / 1000).toFixed(2)}M` 
    : `£${totalRevenue}k`;
  
  // Calculate percentage change (mock data)
  const percentageChange = period === "6months" ? 18 : period === "12months" ? 24 : 12;

  // Auto-load seed data on first visit
  useEffect(() => {
    const autoSeed = async () => {
      const hasData = await checkDataExists();
      if (!hasData) {
        console.log("🌱 No existing data found. Auto-loading seed data...");
        await seedAllModules();
      }
    };
    autoSeed();
  }, []);

  const handleSeedData = async () => {
    setSeedLoading(true);
    try {
      await seedAllModules();
      alert("✅ Sample data loaded! Check RFIs, Defects, Photos, Plant Booking, etc.");
    } catch (error) {
      console.error("Failed to seed data:", error);
      alert("❌ Failed to load sample data");
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex gap-3">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value as "6months" | "12months" | "ytd")}
            className="rounded-lg border border-gray-700/50 bg-gray-800/80 px-4 py-2 text-sm text-white cursor-pointer"
          >
            <option value="6months">Last 6 months</option>
            <option value="12months">Last 12 months</option>
            <option value="ytd">Year to date</option>
          </select>
          <button 
            onClick={handleSeedData}
            disabled={seedLoading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {seedLoading ? "Loading..." : "Load Sample Data"}
          </button>
          <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </section>

      {/* Charts & Activity Row */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Revenue Trend</p>
                <h2 className="mt-1 text-xl font-bold text-white">
                  {period === "6months" ? "Last 6 Months" : period === "12months" ? "Last 12 Months" : "Year to Date"}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">{formattedRevenue}</p>
                <p className="text-xs text-green-400">↑ {percentageChange}% vs previous period</p>
              </div>
            </div>
          </div>
          
          <div className={`flex items-end justify-between h-48 mt-44 ${period === "12months" ? "gap-2" : "gap-3"}`}>
            {revenueData.map((item, i) => (
              <div key={item.month} className="flex flex-col items-center flex-1 gap-2">
                <div className="relative w-full">
                  <div 
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all hover:from-orange-400 hover:to-orange-300"
                    style={{ height: `${(item.value / maxRevenue) * 180}px` }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.month}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recent Activity</p>
            <h2 className="mt-1 text-xl font-bold text-white">Live Feed</h2>
          </div>
          <div className="space-y-4">
            {activityFeed.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="text-2xl">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.action}</p>
                  <p className="text-xs text-gray-300 truncate">{item.details}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects & Performance Row */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Active Projects Table */}
        <div className="lg:col-span-2 rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Projects</p>
              <h2 className="mt-1 text-xl font-bold text-white">Active Projects</h2>
            </div>
            <button className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Project</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Manager</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Phase</th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {projects.map((project, i) => (
                  <tr key={i} className="hover:bg-gray-700/30">
                    <td className="py-3 text-sm font-medium text-white">{project.name}</td>
                    <td className="py-3 text-sm text-gray-300">{project.manager}</td>
                    <td className="py-3 text-sm text-gray-400">{project.phase}</td>
                    <td className="py-3">
                      <StatusPill label={project.health} tone={project.health as any} />
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-white">{project.budget}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Performance</p>
              <h2 className="mt-1 text-xl font-bold text-white">Key Metrics</h2>
            </div>
            <div className="space-y-4">
              {reports.map((metric, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{metric.label}</p>
                    <p className="text-lg font-bold text-white">{metric.value}</p>
                  </div>
                  <span className="text-sm font-medium text-green-400">{metric.trend}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Milestones */}
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Schedule</p>
              <h2 className="mt-1 text-xl font-bold text-white">Milestones</h2>
            </div>
            <div className="space-y-3">
              {upcomingMilestones.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                    item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.milestone}</p>
                    <p className="text-xs text-gray-400">{item.project}</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 whitespace-nowrap">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Financial Overview */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Outstanding Invoices */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Financials</p>
              <h2 className="mt-1 text-xl font-bold text-white">Outstanding Invoices</h2>
            </div>
            <button className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </button>
          </div>

          <div className="space-y-3">
            {invoices.slice(0, 3).map((invoice, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{invoice.client}</p>
                  <p className="text-xs text-gray-400">{invoice.id} • Due {invoice.due}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{invoice.amount}</p>
                  <StatusPill label={invoice.status} tone={invoice.status as any} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cash Flow</p>
            <h2 className="mt-1 text-xl font-bold text-white">30-Day Summary</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-green-900/20 border border-green-700/50">
              <div>
                <p className="text-sm text-gray-400">Incoming</p>
                <p className="text-2xl font-bold text-green-400">£142,300</p>
              </div>
              <span className="text-3xl">↓</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-900/20 border border-red-700/50">
              <div>
                <p className="text-sm text-gray-400">Outgoing</p>
                <p className="text-2xl font-bold text-red-600">£89,600</p>
              </div>
              <span className="text-3xl">↑</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-900/20 border border-blue-700/50">
              <div>
                <p className="text-sm text-gray-400">Net Position</p>
                <p className="text-2xl font-bold text-blue-600">+£52,700</p>
              </div>
              <span className="text-sm text-green-400">+16.5%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
