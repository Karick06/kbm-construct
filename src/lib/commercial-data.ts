// =============================================================================
// COMMERCIAL SAMPLE DATA
// =============================================================================
// Sample commercial data for development and demonstration
// =============================================================================

import {
  Valuation,
  CommercialVariation,
  Contract,
  ProcurementPackage,
  CostReport,
  CommercialTask,
  CommercialIssue,
  CommercialProject,
} from "./commercial-models";

// Sample Valuations
export const sampleValuations: Valuation[] = [
  {
    id: "VAL-001",
    projectId: "PRJ-2502",
    applicationRef: "APP-M01",
    period: "January 2025",
    submittedDate: "2025-02-05",
    appliedValue: 450000,
    certifiedValue: 420000,
    retentionValue: 42000,
    paidValue: 378000,
    status: "paid",
    certifier: "John Smith",
    certifierCompany: "Quantity Surveyors Ltd",
    approvedBy: "Sarah Johnson",
    approvedDate: "2025-02-08",
    paidDate: "2025-02-15",
    notes: "Standard monthly valuation, all documentation received",
    attachments: ["APP-M01-application.pdf", "APP-M01-supporting.pdf"],
  },
  {
    id: "VAL-002",
    projectId: "PRJ-2502",
    applicationRef: "APP-M02",
    period: "February 2025",
    submittedDate: "2025-03-05",
    appliedValue: 480000,
    certifiedValue: 460000,
    retentionValue: 46000,
    status: "certified",
    certifier: "John Smith",
    certifierCompany: "Quantity Surveyors Ltd",
    approvedBy: "Sarah Johnson",
    approvedDate: "2025-03-10",
    notes: "Minor query on plant rates - resolved",
    attachments: ["APP-M02-application.pdf"],
  },
  {
    id: "VAL-003",
    projectId: "PRJ-2502",
    applicationRef: "APP-M03",
    period: "March 2025",
    submittedDate: "2025-04-02",
    appliedValue: 520000,
    certifiedValue: 0,
    retentionValue: 0,
    status: "submitted",
    certifier: "John Smith",
    certifierCompany: "Quantity Surveyors Ltd",
    notes: "Awaiting certification review",
    attachments: ["APP-M03-application.pdf", "APP-M03-timesheets.pdf", "APP-M03-invoices.pdf"],
  },
];

// Sample Variations
export const sampleVariations: CommercialVariation[] = [
  {
    id: "VAR-001",
    projectId: "PRJ-2502",
    variationRef: "VO-2025-001",
    title: "Additional foundations due to soil conditions",
    description: "Additional excavation and deeper foundations required following trial pits",
    submittedDate: "2025-02-01",
    quotedValue: 85000,
    approvedValue: 80000,
    actualValue: 78500,
    status: "completed",
    impact: "costs",
    programmeDaysImpact: 0,
    clientApproval: true,
    architectApproval: true,
    contractorApproval: true,
    submittedBy: "Mike Wilson",
    approvedBy: "Sarah Johnson",
    completedDate: "2025-03-15",
    notes: "Completed under estimate",
    attachments: ["VAR-001-quote.pdf", "VAR-001-approval.pdf"],
  },
  {
    id: "VAR-002",
    projectId: "PRJ-2502",
    variationRef: "VO-2025-002",
    title: "Specification upgrade - fascia panels",
    description: "Client requested upgrade from standard to premium fascia panels",
    submittedDate: "2025-02-15",
    quotedValue: 45000,
    approvedValue: 45000,
    status: "approved",
    impact: "costs",
    programmeDaysImpact: 0,
    clientApproval: true,
    architectApproval: true,
    contractorApproval: true,
    submittedBy: "Mike Wilson",
    approvedBy: "Sarah Johnson",
    notes: "Approved and ready for implementation",
    attachments: ["VAR-002-quote.pdf", "VAR-002-spec.pdf"],
  },
  {
    id: "VAR-003",
    projectId: "PRJ-2502",
    variationRef: "VO-2025-003",
    title: "Programme extension - weather delays",
    description: "Additional weeks required due to adverse weather conditions",
    submittedDate: "2025-03-20",
    quotedValue: 125000,
    status: "submitted",
    impact: "both",
    programmeDaysImpact: 14,
    clientApproval: false,
    architectApproval: false,
    contractorApproval: true,
    submittedBy: "Mike Wilson",
    notes: "Awaiting client and architect review",
    attachments: ["VAR-003-quote.pdf", "VAR-003-weather-data.pdf"],
  },
];

