'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProjectsFromStorage, sampleProjects, sampleProjectDocuments, samplePhotos, sampleDiaryEntries, sampleInvoices, sampleVariations, sampleDefects, getPaymentApplicationsFromStorage, getPlantAllocationsFromStorage, getMaterialDeliveriesFromStorage, getMaterialStockpilesFromStorage, getQualityTestsFromStorage, getSurveyRecordsFromStorage, getProjectBoQLineItemsForProject, saveProjectBoQLineItemsToStorage, getProjectBoQLineItemsFromStorage } from '@/lib/operations-data';
import { sampleValuations, sampleVariations as sampleCommercialVariations, sampleContracts, sampleCostReports } from '@/lib/commercial-data';
import { getStageLabel, getStageColor, calculateProjectHealth, formatCurrency } from '@/lib/operations-models';
import type { DocumentCategory, ConstructionProject } from '@/lib/operations-models';

// Helper to format file sizes
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper to get document category color
function getCategoryColor(category: DocumentCategory): string {
  const colors: Record<DocumentCategory, string> = {
    'contract': 'bg-blue-900/30 text-blue-400 border-blue-700/50',
    'design': 'bg-cyan-900/30 text-cyan-400 border-cyan-700/50',
    'method-statement': 'bg-green-900/30 text-green-400 border-green-700/50',
    'inspection': 'bg-teal-900/30 text-teal-400 border-teal-700/50',
    'site-diary': 'bg-indigo-900/30 text-indigo-400 border-indigo-700/50',
    'correspondence': 'bg-slate-900/30 text-slate-400 border-slate-700/50',
    'variation': 'bg-red-900/30 text-red-400 border-red-700/50',
    'photo': 'bg-pink-900/30 text-pink-400 border-pink-700/50',
    'health-safety': 'bg-yellow-900/30 text-yellow-400 border-yellow-700/50',
    'quality': 'bg-lime-900/30 text-lime-400 border-lime-700/50',
    'delivery': 'bg-orange-900/30 text-orange-400 border-orange-700/50',
    'invoice': 'bg-emerald-900/30 text-emerald-400 border-emerald-700/50',
    'closeout': 'bg-purple-900/30 text-purple-400 border-purple-700/50',
  };
  return colors[category] || 'bg-gray-900/30 text-gray-400 border-gray-700/50';
}

