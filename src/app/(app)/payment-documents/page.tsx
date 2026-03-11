'use client';

import PermissionGuard from "@/components/PermissionGuard";


import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getProjectsFromStorage, getProjectBoQLineItemsFromStorage } from '@/lib/operations-data';
import { 
  getApplicationsForPaymentFromStorage,
  getApplicationsForProject,
  createApplicationForPayment,
  updateApplicationForPayment,
  deleteApplicationForPayment,
  getFinalAccountByProjectId,
  createFinalAccount,
  updateFinalAccount,
  getRetentionReleasesForProject,
  createRetentionRelease
} from '@/lib/payment-documents-data';
import { ApplicationForPaymentDocument } from '@/components/ApplicationForPaymentDocument';
import { FinalAccountDocument } from '@/components/FinalAccountDocument';
import { formatCurrencyUK, formatDateUK } from '@/lib/payment-document-models';

export default function PaymentDocumentsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [applicationsList, setApplicationsList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'view' | 'final-account'>('list');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [selectedFinalAccount, setSelectedFinalAccount] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [retentionReleases, setRetentionReleases] = useState<any[]>([]);

  // Form state for new application
  const [formData, setFormData] = useState({
    contractSum: 0,
    totalVariations: 0,
    previouslyValued: 0,
    thisValuation: 0,
    retentionPercentage: 5,
    defectsDeduction: 0,
    otherDeductions: 0,
    description: '',
    notes: ''
  });

  useEffect(() => {
    const projectsList = getProjectsFromStorage();
    setProjects(projectsList);
    
    const allApps = getApplicationsForPaymentFromStorage();
    setApplicationsList(allApps);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      const project = projects.find(p => p.id === selectedProject);
      const apps = getApplicationsForProject(selectedProject);
      setApplicationsList(apps);
      const releases = getRetentionReleasesForProject(selectedProject);
      setRetentionReleases(releases);

      if (project) {
        // Auto-populate form with project data
        const allBoqItems = getProjectBoQLineItemsFromStorage();
        const projectBoqItems = allBoqItems.filter(item => item.projectId === selectedProject);
        
        // Calculate totals from BoQ items
        const totalClaimed = projectBoqItems.reduce((sum, item) => sum + (item.amountClaimed || 0), 0);
        const totalContractValue = projectBoqItems.reduce((sum, item) => sum + (item.originalAmount || 0), 0);
        
        // Calculate previously valued (sum of all previous applications)
        const previouslyValued = apps.reduce((sum, app) => sum + app.previouslyValued + app.thisValuation, 0);
        
        // Calculate this valuation (total claimed minus previously valued)
        const thisValuation = Math.max(0, totalClaimed - previouslyValued);

        setFormData({
          contractSum: project.contractValue || 0,
          totalVariations: project.grossProfit ? project.contractValue - (project.contractValue - project.grossProfit) : 0,
          previouslyValued: previouslyValued,
          thisValuation: thisValuation,
          retentionPercentage: 5,
          defectsDeduction: 0,
          otherDeductions: 0,
          description: `Application #${apps.length + 1}`,
          notes: `Auto-populated from BoQ claim data - ${new Date().toLocaleDateString()}`
        });
      }
    }
  }, [selectedProject, projects]);

  const handleViewApplication = (appId: string) => {
    const app = applicationsList.find(a => a.id === appId);
    if (app) {
      setSelectedApp(app);
      setSelectedAppId(appId);
      setViewMode('view');
    }
  };

  const handleCreateApplication = () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    const project = projects.find(p => p.id === selectedProject);
    const adjustedSum = formData.contractSum + formData.totalVariations;
    const retention = adjustedSum * (formData.retentionPercentage / 100);
    const totalDeductions = retention + formData.defectsDeduction + formData.otherDeductions;
    const totalClaimed = formData.previouslyValued + formData.thisValuation;

    const newApp = createApplicationForPayment(selectedProject, {
      contractSum: formData.contractSum,
      totalVariations: formData.totalVariations,
      adjustedContractSum: adjustedSum,
      previouslyValued: formData.previouslyValued,
      thisValuation: formData.thisValuation,
      totalValuation: totalClaimed,
      retentionPercentage: formData.retentionPercentage,
      retentionAmount: retention,
      defectsDeduction: formData.defectsDeduction,
      otherDeductions: formData.otherDeductions,
      totalDeductions,
      grossPayment: formData.thisValuation,
      netPayment: formData.thisValuation - totalDeductions,
      description: formData.description,
      notes: formData.notes,
      lineItems: []
    });

    alert('Application for Payment created successfully!');
    setFormData({
      contractSum: 0,
      totalVariations: 0,
      previouslyValued: 0,
      thisValuation: 0,
      retentionPercentage: 5,
      defectsDeduction: 0,
      otherDeductions: 0,
      description: '',
      notes: ''
    });
    setApplicationsList(getApplicationsForProject(selectedProject));
    setViewMode('list');
  };

  const handleCreateFinalAccount = () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    const project = projects.find(p => p.id === selectedProject);
    const totalApps = applicationsList.reduce((sum, app) => sum + app.totalValuation, 0);
    const totalRetention = applicationsList.reduce((sum, app) => sum + app.retentionAmount, 0);

    const account = createFinalAccount(selectedProject, {
      projectName: project?.projectName || '',
      client: project?.client || '',
      contractor: 'KBM Construct',
      startDate: new Date(project?.contractStartDate || new Date()),
      completionDate: new Date(project?.contractCompletionDate || new Date()),
      originalContractSum: formData.contractSum,
      authorizedVariations: formData.totalVariations,
      finalContractSum: formData.contractSum + formData.totalVariations,
      totalClaimedToDate: totalApps,
      retentionHeld: totalRetention,
      totalNetPayments: totalApps - totalRetention,
      finalBalance: (formData.contractSum + formData.totalVariations) - totalApps,
      retentionToBeReleased: totalRetention,
      valueOfWorkCompleted: totalApps,
      variations: []
    });

    alert('Final Account created successfully!');
    setSelectedFinalAccount(account);
    setViewMode('final-account');
  };

  const handleExportPDF = (type: 'application' | 'final-account') => {
    const element = document.getElementById('document-preview');
    if (!element) return;

    const opt = {
      margin: 10,
      filename: type === 'application' ? `Application-${selectedApp?.applicationNumber}.pdf` : 'Final-Account.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    // For now, we'll use window.print() which is built-in
    window.print();
  };

  const project = projects.find(p => p.id === selectedProject);

  return (
    <PermissionGuard permission="payments">
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-orange-500 hover:text-orange-400 transition"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">Applications for Payment & Final Account</h1>
          <p className="mt-2 text-gray-400">Professional payment documents ready for client submission</p>
        </div>

        {/* Project Selector */}
        <div className="mb-6">
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setViewMode('list');
            }}
            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
          >
            <option value="">Select a project...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.projectName}</option>
            ))}
          </select>
        </div>

        {!selectedProject ? (
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-8 text-center">
            <p className="text-gray-400">Select a project to begin</p>
          </div>
        ) : (
          <>
            {/* View Modes */}
            {viewMode === 'list' && (
              <div className="space-y-6">
                {/* Navigation Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setViewMode('create')}
                    className="rounded bg-orange-500 px-6 py-2 text-white hover:bg-orange-600 transition font-semibold"
                  >
                    + Create New Application
                  </button>
                  <button
                    onClick={() => setViewMode('final-account')}
                    className="rounded bg-green-600 px-6 py-2 text-white hover:bg-green-700 transition font-semibold"
                  >
                    Generate Final Account
                  </button>
                </div>

                {/* Applications List */}
                <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                  <h2 className="text-lg font-bold text-white mb-4">Applications for Payment</h2>
                  
                  {applicationsList.length === 0 ? (
                    <p className="text-gray-400">No applications created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {applicationsList.map((app) => (
                        <div key={app.id} className="flex items-start justify-between rounded border border-gray-700/30 bg-gray-900/50 p-4 hover:bg-gray-900 transition">
                          <div>
                            <p className="font-semibold text-white">Application #{app.applicationNumber}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDateUK(app.submissionDate)}</p>
                            <p className="text-sm text-gray-300 mt-2">
                              Valuation: <span className="font-bold text-orange-400">{formatCurrencyUK(app.thisValuation)}</span>
                              {' '} · Net Payable: <span className="font-bold text-green-400">{formatCurrencyUK(app.netPayment)}</span>
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewApplication(app.id)}
                              className="rounded bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-700 transition"
                            >
                              View
                            </button>
                            <button
                              onClick={() => {
                                setSelectedApp(app);
                                setSelectedAppId(app.id);
                                handleExportPDF('application');
                              }}
                              className="rounded bg-purple-600 px-4 py-2 text-xs text-white hover:bg-purple-700 transition"
                            >
                              Export PDF
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this application?')) {
                                  deleteApplicationForPayment(app.id);
                                  setApplicationsList(getApplicationsForProject(selectedProject));
                                }
                              }}
                              className="rounded bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Retention Releases */}
                {retentionReleases.length > 0 && (
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                    <h2 className="text-lg font-bold text-white mb-4">Retention Releases</h2>
                    <div className="space-y-3">
                      {retentionReleases.map((release) => (
                        <div key={release.id} className="flex items-start justify-between rounded border border-gray-700/30 bg-gray-900/50 p-4">
                          <div>
                            <p className="font-semibold text-white capitalize">{release.reason.replace('-', ' ')}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDateUK(release.releaseDate)}</p>
                            <p className="text-sm text-gray-300 mt-2">Amount: <span className="font-bold text-green-400">{formatCurrencyUK(release.retentionAmount)}</span></p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Create New Application Form */}
            {viewMode === 'create' && (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 space-y-6">
                <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-4">
                  <p className="text-blue-300 text-sm">
                    <span className="font-semibold">ℹ️ Auto-populated:</span> Contract value, variations, and valuations are automatically pulled from the project and BoQ data. Only modify retention and deductions below.
                  </p>
                </div>

                <h2 className="text-xl font-bold text-white">Create Application for Payment</h2>

                {/* Auto-populated Read-only Fields */}
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Contract Sum (£)</label>
                    <div className="rounded border border-gray-700 bg-gray-700/50 px-4 py-2 text-gray-300 font-mono">
                      {formatCurrencyUK(formData.contractSum)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">From project</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Authorized Variations (£)</label>
                    <div className="rounded border border-gray-700 bg-gray-700/50 px-4 py-2 text-gray-300 font-mono">
                      {formatCurrencyUK(formData.totalVariations)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">From project</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Adjusted Contract Sum (£)</label>
                    <div className="rounded border border-gray-700 bg-gray-700/50 px-4 py-2 text-gray-300 font-mono font-bold">
                      {formatCurrencyUK(formData.contractSum + formData.totalVariations)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Contract + Variations</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Previously Valued (£)</label>
                    <div className="rounded border border-gray-700 bg-gray-700/50 px-4 py-2 text-gray-300 font-mono">
                      {formatCurrencyUK(formData.previouslyValued)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">From previous applications</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">This Valuation (£)</label>
                    <div className="rounded border border-orange-700 bg-orange-900/20 px-4 py-2 text-orange-300 font-mono font-bold text-lg">
                      {formatCurrencyUK(formData.thisValuation)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">From BoQ claims data</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Total Cumulative Valuation (£)</label>
                    <div className="rounded border border-gray-700 bg-gray-700/50 px-4 py-2 text-gray-300 font-mono font-bold">
                      {formatCurrencyUK(formData.previouslyValued + formData.thisValuation)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Previous + This</p>
                  </div>
                </div>

                <hr className="border-gray-700" />

                {/* Editable Deduction Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Deductions & Adjustments</h3>
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Retention (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.retentionPercentage}
                        onChange={(e) => setFormData({ ...formData, retentionPercentage: parseFloat(e.target.value) })}
                        className="w-full rounded border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-orange-500"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Amount: <span className="text-orange-400 font-bold">
                          {formatCurrencyUK((formData.contractSum + formData.totalVariations) * (formData.retentionPercentage / 100))}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Defects Deduction (£)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.defectsDeduction}
                        onChange={(e) => setFormData({ ...formData, defectsDeduction: parseFloat(e.target.value) })}
                        className="w-full rounded border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">Other Deductions (£)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.otherDeductions}
                        onChange={(e) => setFormData({ ...formData, otherDeductions: parseFloat(e.target.value) })}
                        className="w-full rounded border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-700" />

                {/* Payment Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Payment Summary</h3>
                  <div className="grid gap-4 sm:grid-cols-3 rounded-lg border border-gray-700/30 bg-gray-900/50 p-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Gross Valuation</p>
                      <p className="text-xl font-bold text-orange-400">{formatCurrencyUK(formData.thisValuation)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Deductions</p>
                      <p className="text-xl font-bold text-red-400">
                        {formatCurrencyUK(
                          ((formData.contractSum + formData.totalVariations) * (formData.retentionPercentage / 100)) +
                          formData.defectsDeduction +
                          formData.otherDeductions
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Net Payment Due</p>
                      <p className="text-xl font-bold text-green-400">
                        {formatCurrencyUK(
                          formData.thisValuation -
                          (((formData.contractSum + formData.totalVariations) * (formData.retentionPercentage / 100)) +
                          formData.defectsDeduction +
                          formData.otherDeductions)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full rounded border border-gray-700 bg-gray-900 px-4 py-2 text-white focus:border-orange-500"
                  />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    onClick={() => {
                      setViewMode('list');
                      setSelectedProject('');
                      setFormData({
                        contractSum: 0,
                        totalVariations: 0,
                        previouslyValued: 0,
                        thisValuation: 0,
                        retentionPercentage: 5,
                        defectsDeduction: 0,
                        otherDeductions: 0,
                        description: '',
                        notes: ''
                      });
                    }}
                    className="rounded border border-gray-700 px-6 py-2 font-medium text-gray-300 hover:bg-gray-900/50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApplication}
                    className="rounded bg-orange-600 px-6 py-2 font-medium text-white hover:bg-orange-700"
                  >
                    Create Application
                  </button>
                </div>
              </div>
            )}

            {/* View Application */}
            {viewMode === 'view' && selectedApp && (
              <div>
                <div className="mb-6 flex gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition font-semibold"
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button
                    onClick={() => handleExportPDF('application')}
                    className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 transition font-semibold"
                  >
                    Export to PDF
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className="rounded bg-gray-700 px-6 py-2 text-white hover:bg-gray-600 transition"
                  >
                    Back
                  </button>
                </div>

                {showPreview && (
                  <div id="document-preview" className="rounded-lg border border-gray-700/50 bg-white p-8 overflow-auto max-h-screen">
                    <ApplicationForPaymentDocument
                      application={selectedApp}
                      project={project}
                      company={{
                        name: 'KBM Construct',
                        address: '123 Business Park, London, UK',
                        phone: '+44 (0)20 1234 5678',
                        email: 'info@kbm-construct.com'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Final Account View */}
            {viewMode === 'final-account' && selectedFinalAccount && (
              <div>
                <div className="mb-6 flex gap-3">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition font-semibold"
                  >
                    {showPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                  <button
                    onClick={() => handleExportPDF('final-account')}
                    className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 transition font-semibold"
                  >
                    Export to PDF
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className="rounded bg-gray-700 px-6 py-2 text-white hover:bg-gray-600 transition"
                  >
                    Back
                  </button>
                </div>

                {showPreview && (
                  <div id="document-preview" className="rounded-lg border border-gray-700/50 bg-white p-8 overflow-auto max-h-screen">
                    <FinalAccountDocument
                      account={selectedFinalAccount}
                      company={{
                        name: 'KBM Construct',
                        address: '123 Business Park, London, UK',
                        phone: '+44 (0)20 1234 5678',
                        email: 'info@kbm-construct.com'
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </PermissionGuard>
  );
}