// Sample Contracts
export const sampleContracts: Contract[] = [
  {
    id: "CON-001",
    projectId: "PRJ-2502",
    contractRef: "CON-MAIN-001",
    title: "Main Contract - A12 Road Upgrade",
    contractorName: "BuildCorp Construction Ltd",
    contractorContact: "Jim Parker",
    contractValue: 6500000,
    startDate: "2024-12-01",
    endDate: "2025-09-30",
    status: "active",
    contractType: "lump-sum",
    retentionPercentage: 10,
    retentionValue: 650000,
    retentionHeld: 580000,
    scope: "Ground works, asphalt and surface finishing for A12 corridor",
    riskLevel: "medium",
    keyContacts: [
      {
        name: "Jim Parker",
        role: "Project Manager",
        phone: "01234 567890",
        email: "jim.parker@buildcorp.com",
      },
      {
        name: "Dave Smith",
        role: "Site Manager",
        phone: "01234 567891",
        email: "dave.smith@buildcorp.com",
      },
    ],
    attachments: ["CON-MAIN-001.pdf", "SPEC-001.pdf"],
  },
  {
    id: "CON-002",
    projectId: "PRJ-2502",
    contractRef: "CON-ASPHALT-001",
    title: "Asphalt Supply and Laying",
    contractorName: "Tarmac Contractors Ltd",
    contractorContact: "Rachel Green",
    contractValue: 850000,
    startDate: "2025-03-01",
    endDate: "2025-06-30",
    status: "active",
    contractType: "remeasure",
    retentionPercentage: 5,
    retentionValue: 42500,
    retentionHeld: 32000,
    scope: "Supply and laying of asphalt wearing course",
    riskLevel: "low",
    keyContacts: [
      {
        name: "Rachel Green",
        role: "Commercial Manager",
        phone: "01246 555111",
        email: "rachel.green@tarmac.com",
      },
    ],
    attachments: ["CON-ASPHALT-001.pdf"],
  },
];

// Sample Procurement
export const sampleProcurement: ProcurementPackage[] = [
  {
    id: "PROC-001",
    projectId: "PRJ-2502",
    packageRef: "PKG-EXCAVATOR",
    title: "Excavator Hire - 360° CAT 320",
    description: "20-tonne excavator for groundworks phase",
    scope: "Monthly hire with operator",
    stage: "delivery",
    estimatedValue: 125000,
    actualValue: 124500,
    targetDate: "2025-04-30",
    dueDate: "2025-04-15",
    awardDate: "2025-02-10",
    deliveredDate: "2025-03-05",
    suppliers: [
      {
        name: "Plant Hire UK",
        contactPerson: "Tom Brown",
        email: "tom@planthireuk.com",
        phone: "01632 555999",
        quotedPrice: 124500,
        selected: true,
      },
    ],
    status: "delivered",
    notes: "Delivered and operational on site",
    attachments: ["PROC-001-quote.pdf", "PROC-001-delivery.pdf"],
  },
  {
    id: "PROC-002",
    projectId: "PRJ-2502",
    packageRef: "PKG-CONCRETE",
    title: "Ready-Mix Concrete Supply",
    description: "Supply of ready-mix concrete for foundations",
    scope: "Grade C35 concrete with delivery",
    stage: "award",
    estimatedValue: 285000,
    targetDate: "2025-05-15",
    dueDate: "2025-05-01",
    suppliers: [
      {
        name: "Lafarge Concrete",
        contactPerson: "Peter Adams",
        email: "peter@lafarge.co.uk",
        phone: "01902 777666",
        quotedPrice: 285000,
        selected: true,
      },
    ],
    status: "awarded",
    notes: "Order placed, awaiting delivery schedule confirmation",
    attachments: ["PROC-002-quote.pdf", "PROC-002-po.pdf"],
  },
  {
    id: "PROC-003",
    projectId: "PRJ-2502",
    packageRef: "PKG-TRAFFIC",
    title: "Traffic Management Services",
    description: "Traffic management and temporary road signage",
    scope: "Full TM service for 6-month period",
    stage: "evaluation",
    estimatedValue: 185000,
    targetDate: "2025-04-30",
    dueDate: "2025-04-01",
    suppliers: [
      {
        name: "SafeRoute TM",
        contactPerson: "Lisa Johnson",
        email: "lisa@saferoute.com",
        phone: "01633 777888",
        quotedPrice: 185000,
      },
      {
        name: "Traffic Control Ltd",
        contactPerson: "Andrew White",
        email: "andrew@trafficcontrol.com",
        phone: "01634 888999",
        quotedPrice: 195000,
      },
    ],
    status: "pending",
    notes: "Quotes under evaluation, TM plan review pending",
    attachments: ["PROC-003-quote1.pdf", "PROC-003-quote2.pdf"],
  },
];

// Sample Cost Reports
export const sampleCostReports: CostReport[] = [
  {
    id: "COST-001",
    projectId: "PRJ-2502",
    packageName: "Groundworks",
    budget: 2100000,
    committed: 1900000,
    forecast: 2050000,
    actual: 1850000,
    variance: -50000,
    variancePercentage: -2.4,
    status: "on-track",
    lastUpdated: "2025-04-10",
    notes: "Early completion on piling works",
  },
  {
    id: "COST-002",
    projectId: "PRJ-2502",
    packageName: "Asphalt & Surfacing",
    budget: 2300000,
    committed: 2100000,
    forecast: 2350000,
    variance: 50000,
    variancePercentage: 2.2,
    status: "at-risk",
    lastUpdated: "2025-04-10",
    notes: "Material price fluctuation, awaiting supplier confirmation",
  },
  {
    id: "COST-003",
    projectId: "PRJ-2502",
    packageName: "Traffic Management",
    budget: 185000,
    committed: 150000,
    forecast: 185000,
    variance: 0,
    variancePercentage: 0,
    status: "on-track",
    lastUpdated: "2025-04-10",
  },
];

