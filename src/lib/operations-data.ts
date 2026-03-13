// =============================================================================
// SAMPLE OPERATIONS DATA
// =============================================================================

import type {
  ConstructionProject,
  ProjectHandover,
  ProgressMilestone,
  ProjectDocument,
  SitePhoto,
  SiteDiaryEntry,
  InvoiceApplication,
  VariationOrder,
  DefectItem,
  ProjectBoQLineItem,
} from "./operations-models";

import type { BoQItem } from "./boq-models";

import type { BillOfQuantities } from "./boq-models";

// =============================================================================
// PROJECT HANDOVERS (New wins from estimating)
// =============================================================================

export const sampleHandovers: ProjectHandover[] = [
  {
    id: "HO-2024-001",
    projectId: "PRJ-2024-051",
    estimateId: "EST-2024-038",
    client: "Greenwich Properties",
    projectName: "Commercial Office Refurbishment",
    contractValue: 580000,
    contractType: "lump-sum",
    startDate: "2026-02-28",
    duration: 32,
    completionDate: "2026-10-15",
    handoverDate: "2026-02-10",
    handoverFromUser: "Sarah Mitchell",
    handoverStatus: "pending",
    tender: true,
    contractSigned: true,
    insuranceInPlace: true,
    bondRequired: false,
    riskAssessment: true,
    methodStatements: false,
    siteSetupPlan: false,
    resourceAllocation: false,
    supplierOrdersPlaced: false,
  },
  {
    id: "HO-2024-002",
    projectId: "PRJ-2024-052",
    estimateId: "EST-2024-039",
    client: "Fortis Developments",
    projectName: "Residential Housing Development",
    contractValue: 3200000,
    contractType: "remeasure",
    startDate: "2026-03-10",
    duration: 68,
    completionDate: "2027-06-28",
    handoverDate: "2026-02-12",
    handoverFromUser: "James Bradford",
    handoverStatus: "pending",
    tender: true,
    contractSigned: true,
    insuranceInPlace: true,
    bondRequired: true,
    bondInPlace: true,
    riskAssessment: true,
    methodStatements: true,
    siteSetupPlan: false,
    resourceAllocation: false,
    supplierOrdersPlaced: false,
  },
];

const HANDOVERS_STORAGE_KEY = "kbm_operations_handovers";
const PROJECTS_STORAGE_KEY = "kbm_operations_projects";

const parseCurrencyValue = (value: string): number => {
  const cleaned = value.replace(/[^0-9.KMk]/g, "");
  const base = parseFloat(cleaned.replace(/[MKmk]/g, ""));
  if (Number.isNaN(base)) return 0;
  if (/[mM]/.test(cleaned)) return base * 1000000;
  if (/[kK]/.test(cleaned)) return base * 1000;
  return base;
};

const formatIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

export const getHandoversFromStorage = (): ProjectHandover[] => {
  if (typeof window === "undefined") return sampleHandovers;
  try {
    const stored = localStorage.getItem(HANDOVERS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ProjectHandover[]) : sampleHandovers;
  } catch (error) {
    console.error("Failed to load handovers:", error);
    return sampleHandovers;
  }
};

export const saveHandoversToStorage = (handovers: ProjectHandover[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HANDOVERS_STORAGE_KEY, JSON.stringify(handovers));
  } catch (error) {
    console.error("Failed to save handovers:", error);
  }
};

export const getProjectsFromStorage = (): ConstructionProject[] => {
  if (typeof window === "undefined") return sampleProjects;
  try {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as ConstructionProject[]) : sampleProjects;
  } catch (error) {
    console.error("Failed to load projects:", error);
    return sampleProjects;
  }
};

export const getProjectNames = (): string[] => {
  return getProjectsFromStorage().map(p => p.projectName).sort();
};

export const saveProjectsToStorage = (projects: ConstructionProject[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects:", error);
  }
};

