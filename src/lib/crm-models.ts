/**
 * CRM Data Models
 * Comprehensive CRM system similar to Salesforce
 */

// ===== LEAD MANAGEMENT =====

export type LeadSource = 'Website' | 'Referral' | 'Tender Portal' | 'Cold Call' | 'LinkedIn' | 'Trade Show' | 'Email Campaign' | 'Partner' | 'Other';
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Unqualified' | 'Converted';
export type LeadRating = 'Hot' | 'Warm' | 'Cold';

export interface Lead {
  id: string;
  company: string;
  contactName: string;
  title: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  rating: LeadRating;
  estimatedValue: number;
  estimatedCloseDate: string;
  industry: string;
  address: string;
  city: string;
  postcode: string;
  website?: string;
  description: string;
  assignedTo: string;
  createdDate: string;
  lastContactDate?: string;
  convertedDate?: string;
  convertedToAccountId?: string;
  convertedToContactId?: string;
  convertedToOpportunityId?: string;
  notes: string;
}

// ===== ACCOUNT (COMPANY) MANAGEMENT =====

export type AccountType = 'Prospect' | 'Customer' | 'Partner' | 'Competitor';
export type Industry = 'Construction' | 'Infrastructure' | 'Residential' | 'Commercial' | 'Industrial' | 'Public Sector' | 'Energy' | 'Transport' | 'Other';

export interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  industry: Industry;
  website?: string;
  phone: string;
  parentAccountId?: string;
  billingAddress: string;
  billingCity: string;
  billingPostcode: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostcode?: string;
  description: string;
  employees?: number;
  annualRevenue?: number;
  accountOwner: string;
  createdDate: string;
  lastActivityDate?: string;
  rating?: number;
}

// ===== CONTACT MANAGEMENT =====

export interface Contact {
  id: string;
  accountId: string;
  firstName: string;
  lastName: string;
  title: string;
  department?: string;
  email: string;
  phone: string;
  mobile?: string;
  linkedIn?: string;
  isPrimaryContact: boolean;
  isDecisionMaker: boolean;
  mailingAddress?: string;
  mailingCity?: string;
  mailingPostcode?: string;
  birthdate?: string;
  assistant?: string;
  assistantPhone?: string;
  reportsToContactId?: string;
  description: string;
  contactOwner: string;
  createdDate: string;
  lastActivityDate?: string;
}

// ===== OPPORTUNITY/DEAL PIPELINE =====

export type OpportunityStage = 
  | 'Prospecting' 
  | 'Qualification' 
  | 'Needs Analysis' 
  | 'Proposal Submitted' 
  | 'Negotiation' 
  | 'Closed Won' 
  | 'Closed Lost';

export type OpportunityType = 'New Business' | 'Existing Business' | 'Renewal';
export type LeadSource_Opp = LeadSource; // Reuse the same sources

export interface Opportunity {
  id: string;
  name: string;
  accountId: string;
  amount: number;
  closeDate: string;
  stage: OpportunityStage;
  probability: number; // 0-100
  type: OpportunityType;
  leadSource: LeadSource_Opp;
  description: string;
  nextStep: string;
  competitorAnalysis?: string;
  painPoints?: string;
  proposedSolution?: string;
  opportunityOwner: string;
  createdDate: string;
  lastModifiedDate: string;
  expectedRevenue: number; // amount * probability
  isClosed: boolean;
  isWon: boolean;
  lostReason?: string;
  lostToCompetitor?: string;
}

// Stage probability mapping (similar to Salesforce defaults)
export const STAGE_PROBABILITY_MAP: Record<OpportunityStage, number> = {
  'Prospecting': 10,
  'Qualification': 20,
  'Needs Analysis': 40,
  'Proposal Submitted': 60,
  'Negotiation': 80,
  'Closed Won': 100,
  'Closed Lost': 0,
};

// ===== ACTIVITY & INTERACTION TRACKING =====

