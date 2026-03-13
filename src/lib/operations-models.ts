// =============================================================================
// CONSTRUCTION OPERATIONS MANAGEMENT MODELS
// =============================================================================
// Comprehensive type definitions for managing construction projects from
// estimating handover through to final invoicing and project closeout
// =============================================================================

export type ProjectStage =
  | "handover"        // Just received from estimating
  | "mobilisation"    // Site setup, team allocation, pre-start
  | "active"          // Construction in progress
  | "snagging"        // Defects/completion items
  | "practical"       // Practical completion achieved
  | "defects"         // Defects liability period
  | "final"           // Final account/closeout
  | "complete";       // Fully closed

export type DocumentCategory =
  | "contract"          // Contracts, LOIs, tender docs
  | "design"            // Drawings, specifications
  | "method-statement"  // RAMS, method statements
  | "inspection"        // Inspection reports, test certificates
  | "site-diary"        // Daily site records
  | "correspondence"    // Letters, emails, meeting minutes
  | "variation"         // Variation orders, change requests
  | "photo"             // Site photography
  | "health-safety"     // H&S documentation
  | "quality"           // Quality assurance records
  | "delivery"          // Delivery notes, material receipts
  | "invoice"           // Invoices, payment applications
  | "closeout";         // Handover docs, O&M manuals

export type InvoiceStage =
  | "not-started"       // No invoices yet
  | "interim"           // Interim payments in progress
  | "retention"         // Retention held
  | "final-submitted"   // Final account submitted
  | "final-agreed"      // Final account agreed
  | "retention-released" // Retention released
  | "complete";         // All payments received

export type ProgressMilestone = {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  actualDate?: string;
  status: "not-started" | "in-progress" | "complete" | "overdue";
  percentage: number;
  responsible: string;
  notes?: string;
};

export type ProjectDocument = {
  id: string;
  projectId: string;
  category: DocumentCategory;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedDate: string;
  tags: string[];
  relatedMilestone?: string;
  issuedRevision?: string;
  currentRevision?: string;
  status: "draft" | "issued" | "approved" | "superseded" | "archived";
};

export type SitePhoto = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  takenBy: string;
  takenDate: string;
  location?: {
    lat: number;
    lng: number;
    area?: string; // e.g., "Ground Floor East Wing"
  };
  tags: string[];
  relatedDocument?: string;
  relatedMilestone?: string;
  thumbnail?: string;
};

export type SiteDiaryEntry = {
  id: string;
  projectId: string;
  date: string;
  weather: {
    condition: "dry" | "rain" | "snow" | "wind" | "frost";
    temperature?: number;
    notes?: string;
  };
  labour: {
    ownStaff: number;
    subcontractors: number;
    visitors: number;
  };
  plant: {
    onSite: string[]; // Array of plant IDs or names
    offSite: string[];
  };
  workCarriedOut: string;
  materialsDelivered?: string[];
  visitorsToSite?: Array<{
    name: string;
    company: string;
    purpose: string;
  }>;
  incidentsOrIssues?: string;
  tomorrowsWork?: string;
  photosAttached: string[]; // Array of photo IDs
  enteredBy: string;
  enteredAt: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
};

export type ProjectHandover = {
  id: string;
  projectId: string;
  estimateId: string;
  enquiryId?: string;
  client: string;
  projectName: string;
  projectAddress?: string;
  contractValue: number;
  contractType: "lump-sum" | "remeasure" | "cost-plus" | "target-cost";
  quoteRef?: string;
  quoteTotal?: number;
  marginPercent?: number;
  submittedDate?: string;
  dueDate?: string;
  receivedDate?: string;
  estimateStatus?: "new-assignment" | "in-progress" | "quote-submitted" | "won" | "lost";
  estimateProgress?: number;
  estimator?: string;
  assignedTo?: string;
  outcome?: string;
  estimateNotes?: string;
  drawingFiles?: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    uploadedAt: string;
    dataUrl: string;
  }>;
  boqItems?: Array<{
    id: string;
    itemNumber: string;
    description: string;
    unit: string;
    quantity: number;
    rate: number;
    amount: number;
    standard: "SMM7" | "CESMM" | "SHW";
    section?: string;
    notes?: string;
  }>;
  startDate: string;
  duration: number; // in weeks
  completionDate: string;
  
  // Handover details
  handoverDate: string;
  handoverFromUser: string;
  handoverToUser?: string; // Project Manager assigned
  handoverNotes?: string;
  orderNumber?: string;
  contractFileName?: string;
  invoiceAddress?: string;
  paymentTerms?: string;
  handoverStatus: "pending" | "accepted" | "rejected" | "queries";
  
  // Key documents from estimating
  tender: boolean;
  contractSigned: boolean;
  insuranceInPlace: boolean;
  bondRequired: boolean;
  bondInPlace?: boolean;
  
  // Pre-start requirements
  riskAssessment: boolean;
  methodStatements: boolean;
  siteSetupPlan: boolean;
  resourceAllocation: boolean;
  supplierOrdersPlaced: boolean;
  
  acceptedAt?: string;
};

