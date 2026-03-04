// =============================================================================
// CONSTRUCTION COMMERCIAL MANAGEMENT MODELS
// =============================================================================
// Comprehensive type definitions for managing commercial activities including
// valuations, variations, procurement, contracts, and cost control
// =============================================================================

export type ValuationStatus = "draft" | "submitted" | "certified" | "part-certified" | "rejected" | "paid";

export type VariationStatus = "draft" | "submitted" | "priced" | "approved" | "rejected" | "completed";

export type VariationImpact = "costs" | "programme" | "both" | "neither";

export type ContractStatus = "draft" | "executed" | "active" | "variation" | "completed" | "terminated";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type ProcurementStage = "tender" | "shortlist" | "evaluation" | "negotiation" | "award" | "order" | "delivery";

export type Valuation = {
  id: string;
  projectId: string;
  applicationRef: string;
  period: string;
  submittedDate: string;
  appliedValue: number;
  certifiedValue: number;
  retentionValue: number;
  paidValue?: number;
  status: ValuationStatus;
  certifier: string;
  certifierCompany: string;
  approvedBy?: string;
  approvedDate?: string;
  paidDate?: string;
  notes?: string;
  attachments: string[];
};

export type CommercialVariation = {
  id: string;
  projectId: string;
  variationRef: string;
  title: string;
  description: string;
  submittedDate: string;
  quotedValue: number;
  approvedValue?: number;
  actualValue?: number;
  status: VariationStatus;
  impact: VariationImpact;
  programmeDaysImpact: number;
  clientApproval: boolean;
  architectApproval: boolean;
  contractorApproval: boolean;
  submittedBy: string;
  approvedBy?: string;
  completedDate?: string;
  notes?: string;
  attachments: string[];
};

export type Contract = {
  id: string;
  projectId: string;
  contractRef: string;
  title: string;
  contractorName: string;
  contractorContact: string;
  contractValue: number;
  startDate: string;
  endDate?: string;
  status: ContractStatus;
  contractType: "lump-sum" | "remeasure" | "cost-plus" | "management" | "design-build";
  retentionPercentage: number;
  retentionValue?: number;
  retentionHeld?: number;
  releaseDate?: string;
  scope: string;
  terms?: string;
  riskLevel: RiskLevel;
  keyContacts: Array<{
    name: string;
    role: string;
    phone: string;
    email: string;
  }>;
  attachments: string[];
};

export type ProcurementPackage = {
  id: string;
  projectId: string;
  packageRef: string;
  title: string;
  description: string;
  scope: string;
  stage: ProcurementStage;
  estimatedValue: number;
  actualValue?: number;
  targetDate: string;
  dueDate: string;
  awardDate?: string;
  deliveredDate?: string;
  suppliers: Array<{
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    quotedPrice?: number;
    selected?: boolean;
  }>;
  status: "pending" | "in-progress" | "awarded" | "delivered" | "closed";
  notes?: string;
  attachments: string[];
};

export type CostReport = {
  id: string;
  projectId: string;
  packageName: string;
  budget: number;
  committed: number;
  forecast: number;
  actual?: number;
  variance: number;
  variancePercentage: number;
  status: "on-track" | "at-risk" | "overrun";
  lastUpdated: string;
  notes?: string;
};

export type CommercialTask = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  bucket: "this-week" | "awaiting-info" | "upcoming";
  dueDate: string;
  assignedTo: string;
  priority: "low" | "medium" | "high";
  status: "open" | "in-progress" | "completed" | "on-hold";
  relatedTo?: "valuation" | "variation" | "procurement" | "contract";
  relatedId?: string;
  completedDate?: string;
  notes?: string;
};

export type CommercialIssue = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  status: "open" | "in-progress" | "resolved" | "closed";
  raisedBy: string;
  raisedDate: string;
  owner: string;
  targetResolutionDate: string;
  resolution?: string;
  resolvedDate?: string;
  impact: string;
  mitigation: string;
};

export type CommercialProject = {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  projectValue: number;
  forecastFinalAccount: number;
  grossMargin: number;
  costToComplete: number;
  valuationsCount: number;
  variationsCount: number;
  contractsCount: number;
  openIssuesCount: number;
  nextMilestone?: string;
  nextMilestoneDate?: string;
  status: "information" | "active" | "complete";
};