export type ActivityType = 'Call' | 'Email' | 'Meeting' | 'Task' | 'Note' | 'Site Visit';
export type ActivityStatus = 'Planned' | 'In Progress' | 'Completed' | 'Cancelled';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description: string;
  relatedToType: 'Lead' | 'Account' | 'Contact' | 'Opportunity';
  relatedToId: string;
  relatedToName: string; // for display
  status: ActivityStatus;
  priority?: TaskPriority;
  assignedTo: string;
  dueDate?: string;
  dueTime?: string;
  completedDate?: string;
  duration?: number; // minutes
  outcome?: string;
  createdDate: string;
  createdBy: string;
  reminderSet?: boolean;
  reminderDateTime?: string;
}

// ===== CAMPAIGN MANAGEMENT =====

export type CampaignType = 'Email' | 'Webinar' | 'Trade Show' | 'Direct Mail' | 'Social Media' | 'Other';
export type CampaignStatus = 'Planning' | 'Active' | 'Completed' | 'Cancelled';

export interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate?: string;
  budget: number;
  actualCost: number;
  expectedRevenue: number;
  expectedResponse: number;
  description: string;
  targetAudience: string;
  campaignOwner: string;
  leadsGenerated: number;
  opportunitiesCreated: number;
  dealsWonCount: number;
  createdDate: string;
}

// ===== SALES FORECASTING =====

export interface ForecastPeriod {
  period: string; // e.g., "Q1 2026", "March 2026"
  pipelineValue: number;
  weightedValue: number; // sum of (amount * probability)
  bestCase: number;
  worstCase: number;
  committed: number; // opportunities at 80%+ probability
  closed: number;
  quota: number;
}

// ===== CRM METRICS & ANALYTICS =====

export interface CRMMetrics {
  totalLeads: number;
  newLeadsThisMonth: number;
  leadConversionRate: number; // percentage
  averageLeadResponseTime: number; // hours
  totalOpportunities: number;
  openOpportunities: number;
  totalPipelineValue: number;
  weightedPipelineValue: number;
  averageDealSize: number;
  winRate: number; // percentage
  averageSalesCycle: number; // days
  dealsWonThisMonth: number;
  dealsLostThisMonth: number;
  revenueThisMonth: number;
  forecastThisQuarter: number;
}

// ===== HELPER FUNCTIONS =====

export function calculateProbability(stage: OpportunityStage): number {
  return STAGE_PROBABILITY_MAP[stage];
}

export function calculateExpectedRevenue(amount: number, probability: number): number {
  return amount * (probability / 100);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getStageColor(stage: OpportunityStage): string {
  const colors: Record<OpportunityStage, string> = {
    'Prospecting': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    'Qualification': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'Needs Analysis': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'Proposal Submitted': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'Negotiation': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Closed Won': 'bg-green-500/20 text-green-300 border-green-500/30',
    'Closed Lost': 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  return colors[stage];
}

export function getLeadRatingColor(rating: LeadRating): string {
  const colors: Record<LeadRating, string> = {
    'Hot': 'bg-red-500/20 text-red-300 border-red-500/30',
    'Warm': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'Cold': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  };
  return colors[rating];
}

export function getActivityTypeIcon(type: ActivityType): string {
  const icons: Record<ActivityType, string> = {
    'Call': '📞',
    'Email': '📧',
    'Meeting': '👥',
    'Task': '✓',
    'Note': '📝',
    'Site Visit': '🏗️',
  };
  return icons[type];
}

export function calculateDaysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getNextStageRecommendation(currentStage: OpportunityStage): string {
  const recommendations: Record<OpportunityStage, string> = {
    'Prospecting': 'Schedule discovery call to qualify the opportunity',
    'Qualification': 'Conduct needs analysis meeting with key stakeholders',
    'Needs Analysis': 'Prepare and submit detailed proposal',
    'Proposal Submitted': 'Follow up and address questions, begin negotiation',
    'Negotiation': 'Finalize terms and close the deal',
    'Closed Won': 'Begin project onboarding and handoff',
    'Closed Lost': 'Request feedback and add to nurture campaign',
  };
  return recommendations[currentStage];
}