export type ConstructionProject = {
  id: string;
  projectCode: string;
  estimateId: string;
  boqId?: string; // Link to Bill of Quantities for claims tracking
  
  // Basic info
  projectName: string;
  client: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
  };
  siteAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    lat?: number;
    lng?: number;
  };

  orderNumber?: string;
  contractFileName?: string;
  invoiceAddress?: string;
  paymentTerms?: string;
  handoverNotes?: string;
  
  // Contract details
  contractValue: number;
  contractType: "lump-sum" | "remeasure" | "cost-plus" | "target-cost";
  contractStartDate: string;
  contractCompletionDate: string;
  contractDuration: number; // weeks
  liquidatedDamages?: number; // per week
  retentionPercentage: number;
  retentionLimit?: number;
  
  // Current status
  stage: ProjectStage;
  overallProgress: number; // 0-100
  daysToCompletion: number;
  onProgramme: boolean;
  
  // Team
  projectManager: string;
  siteManager?: string;
  contractsManager?: string;
  healthSafetyOfficer?: string;
  team: Array<{
    userId: string;
    name: string;
    role: string;
  }>;
  
  // Financial
  valuationToDate: number;
  costToDate: number;
  forecastFinalCost: number;
  grossProfit: number;
  grossProfitPercentage: number;
  invoiceStage: InvoiceStage;
  lastInvoiceDate?: string;
  nextInvoiceDate?: string;
  
  // Milestones
  milestones: ProgressMilestone[];
  
  // Documents & photos
  documentCount: number;
  photoCount: number;
  siteDiaryCount: number;
  
  // Risk & quality
  riskLevel: "low" | "medium" | "high" | "critical";
  qualityScore?: number; // 0-100
  safetyScore?: number; // 0-100
  
  // Flags
  hasVariations: boolean;
  hasDelays: boolean;
  hasDefects: boolean;
  requiresAttention: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type ProjectBoQLineItem = {
  id: string;
  projectId: string;
  boqItemId: string;
  itemNumber: string;
  description: string;
  unit: string;
  originalQuantity: number;
  rate: number; // £ per unit
  originalAmount: number; // quantity × rate
  
  // Progress tracking
  quantityClaimed: number; // Total quantity claimed to date
  amountClaimed: number; // quantityClaimed × rate
  percentageComplete: number; // 0-100, used instead of quantity for some items
  amountClaimedByPercentage: number; // If using percentage method
  
  // Variations
  variations: Array<{
    voNumber: string;
    adjustedQuantity?: number;
    adjustedRate?: number;
    adjustedAmount?: number;
  }>;
};

export type InvoiceLineItem = {
  id: string;
  projectBoQLineItemId: string; // Link to BoQ line item
  description: string;
  unit: string;
  quantity: number;
  claimedQuantity?: number; // For this period only
  percentageComplete?: number; // For this period only
  rate: number;
  claimedAmount: number; // Amount being claimed in this application
};

export type InvoiceApplication = {
  id: string;
  projectId: string;
  applicationNumber: number;
  period: {
    from: string;
    to: string;
  };
  
  status: "draft" | "submitted" | "certified" | "paid" | "disputed";
  
  // Line items tied to BoQ
  lineItems: InvoiceLineItem[];
  
  // Values
  grossValuation: number;
  retentionDeducted: number;
  previousPayments: number;
  thisPayment: number;
  cumulativePaid: number;
  
  // Certification
  certifiedBy?: string;
  certifiedDate?: string;
  certifiedAmount?: number;
  
  // Payment
  paymentDueDate?: string;
  paidDate?: string;
  paidAmount?: number;
  
  // Documents
  supportingDocs: string[]; // Document IDs
  
  submittedBy: string;
  submittedDate?: string;
  
  notes?: string;
};