export const createHandoverFromEstimate = (job: {
  id: string;
  enquiryId?: string;
  client: string;
  projectName: string;
  projectAddress?: string;
  value: string;
  status?: "new-assignment" | "in-progress" | "quote-submitted" | "won" | "lost";
  progress?: number;
  quoteRef?: string;
  submittedDate?: string;
  dueDate?: string;
  receivedDate?: string;
  quoteTotal?: number;
  marginPercent?: number;
  outcome?: string;
  notes?: string;
  boqItems?: Array<{
    id?: string;
    itemNumber?: string;
    description: string;
    unit: string;
    quantity: number;
    rate: number;
    total?: number;
    amount?: number;
    section?: string;
    notes?: string;
    standard?: "SMM7" | "CESMM" | "SHW";
  }>;
  estimator?: string;
  assignedTo?: string;
  orderNumber?: string;
  contractFileName?: string;
  invoiceAddress?: string;
  paymentTerms?: string;
  drawingFiles?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: string;
    dataUrl: string;
  }>;
}): ProjectHandover => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() + 28);
  const durationWeeks = 32;
  const completionDate = new Date(startDate);
  completionDate.setDate(completionDate.getDate() + durationWeeks * 7);
  const estimateSuffix = job.id.replace("EST-", "");
  const mappedBoqItems = (job.boqItems || []).map((item, index) => ({
    id: item.id || `BOQ-${estimateSuffix}-${index + 1}`,
    itemNumber: item.itemNumber || `ITEM-${String(index + 1).padStart(3, "0")}`,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.amount ?? item.total ?? item.quantity * item.rate,
    standard: item.standard || "SMM7",
    section: item.section,
    notes: item.notes,
  }));

  return {
    id: `HO-${Date.now()}`,
    projectId: `PRJ-${estimateSuffix}`,
    estimateId: job.id,
    enquiryId: job.enquiryId,
    client: job.client,
    projectName: job.projectName,
    projectAddress: job.projectAddress,
    contractValue: job.quoteTotal ?? parseCurrencyValue(job.value),
    contractType: "lump-sum",
    quoteRef: job.quoteRef,
    quoteTotal: job.quoteTotal,
    marginPercent: job.marginPercent,
    submittedDate: job.submittedDate,
    dueDate: job.dueDate,
    receivedDate: job.receivedDate,
    estimateStatus: job.status,
    estimateProgress: job.progress,
    estimator: job.estimator,
    assignedTo: job.assignedTo,
    outcome: job.outcome,
    estimateNotes: job.notes,
    drawingFiles: job.drawingFiles,
    boqItems: mappedBoqItems.length > 0 ? mappedBoqItems : undefined,
    startDate: formatIsoDate(startDate),
    duration: durationWeeks,
    completionDate: formatIsoDate(completionDate),
    handoverDate: formatIsoDate(today),
    handoverFromUser: job.estimator || job.assignedTo || "Estimating Team",
    orderNumber: job.orderNumber,
    contractFileName: job.contractFileName,
    invoiceAddress: job.invoiceAddress,
    paymentTerms: job.paymentTerms,
    handoverNotes: [
      job.orderNumber ? `Order number: ${job.orderNumber}` : null,
      job.contractFileName ? `Contract file: ${job.contractFileName}` : null,
      job.invoiceAddress ? `Invoice address: ${job.invoiceAddress}` : null,
      job.paymentTerms ? `Payment terms: ${job.paymentTerms}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || undefined,
    handoverStatus: "pending",
    tender: true,
    contractSigned: true,
    insuranceInPlace: true,
    bondRequired: false,
    riskAssessment: true,
    methodStatements: false,
    siteSetupPlan: false,
    resourceAllocation: false,
    supplierOrdersPlaced: false,
  };
};

export const createProjectFromHandover = (handover: ProjectHandover): ConstructionProject => {
  const today = new Date();
  const startDate = new Date(handover.startDate || today.toISOString());
  const completionDate = new Date(handover.completionDate || today.toISOString());
  const millisPerDay = 24 * 60 * 60 * 1000;
  const daysToCompletion = Math.ceil((completionDate.getTime() - today.getTime()) / millisPerDay);
  const estimateSuffix = handover.estimateId.replace("EST-", "");

  return {
    id: handover.projectId,
    projectCode: `EST-${estimateSuffix}`,
    estimateId: handover.estimateId,
    projectName: handover.projectName,
    client: handover.client,
    clientContact: {
      name: "TBD",
      email: "",
      phone: "",
    },
    siteAddress: {
      line1: handover.projectAddress || "TBD",
      city: "",
      postcode: "",
    },
    orderNumber: handover.orderNumber,
    contractFileName: handover.contractFileName,
    invoiceAddress: handover.invoiceAddress,
    paymentTerms: handover.paymentTerms,
    handoverNotes: handover.handoverNotes,
    contractValue: handover.contractValue,
    contractType: handover.contractType,
    contractStartDate: handover.startDate,
    contractCompletionDate: handover.completionDate,
    contractDuration: handover.duration,
    retentionPercentage: 5,
    stage: "mobilisation",
    overallProgress: 0,
    daysToCompletion: Number.isNaN(daysToCompletion) ? 0 : daysToCompletion,
    onProgramme: true,
    projectManager: handover.handoverToUser || handover.estimator || handover.assignedTo || "Operations Team",
    team: [
      {
        userId: "USR-OPS",
        name: handover.handoverToUser || "Operations Team",
        role: "Project Manager",
      },
    ],
    valuationToDate: 0,
    costToDate: 0,
    forecastFinalCost: 0,
    grossProfit: 0,
    grossProfitPercentage: 0,
    invoiceStage: "not-started",
    milestones: [],
    documentCount: 0,
    photoCount: 0,
    siteDiaryCount: 0,
    riskLevel: "low",
    qualityScore: 90,
    safetyScore: 90,
    hasVariations: false,
    hasDelays: false,
    hasDefects: false,
    requiresAttention: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

// =============================================================================
// CONSTRUCTION PROJECTS
// =============================================================================

export const sampleProjects: ConstructionProject[] = [
  {
    id: "PRJ-2501",
    projectCode: "THM-25-01",
    estimateId: "EST-2024-015",
    projectName: "Thames Retail Park",
    client: "Westfield Shopping Centers",
    clientContact: {
      name: "Richard Thompson",
      email: "r.thompson@westfield.com",
      phone: "020 7123 4567",
    },
    siteAddress: {
      line1: "Riverside Business Park",
      line2: "Thames Road",
      city: "London",
      postcode: "SE1 2AA",
    },
    contractValue: 4200000,
    contractType: "lump-sum",
    contractStartDate: "2025-04-01",
    contractCompletionDate: "2026-06-15",
    contractDuration: 62,
    retentionPercentage: 5,
    stage: "active",
    overallProgress: 68,
    daysToCompletion: 119,
    onProgramme: true,
    projectManager: "Emma Patel",
    siteManager: "Tom Richardson",
    contractsManager: "Sarah Mitchell",
    healthSafetyOfficer: "David Walsh",
    team: [
      { userId: "USR-001", name: "Emma Patel", role: "Project Manager" },
      { userId: "USR-015", name: "Tom Richardson", role: "Site Manager" },
      { userId: "USR-023", name: "Gary Foster", role: "Site Engineer" },
      { userId: "USR-031", name: "Lisa Andrews", role: "Quantity Surveyor" },
    ],
    valuationToDate: 2856000,
    costToDate: 2514000,
    forecastFinalCost: 3780000,
    grossProfit: 420000,
    grossProfitPercentage: 10,
    invoiceStage: "interim",
    lastInvoiceDate: "2026-01-31",
    nextInvoiceDate: "2026-02-28",
    milestones: [
      {
        id: "MS-001",
        name: "Site Setup Complete",
        description: "Site hoarding, welfare, temp services",
        targetDate: "2025-04-15",
        actualDate: "2025-04-14",
        status: "complete",
        percentage: 100,
        responsible: "Tom Richardson",
      },
      {
        id: "MS-002",
        name: "Demolition Complete",
        description: "Strip out existing fit-out",
        targetDate: "2025-05-30",
        actualDate: "2025-05-28",
        status: "complete",
        percentage: 100,
        responsible: "Tom Richardson",
      },
      {
        id: "MS-003",
        name: "Structure Complete",
        description: "Structural alterations and new steel",
        targetDate: "2025-09-15",
        actualDate: "2025-09-20",
        status: "complete",
        percentage: 100,
        responsible: "Gary Foster",
        notes: "5 days delay due to steel delivery",
      },
      {
        id: "MS-004",
        name: "Envelope Watertight",
        description: "Roof, cladding, glazing complete",
        targetDate: "2025-11-30",
        actualDate: "2025-12-02",
        status: "complete",
        percentage: 100,
        responsible: "Tom Richardson",
      },
      {
        id: "MS-005",
        name: "M&E First Fix Complete",
        description: "Services installation first fix",
        targetDate: "2026-01-31",
        actualDate: "2026-02-03",
        status: "complete",
        percentage: 100,
        responsible: "Gary Foster",
      },
      {
        id: "MS-006",
        name: "Finishes Complete",
        description: "Internal finishes and decorations",
        targetDate: "2026-04-15",
        status: "in-progress",
        percentage: 75,
        responsible: "Tom Richardson",
      },
      {
        id: "MS-007",
        name: "M&E Second Fix & Commission",
        description: "Services commissioning and testing",
        targetDate: "2026-05-15",
        status: "in-progress",
        percentage: 40,
        responsible: "Gary Foster",
      },
      {
        id: "MS-008",
        name: "External Works Complete",
        description: "Landscaping, car park, external lighting",
        targetDate: "2026-06-01",
        status: "not-started",
        percentage: 0,
        responsible: "Tom Richardson",
      },
      {
        id: "MS-009",
        name: "Practical Completion",
        description: "PC achieved, client handover",
        targetDate: "2026-06-15",
        status: "not-started",
        percentage: 0,
        responsible: "Emma Patel",
      },
    ],
    documentCount: 247,
    photoCount: 1893,
    siteDiaryCount: 285,
    riskLevel: "low",
    qualityScore: 92,
    safetyScore: 96,
    hasVariations: true,
    hasDelays: false,
    hasDefects: false,
    requiresAttention: false,
    createdAt: "2025-03-15T09:00:00Z",
    updatedAt: "2026-02-16T14:30:00Z",
  },
  {
    id: "PRJ-2502",
    projectCode: "PMU-25-02",
    estimateId: "EST-2024-022",
    projectName: "Premier Mixed Use Development",
    client: "Berkeley Group",
    clientContact: {
      name: "Amanda Foster",
      email: "a.foster@berkeleygroup.co.uk",
      phone: "020 7234 5678",
    },
    siteAddress: {
      line1: "Former Industrial Site",
      line2: "Victoria Road",
      city: "Manchester",
      postcode: "M1 4HT",
    },
    contractValue: 6800000,
    contractType: "remeasure",
    contractStartDate: "2025-06-15",
    contractCompletionDate: "2026-08-20",
    contractDuration: 58,
    liquidatedDamages: 5000,
    retentionPercentage: 5,
    retentionLimit: 250000,
    stage: "active",
    overallProgress: 52,
    daysToCompletion: 185,
    onProgramme: false,
    projectManager: "Michael Chen",
    siteManager: "Paul Anderson",
    contractsManager: "Sarah Mitchell",
    healthSafetyOfficer: "David Walsh",
    team: [
      { userId: "USR-002", name: "Michael Chen", role: "Project Manager" },
      { userId: "USR-018", name: "Paul Anderson", role: "Site Manager" },
      { userId: "USR-025", name: "Rachel Green", role: "Site Engineer" },
      { userId: "USR-032", name: "Mark Taylor", role: "Quantity Surveyor" },
    ],
    valuationToDate: 3536000,
    costToDate: 3298000,
    forecastFinalCost: 6460000,
    grossProfit: 340000,
    grossProfitPercentage: 5,
    invoiceStage: "interim",
    lastInvoiceDate: "2026-01-31",
    nextInvoiceDate: "2026-02-28",
    milestones: [
      {
        id: "MS-010",
        name: "Groundworks Complete",
        description: "Piling, foundations, drainage",
        targetDate: "2025-09-30",
        actualDate: "2025-10-15",
        status: "complete",
        percentage: 100,
        responsible: "Paul Anderson",
        notes: "2 weeks delay - contaminated ground",
      },
      {
        id: "MS-011",
        name: "Substructure Complete",
        description: "Basement construction",
        targetDate: "2025-12-15",
        actualDate: "2026-01-05",
        status: "complete",
        percentage: 100,
        responsible: "Rachel Green",
        notes: "3 weeks delay - weather & ground conditions",
      },
      {
        id: "MS-012",
        name: "Frame Complete to Level 4",
        description: "Concrete frame construction",
        targetDate: "2026-03-31",
        status: "in-progress",
        percentage: 65,
        responsible: "Paul Anderson",
      },
      {
        id: "MS-013",
        name: "Envelope Watertight",
        description: "Building envelope complete",
        targetDate: "2026-06-15",
        status: "not-started",
        percentage: 0,
        responsible: "Paul Anderson",
      },
    ],
    documentCount: 189,
    photoCount: 1456,
    siteDiaryCount: 187,
    riskLevel: "high",
    qualityScore: 85,
    safetyScore: 88,
    hasVariations: true,
    hasDelays: true,
    hasDefects: false,
    requiresAttention: true,
    createdAt: "2025-05-20T09:00:00Z",
    updatedAt: "2026-02-16T15:45:00Z",
  },
  {
    id: "PRJ-2503",
    projectCode: "CWH-25-03",
    estimateId: "EST-2024-008",
    projectName: "Central Warehouse Distribution Centre",
    client: "DHL Supply Chain",
    clientContact: {
      name: "Klaus Schmidt",
      email: "klaus.schmidt@dhl.com",
      phone: "020 7345 6789",
    },
    siteAddress: {
      line1: "Logistics Park",
      line2: "Junction 15 M1",
      city: "Milton Keynes",
      postcode: "MK10 0BA",
    },
    contractValue: 2100000,
    contractType: "lump-sum",
    contractStartDate: "2025-10-01",
    contractCompletionDate: "2026-04-01",
    contractDuration: 26,
    retentionPercentage: 3,
    stage: "snagging",
    overallProgress: 95,
    daysToCompletion: 44,
    onProgramme: true,
    projectManager: "David Johnson",
    siteManager: "Steve Matthews",
    contractsManager: "Lisa Andrews",
    healthSafetyOfficer: "Jennifer Cole",
    team: [
      { userId: "USR-003", name: "David Johnson", role: "Project Manager" },
      { userId: "USR-019", name: "Steve Matthews", role: "Site Manager" },
      { userId: "USR-026", name: "Chris Morgan", role: "Site Engineer" },
    ],
    valuationToDate: 1995000,
    costToDate: 1827000,
    forecastFinalCost: 1920000,
    grossProfit: 180000,
    grossProfitPercentage: 8.6,
    invoiceStage: "interim",
    lastInvoiceDate: "2026-01-31",
    nextInvoiceDate: "2026-02-28",
    milestones: [],
    documentCount: 134,
    photoCount: 892,
    siteDiaryCount: 142,
    riskLevel: "low",
    qualityScore: 94,
    safetyScore: 91,
    hasVariations: false,
    hasDelays: false,
    hasDefects: true,
    requiresAttention: false,
    createdAt: "2025-09-10T09:00:00Z",
    updatedAt: "2026-02-16T11:20:00Z",
  },
];

// =============================================================================
// SITE DIARY ENTRIES
// =============================================================================

export const sampleDiaryEntries: SiteDiaryEntry[] = [
  {
    id: "DIARY-001",
    projectId: "PRJ-2501",
    date: "2026-02-16",
    weather: {
      condition: "dry",
      temperature: 8,
      notes: "Clear skies, light breeze",
    },
    labour: {
      ownStaff: 12,
      subcontractors: 24,
      visitors: 3,
    },
    plant: {
      onSite: ["EX-001 (Excavator)", "CR-003 (Crane)", "DM-005 (Dumper)"],
      offSite: [],
    },
    workCarriedOut: "Ground floor slab concreting completed (Zone A). First floor blockwork progressing well. M&E conduit installation ongoing. Site meeting held with architect regarding finishes specification.",
    materialsDelivered: [
      "40 tonnes ready mix concrete",
      "200 concrete blocks",
      "Electrical conduit - 500m",
    ],
    visitorsToSite: [
      { name: "Richard Thompson", company: "Westfield", purpose: "Progress inspection" },
      { name: "Jane Collins", company: "ABC Architects", purpose: "Design queries" },
      { name: "HSE Inspector", company: "HSE", purpose: "Routine inspection" },
    ],
    incidentsOrIssues: "Minor delay in concrete pour due to late delivery (30 minutes). No impact on programme.",
    tomorrowsWork: "Continue first floor blockwork. Commence steelwork erection for mezzanine. M&E conduit completion Zone A.",
    photosAttached: ["PHO-001", "PHO-002", "PHO-003"],
    enteredBy: "Tom Richardson",
    enteredAt: "2026-02-16T17:30:00Z",
    approved: true,
    approvedBy: "Emma Patel",
    approvedAt: "2026-02-16T18:15:00Z",
  },
];

// =============================================================================
// VARIATION ORDERS
// =============================================================================

export const sampleVariations: VariationOrder[] = [
  {
    id: "VO-2501-003",
    projectId: "PRJ-2501",
    voNumber: "VO-003",
    title: "Additional Fire Doors - Ground Floor",
    description: "Client request to upgrade 6 standard doors to 60-minute fire rated doors in retail units 1-3. Includes frames, ironmongery, and fire stopping.",
    reason: "client-change",
    status: "approved",
    estimatedValue: 8500,
    quotedValue: 9200,
    approvedValue: 9200,
    actualCost: 8750,
    raisedDate: "2026-01-15",
    raisedBy: "Emma Patel",
    requiredBy: "2026-03-01",
    approvedDate: "2026-01-22",
    approvedBy: "Richard Thompson",
    completedDate: "2026-02-10",
    programmeImpact: 0,
    affectsMilestones: [],
    attachedDocs: ["DOC-145", "DOC-146"],
    clientApproved: true,
    architectApproved: true,
    internalApproved: true,
    notes: "All materials ordered and delivered. Installation complete.",
  },
  {
    id: "VO-2502-001",
    projectId: "PRJ-2502",
    voNumber: "VO-001",
    title: "Additional Piling Due to Ground Conditions",
    description: "Contaminated ground encountered required additional piling and remediation works beyond original scope.",
    reason: "site-conditions",
    status: "completed",
    estimatedValue: 125000,
    quotedValue: 138000,
    approvedValue: 138000,
    actualCost: 134500,
    raisedDate: "2025-08-20",
    raisedBy: "Michael Chen",
    approvedDate: "2025-08-25",
    approvedBy: "Amanda Foster",
    completedDate: "2025-10-15",
    programmeImpact: 14,
    affectsMilestones: ["MS-010", "MS-011"],
    attachedDocs: ["DOC-089", "DOC-090", "DOC-091"],
    clientApproved: true,
    architectApproved: true,
    internalApproved: true,
    notes: "Ground investigation report attached. 2-week programme extension agreed.",
  },
  {
    id: "VO-2502-002",
    projectId: "PRJ-2502",
    voNumber: "VO-002",
    title: "Upgraded HVAC System Specification",
    description: "Client request for higher specification HVAC system with improved air quality controls and increased capacity.",
    reason: "client-change",
    status: "priced",
    estimatedValue: 45000,
    quotedValue: 52000,
    approvedValue: undefined,
    raisedDate: "2026-01-28",
    raisedBy: "Amanda Foster",
    programmeImpact: 3,
    affectsMilestones: ["MS-014"],
    attachedDocs: ["DOC-092"],
    clientApproved: false,
    architectApproved: true,
    internalApproved: true,
    notes: "Awaiting client approval. Will add 3 days to M&E programme.",
  },
];


// =============================================================================
// DEFECT ITEMS
// =============================================================================

export const sampleDefects: DefectItem[] = [
  {
    id: "DEF-2503-001",
    projectId: "PRJ-2503",
    defectNumber: "001",
    category: "snagging",
    severity: "minor",
    description: "Paint finish to internal walls - several areas requiring touching up",
    location: "Office area, walls 3, 7, 12",
    raisedBy: "Klaus Schmidt",
    raisedDate: "2026-02-10",
    status: "in-progress",
    assignedTo: "Steve Matthews",
    targetDate: "2026-02-20",
    photos: ["PHO-234", "PHO-235"],
    notes: "Decorator scheduled for 18th February",
  },
  {
    id: "DEF-2503-002",
    projectId: "PRJ-2503",
    defectNumber: "002",
    category: "defect",
    severity: "major",
    description: "Loading bay door - Does not close fully, 50mm gap at bottom",
    location: "Loading bay 2, north elevation",
    raisedBy: "Klaus Schmidt",
    raisedDate: "2026-02-10",
    status: "open",
    assignedTo: "Chris Morgan",
    targetDate: "2026-02-22",
    photos: ["PHO-236"],
    cost: 1200,
    notes: "Specialist door supplier contacted. Site visit booked for 17th February.",
  },
];

// =============================================================================
// INVOICE APPLICATIONS
// =============================================================================

export const sampleInvoices: InvoiceApplication[] = [
  {
    id: "INV-2501-007",
    projectId: "PRJ-2501",
    applicationNumber: 7,
    period: {
      from: "2026-01-01",
      to: "2026-01-31",
    },
    status: "certified",
    lineItems: [],
    grossValuation: 3150000,
    retentionDeducted: 157500,
    previousPayments: 2706000,
    thisPayment: 286500,
    cumulativePaid: 2992500,
    certifiedBy: "Lisa Andrews",
    certifiedDate: "2026-02-05",
    certifiedAmount: 286500,
    paymentDueDate: "2026-02-19",
    supportingDocs: ["DOC-210", "DOC-211", "DOC-212"],
    submittedBy: "Emma Patel",
    submittedDate: "2026-02-01",
    notes: "Includes VO-003 (£9,200). Payment due 14 days from certification.",
  },
  {
    id: "INV-2502-004",
    projectId: "PRJ-2502",
    applicationNumber: 4,
    period: {
      from: "2026-01-01",
      to: "2026-01-31",
    },
    status: "submitted",
    lineItems: [],
    grossValuation: 1950000,
    retentionDeducted: 97500,
    previousPayments: 1560000,
    thisPayment: 292500,
    cumulativePaid: 1852500,
    submittedBy: "Michael Chen",
    submittedDate: "2026-02-03",
    supportingDocs: ["DOC-078", "DOC-079"],
    notes: "Ground remediation costs included. Awaiting architect certification.",
  },
  {
    id: "INV-2502-005",
    projectId: "PRJ-2502",
    applicationNumber: 5,
    period: {
      from: "2026-02-01",
      to: "2026-02-15",
    },
    status: "draft",
    lineItems: [],
    grossValuation: 2100000,
    retentionDeducted: 105000,
    previousPayments: 1852500,
    thisPayment: 142500,
    cumulativePaid: 1995000,
    submittedBy: "Michael Chen",
    supportingDocs: ["DOC-080", "DOC-081"],
    notes: "Frame and roof works in progress.",
  },
];


// =============================================================================
// PROJECT DOCUMENTS
// =============================================================================

export const sampleDocuments: ProjectDocument[] = [
  {
    id: "DOC-001",
    projectId: "PRJ-2501",
    category: "contract",
    title: "Main Contract - Signed",
    description: "JCT Design & Build Contract 2016",
    fileName: "THM-Contract-Signed.pdf",
    fileSize: 2458000,
    mimeType: "application/pdf",
    uploadedBy: "Sarah Mitchell",
    uploadedDate: "2025-03-01T10:00:00Z",
    tags: ["contract", "legal", "signed"],
    currentRevision: "Final",
    status: "issued",
  },
  {
    id: "DOC-145",
    projectId: "PRJ-2501",
    category: "variation",
    title: "VO-003 - Fire Doors Quotation",
    description: "Quotation for additional fire doors",
    fileName: "VO-003-Quotation.pdf",
    fileSize: 156000,
    mimeType: "application/pdf",
    uploadedBy: "Emma Patel",
    uploadedDate: "2026-01-16T14:30:00Z",
    tags: ["variation", "quotation", "fire-safety"],
    relatedMilestone: undefined,
    currentRevision: "A",
    status: "approved",
  },
];

// =============================================================================
// SITE PHOTOS
// =============================================================================

export const samplePhotos: SitePhoto[] = [
  {
    id: "PHO-001",
    projectId: "PRJ-2501",
    title: "Ground Floor Slab Concreting - Zone A",
    description: "Concrete pour in progress, good weather conditions",
    fileName: "2026-02-16-slab-pour-zone-a.jpg",
    fileSize: 3456000,
    takenBy: "Tom Richardson",
    takenDate: "2026-02-16T11:30:00Z",
    location: {
      lat: 51.5074,
      lng: -0.1278,
      area: "Ground Floor - Zone A",
    },
    tags: ["concrete", "groundworks", "progress"],
    relatedMilestone: "MS-006",
  },
  {
    id: "PHO-234",
    projectId: "PRJ-2503",
    title: "Paint Defect - Wall 3",
    description: "Paint finish requires touching up",
    fileName: "2026-02-10-defect-wall-3.jpg",
    fileSize: 1234000,
    takenBy: "Klaus Schmidt",
    takenDate: "2026-02-10T14:00:00Z",
    location: {
      lat: 51.7534,
      lng: -0.4972,
      area: "Office Area - Wall 3",
    },
    tags: ["defect", "snagging", "finishes"],
  },
];

// =============================================================================
// SAMPLE PROJECT DOCUMENTS
// =============================================================================

export const sampleProjectDocuments: ProjectDocument[] = [
  // Thames Retail Park documents
  {
    id: "DOC-001",
    projectId: "PRJ-2502",
    category: "contract",
    title: "Main Contract - Thames Retail Park",
    description: "Primary construction contract agreement",
    fileName: "Thames_RetailPark_MainContract_v2.pdf",
    fileSize: 2450000,
    mimeType: "application/pdf",
    uploadedBy: "John Thompson",
    uploadedDate: "2025-11-15T09:30:00Z",
    tags: ["contract", "legal", "signed"],
    currentRevision: "2",
    status: "approved",
  },
  {
    id: "DOC-002",
    projectId: "PRJ-2502",
    category: "health-safety",
    title: "Contractor Insurance Certificate",
    description: "Public Liability and Professional Indemnity - Valid until November 2026",
    fileName: "Insurance_Certificate_2025.pdf",
    fileSize: 850000,
    mimeType: "application/pdf",
    uploadedBy: "Claire Bolton",
    uploadedDate: "2025-11-01T10:15:00Z",
    tags: ["insurance", "compliance", "valid"],
    status: "approved",
  },
  {
    id: "DOC-003",
    projectId: "PRJ-2502",
    category: "design",
    title: "Architectural Plans - Ground Floor",
    description: "Latest approved architectural drawings for ground level",
    fileName: "Arch_Plans_GF_Rev D.pdf",
    fileSize: 5600000,
    mimeType: "application/pdf",
    uploadedBy: "Emma Richardson",
    uploadedDate: "2026-01-20T14:45:00Z",
    tags: ["drawings", "architecture", "structural"],
    issuedRevision: "D",
    currentRevision: "D",
    status: "approved",
  },
  {
    id: "DOC-004",
    projectId: "PRJ-2502",
    category: "design",
    title: "Materials & Finishes Specifications",
    description: "Complete specification document for all materials and finishes",
    fileName: "Materials_Specs_Issued.docx",
    fileSize: 1200000,
    mimeType: "application/msword",
    uploadedBy: "Mark Davies",
    uploadedDate: "2026-01-15T11:20:00Z",
    tags: ["specifications", "materials", "finishes"],
    status: "issued",
  },
  {
    id: "DOC-005",
    projectId: "PRJ-2502",
    category: "health-safety",
    title: "Site Risk Assessment Report",
    description: "Comprehensive risk assessment and mitigation strategies",
    fileName: "Risk_Assessment_v1.3.pdf",
    fileSize: 3100000,
    mimeType: "application/pdf",
    uploadedBy: "Helen Foster",
    uploadedDate: "2026-02-01T09:00:00Z",
    tags: ["risk", "safety", "compliance"],
    status: "approved",
  },
  {
    id: "DOC-006",
    projectId: "PRJ-2502",
    category: "correspondence",
    title: "Planning Permission - Secondary",
    description: "Planning permission approval for secondary external works",
    fileName: "Planning_Permission_Secondary.pdf",
    fileSize: 945000,
    mimeType: "application/pdf",
    uploadedBy: "John Thompson",
    uploadedDate: "2026-01-25T16:30:00Z",
    tags: ["permits", "planning", "legal"],
    status: "approved",
  },
  
  // Premier Mixed Use documents
  {
    id: "DOC-007",
    projectId: "PRJ-2501",
    category: "contract",
    title: "Main Contract - Premier Mixed Use",
    description: "Primary construction contract with amendments",
    fileName: "Premier_MainContract_Rev1.pdf",
    fileSize: 2800000,
    mimeType: "application/pdf",
    uploadedBy: "John Thompson",
    uploadedDate: "2025-09-20T10:00:00Z",
    tags: ["contract", "legal", "signed"],
    currentRevision: "1",
    status: "approved",
  },
  {
    id: "DOC-008",
    projectId: "PRJ-2501",
    category: "method-statement",
    title: "Construction Method Statement",
    description: "Detailed construction methodology and phasing",
    fileName: "Method_Statement_Final.pdf",
    fileSize: 4200000,
    mimeType: "application/pdf",
    uploadedBy: "Michael Chen",
    uploadedDate: "2025-10-05T13:45:00Z",
    tags: ["method", "quality", "procedures"],
    status: "approved",
  },
  {
    id: "DOC-009",
    projectId: "PRJ-2501",
    category: "design",
    title: "Structural Drawings - Phase 1",
    description: "Structural engineering drawings for phase 1 works",
    fileName: "Structural_Phase1_Rev C.pdf",
    fileSize: 6800000,
    mimeType: "application/pdf",
    uploadedBy: "Emma Richardson",
    uploadedDate: "2025-12-10T11:30:00Z",
    tags: ["drawings", "structural", "engineering"],
    issuedRevision: "C",
    currentRevision: "C",
    status: "approved",
  },
  {
    id: "DOC-010",
    projectId: "PRJ-2501",
    category: "quality",
    title: "Quality Assurance Plan",
    description: "Comprehensive QA procedures and testing protocols",
    fileName: "QA_Plan_Issue2.docx",
    fileSize: 1650000,
    mimeType: "application/msword",
    uploadedBy: "Catherine Wilson",
    uploadedDate: "2026-01-08T14:15:00Z",
    tags: ["quality", "qa", "testing"],
    status: "issued",
  },
  
  // Central Warehouse documents
  {
    id: "DOC-011",
    projectId: "PRJ-2503",
    category: "contract",
    title: "Main Contract - Central Warehouse",
    description: "Primary construction contract agreement signed",
    fileName: "CentralWarehouse_Contract_Final.pdf",
    fileSize: 3200000,
    mimeType: "application/pdf",
    uploadedBy: "John Thompson",
    uploadedDate: "2025-07-01T09:00:00Z",
    tags: ["contract", "legal", "signed"],
    currentRevision: "Final",
    status: "approved",
  },
  {
    id: "DOC-012",
    projectId: "PRJ-2503",
    category: "health-safety",
    title: "Contractor Insurance - Updated",
    description: "Current insurance certificates - valid until July 2026",
    fileName: "Insurance_Warehouse_Jul2026.pdf",
    fileSize: 920000,
    mimeType: "application/pdf",
    uploadedBy: "Claire Bolton",
    uploadedDate: "2025-07-15T10:30:00Z",
    tags: ["insurance", "compliance"],
    status: "approved",
  },
  {
    id: "DOC-013",
    projectId: "PRJ-2503",
    category: "inspection",
    title: "Factory Testing Report - Structural Steel",
    description: "Certification of structural steel testing and verification",
    fileName: "Factory_Test_SteelWork_Final.pdf",
    fileSize: 2340000,
    mimeType: "application/pdf",
    uploadedBy: "David Chen",
    uploadedDate: "2026-02-05T15:20:00Z",
    tags: ["testing", "certification", "materials"],
    status: "approved",
  },
  {
    id: "DOC-014",
    projectId: "PRJ-2503",
    category: "design",
    title: "As-Built Drawings - Complete",
    description: "Final as-built drawings reflecting all variations",
    fileName: "AsBuilt_Drawings_Complete.pdf",
    fileSize: 7100000,
    mimeType: "application/pdf",
    uploadedBy: "Emma Richardson",
    uploadedDate: "2026-02-08T12:00:00Z",
    tags: ["drawings", "as-built", "final"],
    status: "archived",
  },
];

// =============================================================================
// SITE DIARIES STORAGE
// =============================================================================

const SITE_DIARIES_STORAGE_KEY = "kbm_operations_site_diaries";

export const getSiteDiariesFromStorage = (): SiteDiaryEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SITE_DIARIES_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SiteDiaryEntry[]) : [];
  } catch (error) {
    console.error("Failed to load site diaries:", error);
    return [];
  }
};

export const saveSiteDiariesToStorage = (diaries: SiteDiaryEntry[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SITE_DIARIES_STORAGE_KEY, JSON.stringify(diaries));
  } catch (error) {
    console.error("Failed to save site diaries:", error);
  }
};

export const addSiteDiaryEntry = (entry: Omit<SiteDiaryEntry, "id" | "enteredAt">): SiteDiaryEntry => {
  const diaries = getSiteDiariesFromStorage();
  const newEntry: SiteDiaryEntry = {
    ...entry,
    id: `SD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    enteredAt: new Date().toISOString(),
  };
  diaries.push(newEntry);
  saveSiteDiariesToStorage(diaries);
  return newEntry;
};

