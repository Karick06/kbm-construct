"use client";

import PermissionGuard from "@/components/PermissionGuard";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import {
  type Lead,
  type Opportunity,
  type Activity,
  type Account,
  type Contact,
  type CRMMetrics,
  formatCurrency,
  getStageColor,
  getLeadRatingColor,
  getActivityTypeIcon,
  getNextStageRecommendation,
  calculateDaysSince,
} from "@/lib/crm-models";
import {
  getLeadsFromStorage,
  saveLeadsToStorage,
  getOpportunitiesFromStorage,
  saveOpportunitiesToStorage,
  updateOpportunity,
  getActivitiesFromStorage,
  saveActivitiesToStorage,
  createActivity,
  updateActivity,
  getAccountsFromStorage,
  getContactsFromStorage,
  getContactsByAccount,
  calculateCRMMetrics,
  convertLead,
  createLead,
  updateLead,
  createOpportunity,
} from "@/lib/crm-data";

type ViewMode = 'dashboard' | 'leads' | 'opportunities' | 'activities' | 'pipeline';

export default function CRMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [metrics, setMetrics] = useState<CRMMetrics | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showNewOpportunityModal, setShowNewOpportunityModal] = useState(false);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  // Load data
  useEffect(() => {
    setLeads(getLeadsFromStorage());
    setOpportunities(getOpportunitiesFromStorage());
    setActivities(getActivitiesFromStorage());
    setAccounts(getAccountsFromStorage());
    setContacts(getContactsFromStorage());
    setMetrics(calculateCRMMetrics());
  }, []);

  // Save data
  useEffect(() => {
    if (leads.length > 0) saveLeadsToStorage(leads);
  }, [leads]);

  useEffect(() => {
    if (opportunities.length > 0) saveOpportunitiesToStorage(opportunities);
  }, [opportunities]);

  useEffect(() => {
    if (activities.length > 0) saveActivitiesToStorage(activities);
  }, [activities]);

  // Recalculate metrics when data changes
  useEffect(() => {
    setMetrics(calculateCRMMetrics());
  }, [leads, opportunities, activities]);

  // Handle lead conversion
  const handleConvertLead = (leadId: string) => {
    try {
      const { accountId, contactId, opportunityId } = convertLead(leadId);
      setLeads(getLeadsFromStorage());
      setOpportunities(getOpportunitiesFromStorage());
      setAccounts(getAccountsFromStorage());
      setContacts(getContactsFromStorage());
      setSelectedLead(null);
      alert(`Lead converted successfully!\nAccount: ${accountId}\nContact: ${contactId}\nOpportunity: ${opportunityId}`);
      setViewMode('opportunities');
    } catch (error) {
      console.error('Failed to convert lead:', error);
      alert('Failed to convert lead');
    }
  };

  // Handle opportunity stage change
  const handleStageChange = (oppId: string, newStage: any) => {
    updateOpportunity(oppId, { stage: newStage });
    setOpportunities(getOpportunitiesFromStorage());
  };

  // Handle activity completion
  const handleCompleteActivity = (activityId: string) => {
    updateActivity(activityId, { status: 'Completed', completedDate: new Date().toISOString() });
    setActivities(getActivitiesFromStorage());
  };

  const getFilteredLeads = () => {
    if (filterStatus === 'all') return leads;
    return leads.filter(l => l.status === filterStatus);
  };

  const getFilteredOpportunities = () => {
    if (filterStage === 'all') return opportunities;
    return opportunities.filter(o => o.stage === filterStage);
  };

  const getPendingActivities = () => {
    return activities.filter(a => a.status === 'Planned' || a.status === 'In Progress');
  };

  const getTodayActivities = () => {
    const today = new Date().toISOString().split('T')[0];
    return activities.filter(a => a.dueDate === today);
  };

  return (
    <PermissionGuard permission="clients">
    <div className="space-y-6">
      <PageHeader title="CRM - Business Development" subtitle="Manage leads, opportunities, and customer relationships" />

      {/* View Mode Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['dashboard', 'leads', 'pipeline', 'opportunities', 'activities'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition-colors ${
              viewMode === mode
                ? 'border-orange-500 text-orange-500'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold uppercase text-gray-400">Total Leads</p>
                <span className="text-2xl">🎯</span>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.totalLeads}</p>
              <p className="text-xs text-green-400 mt-1">+{metrics.newLeadsThisMonth} this month</p>
            </div>

            <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold uppercase text-gray-400">Pipeline Value</p>
                <span className="text-2xl">💰</span>
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(metrics.totalPipelineValue)}</p>
              <p className="text-xs text-gray-400 mt-1">Weighted: {formatCurrency(metrics.weightedPipelineValue)}</p>
            </div>

            <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold uppercase text-gray-400">Win Rate</p>
                <span className="text-2xl">🏆</span>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.winRate.toFixed(1)}%</p>
              <p className="text-xs text-gray-400 mt-1">Avg deal: {formatCurrency(metrics.averageDealSize)}</p>
            </div>

            <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold uppercase text-gray-400">Deals This Month</p>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-white">{metrics.dealsWonThisMonth}</p>
              <p className="text-xs text-gray-400 mt-1">Revenue: {formatCurrency(metrics.revenueThisMonth)}</p>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Lead Conversion</p>
              <p className="text-2xl font-bold text-blue-400">{metrics.leadConversionRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Avg Sales Cycle</p>
              <p className="text-2xl font-bold text-cyan-400">{metrics.averageSalesCycle.toFixed(0)} days</p>
            </div>
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
              <p className="text-xs font-semibold uppercase text-gray-400 mb-2">Open Opportunities</p>
              <p className="text-2xl font-bold text-yellow-400">{metrics.openOpportunities}</p>
            </div>
          </div>

          {/* Recent Activities & Hot Leads */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Today's Activities */}
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
              <h3 className="text-lg font-bold text-white mb-4">Today's Activities ({getTodayActivities().length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getTodayActivities().slice(0, 10).map((activity) => (
                  <div key={activity.id} className="rounded border border-gray-700/50 bg-gray-900/50 p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getActivityTypeIcon(activity.type)}</span>
                        <div>
                          <p className="text-sm font-semibold text-white">{activity.subject}</p>
                          <p className="text-xs text-gray-400">{activity.relatedToName}</p>
                        </div>
                      </div>
                      {activity.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          activity.priority === 'High' ? 'bg-red-500/20 text-red-400' : 
                          activity.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {activity.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{activity.dueTime} - {activity.assignedTo}</p>
                    {activity.status !== 'Completed' && (
                      <button
                        onClick={() => handleCompleteActivity(activity.id)}
                        className="text-xs mt-2 px-3 py-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      >
                        Mark Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hot Leads */}
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5">
              <h3 className="text-lg font-bold text-white mb-4">Hot Leads ({leads.filter(l => l.rating === 'Hot' && l.status !== 'Converted').length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leads.filter(l => l.rating === 'Hot' && l.status !== 'Converted').slice(0, 10).map((lead) => (
                  <div 
                    key={lead.id} 
                    onClick={() => {setSelectedLead(lead); setViewMode('leads');}}
                    className="rounded border border-gray-700/50 bg-gray-900/50 p-3 hover:bg-gray-900/70 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-white">{lead.company}</p>
                        <p className="text-xs text-gray-400">{lead.contactName}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getLeadRatingColor(lead.rating)}`}>
                        {lead.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{lead.source}</span>
                      <span className="font-semibold text-green-400">{formatCurrency(lead.estimatedValue)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Close: {lead.estimatedCloseDate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leads View */}
      {viewMode === 'leads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded text-sm ${filterStatus === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('New')}
                className={`px-3 py-1 rounded text-sm ${filterStatus === 'New' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                New
              </button>
              <button
                onClick={() => setFilterStatus('Contacted')}
                className={`px-3 py-1 rounded text-sm ${filterStatus === 'Contacted' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Contacted
              </button>
              <button
                onClick={() => setFilterStatus('Qualified')}
                className={`px-3 py-1 rounded text-sm ${filterStatus === 'Qualified' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                Qualified
              </button>
            </div>
            <button
              onClick={() => setShowNewLeadModal(true)}
              className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 font-semibold"
            >
              + New Lead
            </button>
          </div>

          {/* Leads Table */}
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900/50">
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredLeads().map((lead) => (
                  <tr 
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="border-b border-gray-700/30 hover:bg-gray-700/30 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-white">{lead.company}</p>
                      <p className="text-xs text-gray-500">{lead.id}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-300">{lead.contactName}</p>
                      <p className="text-xs text-gray-500">{lead.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded border ${
                        lead.status === 'New' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                        lead.status === 'Contacted' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                        lead.status === 'Qualified' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        lead.status === 'Converted' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        'bg-gray-500/20 text-gray-400 border-gray-500/30'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded border ${getLeadRatingColor(lead.rating)}`}>
                        {lead.rating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-400">{formatCurrency(lead.estimatedValue)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{lead.source}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{lead.assignedTo}</td>
                    <td className="px-4 py-3">
                      {lead.status === 'Qualified' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConvertLead(lead.id);
                          }}
                          className="text-xs px-3 py-1 rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                        >
                          Convert
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Sales Pipeline</h2>
          <div className="grid grid-cols-7 gap-2">
            {(['Prospecting', 'Qualification', 'Needs Analysis', 'Proposal Submitted', 'Negotiation', 'Closed Won', 'Closed Lost'] as const).map((stage) => {
              const stageOpps = opportunities.filter(o => o.stage === stage);
              const stageValue = stageOpps.reduce((sum, o) => sum + o.amount, 0);
              return (
                <div key={stage} className="flex flex-col rounded-lg border border-gray-700/50 bg-gray-800/50 p-3 min-h-[400px]">
                  <div className="mb-3 pb-2 border-b border-gray-700">
                    <p className="text-xs font-semibold text-gray-400">{stage}</p>
                    <p className="text-lg font-bold text-white">{stageOpps.length}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(stageValue)}</p>
                  </div>
                  <div className="space-y-2 overflow-y-auto">
                    {stageOpps.map((opp) => (
                      <div
                        key={opp.id}
                        onClick={() => setSelectedOpportunity(opp)}
                        className="rounded border border-gray-700/50 bg-gray-900/50 p-2 hover:bg-gray-900/70 cursor-pointer"
                      >
                        <p className="text-xs font-semibold text-white mb-1">{opp.name}</p>
                        <p className="text-xs text-green-400 font-semibold">{formatCurrency(opp.amount)}</p>
                        <p className="text-xs text-gray-500 mt-1">{opp.closeDate}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opportunities View */}
      {viewMode === 'opportunities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStage('all')}
                className={`px-3 py-1 rounded text-sm ${filterStage === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                All
              </button>
              {(['Prospecting', 'Qualification', 'Proposal Submitted', 'Negotiation'] as const).map((stage) => (
                <button
                  key={stage}
                  onClick={() => setFilterStage(stage)}
                  className={`px-3 py-1 rounded text-sm ${filterStage === stage ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  {stage}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewOpportunityModal(true)}
              className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 font-semibold"
            >
              + New Opportunity
            </button>
          </div>

          <div className="grid gap-4">
            {getFilteredOpportunities().map((opp) => {
              const account = accounts.find(a => a.id === opp.accountId);
              return (
                <div
                  key={opp.id}
                  onClick={() => setSelectedOpportunity(opp)}
                  className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">{opp.name}</h3>
                      <p className="text-sm text-gray-400">{account?.name || 'Unknown Account'}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded border ${getStageColor(opp.stage)}`}>
                      {opp.stage}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Amount</p>
                      <p className="text-lg font-bold text-green-400">{formatCurrency(opp.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Probability</p>
                      <p className="text-lg font-bold text-blue-400">{opp.probability}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expected Revenue</p>
                      <p className="text-lg font-bold text-cyan-400">{formatCurrency(opp.expectedRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Close Date</p>
                      <p className="text-sm font-semibold text-white">{opp.closeDate}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <p className="text-xs text-gray-500 mb-1">Next Step:</p>
                    <p className="text-sm text-gray-300">{opp.nextStep || getNextStageRecommendation(opp.stage)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activities View */}
      {viewMode === 'activities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Activities</h2>
            <button
              onClick={() => setShowNewActivityModal(true)}
              className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 font-semibold"
            >
              + Log Activity
            </button>
          </div>

          <div className="space-y-3">
            {activities.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()).map((activity) => (
              <div key={activity.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getActivityTypeIcon(activity.type)}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-white">{activity.subject}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          activity.status === 'Completed' ? 'bg-green-500/20 text-green-400' :
                          activity.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {activity.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">{activity.relatedToType}: {activity.relatedToName}</p>
                      <p className="text-sm text-gray-300 mt-2">{activity.description}</p>
                    </div>
                  </div>
                  {activity.priority && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      activity.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                      activity.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {activity.priority}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-3 pt-3 border-t border-gray-700">
                  <span>{activity.assignedTo}</span>
                  {activity.dueDate && <span>Due: {activity.dueDate} {activity.dueTime || ''}</span>}
                  {activity.completedDate && <span>Completed: {new Date(activity.completedDate).toLocaleDateString()}</span>}
                </div>
                
                {activity.outcome && (
                  <div className="mt-2 text-sm text-gray-400">
                    <span className="font-semibold">Outcome:</span> {activity.outcome}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW LEAD MODAL */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">New Lead</h2>
              <button onClick={() => setShowNewLeadModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newLead = createLead({
                company: formData.get('company') as string,
                contactName: formData.get('contactName') as string,
                title: String(formData.get('title') || ''),
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                source: formData.get('source') as any,
                status: 'New',
                rating: formData.get('rating') as any,
                estimatedValue: parseFloat(String(formData.get('estimatedValue') || '0')),
                estimatedCloseDate: String(formData.get('estimatedCloseDate') || ''),
                industry: String(formData.get('industry') || ''),
                address: String(formData.get('address') || ''),
                city: String(formData.get('city') || ''),
                postcode: String(formData.get('postcode') || ''),
                website: formData.get('website') ? String(formData.get('website')) : undefined,
                description: String(formData.get('description') || ''),
                assignedTo: formData.get('assignedTo') as string,
                notes: '',
              });
              setLeads(getLeadsFromStorage());
              setShowNewLeadModal(false);
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Company Name *</label>
                  <input name="company" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Contact Name *</label>
                  <input name="contactName" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Job Title</label>
                  <input name="title" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Email *</label>
                  <input name="email" type="email" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Phone *</label>
                  <input name="phone" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Lead Source *</label>
                  <select name="source" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Rating *</label>
                  <select name="rating" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Estimated Value (£)</label>
                  <input name="estimatedValue" type="number" step="0.01" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Estimated Close Date</label>
                  <input name="estimatedCloseDate" type="date" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Industry</label>
                  <input name="industry" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Website</label>
                  <input name="website" type="url" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Assigned To *</label>
                  <input name="assignedTo" required defaultValue="Sales Team" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Address</label>
                <input name="address" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">City</label>
                  <input name="city" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Postcode</label>
                  <input name="postcode" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Description / Notes</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowNewLeadModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW OPPORTUNITY MODAL */}
      {showNewOpportunityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">New Opportunity</h2>
              <button onClick={() => setShowNewOpportunityModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const newOpp = createOpportunity({
                name: formData.get('name') as string,
                accountId: formData.get('accountId') as string,
                amount: parseFloat(formData.get('amount') as string),
                closeDate: formData.get('closeDate') as string,
                stage: formData.get('stage') as any || 'Prospecting',
                type: formData.get('type') as any || 'New Business',
                leadSource: formData.get('leadSource') as any || 'Website',
                description: formData.get('description') as string || '',
                nextStep: formData.get('nextStep') as string || '',
                opportunityOwner: formData.get('opportunityOwner') as string,
                isClosed: false,
                isWon: false,
              });
              setOpportunities(getOpportunitiesFromStorage());
              setShowNewOpportunityModal(false);
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Opportunity Name *</label>
                  <input name="name" required placeholder="e.g., Thames Valley Development Project" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Account *</label>
                  <select name="accountId" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="">Select Account...</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Amount (£) *</label>
                  <input name="amount" type="number" step="0.01" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Close Date *</label>
                  <input name="closeDate" type="date" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Stage</label>
                  <select name="stage" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="Prospecting">Prospecting</option>
                    <option value="Qualification">Qualification</option>
                    <option value="Needs Analysis">Needs Analysis</option>
                    <option value="Proposal Submitted">Proposal Submitted</option>
                    <option value="Negotiation">Negotiation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Type</label>
                  <select name="type" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="New Business">New Business</option>
                    <option value="Existing Customer - Upgrade">Existing Customer - Upgrade</option>
                    <option value="Existing Customer - Replacement">Existing Customer - Replacement</option>
                    <option value="Existing Customer - Downgrade">Existing Customer - Downgrade</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Lead Source</label>
                  <select name="leadSource" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Opportunity Owner *</label>
                  <input name="opportunityOwner" required defaultValue="Sales Team" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Description</label>
                <textarea name="description" rows={3} placeholder="Describe the opportunity..." className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Next Step</label>
                <input name="nextStep" placeholder="e.g., Schedule follow-up call" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowNewOpportunityModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold">
                  Create Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW ACTIVITY MODAL */}
      {showNewActivityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Log Activity</h2>
              <button onClick={() => setShowNewActivityModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const relatedTo = formData.get('relatedTo') as string;
              const [relatedToType, relatedToId] = relatedTo.split(':');
              
              let relatedToName = '';
              if (relatedToType === 'Lead') {
                const lead = leads.find(l => l.id === relatedToId);
                relatedToName = lead?.company || '';
              } else if (relatedToType === 'Account') {
                const account = accounts.find(a => a.id === relatedToId);
                relatedToName = account?.name || '';
              } else if (relatedToType === 'Opportunity') {
                const opp = opportunities.find(o => o.id === relatedToId);
                relatedToName = opp?.name || '';
              }
              
              createActivity({
                type: formData.get('type') as any,
                subject: formData.get('subject') as string,
                description: formData.get('description') as string || '',
                relatedToType: relatedToType as any,
                relatedToId: relatedToId,
                relatedToName: relatedToName,
                status: formData.get('status') as any,
                priority: formData.get('priority') as any || undefined,
                assignedTo: formData.get('assignedTo') as string,
                dueDate: formData.get('dueDate') as string || undefined,
                dueTime: formData.get('dueTime') as string || undefined,
                createdBy: formData.get('assignedTo') as string,
              });
              setActivities(getActivitiesFromStorage());
              setShowNewActivityModal(false);
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Activity Type *</label>
                  <select name="type" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Site Visit">Site Visit</option>
                    <option value="Task">Task</option>
                    <option value="Note">Note</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Status *</label>
                  <select name="status" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Subject *</label>
                  <input name="subject" required placeholder="e.g., Follow-up call about proposal" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Related To *</label>
                  <select name="relatedTo" required className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="">Select...</option>
                    <optgroup label="Leads">
                      {leads.map(lead => (
                        <option key={lead.id} value={`Lead:${lead.id}`}>{lead.company} - {lead.contactName}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Accounts">
                      {accounts.map(acc => (
                        <option key={acc.id} value={`Account:${acc.id}`}>{acc.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Opportunities">
                      {opportunities.map(opp => (
                        <option key={opp.id} value={`Opportunity:${opp.id}`}>{opp.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Priority</label>
                  <select name="priority" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                    <option value="">None</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Assigned To *</label>
                  <input name="assignedTo" required defaultValue="Sales Team" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Due Date</label>
                  <input name="dueDate" type="date" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Due Time</label>
                  <input name="dueTime" type="time" className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-1">Description / Notes</label>
                <textarea name="description" rows={3} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowNewActivityModal(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold">
                  Log Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEAD DETAIL MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedLead.company}</h2>
                <p className="text-sm text-gray-400">{selectedLead.contactName}</p>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Lead Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Status</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    selectedLead.status === 'New' ? 'bg-blue-500/20 text-blue-400' :
                    selectedLead.status === 'Contacted' ? 'bg-cyan-500/20 text-cyan-400' :
                    selectedLead.status === 'Qualified' ? 'bg-green-500/20 text-green-400' :
                    'bg-purple-500/20 text-purple-400'
                  }`}>
                    {selectedLead.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Rating</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getLeadRatingColor(selectedLead.rating)}`}>
                    {selectedLead.rating}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Email</p>
                  <p className="text-white">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Phone</p>
                  <p className="text-white">{selectedLead.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Source</p>
                  <p className="text-white">{selectedLead.source}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Assigned To</p>
                  <p className="text-white">{selectedLead.assignedTo}</p>
                </div>
                {selectedLead.estimatedValue && selectedLead.estimatedValue > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Estimated Value</p>
                    <p className="text-green-400 font-bold">{formatCurrency(selectedLead.estimatedValue)}</p>
                  </div>
                )}
                {selectedLead.estimatedCloseDate && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Estimated Close Date</p>
                    <p className="text-white">{selectedLead.estimatedCloseDate}</p>
                  </div>
                )}
              </div>

              {selectedLead.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-white">{selectedLead.description}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                {selectedLead.status === 'Qualified' && !selectedLead.convertedDate && (
                  <button
                    onClick={() => {
                      handleConvertLead(selectedLead.id);
                      setSelectedLead(null);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
                  >
                    Convert Lead
                  </button>
                )}
                {selectedLead.status === 'New' && (
                  <button
                    onClick={() => {
                      const updated = leads.map(l => 
                        l.id === selectedLead.id 
                          ? { ...l, status: 'Contacted' as const, lastContactDate: new Date().toISOString() }
                          : l
                      );
                      setLeads(updated);
                      setSelectedLead({ ...selectedLead, status: 'Contacted', lastContactDate: new Date().toISOString() });
                    }}
                    className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 font-semibold"
                  >
                    Mark as Contacted
                  </button>
                )}
                {selectedLead.status === 'Contacted' && (
                  <button
                    onClick={() => {
                      const updated = leads.map(l => 
                        l.id === selectedLead.id 
                          ? { ...l, status: 'Qualified' as const }
                          : l
                      );
                      setLeads(updated);
                      setSelectedLead({ ...selectedLead, status: 'Qualified' });
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
                  >
                    Mark as Qualified
                  </button>
                )}
                <button onClick={() => setSelectedLead(null)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OPPORTUNITY DETAIL MODAL */}
      {selectedOpportunity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedOpportunity.name}</h2>
                <p className="text-sm text-gray-400">{accounts.find(a => a.id === selectedOpportunity.accountId)?.name}</p>
              </div>
              <button onClick={() => setSelectedOpportunity(null)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-1">Amount</p>
                  <p className="text-green-400 font-bold text-lg">{formatCurrency(selectedOpportunity.amount)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-1">Probability</p>
                  <p className="text-blue-400 font-bold text-lg">{selectedOpportunity.probability}%</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-1">Expected Revenue</p>
                  <p className="text-cyan-400 font-bold text-lg">{formatCurrency(selectedOpportunity.expectedRevenue)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase mb-1">Close Date</p>
                  <p className="text-white font-bold text-lg">{new Date(selectedOpportunity.closeDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Stage</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getStageColor(selectedOpportunity.stage)}`}>
                    {selectedOpportunity.stage}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Type</p>
                  <p className="text-white">{selectedOpportunity.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Lead Source</p>
                  <p className="text-white">{selectedOpportunity.leadSource}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Owner</p>
                  <p className="text-white">{selectedOpportunity.opportunityOwner}</p>
                </div>
              </div>

              {selectedOpportunity.description && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-white">{selectedOpportunity.description}</p>
                </div>
              )}

              {selectedOpportunity.nextStep && (
                <div>
                  <p className="text-xs text-gray-500 uppercase mb-1">Next Step</p>
                  <p className="text-white">{selectedOpportunity.nextStep}</p>
                </div>
              )}

              {/* Stage Progression Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                {!selectedOpportunity.isClosed && (
                  <>
                    {selectedOpportunity.stage !== 'Negotiation' && (
                      <button
                        onClick={() => {
                          const nextStage = 
                            selectedOpportunity.stage === 'Prospecting' ? 'Qualification' :
                            selectedOpportunity.stage === 'Qualification' ? 'Needs Analysis' :
                            selectedOpportunity.stage === 'Needs Analysis' ? 'Proposal Submitted' :
                            selectedOpportunity.stage === 'Proposal Submitted' ? 'Negotiation' :
                            selectedOpportunity.stage;
                          handleStageChange(selectedOpportunity.id, nextStage);
                          setSelectedOpportunity(null);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold"
                      >
                        Move to Next Stage
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleStageChange(selectedOpportunity.id, 'Closed Won');
                        setSelectedOpportunity(null);
                      }}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 font-semibold"
                    >
                      Mark as Won
                    </button>
                    <button
                      onClick={() => {
                        handleStageChange(selectedOpportunity.id, 'Closed Lost');
                        setSelectedOpportunity(null);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 font-semibold"
                    >
                      Mark as Lost
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedOpportunity(null)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
}