export type InvoiceApplicationOld = {
  id: string;
  projectId: string;
  applicationNumber: number;
  period: {
    from: string;
    to: string;
  };
  
  status: "draft" | "submitted" | "certified" | "paid" | "disputed";
  
  // Values
  grossValuation: number;
  retentionDeducted: number;
  previousPayments: number;
  thisPayment: number;
  cumulativePaid: number;
  
  // Certification
  certifiedBy?: string;
  certifiedDate?: string;
  certifiedAmount?: number;
  
  // Payment
  paymentDueDate?: string;
  paidDate?: string;
  paidAmount?: number;
  
  // Documents
  supportingDocs: string[]; // Document IDs
  
  submittedBy: string;
  submittedDate?: string;
  
  notes?: string;
};

export type VariationOrder = {
  id: string;
  projectId: string;
  voNumber: string;
  
  title: string;
  description: string;
  reason: "client-change" | "design-development" | "site-conditions" | "error-omission" | "other";
  
  status: "draft" | "submitted" | "priced" | "approved" | "rejected" | "completed";
  
  // Financial
  estimatedValue: number;
  quotedValue?: number;
  approvedValue?: number;
  actualCost?: number;
  
  // Dates
  raisedDate: string;
  raisedBy: string;
  requiredBy?: string;
  approvedDate?: string;
  approvedBy?: string;
  completedDate?: string;
  
  // Impact
  programmeImpact: number; // days
  affectsMilestones: string[]; // Milestone IDs
  
  // Documents
  attachedDocs: string[];
  
  // Workflow
  clientApproved?: boolean;
  architectApproved?: boolean;
  internalApproved?: boolean;
  
  notes?: string;
};

export type DefectItem = {
  id: string;
  projectId: string;
  defectNumber: string;
  
  category: "snagging" | "defect" | "safety" | "quality" | "design";
  severity: "minor" | "major" | "critical";
  
  description: string;
  location: string;
  raisedBy: string;
  raisedDate: string;
  
  status: "open" | "in-progress" | "completed" | "verified" | "closed" | "deferred";
  
  assignedTo?: string;
  targetDate?: string;
  completedDate?: string;
  verifiedDate?: string;
  verifiedBy?: string;
  
  photos: string[]; // Photo IDs
  cost?: number;
  
  notes?: string;
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function calculateProjectHealth(project: ConstructionProject): {
  score: number;
  status: "excellent" | "good" | "concern" | "critical";
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;
  
  // Check programme
  if (!project.onProgramme) {
    score -= 20;
    issues.push("Behind programme");
  }
  
  // Check profit margin
  if (project.grossProfitPercentage < 5) {
    score -= 15;
    issues.push("Low profit margin");
  }
  
  // Check risk level
  if (project.riskLevel === "high" || project.riskLevel === "critical") {
    score -= 15;
    issues.push(`${project.riskLevel} risk level`);
  }
  
  // Check variations
  if (project.hasVariations) {
    score -= 5;
    issues.push("Active variations");
  }
  
  // Check defects
  if (project.hasDefects) {
    score -= 10;
    issues.push("Outstanding defects");
  }
  
  // Determine status
  let status: "excellent" | "good" | "concern" | "critical";
  if (score >= 90) status = "excellent";
  else if (score >= 75) status = "good";
  else if (score >= 50) status = "concern";
  else status = "critical";
  
  return { score, status, issues };
}

export function getStageColor(stage: ProjectStage): string {
  const colors: Record<ProjectStage, string> = {
    handover: "blue",
    mobilisation: "purple",
    active: "orange",
    snagging: "yellow",
    practical: "cyan",
    defects: "pink",
    final: "green",
    complete: "gray",
  };
  return colors[stage];
}

export function getStageLabel(stage: ProjectStage): string {
  const labels: Record<ProjectStage, string> = {
    handover: "Handover from Estimating",
    mobilisation: "Mobilisation & Setup",
    active: "Active Construction",
    snagging: "Snagging & Completion",
    practical: "Practical Completion",
    defects: "Defects Liability",
    final: "Final Account",
    complete: "Complete & Closed",
  };
  return labels[stage];
}

export function getNextProjectStage(current: ProjectStage): ProjectStage | null {
  const sequence: ProjectStage[] = [
    "handover",
    "mobilisation",
    "active",
    "snagging",
    "practical",
    "defects",
    "final",
    "complete",
  ];
  
  const currentIndex = sequence.indexOf(current);
  if (currentIndex === -1 || currentIndex === sequence.length - 1) {
    return null;
  }
  
  return sequence[currentIndex + 1];
}

export function calculateDaysToCompletion(completionDate: string): number {
  const today = new Date();
  const completion = new Date(completionDate);
  const diffTime = completion.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isProjectOverdue(completionDate: string): boolean {
  return calculateDaysToCompletion(completionDate) < 0;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