// Helper to get document status icon
function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    'draft': '📝',
    'issued': '📄',
    'approved': '✓',
    'superseded': '❌',
    'archived': '📦',
  };
  return icons[status] || '📄';
}

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [projects, setProjects] = useState<ConstructionProject[]>(sampleProjects);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'photos' | 'diary' | 'financials' | 'defects' | 'commercial' | 'payment-apps' | 'plant' | 'materials' | 'quality' | 'surveys' | 'team' | 'boq' | 'valuations' | 'wip' | 'budget'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showAssignOperativeModal, setShowAssignOperativeModal] = useState(false);
  const [showAssignEquipmentModal, setShowAssignEquipmentModal] = useState(false);
  
  // BoQ Claiming modal state
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [selectedBoQItem, setSelectedBoQItem] = useState<any>(null);
  const [claimType, setClaimType] = useState<'quantity' | 'percentage'>('percentage');
  const [claimValue, setClaimValue] = useState<number>(0);
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<'invoice' | 'variation' | 'defect' | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editData, setEditData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; id: string } | null>(null);
  
  // Local state for data persistence
  const [localInvoices, setLocalInvoices] = useState(sampleInvoices);
  const [localVariations, setLocalVariations] = useState(sampleVariations);
  const [localDefects, setLocalDefects] = useState(sampleDefects);
  const [paymentApps, setPaymentApps] = useState<any[]>([]);
  const [plantAllocations, setPlantAllocations] = useState<any[]>([]);
  const [materialDeliveries, setMaterialDeliveries] = useState<any[]>([]);
  const [materialStockpiles, setMaterialStockpiles] = useState<any[]>([]);
  const [qualityTests, setQualityTests] = useState<any[]>([]);
  const [surveyRecords, setSurveyRecords] = useState<any[]>([]);
  const [boqLineItems, setBoqLineItems] = useState<any[]>([]);

  useEffect(() => {
    setProjects(getProjectsFromStorage());
    setProjectsLoaded(true);
  }, []);

  // Read tab from URL search parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'documents', 'photos', 'diary', 'financials', 'defects', 'commercial', 'payment-apps', 'plant', 'materials', 'quality', 'surveys', 'team', 'boq', 'valuations', 'wip', 'budget'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, []);

  useEffect(() => {
    setPaymentApps(getPaymentApplicationsFromStorage().filter(app => app.projectId === projectId));
    setPlantAllocations(getPlantAllocationsFromStorage().filter(pa => pa.projectId === projectId));
    setMaterialDeliveries(getMaterialDeliveriesFromStorage().filter(md => md.projectId === projectId));
    setMaterialStockpiles(getMaterialStockpilesFromStorage().filter(ms => ms.projectId === projectId));
    setQualityTests(getQualityTestsFromStorage().filter(qt => qt.projectId === projectId));
    setSurveyRecords(getSurveyRecordsFromStorage().filter(sr => sr.projectId === projectId));
    const allBoQItems = getProjectBoQLineItemsFromStorage();
    setBoqLineItems(
      allBoQItems.map(item => ({
        ...item,
        itemNo: item.itemNumber,
        desc: item.description,
        unit: item.unit,
        qty: item.originalQuantity,
        rate: item.rate,
        claimed: item.amountClaimed,
        complete: item.percentageComplete,
      }))
    );
  }, [projectId]);

  // Find the project - in real app would fetch from database
  const project = projects.find(p => p.id === projectId);

  if (!project && !projectsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Loading project...</h1>
          <p className="text-gray-400">Fetching latest project data</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Project Not Found</h1>
          <button
            onClick={() => router.back()}
            className="rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const health = calculateProjectHealth(project);
  
  // Default BoQ items for demo
  const defaultBoqItems = [
    { itemNo: 'A/01', desc: 'Mobilisation & Site Setup', unit: 'Item', qty: 1, rate: 28000, claimed: 28000, complete: 100 },
    { itemNo: 'A/02', desc: 'Site Welfare & Facilities', unit: 'Item', qty: 1, rate: 12000, claimed: 9600, complete: 80 },
    { itemNo: 'C/01', desc: 'Excavation - General', unit: 'm³', qty: 450, rate: 18.50, claimed: 7425, complete: 32 },
    { itemNo: 'C/02', desc: 'Excavation - Foundation Pits', unit: 'm³', qty: 280, rate: 22.00, claimed: 0, complete: 0 },
    { itemNo: 'D/01', desc: 'Concrete - Basis/Pads E28', unit: 'm³', qty: 120, rate: 185.00, claimed: 11100, complete: 50 },
    { itemNo: 'D/02', desc: 'Concrete - Foundation Beams', unit: 'm³', qty: 85, rate: 195.00, claimed: 0, complete: 0 },
  ];
  
  // Normalize ProjectBoQLineItem to simpler format for UI
  const normalizeBoQItems = (items: any[]) => {
    return items.map(item => ({
      id: item.id,
      itemNo: item.itemNumber,
      desc: item.description,
      unit: item.unit,
      qty: item.originalQuantity,
      rate: item.rate,
      claimed: item.amountClaimed,
      complete: item.percentageComplete,
      // Keep original structure for reference
      ...item
    }));
  };

  // Denormalize normalized items back to ProjectBoQLineItem format for storage
  const denormalizeBoQItems = (items: any[]) => {
    return items.map(item => ({
      id: item.id,
      projectId: item.projectId,
      boqItemId: item.boqItemId,
      itemNumber: item.itemNo || item.itemNumber,
      description: item.desc || item.description,
      unit: item.unit,
      originalQuantity: item.qty || item.originalQuantity,
      rate: item.rate,
      originalAmount: (item.qty || item.originalQuantity) * item.rate,
      quantityClaimed: item.quantityClaimed || 0,
      amountClaimed: item.claimed || item.amountClaimed,
      percentageComplete: item.complete || item.percentageComplete,
      amountClaimedByPercentage: item.amountClaimedByPercentage || 0,
      variations: item.variations || []
    }));
  };

  // Get documents, photos, diary, invoices, variations, and defects for this project
  const projectDocuments = sampleProjectDocuments.filter(doc => doc.projectId === projectId);
  const projectPhotos = samplePhotos.filter(photo => photo.projectId === projectId);
  const projectDiary = sampleDiaryEntries.filter(entry => entry.projectId === projectId);
  const projectInvoices = localInvoices.filter(inv => inv.projectId === projectId);
  const projectVariations = localVariations.filter(vo => vo.projectId === projectId);
  const projectDefects = localDefects.filter(defect => defect.projectId === projectId);
  
  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToast({ message, type, id });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Validation functions
  const validateInvoice = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.status) errors.status = 'Status is required';
    if (data.applicationNumber && data.applicationNumber < 0) errors.applicationNumber = 'Application number must be positive';
    if (data.paidAmount && data.paidAmount < 0) errors.paidAmount = 'Paid amount must be non-negative';
    return errors;
  };
  
  const validateVariation = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.status) errors.status = 'Status is required';
    if (data.quotedValue && data.quotedValue < 0) errors.quotedValue = 'Quoted value must be non-negative';
    if (data.approvedValue && data.approvedValue < 0) errors.approvedValue = 'Approved value must be non-negative';
    if (data.programmeImpact && data.programmeImpact < 0) errors.programmeImpact = 'Programme impact must be non-negative';
    return errors;
  };
  
  const validateDefect = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!data.status) errors.status = 'Status is required';
    if (!data.severity) errors.severity = 'Severity is required';
    if (data.cost && data.cost < 0) errors.cost = 'Cost must be non-negative';
    if (data.assignedTo && data.assignedTo.trim().length === 0) errors.assignedTo = 'Please assign to someone';
    return errors;
  };
  
  // Edit modal handlers
  const openInvoiceEditModal = (invoice: any) => {
    setEditType('invoice');
    setEditingItem(invoice);
    setEditData({ ...invoice });
    setEditModalOpen(true);
  };
  
  const openVariationEditModal = (variation: any) => {
    setEditType('variation');
    setEditingItem(variation);
    setEditData({ ...variation });
    setEditModalOpen(true);
  };
  
  const openDefectEditModal = (defect: any) => {
    setEditType('defect');
    setEditingItem(defect);
    setEditData({ ...defect });
    setEditModalOpen(true);
  };
  
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditType(null);
    setEditingItem(null);
    setEditData(null);
    setValidationErrors({});
  };
  
  const saveEditChanges = () => {
    // Validate based on edit type
    let errors: Record<string, string> = {};
    if (editType === 'invoice') {
      errors = validateInvoice(editData);
    } else if (editType === 'variation') {
      errors = validateVariation(editData);
    } else if (editType === 'defect') {
      errors = validateDefect(editData);
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please fix the errors in the form', 'error');
      return;
    }
    
    // Persist changes to local state
    if (editType === 'invoice') {
      const updatedInvoices = localInvoices.map(inv =>
        inv.id === editingItem.id ? editData : inv
      );
      setLocalInvoices(updatedInvoices);
      showToast('Invoice updated successfully', 'success');
    } else if (editType === 'variation') {
      const updatedVariations = localVariations.map(vo =>
        vo.id === editingItem.id ? editData : vo
      );
      setLocalVariations(updatedVariations);
      showToast('Variation order updated successfully', 'success');
    } else if (editType === 'defect') {
      const updatedDefects = localDefects.map(d =>
        d.id === editingItem.id ? editData : d
      );
      setLocalDefects(updatedDefects);
      showToast('Defect updated successfully', 'success');
    }
    
    closeEditModal();
  };
  
  // Group documents by category
  const documentsByCategory = projectDocuments.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, typeof projectDocuments>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="mb-4 text-orange-500 hover:text-orange-400 transition"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">{project.projectName}</h1>
          <p className="mt-2 text-gray-400">{project.client}</p>
        </div>
        <div className="text-right space-y-3">
          <div>
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${
              getStageColor(project.stage) === 'blue' ? 'bg-blue-900/30 text-blue-400' :
              getStageColor(project.stage) === 'purple' ? 'bg-purple-900/30 text-purple-400' :
              getStageColor(project.stage) === 'orange' ? 'bg-orange-900/30 text-orange-400' :
              'bg-green-900/30 text-green-400'
            }`}>
              {getStageLabel(project.stage)}
            </span>
          </div>
          <div>
            <button
              onClick={() => router.push(`/commercial/${projectId}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition"
            >
              View Commercial →
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase text-gray-500">Progress</p>
          <p className="mt-2 text-2xl font-bold text-white">{project.overallProgress}%</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase text-gray-500">Contract Value</p>
          <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(project.contractValue)}</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase text-gray-500">Days Left</p>
          <p className="mt-2 text-2xl font-bold text-white">{project.daysToCompletion}d</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs uppercase text-gray-500">Health</p>
          <p className="mt-2 text-2xl font-bold capitalize" style={{
            color: health.status === 'excellent' ? '#4ade80' :
                   health.status === 'good' ? '#60a5fa' :
                   health.status === 'concern' ? '#fbbf24' : '#f87171'
          }}>
            {health.status}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700/50">
        <div className="flex gap-4 overflow-x-auto">
          {['overview', 'documents', 'photos', 'diary', 'team', 'boq', 'valuations', 'wip', 'budget', 'payment-apps', 'plant', 'materials', 'quality', 'surveys', 'financials', 'defects', 'commercial'].map((tab) => {
            const tabLabels: Record<string, string> = {
              'overview': 'Overview',
              'documents': 'Documents',
              'photos': 'Photos',
              'diary': 'Site Diary',
              'team': 'Team & Resources',
              'boq': 'BoQ & Claims',
              'valuations': 'Valuations',
              'wip': 'WIP Report',
              'budget': 'Budget',
              'payment-apps': 'Payments',
              'plant': 'Plant',
              'materials': 'Materials',
              'quality': 'Quality',
              'surveys': 'Surveys',
              'financials': 'Financials',
              'defects': 'Defects',
              'commercial': 'Commercial',
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-3 px-2 text-sm font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-b-2 border-orange-500 text-orange-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tabLabels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {/* Project Details */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                <h2 className="mb-4 text-lg font-bold text-white">Project Details</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="mt-1 text-white">{new Date(project.contractStartDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Estimated Completion</p>
                    <p className="mt-1 text-white">{new Date(project.contractCompletionDate).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Project Manager</p>
                    <p className="mt-1 text-white">{project.projectManager}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Site Manager</p>
                    <p className="mt-1 text-white">{project.siteManager || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gross Profit</p>
                    <p className="mt-1 text-green-400 font-semibold">{formatCurrency(project.grossProfit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Margin</p>
                    <p className="mt-1 text-white">{Math.round((project.grossProfit / project.contractValue) * 100)}%</p>
                  </div>
                </div>
              </div>

              {(project.orderNumber || project.contractFileName || project.invoiceAddress || project.paymentTerms || project.handoverNotes) && (
                <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-6">
                  <h2 className="mb-4 text-lg font-bold text-blue-300">Commercial Setup</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-gray-400">Order Number</p>
                      <p className="mt-1 text-white">{project.orderNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Contract File</p>
                      <p className="mt-1 text-white">{project.contractFileName || 'Not provided'}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-xs text-gray-400">Invoice Address</p>
                      <p className="mt-1 text-white whitespace-pre-line">{project.invoiceAddress || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Payment Terms</p>
                      <p className="mt-1 text-white">{project.paymentTerms || 'Not provided'}</p>
                    </div>
                  </div>
                  {project.handoverNotes && (
                    <div className="mt-4 rounded border border-blue-700/40 bg-blue-900/20 p-3 text-sm text-blue-200">
                      {project.handoverNotes}
                    </div>
                  )}
                </div>
              )}

              {/* Health Issues */}
              {health.issues.length > 0 && (
                <div className="rounded-lg border border-red-700/50 bg-red-900/10 p-6">
                  <h2 className="mb-4 text-lg font-bold text-red-400">Issues Requiring Attention</h2>
                  <ul className="space-y-2">
                    {health.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5"></span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                <h3 className="mb-4 text-sm font-bold uppercase text-gray-400">Quick Stats</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Documents</p>
                    <p className="text-2xl font-bold text-white">{project.documentCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Photos</p>
                    <p className="text-2xl font-bold text-white">{project.photoCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Site Diary Entries</p>
                    <p className="text-2xl font-bold text-white">{project.siteDiaryCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Variations</p>
                    <p className="text-2xl font-bold" style={{ color: project.hasVariations ? '#fb923c' : '#9ca3af' }}>
                      {project.hasVariations ? '2' : '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/30 p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <span className="text-2xl">📁</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Upload Documents</h3>
                <p className="mb-4 text-sm text-gray-400">Drag and drop files or click to browse</p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="rounded bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
                >
                  Select Files to Upload
                </button>
              </div>
            </div>

            {/* Documents by Category */}
            {Object.keys(documentsByCategory).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(documentsByCategory).map(([category, docs]) => (
                  <div key={category} className="rounded-lg border border-gray-700/50 bg-gray-800/50 overflow-hidden">
                    <div className={`px-6 py-3 font-semibold border-b border-gray-700/50 ${getCategoryColor(category as DocumentCategory).split(' ').slice(0, 2).join(' ')}`}>
                      {category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ({docs.length})
                    </div>
                    <div className="divide-y divide-gray-700/50">
                      {docs.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between px-6 py-3 hover:bg-gray-800/80 transition">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl flex-shrink-0 pt-1">{getStatusIcon(doc.status)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium text-white truncate">{doc.title}</p>
                                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getCategoryColor(doc.category)}`}>
                                    {doc.category}
                                  </span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                                    doc.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                                    doc.status === 'issued' ? 'bg-blue-900/30 text-blue-400' :
                                    doc.status === 'draft' ? 'bg-yellow-900/30 text-yellow-400' :
                                    doc.status === 'superseded' ? 'bg-red-900/30 text-red-400' :
                                    'bg-gray-900/30 text-gray-400'
                                  }`}>
                                    {doc.status}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{doc.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                  <span>📦 {formatFileSize(doc.fileSize)}</span>
                                  <span>👤 {doc.uploadedBy}</span>
                                  <span>📅 {new Date(doc.uploadedDate).toLocaleDateString('en-GB')}</span>
                                  {doc.currentRevision && <span>📌 Rev {doc.currentRevision}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <button className="rounded border border-gray-600 bg-gray-700/50 hover:bg-gray-600 px-3 py-1 text-xs font-medium text-gray-200 transition">
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No documents uploaded yet</p>
                <p className="text-xs text-gray-600 mt-2">Upload documents to organize project files</p>
              </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md rounded-lg bg-gray-900 border border-gray-700 p-6">
                  <h2 className="mb-4 text-lg font-bold text-white">Upload Document</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Document Category</label>
                      <select className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm">
                        <option value="contract">Contracts</option>
                        <option value="design">Design & Drawings</option>
                        <option value="method-statement">Method Statements</option>
                        <option value="inspection">Inspection & Testing</option>
                        <option value="site-diary">Site Diary</option>
                        <option value="correspondence">Correspondence</option>
                        <option value="variation">Variations</option>
                        <option value="photo">Photos</option>
                        <option value="health-safety">Health & Safety</option>
                        <option value="quality">Quality Records</option>
                        <option value="delivery">Delivery Notes</option>
                        <option value="invoice">Invoices</option>
                        <option value="closeout">Closeout Docs</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Document Title</label>
                      <input
                        type="text"
                        placeholder="Enter document title"
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Select File</label>
                      <input
                        type="file"
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-300 text-sm file:mr-2 file:rounded file:border-0 file:bg-orange-500 file:px-2 file:py-1 file:text-white file:text-xs file:font-medium file:cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowUploadModal(false)}
                        className="flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowUploadModal(false)}
                        className="flex-1 rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/30 p-8">
              <div className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">Upload Site Photos</h3>
                <p className="mb-4 text-sm text-gray-400">Add photos with automatic geolocation tagging</p>
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="rounded bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
                >
                  Upload Photos
                </button>
              </div>
            </div>

            {/* Photos Grid */}
            {projectPhotos.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">{projectPhotos.length} photos</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projectPhotos.map((photo) => (
                    <div key={photo.id} className="rounded-lg border border-gray-700/50 bg-gray-800/50 overflow-hidden hover:border-gray-600 transition group cursor-pointer">
                      {/* Photo Placeholder */}
                      <div className="relative bg-gradient-to-br from-gray-700 to-gray-800 h-48 flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-30 group-hover:opacity-40 transition">
                          <svg className="w-full h-full" viewBox="0 0 100 100">
                            <rect width="100" height="100" fill="none" stroke="currentColor" opacity="0.1" />
                          </svg>
                        </div>
                        <span className="text-4xl z-10">📷</span>
                      </div>
                      
                      {/* Photo Info */}
                      <div className="p-4">
                        <p className="font-medium text-white text-sm truncate">{photo.title}</p>
                        {photo.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{photo.description}</p>}
                        
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>📅 {new Date(photo.takenDate).toLocaleDateString('en-GB')}</span>
                            <span>📦 {formatFileSize(photo.fileSize)}</span>
                          </div>
                          
                          {photo.location && (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <span>📍</span>
                              <span>{photo.location.area || `${photo.location.lat.toFixed(4)}, ${photo.location.lng.toFixed(4)}`}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>👤 {photo.takenBy}</span>
                          </div>
                          
                          {photo.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {photo.tags.map((tag) => (
                                <span key={tag} className="px-2 py-1 rounded bg-gray-700/50 text-gray-300 text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 flex gap-2">
                          <button className="flex-1 rounded border border-gray-600 bg-gray-700/50 hover:bg-gray-600 px-2 py-1 text-xs font-medium text-gray-200 transition">
                            View
                          </button>
                          <button className="flex-1 rounded border border-gray-600 bg-gray-700/50 hover:bg-gray-600 px-2 py-1 text-xs font-medium text-gray-200 transition">
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No photos uploaded yet</p>
                <p className="text-xs text-gray-600 mt-2">Upload site photos to document project progress</p>
              </div>
            )}

            {/* Photo Upload Modal */}
            {showPhotoModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-md rounded-lg bg-gray-900 border border-gray-700 p-6">
                  <h2 className="mb-4 text-lg font-bold text-white">Upload Site Photo</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Photo Title</label>
                      <input
                        type="text"
                        placeholder="e.g., Site overview - Week 5"
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        placeholder="Optional description of the photo"
                        rows={3}
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <input type="checkbox" className="mr-2" />
                        Include GPS Location
                      </label>
                      <p className="text-xs text-gray-500 ml-6">Uses device location if available</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Select Photos</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-300 text-sm file:mr-2 file:rounded file:border-0 file:bg-orange-500 file:px-2 file:py-1 file:text-white file:text-xs file:font-medium file:cursor-pointer"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowPhotoModal(false)}
                        className="flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowPhotoModal(false)}
                        className="flex-1 rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="space-y-6">
            {/* Add Entry Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowDiaryModal(true)}
                className="rounded bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
              >
                + Add Diary Entry
              </button>
            </div>

            {/* Diary Entries Timeline */}
            {projectDiary.length > 0 ? (
              <div className="space-y-4">
                {projectDiary
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry, index) => (
                    <div key={entry.id} className="relative">
                      {/* Timeline connector */}
                      {index < projectDiary.length - 1 && (
                        <div className="absolute left-6 top-16 h-8 w-0.5 bg-gradient-to-b from-orange-500 to-gray-700"/>
                      )}
                      
                      {/* Entry */}
                      <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 hover:border-gray-600 transition">
                        <div className="flex items-start gap-4">
                          {/* Timeline dot */}
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-4 w-4 rounded-full bg-orange-500 ring-4 ring-gray-900" />
                          </div>
                          
                          {/* Entry content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white text-lg">{entry.workCarriedOut.split('\n')[0]}</h3>
                                <p className="text-sm text-gray-400 mt-1">
                                  📅 {new Date(entry.date).toLocaleDateString('en-GB')} at {new Date(entry.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                                entry.weather.condition === 'dry' ? 'bg-yellow-900/30 text-yellow-400' :
                                entry.weather.condition === 'rain' ? 'bg-blue-900/30 text-blue-400' :
                                entry.weather.condition === 'snow' ? 'bg-blue-200/20 text-blue-300' :
                                entry.weather.condition === 'wind' ? 'bg-purple-900/30 text-purple-400' :
                                'bg-gray-700/50 text-gray-300'
                              }`}>
                                {entry.weather.condition === 'dry' ? '☀️ Dry' :
                                 entry.weather.condition === 'rain' ? '🌧️ Rain' :
                                 entry.weather.condition === 'snow' ? '❄️ Snow' :
                                 entry.weather.condition === 'wind' ? '💨 Wind' :
                                 '⛱️ Frost'}
                              </span>
                            </div>
                            
                            {/* Entry text */}
                            <p className="mt-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{entry.workCarriedOut}</p>
                            
                            {/* Labour metrics */}
                            {(entry.labour.ownStaff > 0 || entry.labour.subcontractors > 0 || entry.labour.visitors > 0) && (
                              <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-gray-700/30">
                                {entry.labour.ownStaff > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500">Own Staff</p>
                                    <p className="text-sm font-medium text-white">{entry.labour.ownStaff}</p>
                                  </div>
                                )}
                                {entry.labour.subcontractors > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500">Subcontractors</p>
                                    <p className="text-sm font-medium text-white">{entry.labour.subcontractors}</p>
                                  </div>
                                )}
                                {entry.labour.visitors > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500">Visitors</p>
                                    <p className="text-sm font-medium text-white">{entry.labour.visitors}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Weather and Optional Info Row */}
                            {(entry.weather.temperature !== undefined || entry.tomorrowsWork) && (
                              <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-700/30">
                                {entry.weather.temperature !== undefined && (
                                  <div>
                                    <p className="text-xs text-gray-500">Temperature</p>
                                    <p className="text-sm font-medium text-white">{entry.weather.temperature}°C</p>
                                  </div>
                                )}
                                {entry.tomorrowsWork && (
                                  <div>
                                    <p className="text-xs text-gray-500">Tomorrow's Work</p>
                                    <p className="text-sm font-medium text-white">{entry.tomorrowsWork}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Entry metadata */}
                            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-700/30">
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>👤 {entry.enteredBy}</span>
                                {entry.photosAttached && entry.photosAttached.length > 0 && (
                                  <span>📷 {entry.photosAttached.length} photos</span>
                                )}
                              </div>
                              <button className="rounded border border-gray-600 bg-gray-700/50 hover:bg-gray-600 px-3 py-1 text-xs font-medium text-gray-200 transition">
                                View Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No diary entries yet</p>
                <p className="text-xs text-gray-600 mt-2">Daily site diary entries will appear here</p>
              </div>
            )}

            {/* Diary Entry Modal */}
            {showDiaryModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="w-full max-w-2xl rounded-lg bg-gray-900 border border-gray-700 p-6 max-h-[90vh] overflow-y-auto">
                  <h2 className="mb-4 text-lg font-bold text-white">Add Site Diary Entry</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Date & Time</label>
                        <input
                          type="datetime-local"
                          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Weather</label>
                        <select className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm">
                          <option value="dry">Dry</option>
                          <option value="rain">Rain</option>
                          <option value="snow">Snow</option>
                          <option value="wind">Wind</option>
                          <option value="frost">Frost</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Temperature (°C) - Optional</label>
                      <input
                        type="number"
                        placeholder="e.g., 12"
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Work Carried Out</label>
                      <textarea
                        placeholder="Describe the work carried out on site today..."
                        rows={6}
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Own Staff</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Subcontractors</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Visitors</label>
                        <input
                          type="number"
                          placeholder="0"
                          className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Tomorrow's Work - Optional</label>
                      <textarea
                        placeholder="Brief description of planned work for the next day..."
                        rows={3}
                        className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-white text-sm placeholder-gray-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Attach Photos</label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="w-full text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowDiaryModal(false)}
                        className="flex-1 rounded border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowDiaryModal(false)}
                        className="flex-1 rounded bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition"
                      >
                        Save Entry
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Financial Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contract Value</p>
                <p className="text-2xl font-bold text-white mt-2">{formatCurrency(project.contractValue)}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Invoiced</p>
                <p className="text-2xl font-bold text-orange-400 mt-2">{formatCurrency(projectInvoices.reduce((sum, inv) => sum + inv.grossValuation, 0))}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Paid</p>
                <p className="text-2xl font-bold text-green-400 mt-2">{formatCurrency(projectInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0))}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Variations</p>
                <p className="text-2xl font-bold text-purple-400 mt-2">{formatCurrency(projectVariations.reduce((sum, vo) => sum + (vo.approvedValue || 0), 0))}</p>
              </div>
            </div>

            {/* Invoice Applications Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Invoice Applications</h3>
                <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300">{projectInvoices.length}</span>
              </div>

              {projectInvoices.length > 0 ? (
                <div className="space-y-3">
                  {projectInvoices.map((invoice) => (
                    <div key={invoice.id} className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 hover:border-gray-600 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-white">Application {invoice.applicationNumber}</p>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              invoice.status === 'paid' ? 'bg-green-900/30 text-green-400' :
                              invoice.status === 'certified' ? 'bg-blue-900/30 text-blue-400' :
                              invoice.status === 'submitted' ? 'bg-purple-900/30 text-purple-400' :
                              invoice.status === 'disputed' ? 'bg-red-900/30 text-red-400' :
                              'bg-gray-700/50 text-gray-300'
                            }`}>
                              {invoice.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">Period: {new Date(invoice.period.from).toLocaleDateString('en-GB')} to {new Date(invoice.period.to).toLocaleDateString('en-GB')}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-orange-400">{formatCurrency(invoice.thisPayment)}</p>
                          <p className="text-xs text-gray-500 mt-1">This Payment</p>
                        </div>
                      </div>

                      {/* Invoice Details Grid */}
                      <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-700/30">
                        <div>
                          <p className="text-xs text-gray-500">Gross Valuation</p>
                          <p className="text-sm font-medium text-white mt-1">{formatCurrency(invoice.grossValuation)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Retention (5%)</p>
                          <p className="text-sm font-medium text-white mt-1">{formatCurrency(invoice.retentionDeducted)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Previous Payments</p>
                          <p className="text-sm font-medium text-white mt-1">{formatCurrency(invoice.previousPayments)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Cumulative</p>
                          <p className="text-sm font-medium text-green-400 mt-1">{formatCurrency(invoice.cumulativePaid)}</p>
                        </div>
                      </div>

                      {/* Invoice Footer */}
                      <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-700/30">
                        <div className="flex items-center gap-6 text-xs text-gray-500">
                          {invoice.certifiedBy && <span>✓ Certified by {invoice.certifiedBy}</span>}
                          {invoice.paymentDueDate && <span>Due: {new Date(invoice.paymentDueDate).toLocaleDateString('en-GB')}</span>}
                        </div>
                        <button 
                          onClick={() => openInvoiceEditModal(invoice)}
                          className="rounded border border-orange-600 bg-orange-900/30 hover:bg-orange-900/50 px-3 py-1 text-xs font-medium text-orange-400 transition"
                        >
                          Edit Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 text-center">
                  <p className="text-gray-400 text-sm">No invoice applications yet</p>
                </div>
              )}
            </div>

            {/* Variation Orders Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Variation Orders</h3>
                <span className="rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300">{projectVariations.length}</span>
              </div>

              {projectVariations.length > 0 ? (
                <div className="space-y-3">
                  {projectVariations.map((vo) => (
                    <div key={vo.id} className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 hover:border-gray-600 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-white">{vo.voNumber} - {vo.title}</p>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              vo.status === 'approved' ? 'bg-green-900/30 text-green-400' :
                              vo.status === 'completed' ? 'bg-blue-900/30 text-blue-400' :
                              vo.status === 'priced' ? 'bg-purple-900/30 text-purple-400' :
                              vo.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                              'bg-gray-700/50 text-gray-300'
                            }`}>
                              {vo.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{vo.reason.replace('-', ' ').toUpperCase()}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-2xl font-bold text-purple-400">{formatCurrency(vo.approvedValue || vo.quotedValue || vo.estimatedValue)}</p>
                          <p className="text-xs text-gray-500 mt-1">Approved Value</p>
                        </div>
                      </div>

                      {/* VO Description */}
                      <p className="text-sm text-gray-300 mt-3">{vo.description}</p>

                      {/* VO Details Grid */}
                      <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-700/30">
                        <div>
                          <p className="text-xs text-gray-500">Estimated</p>
                          <p className="text-sm font-medium text-white mt-1">{formatCurrency(vo.estimatedValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Quoted</p>
                          <p className="text-sm font-medium text-white mt-1">{vo.quotedValue ? formatCurrency(vo.quotedValue) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Actual Cost</p>
                          <p className="text-sm font-medium text-white mt-1">{vo.actualCost ? formatCurrency(vo.actualCost) : '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Programme Impact</p>
                          <p className="text-sm font-medium text-white mt-1">{vo.programmeImpact ? `${vo.programmeImpact} days` : 'None'}</p>
                        </div>
                      </div>

                      {/* VO Approvals */}
                      <div className="mt-4 flex items-center gap-6 pt-4 border-t border-gray-700/30">
                        <div className="flex items-center gap-4 text-xs">
                          <span className={`flex items-center gap-1 ${vo.clientApproved ? 'text-green-400' : 'text-gray-500'}`}>
                            {vo.clientApproved ? '✓' : '○'} Client
                          </span>
                          <span className={`flex items-center gap-1 ${vo.architectApproved ? 'text-green-400' : 'text-gray-500'}`}>
                            {vo.architectApproved ? '✓' : '○'} Architect
                          </span>
                          <span className={`flex items-center gap-1 ${vo.internalApproved ? 'text-green-400' : 'text-gray-500'}`}>
                            {vo.internalApproved ? '✓' : '○'} Internal
                          </span>
                        </div>
                        <div className="ml-auto">
                          <button 
                            onClick={() => openVariationEditModal(vo)}
                            className="rounded border border-purple-600 bg-purple-900/30 hover:bg-purple-900/50 px-3 py-1 text-xs font-medium text-purple-400 transition"
                          >
                            Edit Variation
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 text-center">
                  <p className="text-gray-400 text-sm">No variation orders yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'defects' && (
          <div className="space-y-6">
            {/* Defects Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Defects</p>
                <p className="text-2xl font-bold text-white mt-2">{projectDefects.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Open</p>
                <p className="text-2xl font-bold text-orange-400 mt-2">{projectDefects.filter(d => d.status === 'open').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">In Progress</p>
                <p className="text-2xl font-bold text-blue-400 mt-2">{projectDefects.filter(d => d.status === 'in-progress').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Closed</p>
                <p className="text-2xl font-bold text-green-400 mt-2">{projectDefects.filter(d => d.status === 'closed').length}</p>
              </div>
            </div>

            {/* Add Defect Button */}
            <div className="flex justify-end">
              <button className="rounded bg-orange-500 px-6 py-2 text-sm font-medium text-white hover:bg-orange-600 transition">
                + Add Defect
              </button>
            </div>

            {/* Defects List */}
            {projectDefects.length > 0 ? (
              <div className="space-y-3">
                {projectDefects.map((defect) => (
                  <div key={defect.id} className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4 hover:border-gray-600 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className={`text-xl ${
                            defect.severity === 'critical' ? '🔴' :
                            defect.severity === 'major' ? '🟠' :
                            defect.severity === 'minor' ? '🟡' :
                            '🟢'
                          }`} />
                          <div>
                            <p className="font-semibold text-white">{defect.defectNumber} - {defect.description}</p>
                            <p className="text-sm text-gray-400 mt-1">{defect.category.replace('-', ' ').toUpperCase()} · {defect.location}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          defect.status === 'open' ? 'bg-red-900/30 text-red-400' :
                          defect.status === 'in-progress' ? 'bg-blue-900/30 text-blue-400' :
                          'bg-green-900/30 text-green-400'
                        }`}>
                          {defect.status === 'open' ? 'OPEN' :
                           defect.status === 'in-progress' ? 'IN PROGRESS' :
                           'CLOSED'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          defect.severity === 'critical' ? 'bg-red-900/30 text-red-400' :
                          defect.severity === 'major' ? 'bg-orange-900/30 text-orange-400' :
                          defect.severity === 'minor' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-gray-700/50 text-gray-300'
                        }`}>
                          {defect.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Defect Details Grid */}
                    <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-700/30">
                      <div>
                        <p className="text-xs text-gray-500">Raised By</p>
                        <p className="text-sm font-medium text-white mt-1">{defect.raisedBy}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Raised Date</p>
                        <p className="text-sm font-medium text-white mt-1">{new Date(defect.raisedDate).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Assigned To</p>
                        <p className="text-sm font-medium text-white mt-1">{defect.assignedTo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Target Date</p>
                        <p className={`text-sm font-medium mt-1 ${
                          defect.targetDate && new Date(defect.targetDate) < new Date() && defect.status !== 'closed'
                            ? 'text-red-400'
                            : 'text-white'
                        }`}>
                          {defect.targetDate ? new Date(defect.targetDate).toLocaleDateString('en-GB') : 'Not set'}
                        </p>
                      </div>
                    </div>

                    {/* Defect Footer */}
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-700/30">
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {defect.photos && defect.photos.length > 0 && (
                          <span>📷 {defect.photos.length} photo{defect.photos.length !== 1 ? 's' : ''}</span>
                        )}
                        {defect.cost && (
                          <span>💷 {formatCurrency(defect.cost)}</span>
                        )}
                        {defect.notes && (
                          <span>📝 Has notes</span>
                        )}
                      </div>
                      <button 
                        onClick={() => openDefectEditModal(defect)}
                        className="rounded border border-red-600 bg-red-900/30 hover:bg-red-900/50 px-3 py-1 text-xs font-medium text-red-400 transition"
                      >
                        Edit Defect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No defects recorded</p>
                <p className="text-xs text-gray-600 mt-2">Defects and snagging items will appear here</p>
              </div>
            )}
          </div>
        )}

        {/* Commercial Tab */}
        {activeTab === 'commercial' && (
          <div className="space-y-6">
            <div className="bg-blue-900/20 border border-blue-700 p-4 rounded">
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">Linked Commercial Data:</span> This project has commercial valuations, variations, and contracts tracked in the Commercial module.
              </p>
            </div>

            {(() => {
              const linkedValuations = sampleValuations.filter(v => v.projectId === projectId);
              const linkedVariations = sampleCommercialVariations.filter(v => v.projectId === projectId);
              const linkedContracts = sampleContracts.filter(c => c.projectId === projectId);
              const linkedCosts = sampleCostReports.filter(cr => cr.projectId === projectId);

              return (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                      <p className="text-xs uppercase text-gray-500">Total Valuations</p>
                      <p className="text-2xl font-bold text-orange-500 mt-2">£{linkedValuations.reduce((sum, v) => sum + v.appliedValue, 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                      <p className="text-xs uppercase text-gray-500">Variations Quoted</p>
                      <p className="text-2xl font-bold text-purple-500 mt-2">£{linkedVariations.reduce((sum, v) => sum + (v.quotedValue || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                      <p className="text-xs uppercase text-gray-500">Active Contracts</p>
                      <p className="text-2xl font-bold text-green-500 mt-2">{linkedContracts.length}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                      <p className="text-xs uppercase text-gray-500">Cost Forecast</p>
                      <p className="text-2xl font-bold text-blue-500 mt-2">£{linkedCosts.reduce((sum, cr) => sum + cr.forecast, 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Recent Valuations */}
                  {linkedValuations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Recent Valuations</h3>
                      <div className="space-y-3">
                        {linkedValuations.slice(-3).map(val => (
                          <div key={val.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-200">{val.applicationRef}</h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                val.status === 'paid' ? 'bg-green-900 text-green-200' :
                                val.status === 'certified' ? 'bg-blue-900 text-blue-200' :
                                'bg-yellow-900 text-yellow-200'
                              }`}>
                                {val.status}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="text-gray-400">Applied</p>
                                <p className="font-bold text-orange-500">£{val.appliedValue.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Certified</p>
                                <p className="font-bold text-blue-500">£{val.certifiedValue.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Retention</p>
                                <p className="font-bold text-red-500">£{(val.retentionValue || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variations */}
                  {linkedVariations.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Commercial Variations</h3>
                      <div className="space-y-3">
                        {linkedVariations.map(var1 => (
                          <div key={var1.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-200">{var1.variationRef}</h4>
                                <p className="text-sm text-gray-400">{var1.description}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                var1.status === 'approved' ? 'bg-green-900 text-green-200' :
                                var1.status === 'completed' ? 'bg-blue-900 text-blue-200' :
                                'bg-yellow-900 text-yellow-200'
                              }`}>
                                {var1.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm space-y-1">
                                <p className="text-gray-400">Impact: <span className="text-gray-200 capitalize font-medium">{var1.impact}</span></p>
                                <p className="text-gray-400">Value: <span className="text-orange-500 font-bold">£{var1.quotedValue?.toLocaleString() || '0'}</span></p>
                              </div>
                              <button
                                onClick={() => router.push(`/commercial/${projectId}`)}
                                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                              >
                                View in Commercial →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                    <h3 className="text-lg font-semibold mb-2">Full Commercial Details</h3>
                    <p className="text-gray-400 text-sm mb-4">Switch to the Commercial module for complete valuations, contracts, procurement, and cost management</p>
                    <button
                      onClick={() => router.push(`/commercial/${projectId}`)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition"
                    >
                      Open Commercial Module →
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Team & Resources Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Team Members Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Team Members</h2>
                  <button 
                    onClick={() => setShowAssignOperativeModal(true)}
                    className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
                  >
                    + Assign Operative
                  </button>
                </div>

                <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                  <div className="space-y-3">
                    {/* Project Manager */}
                    <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase text-blue-400 font-semibold mb-1">Project Manager</p>
                          <p className="text-lg font-bold text-white">{project.projectManager}</p>
                        </div>
                        <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400">Lead</span>
                      </div>
                    </div>

                    {/* Site Manager */}
                    {project.siteManager && (
                      <div className="rounded-lg border border-green-700/30 bg-green-900/10 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs uppercase text-green-400 font-semibold mb-1">Site Manager</p>
                            <p className="text-lg font-bold text-white">{project.siteManager}</p>
                          </div>
                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">Site Lead</span>
                        </div>
                      </div>
                    )}

                    {/* Team Members */}
                    {project.team && project.team.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs uppercase text-gray-400 font-semibold mt-4 mb-2">Assigned Operatives ({project.team.length})</p>
                        {project.team.map((member) => (
                          <div key={member.userId} className="rounded border border-gray-700/50 bg-gray-800 p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-white font-bold">
                                {member.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{member.name}</p>
                                <p className="text-xs text-gray-400">{member.role}</p>
                              </div>
                            </div>
                            <button className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-lg border border-gray-700/50 bg-gray-800/30 p-6 text-center">
                        <p className="text-gray-400 text-sm">No operatives assigned yet</p>
                        <button className="mt-2 text-sm text-orange-400 hover:text-orange-300">
                          + Assign first operative
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resource Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                    <p className="text-xs uppercase text-gray-500">Team Size</p>
                    <p className="mt-2 text-2xl font-bold text-white">{project.team?.length || 0}</p>
                    <p className="mt-1 text-xs text-gray-400">Operatives</p>
                  </div>
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                    <p className="text-xs uppercase text-gray-500">Managers</p>
                    <p className="mt-2 text-2xl font-bold text-orange-400">{1 + (project.siteManager ? 1 : 0)}</p>
                    <p className="mt-1 text-xs text-gray-400">PM + Site</p>
                  </div>
                </div>
              </div>

              {/* Plant & Equipment Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Plant & Equipment</h2>
                  <button 
                    onClick={() => setShowAssignEquipmentModal(true)}
                    className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition"
                  >
                    + Assign Equipment
                  </button>
                </div>

                <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                  {plantAllocations && plantAllocations.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs uppercase text-gray-400 font-semibold mb-2">Allocated Equipment ({plantAllocations.length})</p>
                      {plantAllocations.map((pa) => (
                        <div key={pa.id} className="rounded border border-gray-700/50 bg-gray-800 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-bold text-white">{pa.equipmentType}</p>
                              <p className="text-xs text-gray-400 mt-1">ID: {pa.plantId}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              pa.status === 'on-site' ? 'bg-green-900/30 text-green-400' :
                              pa.status === 'allocated' ? 'bg-blue-900/30 text-blue-400' :
                              'bg-gray-700/50 text-gray-400'
                            }`}>
                              {pa.status.replace('-', ' ').toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm mt-3 pt-3 border-t border-gray-700/30">
                            <div>
                              <p className="text-gray-500">Daily Rate</p>
                              <p className="font-semibold text-white">£{(pa.hireRate || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Duration</p>
                              <p className="font-semibold text-white">{pa.totalDays || 0} days</p>
                            </div>
                          </div>
                          {pa.operatorRequired && (
                            <div className="mt-2 pt-2 border-t border-gray-700/30">
                              <p className="text-xs text-gray-400">
                                Operator: <span className="text-white font-semibold">{pa.operatorName || 'Required'}</span>
                              </p>
                            </div>
                          )}
                          <div className="mt-3 flex gap-2">
                            <button className="flex-1 rounded bg-gray-700 px-3 py-1 text-xs text-white hover:bg-gray-600 transition">
                              Edit
                            </button>
                            <button className="flex-1 rounded bg-red-900/30 px-3 py-1 text-xs text-red-400 hover:bg-red-900/50 transition">
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-6 text-center">
                      <p className="text-gray-400 text-sm">No equipment assigned yet</p>
                      <button className="mt-2 text-sm text-orange-400 hover:text-orange-300">
                        + Assign first equipment
                      </button>
                    </div>
                  )}
                </div>

                {/* Equipment Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                    <p className="text-xs uppercase text-gray-500">Equipment</p>
                    <p className="mt-2 text-2xl font-bold text-white">{plantAllocations?.length || 0}</p>
                    <p className="mt-1 text-xs text-gray-400">Items</p>
                  </div>
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                    <p className="text-xs uppercase text-gray-500">On-Site</p>
                    <p className="mt-2 text-2xl font-bold text-green-400">{plantAllocations?.filter(pa => pa.status === 'on-site').length || 0}</p>
                    <p className="mt-1 text-xs text-gray-400">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resource Allocation Chart */}
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Resource Overview</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Labour Allocation</p>
                    <p className="text-sm font-semibold text-white">{project.team?.length || 0} / 24</p>
                  </div>
                  <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((project.team?.length || 0) / 24) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Equipment Allocation</p>
                    <p className="text-sm font-semibold text-white">{plantAllocations?.length || 0} / 10</p>
                  </div>
                  <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((plantAllocations?.length || 0) / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700/30">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Total Cost/Day</p>
                      <p className="mt-1 text-lg font-bold text-orange-400">
                        £{plantAllocations?.reduce((sum, pa) => sum + (pa.hireRate || 0), 0).toLocaleString() || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Active Resources</p>
                      <p className="mt-1 text-lg font-bold text-green-400">
                        {(project.team?.length || 0) + (plantAllocations?.filter(pa => pa.status === 'on-site').length || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Utilization</p>
                      <p className="mt-1 text-lg font-bold text-blue-400">
                        {plantAllocations?.length > 0 
                          ? Math.round((plantAllocations.filter(pa => pa.status === 'on-site').length / plantAllocations.length) * 100)
                          : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BoQ & Claims Tab */}
        {activeTab === 'boq' && (
          <div className="space-y-6">
            {/* Sample BoQ Data for Demo */}
            <div className="grid gap-4 md:grid-cols-4">
              {(() => {
                const items = boqLineItems.length > 0 ? boqLineItems : defaultBoqItems;
                const totalBoQValue = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
                const totalClaimed = items.reduce((sum, item) => sum + item.claimed, 0);
                return (
                  <>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Total BoQ Value</p>
                      <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalBoQValue)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Line Items</p>
                      <p className="mt-2 text-2xl font-bold text-blue-400">{items.length}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Claimed to Date</p>
                      <p className="mt-2 text-2xl font-bold text-orange-400">{formatCurrency(totalClaimed)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Outstanding</p>
                      <p className="mt-2 text-2xl font-bold text-yellow-400">{formatCurrency(totalBoQValue - totalClaimed)}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* BoQ Line Items */}
            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Bill of Quantities Line Items</h2>
                <button 
                  onClick={() => {
                    // Open claim modal for first incomplete item
                    const itemsToRender = boqLineItems.length > 0 ? boqLineItems : defaultBoqItems;
                    const firstIncompleteItem = itemsToRender.find(item => item.complete < 100);
                    if (firstIncompleteItem) {
                      setSelectedBoQItem(firstIncompleteItem);
                      setClaimValue(firstIncompleteItem.complete);
                      setClaimType('percentage');
                      setShowClaimModal(true);
                    } else {
                      showToast('All items have been fully claimed', 'error');
                    }
                  }}
                  className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
                  + Add Claim
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Item No.</th>
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Description</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Unit</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Qty</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Rate</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Amount</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Claimed</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">% Complete</th>
                      <th className="py-3 px-4 text-center text-gray-400 font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(boqLineItems.length > 0 ? boqLineItems : defaultBoqItems).map((item, idx) => {
                      const amount = item.qty * item.rate;
                      return (
                        <tr key={idx} className="border-b border-gray-700/30 hover:bg-gray-800/50 transition">
                          <td className="py-3 px-4 text-gray-300 font-mono">{item.itemNo}</td>
                          <td className="py-3 px-4 text-gray-300">{item.desc}</td>
                          <td className="py-3 px-4 text-right text-gray-400">{item.unit}</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{item.qty.toLocaleString()}</td>
                          <td className="py-3 px-4 text-right text-white">£{item.rate.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">£{amount.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-orange-400 font-semibold">£{item.claimed.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 rounded-full bg-gray-700 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                                  style={{ width: `${item.complete}%` }}
                                />
                              </div>
                              <span className="text-white font-semibold w-10 text-right">{item.complete}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedBoQItem(item);
                                setClaimValue(item.complete);
                                setClaimType('percentage');
                                setShowClaimModal(true);
                              }}
                              className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700/30">
                <div className="grid grid-cols-4 gap-4">
                  {(() => {
                    const items = boqLineItems.length > 0 ? boqLineItems : defaultBoqItems;
                    const totalBoQValue = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
                    const totalClaimed = items.reduce((sum, item) => sum + item.claimed, 0);
                    const remaining = totalBoQValue - totalClaimed;
                    const avgComplete = items.length > 0 ? Math.round(items.reduce((sum, item) => sum + item.complete, 0) / items.length) : 0;
                    return (
                      <>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total BoQ Value</p>
                          <p className="text-2xl font-bold text-white">{formatCurrency(totalBoQValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Total Claimed</p>
                          <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalClaimed)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Remaining to Claim</p>
                          <p className="text-2xl font-bold text-yellow-400">{formatCurrency(remaining)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Average % Complete</p>
                          <p className="text-2xl font-bold text-blue-400">{avgComplete}%</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="rounded-lg border border-blue-700/30 bg-blue-900/10 p-6">
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">BoQ Items:</span> Track completion of each BoQ line item by quantity claimed or % complete. 
                This data flows through to payment applications to calculate interim valuations automatically.
              </p>
            </div>
          </div>
        )}

        {/* BoQ Claiming Modal */}
        {showClaimModal && selectedBoQItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Record BoQ Claim</h2>
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Item Details */}
              <div className="space-y-2 bg-gray-800/50 rounded p-3 border border-gray-700/50">
                <p className="text-xs text-gray-500">ITEM</p>
                <p className="font-semibold text-white">{selectedBoQItem.itemNo}: {selectedBoQItem.desc}</p>
                <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                  <div>
                    <span className="text-gray-500">Unit:</span>
                    <span className="ml-2 text-white">{selectedBoQItem.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Qty:</span>
                    <span className="ml-2 text-white">{selectedBoQItem.qty}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Rate:</span>
                    <span className="ml-2 text-white">£{selectedBoQItem.rate.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 text-white">£{(selectedBoQItem.qty * selectedBoQItem.rate).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Claim Method Selection */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-300">Claim Method</p>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="claimType"
                      value="percentage"
                      checked={claimType === 'percentage'}
                      onChange={() => setClaimType('percentage')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">By % Complete</span>
                  </label>
                  <label className="flex-1 flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="claimType"
                      value="quantity"
                      checked={claimType === 'quantity'}
                      onChange={() => setClaimType('quantity')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">By Quantity</span>
                  </label>
                </div>
              </div>

              {/* Claim Value Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">
                  {claimType === 'percentage' ? 'Percentage Complete (0-100)' : `Quantity Claimed (0-${selectedBoQItem.qty})`}
                </label>
                <input
                  type="number"
                  min="0"
                  max={claimType === 'percentage' ? 100 : selectedBoQItem.qty}
                  value={claimValue}
                  onChange={(e) => setClaimValue(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Calculated Amount */}
              <div className="bg-orange-900/20 border border-orange-700/50 rounded p-3 space-y-1">
                <p className="text-xs text-gray-400">Claimed Amount:</p>
                <p className="text-2xl font-bold text-orange-400">
                  {(
                    claimType === 'percentage'
                      ? Math.round((selectedBoQItem.qty * selectedBoQItem.rate * claimValue) / 100)
                      : Math.round(claimValue * selectedBoQItem.rate)
                  ).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' })}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowClaimModal(false)}
                  className="flex-1 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Update the item with the claim data
                    const itemsToRender = boqLineItems.length > 0 ? boqLineItems : [...defaultBoqItems];
                    const updatedItems = itemsToRender.map(item => {
                      if (item.itemNo === selectedBoQItem.itemNo) {
                        const newComplete = claimType === 'percentage' ? claimValue : Math.round((claimValue / selectedBoQItem.qty) * 100);
                        const newClaimed = claimType === 'percentage'
                          ? Math.round((selectedBoQItem.qty * selectedBoQItem.rate * claimValue) / 100)
                          : Math.round(claimValue * selectedBoQItem.rate);
                        return {
                          ...item,
                          complete: Math.min(newComplete, 100),
                          claimed: newClaimed,
                        };
                      }
                      return item;
                    });
                    // Update state and save to storage
                    setBoqLineItems(updatedItems);
                    saveProjectBoQLineItemsToStorage(denormalizeBoQItems(updatedItems));
                    setShowClaimModal(false);
                    showToast(`Claim recorded: ${claimType === 'percentage' ? claimValue + '%' : claimValue + ' ' + selectedBoQItem.unit}`);
                  }}
                  className="flex-1 px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition font-semibold"
                >
                  Save Claim
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Valuations Tab */}
        {activeTab === 'valuations' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Contract Value</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(project.contractValue)}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Claimed to Date</p>
                <p className="mt-2 text-2xl font-bold text-orange-400">
                  {formatCurrency(
                    (boqLineItems.length > 0 ? boqLineItems : defaultBoqItems).reduce((sum, item) => sum + item.claimed, 0)
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Outstanding</p>
                <p className="mt-2 text-2xl font-bold text-red-400">
                  {formatCurrency(
                    project.contractValue - (boqLineItems.length > 0 ? boqLineItems : defaultBoqItems).reduce((sum, item) => sum + item.claimed, 0)
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Claimed %</p>
                <p className="mt-2 text-2xl font-bold text-blue-400">
                  {Math.round(
                    ((boqLineItems.length > 0 ? boqLineItems : defaultBoqItems).reduce((sum, item) => sum + item.claimed, 0) / project.contractValue) * 100
                  )}%
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Valuation Summary by Line Item</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left text-gray-400 font-semibold">Item</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Description</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Contract</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Claimed</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Outstanding</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">% of Contract</th>
                      <th className="py-3 px-4 text-right text-gray-400 font-semibold">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(boqLineItems.length > 0 ? boqLineItems : defaultBoqItems).map((item, idx) => {
                      const amount = item.qty * item.rate;
                      const outstanding = amount - item.claimed;
                      const percentOfContract = (amount / project.contractValue) * 100;
                      return (
                        <tr key={idx} className="border-b border-gray-700/30 hover:bg-gray-800/50 transition">
                          <td className="py-3 px-4 text-gray-300 font-mono">{item.itemNo}</td>
                          <td className="py-3 px-4 text-gray-300">{item.desc}</td>
                          <td className="py-3 px-4 text-right text-white font-semibold">{formatCurrency(amount)}</td>
                          <td className="py-3 px-4 text-right text-orange-400 font-semibold">{formatCurrency(item.claimed)}</td>
                          <td className="py-3 px-4 text-right text-red-400 font-semibold">{formatCurrency(outstanding)}</td>
                          <td className="py-3 px-4 text-right text-blue-400 font-semibold">{percentOfContract.toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 rounded-full bg-gray-700 overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                                  style={{ width: `${item.complete}%` }}
                                />
                              </div>
                              <span className="text-white font-semibold w-10 text-right">{item.complete}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* WIP Report Tab */}
        {activeTab === 'wip' && (
          <div className="space-y-6">
            {(() => {
              const items = boqLineItems.length > 0 ? boqLineItems : defaultBoqItems;
              const contractValue = project.contractValue;
              const avgProgress = items.length > 0 ? Math.round(items.reduce((sum, item) => sum + item.complete, 0) / items.length) : 0;
              const completionValue = (avgProgress / 100) * contractValue;
              const invoicedValue = items.reduce((sum, item) => sum + item.claimed, 0);
              const wip = completionValue - invoicedValue;
              const wipPercentage = contractValue > 0 ? (wip / contractValue) * 100 : 0;
              
              return (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Avg Progress</p>
                      <p className="mt-2 text-2xl font-bold text-blue-400">{avgProgress}%</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Completion Value</p>
                      <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(completionValue)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Invoiced Value</p>
                      <p className="mt-2 text-2xl font-bold text-green-400">{formatCurrency(invoicedValue)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">WIP Amount</p>
                      <p className="mt-2 text-2xl font-bold" style={{ color: wip > 0 ? '#fbbf24' : '#9ca3af' }}>
                        {formatCurrency(Math.max(0, wip))}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">WIP Pipeline</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-400">Work Completed vs Contract Value</p>
                          <p className="text-sm font-semibold text-white">{formatCurrency(completionValue)} / {formatCurrency(contractValue)}</p>
                        </div>
                        <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                            style={{ width: `${Math.min(100, (completionValue / contractValue) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-400">Work Invoiced vs Completed</p>
                          <p className="text-sm font-semibold text-white">{formatCurrency(invoicedValue)} / {formatCurrency(completionValue)}</p>
                        </div>
                        <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                            style={{ width: `${completionValue > 0 ? Math.min(100, (invoicedValue / completionValue) * 100) : 0}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-400">WIP as % of Contract</p>
                          <p className="text-sm font-semibold text-white">{wipPercentage.toFixed(1)}%</p>
                        </div>
                        <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
                            style={{ width: `${Math.min(100, wipPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">WIP by Line Item</h3>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {items.map((item, idx) => {
                          const itemAmount = item.qty * item.rate;
                          const itemCompletionValue = (item.complete / 100) * itemAmount;
                          const itemWip = itemCompletionValue - item.claimed;
                          return (
                            <div key={idx} className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-white">{item.itemNo}: {item.desc}</p>
                                  <p className="text-xs text-gray-400 mt-1">{item.qty} × {item.unit}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  itemWip > 0 ? 'bg-amber-900/30 text-amber-400' : 'bg-green-900/30 text-green-400'
                                }`}>
                                  {formatCurrency(Math.max(0, itemWip))}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                                <div>Completion: {formatCurrency(itemCompletionValue)}</div>
                                <div>Invoiced: {formatCurrency(item.claimed)}</div>
                                <div>WIP: {Math.round((itemWip / itemAmount) * 100)}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Summary Statistics</h3>
                      <div className="space-y-4">
                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-400">Avg Item Progress</p>
                          <p className="text-2xl font-bold text-blue-400 mt-1">{avgProgress}%</p>
                        </div>
                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-400">Total WIP Value</p>
                          <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(Math.max(0, wip))}</p>
                        </div>
                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-400">WIP as % of Contract</p>
                          <p className="text-2xl font-bold text-white mt-1">{wipPercentage.toFixed(1)}%</p>
                        </div>
                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-400">Items with WIP</p>
                          <p className="text-2xl font-bold text-orange-400 mt-1">
                            {items.filter(item => {
                              const itemAmount = item.qty * item.rate;
                              const itemCompletionValue = (item.complete / 100) * itemAmount;
                              return (itemCompletionValue - item.claimed) > 0;
                            }).length} / {items.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Budget Tab */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            {(() => {
              const items = boqLineItems.length > 0 ? boqLineItems : defaultBoqItems;
              const contractValue = project.contractValue;
              const grossProfit = project.grossProfit;
              const costToDate = items.reduce((sum, item) => sum + (item.qty * item.rate * (item.complete / 100)), 0);
              const totalClaimed = items.reduce((sum, item) => sum + item.claimed, 0);
              const avgProgress = items.length > 0 ? Math.round(items.reduce((sum, item) => sum + item.complete, 0) / items.length) : 0;
              const forecastedFinalCost = avgProgress > 0 ? costToDate / (avgProgress / 100) : contractValue;
              const forecastedProfit = contractValue - forecastedFinalCost;
              const profitMargin = contractValue > 0 ? (forecastedProfit / contractValue) * 100 : 0;
              const costOverrun = forecastedFinalCost - contractValue;

              return (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Original Budget</p>
                      <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(contractValue)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Cost to Date</p>
                      <p className="mt-2 text-2xl font-bold text-orange-400">{formatCurrency(costToDate)}</p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Forecast at Completion</p>
                      <p className="mt-2 text-2xl font-bold" style={{ color: costOverrun > 0 ? '#f87171' : '#4ade80' }}>
                        {formatCurrency(forecastedFinalCost)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                      <p className="text-xs uppercase text-gray-500">Forecast Profit</p>
                      <p className="mt-2 text-2xl font-bold" style={{ color: forecastedProfit > 0 ? '#4ade80' : '#f87171' }}>
                        {formatCurrency(forecastedProfit)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Budget vs Actual Analysis</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-400">Cost Incurred vs Budget</p>
                            <p className="text-sm font-semibold text-white">{formatCurrency(costToDate)} / {formatCurrency(contractValue)}</p>
                          </div>
                          <div className="h-3 rounded-full bg-gray-700 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                              style={{ width: `${Math.min(100, (costToDate / contractValue) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{((costToDate / contractValue) * 100).toFixed(1)}% of budget spent</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-sm text-gray-400">Progress vs Cost Burn</p>
                            <p className="text-sm font-semibold text-white">{avgProgress}% complete</p>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Scheduled Progress:</span>
                              <span className="text-blue-400 font-semibold">{avgProgress}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-400">Budget Burn Rate:</span>
                              <span className="text-orange-400 font-semibold">{((costToDate / contractValue) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded bg-gray-900/50 border border-gray-700/30">
                              <span className="text-gray-400">Status:</span>
                              <span className={avgProgress >= ((costToDate / contractValue) * 100) ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                {avgProgress >= ((costToDate / contractValue) * 100) ? '✓ On Track' : '⚠ Behind Budget'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-sm text-gray-400 mb-2">Cost Overrun Status</p>
                          <p className="text-2xl font-bold" style={{ color: costOverrun > 0 ? '#f87171' : '#4ade80' }}>
                            {formatCurrency(Math.abs(costOverrun))} {costOverrun > 0 ? 'OVER' : 'UNDER'} budget
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{((costOverrun / contractValue) * 100).toFixed(2)}% variance</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Profitability Forecast</h3>
                      <div className="space-y-3">
                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-400">Original Margin</p>
                          <p className="text-2xl font-bold text-green-400 mt-1">
                            {formatCurrency(grossProfit)} ({Math.round((grossProfit / contractValue) * 100)}%)
                          </p>
                        </div>
                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-400">Forecast Final Profit</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: forecastedProfit > 0 ? '#4ade80' : '#f87171' }}>
                            {formatCurrency(forecastedProfit)} ({profitMargin.toFixed(1)}%)
                          </p>
                        </div>
                        <div className="rounded border border-gray-700/30 bg-gray-900/50 p-3">
                          <p className="text-xs text-gray-400">Variance from Original Margin</p>
                          <p className="text-2xl font-bold mt-1" style={{ color: (forecastedProfit - grossProfit) >= 0 ? '#4ade80' : '#f87171' }}>
                            {formatCurrency(forecastedProfit - grossProfit)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {((forecastedProfit - grossProfit) / grossProfit * 100).toFixed(1)}% change
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Payment Applications Tab */}
        {activeTab === 'payment-apps' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Total Applications</p>
                <p className="mt-2 text-2xl font-bold text-white">{paymentApps.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Total Value</p>
                <p className="mt-2 text-2xl font-bold text-orange-400">£{paymentApps.reduce((sum, app) => sum + (app.grossValue || 0), 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Submitted</p>
                <p className="mt-2 text-2xl font-bold text-blue-400">{paymentApps.filter(a => a.status === 'submitted' || a.status === 'certified' || a.status === 'paid').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Paid</p>
                <p className="mt-2 text-2xl font-bold text-green-400">£{paymentApps.filter(a => a.status === 'paid').reduce((sum, app) => sum + (app.paidValue || 0), 0).toLocaleString()}</p>
              </div>
            </div>

            {paymentApps.length > 0 ? (
              <div className="space-y-3">
                {paymentApps.map(app => (
                  <div key={app.id} className="rounded-lg border border-gray-700/50 bg-gray-800 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">Application {app.applicationNumber}</h3>
                        <p className="text-sm text-gray-400 mt-1">{app.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === 'paid' ? 'bg-green-900/30 text-green-400' :
                        app.status === 'certified' ? 'bg-blue-900/30 text-blue-400' :
                        app.status === 'submitted' ? 'bg-purple-900/30 text-purple-400' :
                        'bg-yellow-900/30 text-yellow-400'
                      }`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Gross Value</p>
                        <p className="font-semibold text-white">£{(app.grossValue || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Retention</p>
                        <p className="font-semibold text-red-400">£{(app.retentionValue || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payable</p>
                        <p className="font-semibold text-orange-400">£{((app.grossValue || 0) - (app.retentionValue || 0)).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Date</p>
                        <p className="font-semibold text-white">{app.paymentDate ? new Date(app.paymentDate).toLocaleDateString('en-GB') : '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No payment applications yet</p>
              </div>
            )}
          </div>
        )}

        {/* Plant Allocation Tab */}
        {activeTab === 'plant' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Total Equipment</p>
                <p className="mt-2 text-2xl font-bold text-white">{plantAllocations.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">On-Site</p>
                <p className="mt-2 text-2xl font-bold text-green-400">{plantAllocations.filter(pa => pa.status === 'on-site').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Total Hire Cost</p>
                <p className="mt-2 text-2xl font-bold text-orange-400">£{plantAllocations.reduce((sum, pa) => sum + (pa.hireCost || 0), 0).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Operators</p>
                <p className="mt-2 text-2xl font-bold text-blue-400">{plantAllocations.filter(pa => pa.operatorRequired).length}</p>
              </div>
            </div>

            {plantAllocations.length > 0 ? (
              <div className="space-y-3">
                {plantAllocations.map(pa => (
                  <div key={pa.id} className="rounded-lg border border-gray-700/50 bg-gray-800 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{pa.equipmentType}</h3>
                        <p className="text-sm text-gray-400 mt-1">ID: {pa.plantId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        pa.status === 'on-site' ? 'bg-green-900/30 text-green-400' :
                        pa.status === 'allocated' ? 'bg-blue-900/30 text-blue-400' :
                        pa.status === 'off-hired' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-gray-700/50 text-gray-400'
                      }`}>
                        {pa.status.replace('-', ' ').charAt(0).toUpperCase() + pa.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Hire Rate (daily)</p>
                        <p className="font-semibold text-white">£{(pa.hireRate || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Days</p>
                        <p className="font-semibold text-white">{pa.totalDays || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Cost</p>
                        <p className="font-semibold text-orange-400">£{(pa.hireCost || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Operator</p>
                        <p className="font-semibold text-white">{pa.operatorRequired ? (pa.operatorName || 'Required') : 'None'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No plant allocations yet</p>
              </div>
            )}
          </div>
        )}

        {/* Materials Management Tab */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Deliveries</p>
                <p className="mt-2 text-2xl font-bold text-white">{materialDeliveries.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Good Condition</p>
                <p className="mt-2 text-2xl font-bold text-green-400">{materialDeliveries.filter(md => md.condition === 'good').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Damaged</p>
                <p className="mt-2 text-2xl font-bold text-red-400">{materialDeliveries.filter(md => md.condition === 'damaged').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Stockpiles</p>
                <p className="mt-2 text-2xl font-bold text-blue-400">{materialStockpiles.length}</p>
              </div>
            </div>

            {(materialDeliveries.length > 0 || materialStockpiles.length > 0) ? (
              <div className="space-y-6">
                {materialDeliveries.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Material Deliveries</h3>
                    <div className="space-y-3">
                      {materialDeliveries.map(md => (
                        <div key={md.id} className="rounded-lg border border-gray-700/50 bg-gray-800 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-white">{md.materialType}</h4>
                              <p className="text-sm text-gray-400">from {md.supplier}</p>
                            </div>
                            <span className={`px-3 py-1 rounded text-xs font-semibold ${
                              md.condition === 'good' ? 'bg-green-900/30 text-green-400' :
                              md.condition === 'damaged' ? 'bg-red-900/30 text-red-400' :
                              'bg-yellow-900/30 text-yellow-400'
                            }`}>
                              {md.condition.charAt(0).toUpperCase() + md.condition.slice(1)}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Quantity</p>
                              <p className="font-semibold text-white">{md.quantity} {md.unit || 'units'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Delivered</p>
                              <p className="font-semibold text-white">{new Date(md.deliveryDate).toLocaleDateString('en-GB')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Cost</p>
                              <p className="font-semibold text-orange-400">£{(md.cost || 0).toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Delivery Note</p>
                              <p className="font-mono text-white text-xs">{md.deliveryNoteNumber || '—'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {materialStockpiles.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Stockpiles</h3>
                    <div className="space-y-3">
                      {materialStockpiles.map(ms => (
                        <div key={ms.id} className="rounded-lg border border-gray-700/50 bg-gray-800 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-white">{ms.materialType}</h4>
                              <p className="text-sm text-gray-400">{ms.location}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Current Stock</p>
                              <p className="font-semibold text-white">{ms.currentStock} {ms.unit || 'units'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Last Updated</p>
                              <p className="font-semibold text-white">{new Date(ms.lastUpdated).toLocaleDateString('en-GB')}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Status</p>
                              <p className="font-semibold text-white">{ms.currentStock > 0 ? '✓ In Stock' : '⚠ Empty'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No material data yet</p>
              </div>
            )}
          </div>
        )}

        {/* Quality Testing Tab */}
        {activeTab === 'quality' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Total Tests</p>
                <p className="mt-2 text-2xl font-bold text-white">{qualityTests.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Passed</p>
                <p className="mt-2 text-2xl font-bold text-green-400">{qualityTests.filter(qt => qt.status === 'pass').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Failed</p>
                <p className="mt-2 text-2xl font-bold text-red-400">{qualityTests.filter(qt => qt.status === 'fail').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Pending</p>
                <p className="mt-2 text-2xl font-bold text-yellow-400">{qualityTests.filter(qt => qt.status === 'pending').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Pass Rate</p>
                <p className="mt-2 text-2xl font-bold text-purple-400">{qualityTests.length > 0 ? Math.round((qualityTests.filter(qt => qt.status === 'pass').length / qualityTests.length) * 100) : 0}%</p>
              </div>
            </div>

            {qualityTests.length > 0 ? (
              <div className="space-y-3">
                {qualityTests.map(qt => (
                  <div key={qt.id} className={`rounded-lg border p-4 ${
                    qt.status === 'fail' ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700/50 bg-gray-800'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{qt.testType.replace('-', ' ').toUpperCase()}</h3>
                        <p className="text-sm text-gray-400 mt-1">{qt.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Location: {qt.location}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        qt.status === 'pass' ? 'bg-green-900/30 text-green-400' :
                        qt.status === 'fail' ? 'bg-red-900/30 text-red-400' :
                        qt.status === 'pending' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-orange-900/30 text-orange-400'
                      }`}>
                        {qt.status.charAt(0).toUpperCase() + qt.status.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Specification</p>
                        <p className="font-semibold text-white">{qt.specification}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Result</p>
                        <p className="font-semibold text-white">{qt.result || '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Test Date</p>
                        <p className="font-semibold text-white">{new Date(qt.testDate).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Tested By</p>
                        <p className="font-semibold text-white">{qt.testedBy}</p>
                      </div>
                    </div>
                    {qt.status === 'fail' && qt.remedialAction && (
                      <div className="mt-3 rounded border border-red-700/40 bg-red-900/20 p-2 text-xs text-red-300">
                        <span className="font-semibold">⚠ Remedial Action:</span> {qt.remedialAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No quality tests yet</p>
              </div>
            )}
          </div>
        )}

        {/* Survey Records Tab */}
        {activeTab === 'surveys' && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Total Surveys</p>
                <p className="mt-2 text-2xl font-bold text-white">{surveyRecords.length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Setting Out</p>
                <p className="mt-2 text-2xl font-bold text-green-400">{surveyRecords.filter(sr => sr.surveyType === 'setting-out').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">As-Built</p>
                <p className="mt-2 text-2xl font-bold text-blue-400">{surveyRecords.filter(sr => sr.surveyType === 'as-built').length}</p>
              </div>
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                <p className="text-xs uppercase text-gray-500">Accuracy</p>
                <p className="mt-2 text-2xl font-bold text-purple-400">±{surveyRecords.length > 0 ? surveyRecords[0].accuracy : 0}mm</p>
              </div>
            </div>

            {surveyRecords.length > 0 ? (
              <div className="space-y-3">
                {surveyRecords.map(sr => (
                  <div key={sr.id} className="rounded-lg border border-gray-700/50 bg-gray-800 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">{sr.description}</h3>
                        <p className="text-sm text-gray-400 mt-1">{sr.location}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        sr.surveyType === 'setting-out' ? 'bg-green-900/30 text-green-400' :
                        sr.surveyType === 'as-built' ? 'bg-blue-900/30 text-blue-400' :
                        sr.surveyType === 'level-check' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-purple-900/30 text-purple-400'
                      }`}>
                        {sr.surveyType.replace('-', ' ').charAt(0).toUpperCase() + sr.surveyType.slice(1)}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Survey Date</p>
                        <p className="font-semibold text-white">{new Date(sr.surveyDate).toLocaleDateString('en-GB')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Coordinates</p>
                        <p className="font-semibold text-white">{sr.coordinates.length} points</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Benchmark</p>
                        <p className="font-mono text-white text-xs">{sr.benchmarkUsed}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Surveyed By</p>
                        <p className="font-semibold text-white">{sr.surveyedBy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-6 text-center">
                <p className="text-gray-400">No survey records yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && editData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="relative w-full max-w-2xl rounded-lg bg-gray-800 shadow-xl">
            {/* Modal Header */}
            <div className="border-b border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editType === 'invoice' && `Edit Invoice ${editData.id}`}
                  {editType === 'variation' && `Edit Variation Order ${editData.voNumber}`}
                  {editType === 'defect' && `Edit Defect ${editData.defectNumber}`}
                </h2>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-300 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4 space-y-4">
              {editType === 'invoice' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                    <select
                      value={editData.status}
                      onChange={(e) => {
                        setEditData({ ...editData, status: e.target.value });
                        setValidationErrors({ ...validationErrors, status: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.status
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-orange-500'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="certified">Certified</option>
                      <option value="paid">Paid</option>
                      <option value="disputed">Disputed</option>
                    </select>
                    {validationErrors.status && <p className="text-xs text-red-400 mt-1">{validationErrors.status}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Certified By</label>
                      <input
                        type="text"
                        value={editData.certifiedBy || ''}
                        onChange={(e) => setEditData({ ...editData, certifiedBy: e.target.value })}
                        className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        placeholder="Name or role"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Application Number</label>
                      <input
                        type="number"
                        value={editData.applicationNumber || ''}
                        onChange={(e) => {
                          setEditData({ ...editData, applicationNumber: parseInt(e.target.value) });
                          setValidationErrors({ ...validationErrors, applicationNumber: '' });
                        }}
                        className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                          validationErrors.applicationNumber
                            ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                            : 'border-gray-600 bg-gray-700 focus:border-orange-500'
                        }`}
                      />
                      {validationErrors.applicationNumber && <p className="text-xs text-red-400 mt-1">{validationErrors.applicationNumber}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Paid Amount</label>
                    <input
                      type="number"
                      value={editData.paidAmount || 0}
                      onChange={(e) => {
                        setEditData({ ...editData, paidAmount: parseFloat(e.target.value) });
                        setValidationErrors({ ...validationErrors, paidAmount: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.paidAmount
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-orange-500'
                      }`}
                    />
                    {validationErrors.paidAmount && <p className="text-xs text-red-400 mt-1">{validationErrors.paidAmount}</p>}
                  </div>

                  <div className="rounded bg-blue-900/20 p-3 border border-blue-600/30">
                    <p className="text-xs text-blue-300">💡 Tip: Change the status above to move this invoice through the workflow (draft → submitted → certified → paid).</p>
                  </div>
                </>
              )}

              {editType === 'variation' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                    <select
                      value={editData.status}
                      onChange={(e) => {
                        setEditData({ ...editData, status: e.target.value });
                        setValidationErrors({ ...validationErrors, status: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.status
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-purple-500'
                      }`}
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="priced">Priced</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="completed">Completed</option>
                    </select>
                    {validationErrors.status && <p className="text-xs text-red-400 mt-1">{validationErrors.status}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Quoted Value</label>
                      <input
                        type="number"
                        value={editData.quotedValue || 0}
                        onChange={(e) => {
                          setEditData({ ...editData, quotedValue: parseFloat(e.target.value) });
                          setValidationErrors({ ...validationErrors, quotedValue: '' });
                        }}
                        className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                          validationErrors.quotedValue
                            ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                            : 'border-gray-600 bg-gray-700 focus:border-purple-500'
                        }`}
                      />
                      {validationErrors.quotedValue && <p className="text-xs text-red-400 mt-1">{validationErrors.quotedValue}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Approved Value</label>
                      <input
                        type="number"
                        value={editData.approvedValue || 0}
                        onChange={(e) => {
                          setEditData({ ...editData, approvedValue: parseFloat(e.target.value) });
                          setValidationErrors({ ...validationErrors, approvedValue: '' });
                        }}
                        className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                          validationErrors.approvedValue
                            ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                            : 'border-gray-600 bg-gray-700 focus:border-purple-500'
                        }`}
                      />
                      {validationErrors.approvedValue && <p className="text-xs text-red-400 mt-1">{validationErrors.approvedValue}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Programme Impact (days)</label>
                    <input
                      type="number"
                      value={editData.programmeImpact || 0}
                      onChange={(e) => {
                        setEditData({ ...editData, programmeImpact: parseInt(e.target.value) });
                        setValidationErrors({ ...validationErrors, programmeImpact: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.programmeImpact
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-purple-500'
                      }`}
                    />
                    {validationErrors.programmeImpact && <p className="text-xs text-red-400 mt-1">{validationErrors.programmeImpact}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Approvals</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editData.clientApproved || false}
                          onChange={(e) => setEditData({ ...editData, clientApproved: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700"
                        />
                        <span className="text-sm text-gray-300">Client Approved</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editData.architectApproved || false}
                          onChange={(e) => setEditData({ ...editData, architectApproved: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700"
                        />
                        <span className="text-sm text-gray-300">Architect Approved</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editData.internalApproved || false}
                          onChange={(e) => setEditData({ ...editData, internalApproved: e.target.checked })}
                          className="rounded border-gray-600 bg-gray-700"
                        />
                        <span className="text-sm text-gray-300">Internal Approved</span>
                      </label>
                    </div>
                  </div>

                  <div className="rounded bg-purple-900/20 p-3 border border-purple-600/30">
                    <p className="text-xs text-purple-300">💡 Tip: Update the status and toggle approvals to move this variation order through its workflow.</p>
                  </div>
                </>
              )}

              {editType === 'defect' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                    <select
                      value={editData.status}
                      onChange={(e) => {
                        setEditData({ ...editData, status: e.target.value });
                        setValidationErrors({ ...validationErrors, status: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.status
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-red-500'
                      }`}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="closed">Closed</option>
                    </select>
                    {validationErrors.status && <p className="text-xs text-red-400 mt-1">{validationErrors.status}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Severity *</label>
                    <select
                      value={editData.severity}
                      onChange={(e) => {
                        setEditData({ ...editData, severity: e.target.value });
                        setValidationErrors({ ...validationErrors, severity: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.severity
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-red-500'
                      }`}
                    >
                      <option value="minor">Minor</option>
                      <option value="major">Major</option>
                      <option value="critical">Critical</option>
                    </select>
                    {validationErrors.severity && <p className="text-xs text-red-400 mt-1">{validationErrors.severity}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Assigned To *</label>
                    <input
                      type="text"
                      value={editData.assignedTo || ''}
                      onChange={(e) => {
                        setEditData({ ...editData, assignedTo: e.target.value });
                        setValidationErrors({ ...validationErrors, assignedTo: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.assignedTo
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-red-500'
                      }`}
                      placeholder="Team member name"
                    />
                    {validationErrors.assignedTo && <p className="text-xs text-red-400 mt-1">{validationErrors.assignedTo}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Target Date</label>
                    <input
                      type="date"
                      value={editData.targetDate ? editData.targetDate.split('T')[0] : ''}
                      onChange={(e) => setEditData({ ...editData, targetDate: e.target.value })}
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cost to Fix</label>
                    <input
                      type="number"
                      value={editData.cost || 0}
                      onChange={(e) => {
                        setEditData({ ...editData, cost: parseFloat(e.target.value) });
                        setValidationErrors({ ...validationErrors, cost: '' });
                      }}
                      className={`w-full rounded border px-3 py-2 text-white focus:outline-none ${
                        validationErrors.cost
                          ? 'border-red-500 bg-red-900/20 focus:border-red-400'
                          : 'border-gray-600 bg-gray-700 focus:border-red-500'
                      }`}
                    />
                    {validationErrors.cost && <p className="text-xs text-red-400 mt-1">{validationErrors.cost}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                    <textarea
                      value={editData.notes || ''}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      rows={3}
                      className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
                      placeholder="Add any notes about this defect"
                    />
                  </div>

                  <div className="rounded bg-red-900/20 p-3 border border-red-600/30">
                    <p className="text-xs text-red-300">💡 Tip: Update the status to move this defect through its lifecycle (open → in-progress → closed).</p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-700 flex gap-3 px-6 py-4">
              <button
                onClick={closeEditModal}
                className="flex-1 rounded border border-gray-600 px-4 py-2 font-medium text-gray-200 hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveEditChanges}
                className={`flex-1 rounded px-4 py-2 font-medium text-white transition ${
                  editType === 'invoice'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : editType === 'variation'
                    ? 'bg-purple-600 hover:bg-purple-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Operative Modal */}
      {showAssignOperativeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAssignOperativeModal(false)}>
          <div className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Assign Operative to Project</h3>
                <p className="mt-1 text-sm text-gray-400">Add team members to {project.projectName}</p>
              </div>
              <button onClick={() => setShowAssignOperativeModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Operative Name *</label>
                <input
                  type="text"
                  placeholder="e.g., John Smith"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Role *</label>
                <select className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none">
                  <option value="">Select role...</option>
                  <option value="General Labourer">General Labourer</option>
                  <option value="Skilled Labourer">Skilled Labourer</option>
                  <option value="Foreman">Foreman</option>
                  <option value="Site Engineer">Site Engineer</option>
                  <option value="Excavator Operator">Excavator Operator</option>
                  <option value="Dumper Driver">Dumper Driver</option>
                  <option value="Groundworker">Groundworker</option>
                  <option value="Plant Operator">Plant Operator</option>
                  <option value="Banksman">Banksman</option>
                  <option value="Traffic Marshal">Traffic Marshal</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Start Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Daily Rate</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400">£</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 pl-8 pr-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Additional information about this assignment..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAssignOperativeModal(false)} className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
                Cancel
              </button>
              <button 
                onClick={() => {
                  showToast('Operative assigned successfully', 'success');
                  setShowAssignOperativeModal(false);
                }}
                className="rounded bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Assign to Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Equipment Modal */}
      {showAssignEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAssignEquipmentModal(false)}>
          <div className="w-full max-w-2xl rounded-lg border border-gray-700/50 bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Assign Equipment to Project</h3>
                <p className="mt-1 text-sm text-gray-400">Allocate plant and equipment to {project.projectName}</p>
              </div>
              <button onClick={() => setShowAssignEquipmentModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Equipment Type *</label>
                <select className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none">
                  <option value="">Select equipment...</option>
                  <option value="Excavator">Excavator</option>
                  <option value="Dumper">Dumper</option>
                  <option value="Roller">Roller</option>
                  <option value="Compactor">Compactor</option>
                  <option value="Generator">Generator</option>
                  <option value="Crane">Crane</option>
                  <option value="Telehandler">Telehandler</option>
                  <option value="Concrete Pump">Concrete Pump</option>
                  <option value="Transit Van">Transit Van</option>
                  <option value="Tipper Truck">Tipper Truck</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Equipment ID/Registration *</label>
                <input
                  type="text"
                  placeholder="e.g., PLT-001 or ABC123"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Start Date *</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">End Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Daily Hire Rate</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">£</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 pl-8 pr-4 py-2 text-white focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Status</label>
                  <select className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none">
                    <option value="allocated">Allocated</option>
                    <option value="on-site">On-Site</option>
                    <option value="off-hired">Off-Hired</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded border border-gray-700/50 bg-gray-800/50 p-3">
                <input
                  type="checkbox"
                  id="operatorRequired"
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="operatorRequired" className="text-sm text-gray-300">
                  Operator required for this equipment
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Additional information..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setShowAssignEquipmentModal(false)} className="rounded bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
                Cancel
              </button>
              <button 
                onClick={() => {
                  showToast('Equipment assigned successfully', 'success');
                  setShowAssignEquipmentModal(false);
                }}
                className="rounded bg-orange-500 px-6 py-2 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Assign to Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          toast.type === 'success'
            ? 'bg-green-600'
            : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.message}
        </div>
      )}
    </div>

  );
}
