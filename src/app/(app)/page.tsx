"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/StatCard";
import StatusPill from "@/components/StatusPill";
import { getProjectsFromStorage, getPaymentApplicationsFromStorage } from "@/lib/operations-data";
import { getEstimateJobsFromStorage, type EstimateJob } from "@/lib/enquiries-store";
import { getTasksFromStorage, type TaskItem } from "@/lib/tasks-store";
import type { ConstructionProject, InvoiceApplication } from "@/lib/operations-models";
import type { StatusTone } from "@/components/StatusPill";

type TrendPoint = {
  month: string;
  value: number;
  label: string;
};

type ActivityItem = {
  action: string;
  details: string;
  time: string;
  icon: string;
};

type MilestoneItem = {
  project: string;
  milestone: string;
  date: string;
  priority: "high" | "medium";
};

type DashboardInvoice = {
  id: string;
  client: string;
  amount: number;
  status: "open" | "draft" | "paid";
  due: string;
};

function parseMoneyValue(value?: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9.KMk]/g, "");
  const numeric = Number(cleaned.replace(/[MKmk]/g, ""));
  if (!Number.isFinite(numeric)) return 0;
  if (/[mM]/.test(cleaned)) return numeric * 1000000;
  if (/[kK]/.test(cleaned)) return numeric * 1000;
  return numeric;
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });
}

function formatCompactCurrency(value: number): string {
  return value.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    notation: "compact",
    maximumFractionDigits: 2,
  });
}

function formatRelativeTime(value?: string): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "short" });
}

function buildMonthlyRevenueMap(applications: InvoiceApplication[]): Map<string, number> {
  const map = new Map<string, number>();

  applications.forEach((application) => {
    const dateString = application.paidDate || application.submittedDate || application.period?.to;
    if (!dateString) return;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return;

    const key = monthKey(date);
    const current = map.get(key) || 0;
    map.set(key, current + (application.paidAmount || application.thisPayment || 0));
  });

  return map;
}