export const getSiteDiariesForProject = (projectId: string): SiteDiaryEntry[] => {
  return getSiteDiariesFromStorage().filter(d => d.projectId === projectId);
};

// =============================================================================
// SITE PHOTOS STORAGE
// =============================================================================

const SITE_PHOTOS_STORAGE_KEY = "kbm_operations_site_photos";

export const getSitePhotosFromStorage = (): SitePhoto[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SITE_PHOTOS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SitePhoto[]) : [];
  } catch (error) {
    console.error("Failed to load site photos:", error);
    return [];
  }
};

export const saveSitePhotosToStorage = (photos: SitePhoto[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SITE_PHOTOS_STORAGE_KEY, JSON.stringify(photos));
  } catch (error) {
    console.error("Failed to save site photos:", error);
  }
};

export const addSitePhoto = (photo: Omit<SitePhoto, "id">): SitePhoto => {
  const photos = getSitePhotosFromStorage();
  const newPhoto: SitePhoto = {
    ...photo,
    id: `PHOTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  photos.push(newPhoto);
  saveSitePhotosToStorage(photos);
  return newPhoto;
};

export const getSitePhotosForProject = (projectId: string): SitePhoto[] => {
  return getSitePhotosFromStorage().filter(p => p.projectId === projectId);
};

// =============================================================================
// PLANT & EQUIPMENT ALLOCATION
// =============================================================================

export type PlantAllocation = {
  id: string;
  projectId: string;
  plantId: string;
  plantName: string;
  plantType: string;
  allocatedFrom: string;
  allocatedTo: string;
  status: "allocated" | "on-site" | "off-hired" | "returned";
  hireRate: number;
  operatorRequired: boolean;
  operatorName?: string;
  notes?: string;
  allocatedBy: string;
  allocatedDate: string;
};

const PLANT_ALLOCATION_STORAGE_KEY = "kbm_operations_plant_allocation";

export const getPlantAllocationsFromStorage = (): PlantAllocation[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PLANT_ALLOCATION_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as PlantAllocation[]) : [];
  } catch (error) {
    console.error("Failed to load plant allocations:", error);
    return [];
  }
};

export const savePlantAllocationsToStorage = (allocations: PlantAllocation[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PLANT_ALLOCATION_STORAGE_KEY, JSON.stringify(allocations));
  } catch (error) {
    console.error("Failed to save plant allocations:", error);
  }
};

export const getPlantAllocationsForProject = (projectId: string): PlantAllocation[] => {
  return getPlantAllocationsFromStorage().filter(a => a.projectId === projectId);
};

// =============================================================================
// MATERIAL DELIVERIES & STOCKPILES
// =============================================================================

export type MaterialDelivery = {
  id: string;
  projectId: string;
  deliveryDate: string;
  supplier: string;
  materialType: string;
  description: string;
  quantity: number;
  unit: string;
  orderReference?: string;
  deliveryNoteNumber?: string;
  receivedBy: string;
  location?: string; // Where stored on site
  condition: "good" | "damaged" | "partial";
  notes?: string;
  photos?: string[]; // Photo IDs
};

export type MaterialStockpile = {
  id: string;
  projectId: string;
  materialType: string;
  description: string;
  currentStock: number;
  unit: string;
  location: string;
  lastUpdated: string;
  updatedBy: string;
};

const MATERIAL_DELIVERIES_STORAGE_KEY = "kbm_operations_material_deliveries";
const MATERIAL_STOCKPILES_STORAGE_KEY = "kbm_operations_material_stockpiles";

export const getMaterialDeliveriesFromStorage = (): MaterialDelivery[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(MATERIAL_DELIVERIES_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as MaterialDelivery[]) : [];
  } catch (error) {
    console.error("Failed to load material deliveries:", error);
    return [];
  }
};

export const saveMaterialDeliveriesToStorage = (deliveries: MaterialDelivery[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MATERIAL_DELIVERIES_STORAGE_KEY, JSON.stringify(deliveries));
  } catch (error) {
    console.error("Failed to save material deliveries:", error);
  }
};

export const getMaterialStockpilesFromStorage = (): MaterialStockpile[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(MATERIAL_STOCKPILES_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as MaterialStockpile[]) : [];
  } catch (error) {
    console.error("Failed to load material stockpiles:", error);
    return [];
  }
};

export const saveMaterialStockpilesToStorage = (stockpiles: MaterialStockpile[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MATERIAL_STOCKPILES_STORAGE_KEY, JSON.stringify(stockpiles));
  } catch (error) {
    console.error("Failed to save material stockpiles:", error);
  }
};

// =============================================================================
// QUALITY TESTING RECORDS
// =============================================================================

export type QualityTest = {
  id: string;
  projectId: string;
  testType: "concrete-cube" | "concrete-slump" | "compaction" | "drainage-pressure" | "drainage-camera" | "soil-bearing" | "other";
  testDate: string;
  location: string;
  description: string;
  specification: string; // Required value/standard
  result: string; // Actual result
  status: "pass" | "fail" | "pending" | "conditional";
  testedBy: string;
  witnessedBy?: string;
  certificateNumber?: string;
  photos?: string[]; // Photo IDs
  documents?: string[]; // Document IDs
  notes?: string;
  remedialAction?: string;
};

const QUALITY_TESTS_STORAGE_KEY = "kbm_operations_quality_tests";

export const getQualityTestsFromStorage = (): QualityTest[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(QUALITY_TESTS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as QualityTest[]) : [];
  } catch (error) {
    console.error("Failed to load quality tests:", error);
    return [];
  }
};

export const saveQualityTestsToStorage = (tests: QualityTest[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUALITY_TESTS_STORAGE_KEY, JSON.stringify(tests));
  } catch (error) {
    console.error("Failed to save quality tests:", error);
  }
};

export const getQualityTestsForProject = (projectId: string): QualityTest[] => {
  return getQualityTestsFromStorage().filter(t => t.projectId === projectId);
};

// =============================================================================
// SETTING OUT & SURVEY RECORDS
// =============================================================================

export type SurveyRecord = {
  id: string;
  projectId: string;
  surveyType: "setting-out" | "as-built" | "level-check" | "volume-calc" | "dimension-check";
  surveyDate: string;
  location: string;
  description: string;
  surveyedBy: string;
  witnessedBy?: string;
  benchmarkUsed: string;
  coordinates: Array<{
    point: string;
    easting: number;
    northing: number;
    level: number;
    description?: string;
  }>;
  accuracy: number; // in mm
  equipmentUsed?: string;
  drawingReference?: string;
  notes?: string;
};

const SURVEY_RECORDS_STORAGE_KEY = "kbm_operations_survey_records";

export const getSurveyRecordsFromStorage = (): SurveyRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(SURVEY_RECORDS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as SurveyRecord[]) : [];
  } catch (error) {
    console.error("Failed to load survey records:", error);
    return [];
  }
};

export const saveSurveyRecordsToStorage = (records: SurveyRecord[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SURVEY_RECORDS_STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("Failed to save survey records:", error);
  }
};

export const getSurveyRecordsForProject = (projectId: string): SurveyRecord[] => {
  return getSurveyRecordsFromStorage().filter(r => r.projectId === projectId);
};

// =============================================================================
// PAYMENT APPLICATIONS
// =============================================================================

const PAYMENT_APPLICATIONS_STORAGE_KEY = "kbm_operations_payment_applications";

export const getPaymentApplicationsFromStorage = (): InvoiceApplication[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(PAYMENT_APPLICATIONS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as InvoiceApplication[]) : [];
  } catch (error) {
    console.error("Failed to load payment applications:", error);
    return [];
  }
};

export const savePaymentApplicationsToStorage = (applications: InvoiceApplication[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PAYMENT_APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
  } catch (error) {
    console.error("Failed to save payment applications:", error);
  }
};

export const getPaymentApplicationsForProject = (projectId: string): InvoiceApplication[] => {
  return getPaymentApplicationsFromStorage().filter(a => a.projectId === projectId);
};
// ============================================================================
// PROJECT BOQ LINE ITEMS - Storage and Management
// ============================================================================

const PROJECT_BOQ_LINE_ITEMS_STORAGE_KEY = "kbm_operations_project_boq_line_items";

export const getProjectBoQLineItemsFromStorage = (): ProjectBoQLineItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(PROJECT_BOQ_LINE_ITEMS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to retrieve project BoQ line items:", error);
    return [];
  }
};

export const saveProjectBoQLineItemsToStorage = (items: ProjectBoQLineItem[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROJECT_BOQ_LINE_ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save project BoQ line items:", error);
  }
};

export const getProjectBoQLineItemsForProject = (projectId: string): ProjectBoQLineItem[] => {
  return getProjectBoQLineItemsFromStorage().filter(item => item.projectId === projectId);
};

export const addProjectBoQLineItemClaim = (
  projectId: string,
  boqItemId: string,
  quantityClaimed?: number,
  percentageComplete?: number,
  variations?: Array<{ voNumber: string; adjustedQuantity?: number; adjustedRate?: number; adjustedAmount?: number }>
): void => {
  const items = getProjectBoQLineItemsFromStorage();
  const existingItem = items.find(i => i.projectId === projectId && i.boqItemId === boqItemId);

  if (existingItem) {
    if (quantityClaimed !== undefined) existingItem.quantityClaimed = quantityClaimed;
    if (percentageComplete !== undefined) existingItem.percentageComplete = percentageComplete;
    if (percentageComplete !== undefined) {
      existingItem.amountClaimedByPercentage = (existingItem.originalAmount * percentageComplete) / 100;
    }
    if (variations) existingItem.variations = variations;
  }

  saveProjectBoQLineItemsToStorage(items);
};

export const deleteProjectBoQLineItem = (projectId: string, boqItemId: string): void => {
  const items = getProjectBoQLineItemsFromStorage();
  const filtered = items.filter(i => !(i.projectId === projectId && i.boqItemId === boqItemId));
  saveProjectBoQLineItemsToStorage(filtered);
};

export const createProjectBoQLineItems = (
  projectId: string,
  boqItems: BoQItem[]
): void => {
  const items = getProjectBoQLineItemsFromStorage();
  
  boqItems.forEach(boqItem => {
    const existingItem = items.find(i => i.projectId === projectId && i.boqItemId === boqItem.id);
    
    if (!existingItem) {
      const newItem: ProjectBoQLineItem = {
        id: `boq-item-${projectId}-${boqItem.id}-${Date.now()}`,
        projectId,
        boqItemId: boqItem.id,
        itemNumber: boqItem.itemNumber,
        description: boqItem.description,
        unit: boqItem.unit,
        originalQuantity: boqItem.quantity,
        rate: boqItem.rate,
        originalAmount: boqItem.amount,
        quantityClaimed: 0,
        amountClaimed: 0,
        percentageComplete: 0,
        amountClaimedByPercentage: 0,
        variations: []
      };
      items.push(newItem);
    }
  });

  saveProjectBoQLineItemsToStorage(items);
};

export const calculateProjectBoQSummary = (projectId: string): {
  totalAmount: number;
  totalClaimed: number;
  outstanding: number;
  averagePercentageComplete: number;
} => {
  const items = getProjectBoQLineItemsForProject(projectId);
  
  const totalAmount = items.reduce((sum, item) => sum + item.originalAmount, 0);
  const totalClaimed = items.reduce((sum, item) => sum + (item.amountClaimed || item.amountClaimedByPercentage || 0), 0);
  const outstanding = totalAmount - totalClaimed;
  const averagePercentageComplete = items.length > 0
    ? Math.round(items.reduce((sum, item) => sum + (item.percentageComplete || 0), 0) / items.length)
    : 0;

  return {
    totalAmount,
    totalClaimed,
    outstanding,
    averagePercentageComplete
  };
};

// ============================================================================
// BILL OF QUANTITIES - Storage and Management
// ============================================================================

const BILL_OF_QUANTITIES_STORAGE_KEY = "kbm_operations_bill_of_quantities";

export const getBillOfQuantitiesFromStorage = (): BillOfQuantities[] => {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(BILL_OF_QUANTITIES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to retrieve bill of quantities:", error);
    return [];
  }
};

export const saveBillOfQuantitiesToStorage = (boqs: BillOfQuantities[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BILL_OF_QUANTITIES_STORAGE_KEY, JSON.stringify(boqs));
  } catch (error) {
    console.error("Failed to save bill of quantities:", error);
  }
};

export const getBillOfQuantitiesForProject = (projectId: string): BillOfQuantities | undefined => {
  return getBillOfQuantitiesFromStorage().find(boq => boq.projectId === projectId);
};

export const createOrUpdateBillOfQuantities = (boq: BillOfQuantities): void => {
  const boqs = getBillOfQuantitiesFromStorage();
  const existingIndex = boqs.findIndex(b => b.id === boq.id);
  
  if (existingIndex >= 0) {
    boqs[existingIndex] = boq;
  } else {
    boqs.push(boq);
  }
  
  saveBillOfQuantitiesToStorage(boqs);
};

export const createBillOfQuantitiesFromBoQItems = (
  projectId: string,
  projectName: string,
  boqItems: BoQItem[]
): BillOfQuantities => {
  const subtotal = boqItems.reduce((sum, item) => sum + item.amount, 0);
  const contingencyPercent = 5;
  const contingency = (subtotal * contingencyPercent) / 100;
  const total = subtotal + contingency;

  const boq: BillOfQuantities = {
    id: `BOQ-${projectId}-${Date.now()}`,
    projectId,
    projectName,
    standard: "SMM7",
    title: `Bill of Quantities - ${projectName}`,
    date: new Date().toISOString().split('T')[0],
    preparedBy: "QS/Estimating Team",
    items: boqItems,
    sections: [], // Could be organized by section if needed
    subtotal,
    contingency,
    contingencyPercent,
    total,
    status: "priced",
  };

  return boq;
};