// Payment Application Document Types

export type ApplicationForPayment = {
  id: string;
  projectId: string;
  applicationNumber: number;
  submissionDate: Date;
  periodStart: Date;
  periodEnd: Date;
  
  // Summary
  contractSum: number;
  totalVariations: number;
  adjustedContractSum: number;
  
  // Valuation
  previouslyValued: number;
  thisValuation: number;
  totalValuation: number;
  
  // Deductions
  retentionPercentage: number;
  retentionAmount: number;
  defectsDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  
  // Payment
  grossPayment: number;
  netPayment: number;
  
  // Status & Approvals
  status: 'draft' | 'submitted' | 'reviewed' | 'approved' | 'paid';
  contractorSigned: boolean;
  architectSigned: boolean;
  clientApproved: boolean;
  paymentDate?: Date;
  paymentReference?: string;
  
  // Details
  description: string;
  notes: string;
  
  // Line items breakdown
  lineItems: ApplicationLineItem[];
};

export type ApplicationLineItem = {
  id: string;
  applicationId: string;
  boqItemId: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  contractAmount: number;
  
  // Progress tracking
  previouslyClaimed: number;
  thisApplicationClaimed: number;
  totalClaimed: number;
  outstandingAmount: number;
};

export type FinalAccount = {
  id: string;
  projectId: string;
  dateGenerated: Date;
  
  // Contract Summary
  originalContractSum: number;
  authorizedVariations: number;
  contractualAdjustments: number;
  finalContractSum: number;
  
  // Payments
  totalClaimedToDate: number;
  retentionHeld: number;
  totalNetPayments: number;
  
  // Outstanding
  finalBalance: number;
  retentionToBeReleased: number;
  
  // Variations Detail
  variations: VariationDetail[];
  
  // Project Details
  projectName: string;
  client: string;
  contractor: string;
  startDate: Date;
  completionDate: Date;
  valueOfWorkCompleted: number;
  
  // Sign-off
  signedByContractor: boolean;
  signedByArchitect: boolean;
  contractorSignDate?: Date;
  architectSignDate?: Date;
};

export type VariationDetail = {
  id: string;
  variationNumber: string;
  description: string;
  dateIssued: Date;
  status: 'approved' | 'pending' | 'rejected';
  amount: number;
  approvedAmount?: number;
  reason: string;
};

export type RetentionRelease = {
  id: string;
  projectId: string;
  applicationId?: string;
  releaseDate: Date;
  retentionPercentage: number;
  retentionAmount: number;
  reason: 'interim' | 'defects-clearance' | 'final-completion' | 'partial';
  approvedBy: string;
};

// Formatting helper
export function formatCurrencyUK(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDateUK(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function calculateTotals(app: ApplicationForPayment) {
  return {
    contractSum: app.contractSum,
    variations: app.totalVariations,
    adjustedSum: app.adjustedContractSum,
    previouslyValued: app.previouslyValued,
    thisValuation: app.thisValuation,
    totalValuation: app.totalValuation,
    retention: app.retentionAmount,
    netPayable: app.netPayment
  };
}