const COST_REPORTS_STORAGE_KEY = "kbm_commercial_cost_reports";

export const getCostReportsFromStorage = (): CostReport[] => {
  if (typeof window === "undefined") return sampleCostReports;
  try {
    const stored = localStorage.getItem(COST_REPORTS_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as CostReport[]) : sampleCostReports;
  } catch (error) {
    console.error("Failed to load cost reports:", error);
    return sampleCostReports;
  }
};

export const saveCostReportsToStorage = (reports: CostReport[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(COST_REPORTS_STORAGE_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error("Failed to save cost reports:", error);
  }
};

// Sample Commercial Tasks
export const sampleCommercialTasks: CommercialTask[] = [
  {
    id: "TASK-001",
    projectId: "PRJ-2502",
    title: "Review March application documentation",
    description: "Check all supporting documents for APP-M03",
    bucket: "this-week",
    dueDate: "2025-04-14",
    assignedTo: "Sarah Johnson",
    priority: "high",
    status: "in-progress",
    relatedTo: "valuation",
    relatedId: "VAL-003",
    notes: "Follow up with site team on labour records",
  },
  {
    id: "TASK-002",
    projectId: "PRJ-2502",
    title: "Obtain client approval for VO-2025-003",
    description: "Chase Metro Council for weather variation approval",
    bucket: "this-week",
    dueDate: "2025-04-16",
    assignedTo: "Mike Wilson",
    priority: "high",
    status: "open",
    relatedTo: "variation",
    relatedId: "VAR-003",
  },
  {
    id: "TASK-003",
    projectId: "PRJ-2502",
    title: "Finalize traffic management contract",
    description: "Review TM proposals and select preferred supplier",
    bucket: "awaiting-info",
    dueDate: "2025-04-20",
    assignedTo: "Sarah Johnson",
    priority: "medium",
    status: "open",
    relatedTo: "procurement",
    relatedId: "PROC-003",
  },
  {
    id: "TASK-004",
    projectId: "PRJ-2502",
    title: "Monthly cost forecast update",
    description: "Update committed costs and forecast for all packages",
    bucket: "upcoming",
    dueDate: "2025-05-01",
    assignedTo: "David Brown",
    priority: "medium",
    status: "open",
  },
];

// Sample Commercial Issues
export const sampleCommercialIssues: CommercialIssue[] = [
  {
    id: "ISSUE-001",
    projectId: "PRJ-2502",
    title: "Material price inflation",
    description: "Asphalt and timber prices have increased 8-12% since tender stage",
    riskLevel: "high",
    status: "open",
    raisedBy: "Mike Wilson",
    raisedDate: "2025-03-15",
    owner: "Sarah Johnson",
    targetResolutionDate: "2025-04-30",
    impact: "Cost forecast shows £180k risk for asphalt package",
    mitigation: "Locking in prices for core materials by month end",
  },
  {
    id: "ISSUE-002",
    projectId: "PRJ-2502",
    title: "Client approval delays",
    description: "Slow approval process for variations causing programme impact",
    riskLevel: "medium",
    status: "in-progress",
    raisedBy: "Dave Thompson",
    raisedDate: "2025-02-20",
    owner: "Mike Wilson",
    targetResolutionDate: "2025-04-30",
    impact: "3 variations awaiting approval, potential 2-week delay",
    mitigation: "Weekly approval meetings established with client",
  },
];

// Sample Commercial Projects
export const sampleCommercialProjects: CommercialProject[] = [
  {
    id: "COMM-001",
    projectId: "PRJ-2502",
    projectName: "A12 Road Upgrade - Metro Council",
    clientName: "Metro Council",
    projectValue: 6500000,
    forecastFinalAccount: 6750000,
    grossMargin: 14.8,
    costToComplete: 2400000,
    valuationsCount: 3,
    variationsCount: 3,
    contractsCount: 2,
    openIssuesCount: 2,
    nextMilestone: "Practical Completion",
    nextMilestoneDate: "2025-09-15",
    status: "active",
  },
  {
    id: "COMM-002",
    projectId: "PRJ-2503",
    projectName: "Stadium Refurbishment - City FC",
    clientName: "City FC",
    projectValue: 4200000,
    forecastFinalAccount: 4150000,
    grossMargin: 12.5,
    costToComplete: 1800000,
    valuationsCount: 4,
    variationsCount: 2,
    contractsCount: 3,
    openIssuesCount: 1,
    nextMilestone: "Handover",
    nextMilestoneDate: "2025-08-31",
    status: "active",
  },
];