function stageLabel(stage: ConstructionProject["stage"]): string {
  return stage
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toProjectStatus(project: ConstructionProject): { label: string; tone: StatusTone } {
  if (project.stage === "complete") {
    return { label: "On Track", tone: "on-track" };
  }
  if (project.hasDelays || !project.onProgramme) {
    return { label: "Late", tone: "late" };
  }
  if (project.requiresAttention || project.riskLevel === "high" || project.riskLevel === "critical") {
    return { label: "Risk", tone: "risk" };
  }
  return { label: "On Track", tone: "on-track" };
}

function getInvoiceStatus(application: InvoiceApplication): DashboardInvoice["status"] {
  if (application.status === "paid") return "paid";
  if (application.status === "draft") return "draft";
  return "open";
}

function toInvoiceTone(status: DashboardInvoice["status"]): StatusTone {
  if (status === "paid") return "paid";
  if (status === "draft") return "draft";
  return "open";
}

function getWindowTotal(map: Map<string, number>, monthsBack: number): number {
  let total = 0;
  const now = new Date();
  for (let offset = 0; offset < monthsBack; offset += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    total += map.get(monthKey(date)) || 0;
  }
  return total;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<"6months" | "12months" | "ytd">("6months");
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [estimateJobs, setEstimateJobs] = useState<EstimateJob[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [applications, setApplications] = useState<InvoiceApplication[]>([]);

  useEffect(() => {
    const hydrate = () => {
      setProjects(getProjectsFromStorage());
      setEstimateJobs(getEstimateJobsFromStorage());
      setTasks(getTasksFromStorage());
      setApplications(getPaymentApplicationsFromStorage());
    };

    hydrate();
    window.addEventListener("storage", hydrate);
    window.addEventListener("focus", hydrate);

    return () => {
      window.removeEventListener("storage", hydrate);
      window.removeEventListener("focus", hydrate);
    };
  }, []);

  const monthlyRevenueMap = useMemo(
    () => buildMonthlyRevenueMap(applications),
    [applications]
  );

  const revenueDataSets = useMemo(() => {
    const now = new Date();

    const buildLastMonths = (count: number): TrendPoint[] => {
      const values: TrendPoint[] = [];
      for (let offset = count - 1; offset >= 0; offset -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
        const key = monthKey(date);
        const amount = monthlyRevenueMap.get(key) || 0;
        values.push({
          month: getMonthLabel(date),
          value: amount,
          label: formatCompactCurrency(amount),
        });
      }
      return values;
    };

    const ytdValues: TrendPoint[] = [];
    for (let month = 0; month <= now.getMonth(); month += 1) {
      const date = new Date(now.getFullYear(), month, 1);
      const key = monthKey(date);
      const amount = monthlyRevenueMap.get(key) || 0;
      ytdValues.push({
        month: getMonthLabel(date),
        value: amount,
        label: formatCompactCurrency(amount),
      });
    }

    return {
      "6months": buildLastMonths(6),
      "12months": buildLastMonths(12),
      ytd: ytdValues,
    };
  }, [monthlyRevenueMap]);

  const revenueData = revenueDataSets[period];
  const maxRevenue = Math.max(...revenueData.map((dataPoint) => dataPoint.value), 1);
  const totalRevenue = revenueData.reduce((sum, dataPoint) => sum + dataPoint.value, 0);
  const formattedRevenue = formatCompactCurrency(totalRevenue);

  const percentageChange = useMemo(() => {
    if (period === "ytd") {
      const now = new Date();
      let currentTotal = 0;
      let previousTotal = 0;

      for (let month = 0; month <= now.getMonth(); month += 1) {
        currentTotal += monthlyRevenueMap.get(monthKey(new Date(now.getFullYear(), month, 1))) || 0;
        previousTotal += monthlyRevenueMap.get(monthKey(new Date(now.getFullYear() - 1, month, 1))) || 0;
      }

      if (previousTotal <= 0) return currentTotal > 0 ? 100 : 0;
      return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
    }

    const windowSize = period === "6months" ? 6 : 12;
    const currentTotal = getWindowTotal(monthlyRevenueMap, windowSize);

    const shiftedMap = new Map<string, number>();
    monthlyRevenueMap.forEach((value, key) => {
      shiftedMap.set(key, value);
    });

    let previousTotal = 0;
    const now = new Date();
    for (let offset = windowSize; offset < windowSize * 2; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      previousTotal += shiftedMap.get(monthKey(date)) || 0;
    }

    if (previousTotal <= 0) return currentTotal > 0 ? 100 : 0;
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }, [monthlyRevenueMap, period]);

  const dashboardStats = useMemo(() => {
    const activeProjects = projects.filter((project) => project.stage !== "complete");
    const needsAttention = activeProjects.filter(
      (project) => project.requiresAttention || !project.onProgramme
    );

    const pipelineStatuses: EstimateJob["status"][] = [
      "new-assignment",
      "in-progress",
      "quote-submitted",
    ];
    const pipelineValue = estimateJobs
      .filter((job) => pipelineStatuses.includes(job.status))
      .reduce((sum, job) => sum + parseMoneyValue(job.value), 0);

    const today = new Date();
    const overdueTasks = tasks.filter((task) => {
      if (task.status === "done") return false;
      const dueDate = new Date(task.dueDate);
      if (Number.isNaN(dueDate.getTime())) return false;
      return dueDate < today;
    });
    const urgentOverdue = overdueTasks.filter((task) => task.priority === "Urgent" || task.priority === "High");

    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const incoming30Days = applications
      .filter((application) => application.status === "paid" && application.paidDate)
      .filter((application) => new Date(application.paidDate || 0) >= monthAgo)
      .reduce((sum, application) => sum + (application.paidAmount || application.thisPayment || 0), 0);

    const outgoing30Days = applications
      .filter((application) => application.status !== "paid")
      .filter((application) => {
        const date = new Date(application.submittedDate || application.period?.to || 0);
        return !Number.isNaN(date.getTime()) && date >= monthAgo;
      })
      .reduce((sum, application) => sum + (application.thisPayment || 0), 0);

    const netPosition = incoming30Days - outgoing30Days;

    return [
      {
        label: "Active projects",
        value: String(activeProjects.length),
        change: `${needsAttention.length} need attention`,
        tone: "sunset" as const,
      },
      {
        label: "Pipeline value",
        value: formatCompactCurrency(pipelineValue),
        change: `${estimateJobs.filter((job) => pipelineStatuses.includes(job.status)).length} live estimates`,
        tone: "ocean" as const,
      },
      {
        label: "Overdue tasks",
        value: String(overdueTasks.length),
        change: `${urgentOverdue.length} high priority`,
        tone: "sage" as const,
      },
      {
        label: "Net cash (30d)",
        value: formatCompactCurrency(netPosition),
        change: `Incoming ${formatCompactCurrency(incoming30Days)}`,
        tone: "sand" as const,
      },
    ];
  }, [applications, estimateJobs, projects, tasks]);

  const activityFeed = useMemo((): ActivityItem[] => {
    const projectEvents = projects
      .slice()
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 3)
      .map((project) => ({
        action: "Project updated",
        details: `${project.projectName} · ${project.overallProgress}% progress`,
        time: formatRelativeTime(project.updatedAt),
        icon: "🏗️",
      }));

    const invoiceEvents = applications
      .slice()
      .sort((left, right) => {
        const leftDate = new Date(left.paidDate || left.submittedDate || left.period?.to || 0).getTime();
        const rightDate = new Date(right.paidDate || right.submittedDate || right.period?.to || 0).getTime();
        return rightDate - leftDate;
      })
      .slice(0, 2)
      .map((application) => {
        const eventDate = application.paidDate || application.submittedDate || application.period?.to;
        return {
          action: application.status === "paid" ? "Invoice paid" : "Invoice application submitted",
          details: `Application #${application.applicationNumber} · ${formatCompactCurrency(application.thisPayment || 0)}`,
          time: formatRelativeTime(eventDate),
          icon: "💰",
        };
      });

    return [...invoiceEvents, ...projectEvents].slice(0, 5);
  }, [applications, projects]);

  const upcomingMilestones = useMemo((): MilestoneItem[] => {
    const now = new Date();

    return projects
      .flatMap((project) =>
        project.milestones
          .filter((milestone) => milestone.status !== "complete")
          .map((milestone) => ({
            project: project.projectName,
            milestone: milestone.name,
            targetDate: milestone.targetDate,
          }))
      )
      .sort((left, right) => new Date(left.targetDate).getTime() - new Date(right.targetDate).getTime())
      .slice(0, 3)
      .map((milestone) => {
        const target = new Date(milestone.targetDate);
        const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          project: milestone.project,
          milestone: milestone.milestone,
          date: target.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
          priority: diffDays <= 7 ? "high" : "medium",
        };
      });
  }, [projects]);

  const reports = useMemo(() => {
    const activeProjects = projects.filter((project) => project.stage !== "complete");
    const averageMargin = activeProjects.length
      ? activeProjects.reduce((sum, project) => sum + project.grossProfitPercentage, 0) / activeProjects.length
      : 0;

    const paidApps = applications.filter(
      (application) => application.status === "paid" && application.submittedDate && application.paidDate
    );
    const averageInvoiceCycle = paidApps.length
      ? Math.round(
          paidApps.reduce((sum, application) => {
            const submitted = new Date(application.submittedDate || 0).getTime();
            const paid = new Date(application.paidDate || 0).getTime();
            return sum + Math.max(0, Math.round((paid - submitted) / (1000 * 60 * 60 * 24)));
          }, 0) / paidApps.length
        )
      : 0;

    const activeTasks = tasks.filter((task) => task.status !== "done").length;
    const resourceLoad = tasks.length > 0 ? Math.round((activeTasks / tasks.length) * 100) : 0;

    return [
      { label: "Gross margin", value: `${averageMargin.toFixed(1)}%`, trend: `${activeProjects.length} active projects` },
      { label: "Invoice cycle", value: averageInvoiceCycle > 0 ? `${averageInvoiceCycle} days` : "—", trend: `${paidApps.length} paid applications` },
      { label: "Resource load", value: `${resourceLoad}%`, trend: `${activeTasks} open tasks` },
    ];
  }, [applications, projects, tasks]);

  const outstandingInvoices = useMemo((): DashboardInvoice[] => {
    const projectNameById = new Map(projects.map((project) => [project.id, project.projectName]));

    return applications
      .filter((application) => application.status !== "paid")
      .sort((left, right) => {
        const leftDate = new Date(left.paymentDueDate || left.period?.to || 0).getTime();
        const rightDate = new Date(right.paymentDueDate || right.period?.to || 0).getTime();
        return leftDate - rightDate;
      })
      .slice(0, 3)
      .map((application) => ({
        id: `APP-${application.applicationNumber}`,
        client: projectNameById.get(application.projectId) || application.projectId,
        amount: application.thisPayment || 0,
        status: getInvoiceStatus(application),
        due: application.paymentDueDate
          ? new Date(application.paymentDueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
          : "TBC",
      }));
  }, [applications, projects]);

  const cashFlowSummary = useMemo(() => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const incoming = applications
      .filter((application) => application.status === "paid" && application.paidDate)
      .filter((application) => new Date(application.paidDate || 0) >= monthAgo)
      .reduce((sum, application) => sum + (application.paidAmount || application.thisPayment || 0), 0);

    const outgoing = applications
      .filter((application) => application.status !== "paid")
      .filter((application) => {
        const date = new Date(application.submittedDate || application.period?.to || 0);
        return !Number.isNaN(date.getTime()) && date >= monthAgo;
      })
      .reduce((sum, application) => sum + (application.thisPayment || 0), 0);

    return {
      incoming,
      outgoing,
      net: incoming - outgoing,
    };
  }, [applications]);

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
          <Link href="/qs-overview" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 inline-flex items-center">
            Export Report
          </Link>
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
            {activityFeed.length === 0 && (
              <p className="text-sm text-gray-400">No recent activity yet.</p>
            )}
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
            <Link href="/projects" className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </Link>
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
                    <td className="py-3 text-sm font-medium text-white">{project.projectName}</td>
                    <td className="py-3 text-sm text-gray-300">{project.projectManager}</td>
                    <td className="py-3 text-sm text-gray-400">{stageLabel(project.stage)}</td>
                    <td className="py-3">
                      <StatusPill label={toProjectStatus(project).label} tone={toProjectStatus(project).tone} />
                    </td>
                    <td className="py-3 text-right text-sm font-semibold text-white">{formatCompactCurrency(project.contractValue)}</td>
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
              {upcomingMilestones.length === 0 && (
                <p className="text-sm text-gray-400">No upcoming milestones found.</p>
              )}
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
            <Link href="/invoices" className="text-sm font-medium text-orange-500 hover:text-orange-400">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {outstandingInvoices.map((invoice, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30 hover:bg-gray-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{invoice.client}</p>
                  <p className="text-xs text-gray-400">{invoice.id} • Due {invoice.due}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{formatCurrency(invoice.amount)}</p>
                  <StatusPill label={invoice.status} tone={toInvoiceTone(invoice.status)} />
                </div>
              </div>
            ))}
            {outstandingInvoices.length === 0 && (
              <p className="text-sm text-gray-400">No outstanding invoice applications.</p>
            )}
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
                <p className="text-2xl font-bold text-green-400">{formatCurrency(cashFlowSummary.incoming)}</p>
              </div>
              <span className="text-3xl">↓</span>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-lg bg-red-900/20 border border-red-700/50">
              <div>
                <p className="text-sm text-gray-400">Outgoing</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(cashFlowSummary.outgoing)}</p>
              </div>
              <span className="text-3xl">↑</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-900/20 border border-blue-700/50">
              <div>
                <p className="text-sm text-gray-400">Net Position</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(cashFlowSummary.net)}</p>
              </div>
              <span className={`text-sm ${cashFlowSummary.net >= 0 ? "text-green-400" : "text-red-400"}`}>
                {cashFlowSummary.net >= 0 ? "Positive" : "Negative"}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
