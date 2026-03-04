'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProjectsFromStorage, getPaymentApplicationsFromStorage, getProjectBoQLineItemsFromStorage } from '@/lib/operations-data';
import { formatCurrency, getStageColor } from '@/lib/operations-models';

export default function QSOverviewPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [paymentApps, setPaymentApps] = useState<any[]>([]);
  const [boqItems, setBoqItems] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dashboard' | 'valuations' | 'wip' | 'payments' | 'variations' | 'warnings'>('dashboard');

  useEffect(() => {
    setProjects(getProjectsFromStorage());
    setPaymentApps(getPaymentApplicationsFromStorage());
    setBoqItems(getProjectBoQLineItemsFromStorage());
  }, []);

  // Calculate QS metrics
  const stats = {
    activeProjects: projects.filter(p => p.stage === 'active').length,
    totalContractValue: projects.reduce((sum, p) => sum + p.contractValue, 0),
    totalValuationToDate: projects.reduce((sum, p) => sum + p.valuationToDate, 0),
    totalOutstanding: projects.reduce((sum, p) => sum + (p.contractValue - p.valuationToDate), 0),
    pendingApplications: paymentApps.filter(a => a.status === 'draft' || a.status === 'submitted').length,
    paidApplications: paymentApps.filter(a => a.status === 'paid').length,
    totalPaid: paymentApps.filter(a => a.status === 'paid').reduce((sum, a) => sum + (a.thisPayment || 0), 0),
    averageProgress: Math.round(projects.reduce((sum, p) => sum + p.overallProgress, 0) / Math.max(1, projects.length)),
  };

  // Early warnings logic
  const earlyWarnings = projects.filter(p => {
    const progress = p.overallProgress;
    const daysLeft = p.daysToCompletion;
    const progressPerDay = progress / (Math.max(1, (p.contractDuration * 7) - daysLeft));
    const requiredProgressPerDay = 100 / (p.contractDuration * 7);
    
    return (
      (progress > 75 && daysLeft < 14) || // Approaching completion
      (progressPerDay < requiredProgressPerDay * 0.8) || // Behind schedule
      (p.valuationToDate > p.contractValue * 0.9) || // High value claimed
      p.hasVariations || // Has variations
      p.hasDelays // Known delays
    );
  });

  // WIP calculation
  const wipData = projects.map(project => {
    const completionValue = project.overallProgress * (project.contractValue / 100);
    const invoiced = project.valuationToDate;
    const wip = completionValue - invoiced;
    return {
      projectId: project.id,
      projectName: project.projectName,
      contractValue: project.contractValue,
      completionValue,
      invoiced,
      wip: Math.max(0, wip),
      wipPercentage: Math.round((wip / project.contractValue) * 100),
    };
  });

  const totalWIP = wipData.reduce((sum, w) => sum + w.wip, 0);

  // Valuation summary
  const valuationSummary = {
    contractedValue: stats.totalContractValue,
    claimed: stats.totalValuationToDate,
    outstanding: stats.totalOutstanding,
    claimedPercentage: Math.round((stats.totalValuationToDate / stats.totalContractValue) * 100),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Quantity Surveyor Dashboard</h1>
          <p className="text-gray-400 mt-1">Project valuations, claims & financial tracking</p>
        </div>
        <button
          onClick={() => router.back()}
          className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-600 transition"
        >
          ← Back
        </button>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2 rounded-lg border border-gray-700/50 bg-gray-800/30 p-2">
        {[
          { mode: 'dashboard' as const, label: 'Dashboard', icon: '📊' },
          { mode: 'valuations' as const, label: 'Valuations', icon: '💰' },
          { mode: 'wip' as const, label: 'WIP Report', icon: '📦' },
          { mode: 'payments' as const, label: 'Payment Apps', icon: '💳' },
          { mode: 'variations' as const, label: 'Variations', icon: '📝' },
          { mode: 'warnings' as const, label: 'Early Warnings', icon: '⚠️' },
        ].map((item) => (
          <button
            key={item.mode}
            onClick={() => setViewMode(item.mode)}
            className={`flex-1 px-3 py-2 rounded text-sm font-semibold transition ${
              viewMode === item.mode
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-4">
              <p className="text-xs uppercase text-blue-400">Active Projects</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.activeProjects}</p>
            </div>
            <div className="rounded-lg border border-green-700/30 bg-green-900/10 p-4">
              <p className="text-xs uppercase text-green-400">Contract Value</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(stats.totalContractValue)}</p>
            </div>
            <div className="rounded-lg border border-orange-700/30 bg-orange-900/10 p-4">
              <p className="text-xs uppercase text-orange-400">Claimed to Date</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(stats.totalValuationToDate)}</p>
              <p className="mt-1 text-xs text-orange-400">{valuationSummary.claimedPercentage}% of contract</p>
            </div>
            <div className="rounded-lg border border-yellow-700/30 bg-yellow-900/10 p-4">
              <p className="text-xs uppercase text-yellow-400">Outstanding</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(stats.totalOutstanding)}</p>
            </div>
          </div>

          {/* WIP & Payment Status */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-purple-700/30 bg-purple-900/10 p-6">
              <p className="text-sm font-semibold uppercase text-purple-400 mb-4">Work in Progress</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(totalWIP)}</p>
              <p className="text-xs text-gray-400 mt-2">Completed but not yet invoiced</p>
              <div className="mt-4 space-y-2">
                {wipData.slice(0, 3).map((w) => (
                  <div key={w.projectId} className="flex justify-between text-xs">
                    <span className="text-gray-300">{w.projectName}</span>
                    <span className="font-semibold text-purple-400">{formatCurrency(w.wip)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-cyan-700/30 bg-cyan-900/10 p-6">
              <p className="text-sm font-semibold uppercase text-cyan-400 mb-4">Payment Applications</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingApplications}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Paid</p>
                  <p className="text-2xl font-bold text-green-400">{stats.paidApplications}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-cyan-300">Total Paid: {formatCurrency(stats.totalPaid)}</p>
            </div>
          </div>

          {/* Project Summary Table */}
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
            <p className="text-lg font-bold text-white mb-4">Active Projects Summary</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left text-gray-400">Project</th>
                    <th className="py-3 px-4 text-right text-gray-400">Contract Value</th>
                    <th className="py-3 px-4 text-right text-gray-400">Claimed</th>
                    <th className="py-3 px-4 text-right text-gray-400">Outstanding</th>
                    <th className="py-3 px-4 text-center text-gray-400">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.filter(p => p.stage === 'active').map((p) => (
                    <tr key={p.id} className="border-b border-gray-700/30 hover:bg-gray-800/50 cursor-pointer transition" onClick={() => router.push(`/projects/${p.id}?tab=valuations`)}>
                      <td className="py-3 px-4 text-gray-300 font-semibold">{p.projectName}</td>
                      <td className="py-3 px-4 text-right text-white">{formatCurrency(p.contractValue)}</td>
                      <td className="py-3 px-4 text-right text-orange-400">{formatCurrency(p.valuationToDate)}</td>
                      <td className="py-3 px-4 text-right text-yellow-400">{formatCurrency(p.contractValue - p.valuationToDate)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-gray-700 overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${p.overallProgress}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-white w-8 text-right">{p.overallProgress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Valuations View */}
      {viewMode === 'valuations' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
              <p className="text-xs uppercase text-gray-500 mb-2">Total Contract Value</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(valuationSummary.contractedValue)}</p>
            </div>
            <div className="rounded-lg border border-orange-700/30 bg-orange-900/10 p-6">
              <p className="text-xs uppercase text-orange-400 mb-2">Total Claimed</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(valuationSummary.claimed)}</p>
              <p className="text-sm text-orange-400 mt-2">{valuationSummary.claimedPercentage}% of contract</p>
            </div>
            <div className="rounded-lg border border-yellow-700/30 bg-yellow-900/10 p-6">
              <p className="text-xs uppercase text-yellow-400 mb-2">Still to Claim</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(valuationSummary.outstanding)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
            <p className="text-lg font-bold text-white mb-4">Valuation by Project</p>
            <div className="space-y-4">
              {projects.map((p) => {
                const claimedPct = Math.round((p.valuationToDate / p.contractValue) * 100);
                return (
                  <div key={p.id} className="rounded border border-gray-700/30 p-4 hover:bg-gray-800/50 cursor-pointer transition" onClick={() => router.push(`/projects/${p.id}?tab=valuations`)}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-white">{p.projectName}</p>
                        <p className="text-xs text-gray-500">{p.client}</p>
                      </div>
                      <span className="text-sm font-bold text-orange-400">{claimedPct}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                      <div>
                        <span className="text-gray-500">Contract:</span>
                        <p className="font-semibold text-white">{formatCurrency(p.contractValue)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Claimed:</span>
                        <p className="font-semibold text-orange-400">{formatCurrency(p.valuationToDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Outstanding:</span>
                        <p className="font-semibold text-yellow-400">{formatCurrency(p.contractValue - p.valuationToDate)}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-700 overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${claimedPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* WIP View */}
      {viewMode === 'wip' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-purple-700/30 bg-purple-900/10 p-6">
            <p className="text-sm uppercase text-purple-400 font-semibold mb-2">Total Work in Progress</p>
            <p className="text-4xl font-bold text-white">{formatCurrency(totalWIP)}</p>
            <p className="text-sm text-gray-400 mt-2">Work completed but not yet invoiced across all projects</p>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
            <p className="text-lg font-bold text-white mb-4">WIP by Project</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left text-gray-400">Project</th>
                    <th className="py-3 px-4 text-right text-gray-400">Contract Value</th>
                    <th className="py-3 px-4 text-right text-gray-400">Completion Value</th>
                    <th className="py-3 px-4 text-right text-gray-400">Invoiced</th>
                    <th className="py-3 px-4 text-right text-gray-400">WIP</th>
                    <th className="py-3 px-4 text-center text-gray-400">WIP %</th>
                  </tr>
                </thead>
                <tbody>
                  {wipData.map((w) => (
                    <tr key={w.projectId} className="border-b border-gray-700/30 hover:bg-gray-800/50 cursor-pointer transition" onClick={() => router.push(`/projects/${w.projectId}?tab=wip`)}>
                      <td className="py-3 px-4 text-gray-300 font-semibold">{w.projectName}</td>
                      <td className="py-3 px-4 text-right text-white">{formatCurrency(w.contractValue)}</td>
                      <td className="py-3 px-4 text-right text-blue-400">{formatCurrency(w.completionValue)}</td>
                      <td className="py-3 px-4 text-right text-orange-400">{formatCurrency(w.invoiced)}</td>
                      <td className="py-3 px-4 text-right text-purple-400 font-bold">{formatCurrency(w.wip)}</td>
                      <td className="py-3 px-4 text-center text-purple-400 font-semibold">{w.wipPercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payment Applications View */}
      {viewMode === 'payments' && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
              <p className="text-xs uppercase text-gray-500">Total Applications</p>
              <p className="mt-2 text-3xl font-bold text-white">{paymentApps.length}</p>
            </div>
            <div className="rounded-lg border border-orange-700/30 bg-orange-900/10 p-4">
              <p className="text-xs uppercase text-orange-400">Pending/Submitted</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.pendingApplications}</p>
            </div>
            <div className="rounded-lg border border-green-700/30 bg-green-900/10 p-4">
              <p className="text-xs uppercase text-green-400">Paid</p>
              <p className="mt-2 text-3xl font-bold text-white">{stats.paidApplications}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6">
            <p className="text-lg font-bold text-white mb-4">Payment Applications</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="py-3 px-4 text-left text-gray-400">Project</th>
                    <th className="py-3 px-4 text-center text-gray-400">App No.</th>
                    <th className="py-3 px-4 text-right text-gray-400">Amount</th>
                    <th className="py-3 px-4 text-center text-gray-400">Status</th>
                    <th className="py-3 px-4 text-center text-gray-400">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentApps.map((app) => (
                    <tr key={app.id} className="border-b border-gray-700/30 hover:bg-gray-800/50 transition">
                      <td className="py-3 px-4 text-gray-300 font-semibold">{app.projectName || 'Project'}</td>
                      <td className="py-3 px-4 text-center text-gray-300">App {app.applicationNumber}</td>
                      <td className="py-3 px-4 text-right text-white font-bold">{formatCurrency(app.grossValuation || app.grossValue || 0)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          app.status === 'paid' ? 'bg-green-900/30 text-green-400' :
                          app.status === 'certified' ? 'bg-blue-900/30 text-blue-400' :
                          app.status === 'submitted' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500">{new Date(app.submittedDate || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Variations View */}
      {viewMode === 'variations' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-red-700/30 bg-red-900/10 p-6">
            <p className="text-sm uppercase text-red-400 font-semibold mb-2">Projects with Variations</p>
            {projects.filter(p => p.hasVariations).length > 0 ? (
              <div className="space-y-3">
                {projects.filter(p => p.hasVariations).map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded border border-red-700/30 bg-red-900/5">
                    <div>
                      <p className="font-semibold text-white">{p.projectName}</p>
                      <p className="text-xs text-gray-500">{p.client}</p>
                    </div>
                    <button onClick={() => router.push(`/projects/${p.id}`)} className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700 transition">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No variations recorded</p>
            )}
          </div>
        </div>
      )}

      {/* Early Warnings View */}
      {viewMode === 'warnings' && (
        <div className="space-y-6">
          {earlyWarnings.length > 0 ? (
            <div className="space-y-3">
              {earlyWarnings.map((project) => (
                <div key={project.id} className="rounded-lg border border-yellow-700/50 bg-yellow-900/10 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-yellow-300">{project.projectName}</p>
                      <div className="mt-2 space-y-1 text-sm text-gray-300">
                        {project.overallProgress > 75 && project.daysToCompletion < 14 && (
                          <p>⏰ Approaching completion with {project.daysToCompletion} days remaining</p>
                        )}
                        {project.hasDelays && (
                          <p>📅 Project has known delays</p>
                        )}
                        {project.valuationToDate > project.contractValue * 0.9 && (
                          <p>💰 High value claimed ({Math.round((project.valuationToDate / project.contractValue) * 100)}% of contract)</p>
                        )}
                        {project.hasVariations && (
                          <p>📝 Variation orders in progress</p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => router.push(`/projects/${project.id}`)}
                      className="whitespace-nowrap px-3 py-2 text-sm rounded bg-yellow-600 text-white hover:bg-yellow-700 transition ml-4"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-green-700/30 bg-green-900/10 p-6 text-center">
              <p className="text-green-400 font-semibold">✓ No early warnings</p>
              <p className="text-sm text-gray-400 mt-2">All projects are within expected parameters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
