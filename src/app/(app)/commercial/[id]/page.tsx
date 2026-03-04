'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  sampleValuations,
  sampleVariations,
  sampleContracts,
  sampleProcurement,
  sampleCostReports,
  sampleCommercialTasks,
  sampleCommercialIssues,
  getCostReportsFromStorage,
} from '@/lib/commercial-data';
import { sampleInvoices, sampleVariations as operationsVariations } from '@/lib/operations-data';
import type {
  Valuation,
  CommercialVariation,
  Contract,
  ProcurementPackage,
  CostReport,
} from '@/lib/commercial-models';
import { DataLinkManager, IntegrationChecker } from '@/lib/data-integration';
import type { DataLink } from '@/lib/data-integration';

type ContractReview = {
  summary: string;
  keyTerms: string[];
  riskFlags: string[];
  clauseReview: Array<{ clause: string; concern: string; suggestion: string }>;
  redlines: string[];
};

type ContractReviewResponse = {
  review: ContractReview;
  model: string;
  source: string;
};

export default function CommercialDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  // Tab management
  const [activeTab, setActiveTab] = useState<'overview' | 'valuations' | 'variations' | 'contracts' | 'procurement' | 'costs' | 'operations'>('overview');

  // Local state for editable data
  const [localValuations, setLocalValuations] = useState<Valuation[]>(
    sampleValuations.filter(v => v.projectId === projectId)
  );
  const [localVariations, setLocalVariations] = useState<CommercialVariation[]>(
    sampleVariations.filter(v => v.projectId === projectId)
  );
  const [localContracts, setLocalContracts] = useState<Contract[]>(
    sampleContracts.filter(c => c.projectId === projectId)
  );
  const [localProcurement, setLocalProcurement] = useState<ProcurementPackage[]>(
    sampleProcurement.filter(p => p.projectId === projectId)
  );
  const [costReports, setCostReports] = useState<CostReport[]>(sampleCostReports);

  // Operations linked data
  const linkedOperationsInvoices = sampleInvoices.filter(inv => inv.projectId === projectId);
  const linkedOperationsVariations = operationsVariations.filter(ov => ov.projectId === projectId);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('edit');
  const [editType, setEditType] = useState<'valuation' | 'variation' | 'contract' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editData, setEditData] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Integration links
  const [dataLinks, setDataLinks] = useState<DataLink[]>([]);
  const [invoiceLinkSelection, setInvoiceLinkSelection] = useState<Record<string, string>>({});
  const [variationLinkSelection, setVariationLinkSelection] = useState<Record<string, string>>({});

  // Contract review modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewFile, setReviewFile] = useState<File | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ContractReviewResponse | null>(null);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Validation functions
  const validateValuation = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.status) errors.status = 'Status is required';
    if (data.appliedValue !== undefined && data.appliedValue < 0) errors.appliedValue = 'Value must be positive';
    if (data.certifiedValue !== undefined && data.certifiedValue < 0) errors.certifiedValue = 'Value must be positive';
    return errors;
  };

  const validateVariation = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.status) errors.status = 'Status is required';
    if (!data.impact) errors.impact = 'Impact is required';
    if (data.quotedValue !== undefined && data.quotedValue < 0) errors.quotedValue = 'Value must be positive';
    return errors;
  };

  const validateContract = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.status) errors.status = 'Status is required';
    if (data.contractValue !== undefined && data.contractValue < 0) errors.contractValue = 'Value must be positive';
    if (!data.contractorName) errors.contractorName = 'Contractor name is required';
    return errors;
  };

  // Edit handlers
  const openEditModal = (type: 'valuation' | 'variation' | 'contract', item: any) => {
    setEditMode('edit');
    setEditType(type);
    setEditingItem(item);
    setEditData({ ...item });
    setValidationErrors({});
    setEditModalOpen(true);
  };

  const openCreateModal = (type: 'valuation' | 'variation') => {
    const today = new Date().toISOString().slice(0, 10);
    setEditMode('create');
    setEditType(type);
    setEditingItem(null);
    setValidationErrors({});

    if (type === 'valuation') {
      const nextIndex = localValuations.length + 1;
      const nextRef = `APP-M${String(nextIndex).padStart(2, '0')}`;
      setEditData({
        id: `VAL-${String(nextIndex).padStart(3, '0')}`,
        projectId,
        applicationRef: nextRef,
        period: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        submittedDate: today,
        appliedValue: 0,
        certifiedValue: 0,
        retentionValue: 0,
        paidValue: 0,
        status: 'draft',
        certifier: 'TBD',
        certifierCompany: 'TBD',
        attachments: [],
        notes: '',
      });
    }

    if (type === 'variation') {
      const nextIndex = localVariations.length + 1;
      const year = new Date().getFullYear();
      setEditData({
        id: `VAR-${String(nextIndex).padStart(3, '0')}`,
        projectId,
        variationRef: `VO-${year}-${String(nextIndex).padStart(3, '0')}`,
        title: '',
        description: '',
        submittedDate: today,
        quotedValue: 0,
        approvedValue: 0,
        actualValue: 0,
        status: 'draft',
        impact: 'costs',
        programmeDaysImpact: 0,
        clientApproval: false,
        architectApproval: false,
        contractorApproval: false,
        submittedBy: 'Commercial Team',
        attachments: [],
        notes: '',
      });
    }

    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditType(null);
    setEditingItem(null);
    setEditData({});
    setValidationErrors({});
  };

  const saveEditChanges = () => {
    let errors: Record<string, string> = {};

    if (editType === 'valuation') {
      errors = validateValuation(editData);
    } else if (editType === 'variation') {
      errors = validateVariation(editData);
    } else if (editType === 'contract') {
      errors = validateContract(editData);
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    if (editType === 'valuation') {
      if (editMode === 'create') {
        setLocalValuations(prev => [...prev, editData]);
        showToast('Valuation created successfully', 'success');
      } else {
        const updated = localValuations.map(v =>
          v.id === editingItem.id ? editData : v
        );
        setLocalValuations(updated);
        showToast('Valuation updated successfully', 'success');
      }
    } else if (editType === 'variation') {
      if (editMode === 'create') {
        setLocalVariations(prev => [...prev, editData]);
        showToast('Variation created successfully', 'success');
      } else {
        const updated = localVariations.map(v =>
          v.id === editingItem.id ? editData : v
        );
        setLocalVariations(updated);
        showToast('Variation updated successfully', 'success');
      }
    } else if (editType === 'contract') {
      const updated = localContracts.map(c =>
        c.id === editingItem.id ? editData : c
      );
      setLocalContracts(updated);
      showToast('Contract updated successfully', 'success');
    }

    closeEditModal();
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts editing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  useEffect(() => {
    setCostReports(getCostReportsFromStorage());
  }, []);

  // Get cost metrics
  const projectCostReports = costReports.filter(cr => cr.projectId === projectId);
  const totalBudget = projectCostReports.reduce((sum, cr) => sum + cr.budget, 0);
  const totalCommitted = projectCostReports.reduce((sum, cr) => sum + cr.committed, 0);
  const totalForecast = projectCostReports.reduce((sum, cr) => sum + cr.forecast, 0);
  const grossMargin = totalBudget - totalCommitted;
  const costToComplete = totalForecast - totalCommitted;

  const valuationStatusCounts = localValuations.reduce<Record<string, number>>((acc, val) => {
    acc[val.status] = (acc[val.status] || 0) + 1;
    return acc;
  }, {});

  const variationImpactCounts = localVariations.reduce<Record<string, number>>((acc, v) => {
    acc[v.impact] = (acc[v.impact] || 0) + 1;
    return acc;
  }, {});

  const contractRiskCounts = localContracts.reduce<Record<string, number>>((acc, c) => {
    acc[c.riskLevel] = (acc[c.riskLevel] || 0) + 1;
    return acc;
  }, {});

  const totalApplied = localValuations.reduce((sum, v) => sum + v.appliedValue, 0);
  const totalCertified = localValuations.reduce((sum, v) => sum + v.certifiedValue, 0);
  const totalPaid = localValuations.reduce((sum, v) => sum + (v.paidValue || 0), 0);

  const submitContractReview = async () => {
    if (!reviewFile) {
      setReviewError('Please upload a contract file before submitting.');
      return;
    }

    setReviewLoading(true);
    setReviewError(null);
    setReviewResult(null);

    try {
      const formData = new FormData();
      formData.append('file', reviewFile);
      const response = await fetch('/api/contracts/review', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || 'Review failed');
      }

      const data = (await response.json()) as ContractReviewResponse;
      setReviewResult(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error';
      setReviewError(message);
    } finally {
      setReviewLoading(false);
    }
  };

  const handleLinkInvoice = (invoiceId: string) => {
    const valuationId = invoiceLinkSelection[invoiceId];
    if (!valuationId) {
      showToast('Select a valuation to link', 'error');
      return;
    }

    const link = DataLinkManager.createLink(
      'commercial',
      valuationId,
      'valuation',
      'operations',
      invoiceId,
      'invoice',
      'valuation-to-invoice',
      'Commercial User'
    );

    setDataLinks(prev => [...prev, link]);
    showToast('Invoice linked to valuation', 'success');
  };

  const handleLinkVariation = (operationsVariationId: string) => {
    const variationId = variationLinkSelection[operationsVariationId];
    if (!variationId) {
      showToast('Select a commercial variation to link', 'error');
      return;
    }

    const link = DataLinkManager.createLink(
      'commercial',
      variationId,
      'variation',
      'operations',
      operationsVariationId,
      'variation',
      'variation-to-variation',
      'Commercial User'
    );

    setDataLinks(prev => [...prev, link]);
    showToast('Variation linked to operations item', 'success');
  };

  const integrationStatus = IntegrationChecker.checkDataConsistency(
    projectId,
    [...localValuations, ...localVariations],
    [...linkedOperationsInvoices, ...linkedOperationsVariations],
    dataLinks
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header with Navigation */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <button
                onClick={() => router.back()}
                className="text-orange-500 hover:text-orange-400 transition mb-2"
              >
                ← Back
              </button>
              <h1 className="text-3xl font-bold">Commercial Management</h1>
              <p className="text-gray-400 mt-1">Project {projectId}</p>
            </div>
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition"
            >
              ← View Operations
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-gray-700 mb-8">
          <div className="flex space-x-8 overflow-x-auto">
            {(['overview', 'valuations', 'variations', 'contracts', 'procurement', 'costs', 'operations'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 px-1 border-b-2 transition font-medium capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm">Forecast Final Account</p>
                  <p className="text-3xl font-bold text-orange-500 mt-2">£{totalForecast.toLocaleString()}</p>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm">Gross Margin</p>
                  <p className={`text-3xl font-bold mt-2 ${grossMargin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    £{grossMargin.toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm">Cost to Complete</p>
                  <p className={`text-3xl font-bold mt-2 ${costToComplete >= 0 ? 'text-blue-500' : 'text-yellow-500'}`}>
                    £{costToComplete.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Commercial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Latest Valuations</h3>
                  <div className="space-y-3">
                    {localValuations.slice(0, 3).map(val => (
                      <div key={val.id} className="flex justify-between items-center">
                        <span className="text-gray-300">{val.applicationRef}</span>
                        <span className="text-orange-500 font-medium">£{val.appliedValue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Open Actions</h3>
                  <div className="space-y-3">
                    {sampleCommercialTasks
                      .filter(t => t.projectId === projectId)
                      .slice(0, 3)
                      .map(task => (
                        <div key={task.id} className="flex items-start space-x-3">
                          <span className="text-orange-500 mt-1">→</span>
                          <div>
                            <p className="text-gray-200">{task.title}</p>
                            <p className="text-gray-500 text-sm">{task.bucket}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Commercial Insights</h3>
                    <p className="text-gray-500 text-sm">Snapshot of valuation, variation, and risk trends</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">Applied vs Paid</p>
                    <p className="text-lg font-semibold text-orange-500">£{totalPaid.toLocaleString()} / £{totalApplied.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <p className="text-xs text-gray-400 uppercase">Valuation Status</p>
                    <div className="mt-3 space-y-2">
                      {Object.entries(valuationStatusCounts).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 capitalize">{status}</span>
                          <span className="text-gray-100 font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <p className="text-xs text-gray-400 uppercase">Variation Impact</p>
                    <div className="mt-3 space-y-2">
                      {Object.entries(variationImpactCounts).map(([impact, count]) => (
                        <div key={impact} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 capitalize">{impact}</span>
                          <span className="text-gray-100 font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <p className="text-xs text-gray-400 uppercase">Contract Risk</p>
                    <div className="mt-3 space-y-2">
                      {Object.entries(contractRiskCounts).map(([risk, count]) => (
                        <div key={risk} className="flex items-center justify-between text-sm">
                          <span className="text-gray-300 capitalize">{risk}</span>
                          <span className="text-gray-100 font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-xs text-gray-400 uppercase mb-2">Certified vs Applied</p>
                  <div className="w-full bg-gray-800 rounded h-3 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full"
                      style={{ width: totalApplied > 0 ? `${Math.min(100, Math.round((totalCertified / totalApplied) * 100))}%` : '0%' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Certified £{totalCertified.toLocaleString()}</span>
                    <span>Applied £{totalApplied.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Valuations Tab */}
          {activeTab === 'valuations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Valuations</h3>
                  <p className="text-sm text-gray-500">Create and manage payment applications</p>
                </div>
                <button
                  onClick={() => openCreateModal('valuation')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition text-sm font-medium"
                >
                  New Application
                </button>
              </div>
              {localValuations.length === 0 ? (
                <p className="text-gray-400">No valuations for this project</p>
              ) : (
                localValuations.map(val => (
                  <div key={val.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{val.applicationRef}</h3>
                        <p className="text-gray-400 text-sm">Application {val.id}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            val.status === 'paid'
                              ? 'bg-green-900 text-green-200'
                              : val.status === 'certified'
                              ? 'bg-blue-900 text-blue-200'
                              : 'bg-yellow-900 text-yellow-200'
                          }`}
                        >
                          {val.status}
                        </span>
                        <button
                          onClick={() => openEditModal('valuation', val)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded transition text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Applied Value</p>
                        <p className="text-xl font-bold text-orange-500">£{val.appliedValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Certified Value</p>
                        <p className="text-xl font-bold text-blue-500">£{val.certifiedValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Retention (10%)</p>
                        <p className="text-xl font-bold text-red-500">£{(val.retentionValue || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Variations Tab */}
          {activeTab === 'variations' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Variations</h3>
                  <p className="text-sm text-gray-500">Track change orders and approvals</p>
                </div>
                <button
                  onClick={() => openCreateModal('variation')}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition text-sm font-medium"
                >
                  New Variation
                </button>
              </div>
              {localVariations.length === 0 ? (
                <p className="text-gray-400">No variations for this project</p>
              ) : (
                localVariations.map(var1 => (
                  <div key={var1.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{var1.variationRef}</h3>
                        <p className="text-gray-400 text-sm">{var1.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            var1.status === 'completed'
                              ? 'bg-green-900 text-green-200'
                              : var1.status === 'approved'
                              ? 'bg-blue-900 text-blue-200'
                              : 'bg-yellow-900 text-yellow-200'
                          }`}
                        >
                          {var1.status}
                        </span>
                        <button
                          onClick={() => openEditModal('variation', var1)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded transition text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Impact</p>
                        <p className="font-medium text-gray-200 capitalize">{var1.impact}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Quoted Value</p>
                        <p className="text-lg font-bold text-orange-500">£{var1.quotedValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Client Approval</p>
                        <span
                          className={`text-sm font-medium ${var1.clientApproval ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {var1.clientApproval ? '✓ Approved' : '✗ Pending'}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Contractor Sign-off</p>
                        <span
                          className={`text-sm font-medium ${var1.contractorApproval ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {var1.contractorApproval ? '✓ Signed' : '✗ Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Contracts Tab */}
          {activeTab === 'contracts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Contracts</h3>
                  <p className="text-sm text-gray-500">Review contract risk and compliance</p>
                </div>
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm font-medium"
                >
                  Review Contract
                </button>
              </div>
              {localContracts.length === 0 ? (
                <p className="text-gray-400">No contracts for this project</p>
              ) : (
                localContracts.map(contract => (
                  <div key={contract.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{contract.contractorName}</h3>
                        <p className="text-gray-400 text-sm">{contract.contractType}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            contract.riskLevel === 'high'
                              ? 'bg-red-900 text-red-200'
                              : contract.riskLevel === 'medium'
                              ? 'bg-yellow-900 text-yellow-200'
                              : 'bg-green-900 text-green-200'
                          }`}
                        >
                          Risk: {contract.riskLevel}
                        </span>
                        <button
                          onClick={() => openEditModal('contract', contract)}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded transition text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-gray-400 text-sm">Contract Value</p>
                        <p className="text-lg font-bold text-orange-500">£{contract.contractValue.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Retention</p>
                        <p className="text-lg font-bold text-red-500">{contract.retentionPercentage}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Retention Value</p>
                        <p className="text-lg font-bold text-red-500">
                          £{((contract.contractValue * contract.retentionPercentage) / 100).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Status</p>
                        <span className="text-sm font-medium text-green-400">{contract.status}</span>
                      </div>
                    </div>

                    {contract.keyContacts.length > 0 && (
                      <div>
                        <p className="text-gray-400 text-sm mb-2">Key Contacts</p>
                        <div className="space-y-2">
                          {contract.keyContacts.map((contact, idx) => (
                            <div key={idx} className="text-sm text-gray-300">
                              <p className="font-medium">{contact.name}</p>
                              <p className="text-gray-500">{contact.role}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Procurement Tab */}
          {activeTab === 'procurement' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Procurement Packages</h3>
                  <p className="text-sm text-gray-500">Track supplier selection and package progress</p>
                </div>
                <button
                  onClick={() => router.push('/procurement-overview')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm font-medium"
                >
                  Open Procurement Overview →
                </button>
              </div>
              {localProcurement.length === 0 ? (
                <p className="text-gray-400">No procurement packages for this project</p>
              ) : (
                localProcurement.map(proc => (
                  <div key={proc.id} className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{proc.title}</h3>
                        <p className="text-gray-400 text-sm">{proc.description}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          proc.stage === 'delivery'
                            ? 'bg-green-900 text-green-200'
                            : proc.stage === 'award'
                            ? 'bg-blue-900 text-blue-200'
                            : 'bg-yellow-900 text-yellow-200'
                        }`}
                      >
                        {proc.stage}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {proc.suppliers.map((supplier, idx) => (
                        <div key={idx} className="bg-gray-800 p-3 rounded">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-gray-200">{supplier.name}</p>
                              <p
                                className={`text-sm ${
                                  supplier.selected
                                    ? 'text-green-400'
                                    : 'text-gray-400'
                                }`}
                              >
                                {supplier.selected ? '✓ Selected' : '○ Not Selected'}
                              </p>
                            </div>
                            <span className="text-lg font-bold text-orange-500">£{(supplier.quotedPrice || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Costs Tab */}
          {activeTab === 'costs' && (
            <div>
              {projectCostReports.length === 0 ? (
                <p className="text-gray-400">No cost reports for this project</p>
              ) : (
                <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-400">Package</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-400">Budget</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-400">Committed</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-400">Forecast</th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-gray-400">Variance</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-gray-400">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectCostReports.map((cr: CostReport) => {
                        const variance = cr.budget - cr.forecast;
                        return (
                          <tr key={cr.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="px-6 py-3 text-sm font-medium text-gray-200">{cr.packageName}</td>
                            <td className="px-6 py-3 text-right text-sm text-gray-300">£{cr.budget.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right text-sm text-gray-300">£{cr.committed.toLocaleString()}</td>
                            <td className="px-6 py-3 text-right text-sm text-orange-500 font-bold">£{cr.forecast.toLocaleString()}</td>
                            <td
                              className={`px-6 py-3 text-right text-sm font-bold ${
                                variance >= 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              £{variance.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-center text-sm">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  cr.status === 'on-track'
                                    ? 'bg-green-900 text-green-200'
                                    : 'bg-yellow-900 text-yellow-200'
                                }`}
                              >
                                {cr.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="bg-gray-800 px-6 py-3 border-t border-gray-700">
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Total Budget</p>
                        <p className="font-bold text-lg">£{totalBudget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Committed</p>
                        <p className="font-bold text-lg">£{totalCommitted.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Forecast</p>
                        <p className="font-bold text-lg text-orange-500">£{totalForecast.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Total Variance</p>
                        <p className={`font-bold text-lg ${totalBudget - totalForecast >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          £{(totalBudget - totalForecast).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

          {/* Operations Tab */}
          {(activeTab as any) === 'operations' && (
            <div className="space-y-6">
              <div className="bg-blue-900/20 border border-blue-700 p-4 rounded">
                <p className="text-blue-300 text-sm">
                  <span className="font-semibold">Integration Status:</span> This project has {linkedOperationsInvoices.length} linked invoices and {linkedOperationsVariations.length} operations variations.
                </p>
              </div>

              {/* Linked Invoices */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Linked Operations Invoices</h3>
                {linkedOperationsInvoices.length === 0 ? (
                  <p className="text-gray-400">No invoices linked to this project</p>
                ) : (
                  <div className="space-y-3">
                    {linkedOperationsInvoices.map(inv => {
                      const linkedValuationLink = dataLinks.find(
                        link => link.linkType === 'valuation-to-invoice' && link.targetId === inv.id
                      );
                      const linkedValuation = linkedValuationLink
                        ? localValuations.find(v => v.id === linkedValuationLink.sourceId)
                        : null;

                      return (
                      <div key={inv.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-200">Application {inv.applicationNumber}</h4>
                            <p className="text-gray-500 text-sm">{inv.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-500">£{inv.thisPayment.toLocaleString()}</p>
                            <span
                              className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                                inv.status === 'paid'
                                  ? 'bg-green-900 text-green-200'
                                  : inv.status === 'certified'
                                  ? 'bg-blue-900 text-blue-200'
                                  : inv.status === 'submitted'
                                  ? 'bg-yellow-900 text-yellow-200'
                                  : 'bg-gray-700 text-gray-300'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-800 border border-gray-700 rounded p-3 text-sm">
                          {linkedValuation ? (
                            <div className="flex items-center justify-between">
                              <p className="text-gray-300">Linked to valuation {linkedValuation.applicationRef}</p>
                              <span className="text-xs text-green-400">✓ Linked</span>
                            </div>
                          ) : (
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Link to valuation</label>
                                <select
                                  value={invoiceLinkSelection[inv.id] || ''}
                                  onChange={e =>
                                    setInvoiceLinkSelection(prev => ({ ...prev, [inv.id]: e.target.value }))
                                  }
                                  className="w-full bg-gray-900 border border-gray-700 text-gray-200 px-2 py-1 rounded"
                                >
                                  <option value="">Select valuation</option>
                                  {localValuations.map(val => (
                                    <option key={val.id} value={val.id}>
                                      {val.applicationRef} · £{val.appliedValue.toLocaleString()}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={() => handleLinkInvoice(inv.id)}
                                className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                              >
                                Link
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-700 pt-2 mt-2">
                          <span>Due: {inv.paymentDueDate ? new Date(inv.paymentDueDate).toLocaleDateString('en-GB') : 'Not set'}</span>
                          <button
                            onClick={() => router.push(`/projects/${projectId}?invoice=${inv.id}`)}
                            className="text-blue-400 hover:text-blue-300 transition"
                          >
                            View in Operations →
                          </button>
                        </div>
                      </div>
                    );
                    })}
                  </div>
                )}
              </div>

              {/* Linked Operations Variations */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Linked Operations Variations</h3>
                {linkedOperationsVariations.length === 0 ? (
                  <p className="text-gray-400">No operations variations for this project</p>
                ) : (
                  <div className="space-y-3">
                    {linkedOperationsVariations.map(opVar => {
                      const linkedVariationLink = dataLinks.find(
                        link => link.linkType === 'variation-to-variation' && link.targetId === opVar.id
                      );
                      const linkedCommercialVariation = linkedVariationLink
                        ? localVariations.find(v => v.id === linkedVariationLink.sourceId)
                        : null;
                      // Find matching commercial variation by matching voNumber in the variationRef
                      const matchingCommercial = localVariations.find(
                        cv => cv.variationRef && opVar.voNumber && cv.variationRef.includes(opVar.voNumber)
                      );
                      return (
                        <div key={opVar.id} className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-gray-200">{opVar.voNumber}: {opVar.description}</h4>
                              <p className="text-gray-500 text-sm">Operations Ref: {opVar.id}</p>
                            </div>
                            <div className="text-right">
                              {linkedCommercialVariation ? (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200 mb-1">
                                  ✓ Linked
                                </span>
                              ) : matchingCommercial ? (
                                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-900 text-green-200 mb-1">
                                  Suggested match
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                            <div>
                              <p className="text-gray-400">Status</p>
                              <p className="font-medium text-gray-200 capitalize">{opVar.status}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Value</p>
                              <p className="font-medium text-orange-500">£{opVar.quotedValue?.toLocaleString() || '0'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400">Impact</p>
                              <p className="font-medium text-gray-200 capitalize">{opVar.programmeImpact} days</p>
                            </div>
                          </div>
                          <div className="bg-gray-800 border border-gray-700 rounded p-3 text-sm">
                            {linkedCommercialVariation ? (
                              <p className="text-gray-300">
                                Linked Commercial Variation: {linkedCommercialVariation.variationRef}
                              </p>
                            ) : (
                              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div className="flex-1">
                                  <label className="block text-xs text-gray-400 mb-1">Link to commercial variation</label>
                                  <select
                                    value={variationLinkSelection[opVar.id] || (matchingCommercial?.id || '')}
                                    onChange={e =>
                                      setVariationLinkSelection(prev => ({ ...prev, [opVar.id]: e.target.value }))
                                    }
                                    className="w-full bg-gray-900 border border-gray-700 text-gray-200 px-2 py-1 rounded"
                                  >
                                    <option value="">Select variation</option>
                                    {localVariations.map(v => (
                                      <option key={v.id} value={v.id}>
                                        {v.variationRef} · £{v.quotedValue.toLocaleString()}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  onClick={() => handleLinkVariation(opVar.id)}
                                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                                >
                                  Link
                                </button>
                              </div>
                            )}
                          </div>
                          {matchingCommercial && !linkedCommercialVariation && (
                            <div className="bg-green-900/20 border border-green-700 p-3 rounded text-sm">
                              <p className="text-green-300">
                                <span className="font-semibold">Suggested Commercial Variation:</span> {matchingCommercial.variationRef}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Data Sync Summary */}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Integration Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Commercial Items</p>
                    <p className="text-2xl font-bold text-orange-500">{localValuations.length + localVariations.length + localContracts.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Linked Invoices</p>
                    <p className="text-2xl font-bold text-green-500">{linkedOperationsInvoices.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Operations Variations</p>
                    <p className="text-2xl font-bold text-blue-500">{linkedOperationsVariations.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Sync Status</p>
                    <p className="text-2xl font-bold text-emerald-500">✓ {integrationStatus.syncStatus}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-gray-800 border border-gray-700 rounded p-3">
                    <p className="text-xs text-gray-400">Linked Items</p>
                    <p className="text-lg font-semibold text-gray-200">{integrationStatus.linkedItemsCount}</p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded p-3">
                    <p className="text-xs text-gray-400">Consistency</p>
                    <p
                      className={`text-lg font-semibold capitalize ${
                        integrationStatus.dataConsistency === 'consistent'
                          ? 'text-green-400'
                          : integrationStatus.dataConsistency === 'warning'
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}
                    >
                      {integrationStatus.dataConsistency}
                    </p>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded p-3">
                    <p className="text-xs text-gray-400">Last Sync</p>
                    <p className="text-sm text-gray-200">
                      {new Date(integrationStatus.lastSyncDate).toLocaleString('en-GB')}
                    </p>
                  </div>
                </div>
                {integrationStatus.warnings.length > 0 && (
                  <div className="mt-4 bg-yellow-900/20 border border-yellow-700 rounded p-3 text-sm">
                    <p className="text-yellow-300 font-semibold mb-2">Integration Warnings</p>
                    <ul className="text-yellow-200 space-y-1">
                      {integrationStatus.warnings.map((warning, idx) => (
                        <li key={idx}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editMode === 'create' ? 'Create' : 'Edit'} {editType === 'valuation' ? 'Valuation' : editType === 'variation' ? 'Variation' : 'Contract'}
            </h2>

            <div className="space-y-4">
              {editType === 'valuation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Application Ref</label>
                    <input
                      type="text"
                      value={editData.applicationRef || ''}
                      onChange={e => handleFieldChange('applicationRef', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Period</label>
                    <input
                      type="text"
                      value={editData.period || ''}
                      onChange={e => handleFieldChange('period', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editData.status || ''}
                      onChange={e => handleFieldChange('status', e.target.value)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.status ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    >
                      <option value="">Select status</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="certified">Certified</option>
                      <option value="paid">Paid</option>
                    </select>
                    {validationErrors.status && <p className="text-red-500 text-xs mt-1">{validationErrors.status}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Applied Value (£)</label>
                    <input
                      type="number"
                      value={editData.appliedValue || 0}
                      onChange={e => handleFieldChange('appliedValue', parseFloat(e.target.value) || 0)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.appliedValue ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    />
                    {validationErrors.appliedValue && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.appliedValue}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Certified Value (£)</label>
                    <input
                      type="number"
                      value={editData.certifiedValue || 0}
                      onChange={e => handleFieldChange('certifiedValue', parseFloat(e.target.value) || 0)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.certifiedValue ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    />
                    {validationErrors.certifiedValue && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.certifiedValue}</p>
                    )}
                  </div>
                </>
              )}

              {editType === 'variation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Variation Ref</label>
                    <input
                      type="text"
                      value={editData.variationRef || ''}
                      onChange={e => handleFieldChange('variationRef', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input
                      type="text"
                      value={editData.title || ''}
                      onChange={e => handleFieldChange('title', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editData.description || ''}
                      onChange={e => handleFieldChange('description', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editData.status || ''}
                      onChange={e => handleFieldChange('status', e.target.value)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.status ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    >
                      <option value="">Select status</option>
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="approved">Approved</option>
                      <option value="completed">Completed</option>
                    </select>
                    {validationErrors.status && <p className="text-red-500 text-xs mt-1">{validationErrors.status}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Impact</label>
                    <select
                      value={editData.impact || ''}
                      onChange={e => handleFieldChange('impact', e.target.value)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.impact ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    >
                      <option value="">Select impact</option>
                      <option value="costs">Costs</option>
                      <option value="programme">Programme</option>
                      <option value="both">Both</option>
                      <option value="neither">Neither</option>
                    </select>
                    {validationErrors.impact && <p className="text-red-500 text-xs mt-1">{validationErrors.impact}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Quoted Value (£)</label>
                    <input
                      type="number"
                      value={editData.quotedValue || 0}
                      onChange={e => handleFieldChange('quotedValue', parseFloat(e.target.value) || 0)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.quotedValue ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    />
                    {validationErrors.quotedValue && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.quotedValue}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Programme Impact (days)</label>
                    <input
                      type="number"
                      value={editData.programmeDaysImpact || 0}
                      onChange={e => handleFieldChange('programmeDaysImpact', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded"
                    />
                  </div>
                </>
              )}

              {editType === 'contract' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={editData.status || ''}
                      onChange={e => handleFieldChange('status', e.target.value)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.status ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    >
                      <option value="">Select status</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                    {validationErrors.status && <p className="text-red-500 text-xs mt-1">{validationErrors.status}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contractor Name</label>
                    <input
                      type="text"
                      value={editData.contractorName || ''}
                      onChange={e => handleFieldChange('contractorName', e.target.value)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.contractorName ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    />
                    {validationErrors.contractorName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.contractorName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contract Value (£)</label>
                    <input
                      type="number"
                      value={editData.contractValue || 0}
                      onChange={e => handleFieldChange('contractValue', parseFloat(e.target.value) || 0)}
                      className={`w-full bg-gray-800 border ${
                        validationErrors.contractValue ? 'border-red-500' : 'border-gray-700'
                      } text-gray-100 px-3 py-2 rounded`}
                    />
                    {validationErrors.contractValue && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.contractValue}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeEditModal}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEditChanges}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition font-medium"
              >
                {editMode === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">Contract Review</h2>
                <p className="text-sm text-gray-500">Upload a contract document to get an AI review</p>
              </div>
              <button
                onClick={() => {
                  setReviewModalOpen(false);
                  setReviewFile(null);
                  setReviewResult(null);
                  setReviewError(null);
                }}
                className="text-gray-400 hover:text-gray-200"
              >
                Close
              </button>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded p-4">
              <label className="block text-sm font-medium mb-2">Contract file (PDF or DOCX)</label>
              <input
                type="file"
                accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={e => setReviewFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-300"
              />
              {reviewError && <p className="text-red-400 text-sm mt-2">{reviewError}</p>}
              <button
                onClick={submitContractReview}
                disabled={reviewLoading}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm font-medium disabled:opacity-60"
              >
                {reviewLoading ? 'Reviewing...' : 'Run Review'}
              </button>
            </div>

            {reviewResult && (
              <div className="mt-6 space-y-4">
                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold">Summary</h3>
                    <span className="text-xs text-gray-500">{reviewResult.model} · {reviewResult.source}</span>
                  </div>
                  <p className="text-sm text-gray-300">{reviewResult.review.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <h3 className="text-sm font-semibold mb-2">Key Terms</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {reviewResult.review.keyTerms.map((term, idx) => (
                        <li key={idx}>• {term}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-800 border border-gray-700 rounded p-4">
                    <h3 className="text-sm font-semibold mb-2">Risk Flags</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                      {reviewResult.review.riskFlags.map((flag, idx) => (
                        <li key={idx}>• {flag}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <h3 className="text-sm font-semibold mb-3">Clause Review</h3>
                  <div className="space-y-3">
                    {reviewResult.review.clauseReview.map((clause, idx) => (
                      <div key={idx} className="border border-gray-700 rounded p-3">
                        <p className="text-sm font-medium text-gray-200">{clause.clause}</p>
                        <p className="text-xs text-gray-400 mt-1">Concern: {clause.concern}</p>
                        <p className="text-xs text-gray-400 mt-1">Suggestion: {clause.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded p-4">
                  <h3 className="text-sm font-semibold mb-2">Redlines</h3>
                  <ul className="text-sm text-gray-300 space-y-1">
                    {reviewResult.review.redlines.map((line, idx) => (
                      <li key={idx}>• {line}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg text-white font-medium flex items-center space-x-2 ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          <span>{toast.type === 'success' ? '✓' : '✕'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
