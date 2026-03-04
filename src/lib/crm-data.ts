/**
 * CRM Data Storage Layer
 * LocalStorage management for CRM entities
 */

import {
  type Lead,
  type Account,
  type Contact,
  type Opportunity,
  type Activity,
  type Campaign,
  type CRMMetrics,
  calculateProbability,
  calculateExpectedRevenue,
  calculateDaysSince,
} from './crm-models';

// Storage Keys
const LEADS_KEY = 'kbm_crm_leads';
const ACCOUNTS_KEY = 'kbm_crm_accounts';
const CONTACTS_KEY = 'kbm_crm_contacts';
const OPPORTUNITIES_KEY = 'kbm_crm_opportunities';
const ACTIVITIES_KEY = 'kbm_crm_activities';
const CAMPAIGNS_KEY = 'kbm_crm_campaigns';

// ===== LEADS =====

export function getLeadsFromStorage(): Lead[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LEADS_KEY);
  return data ? JSON.parse(data) : getSampleLeads();
}

export function saveLeadsToStorage(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
}

export function createLead(lead: Omit<Lead, 'id' | 'createdDate'>): Lead {
  const leads = getLeadsFromStorage();
  const newLead: Lead = {
    ...lead,
    id: `LEAD-${Date.now()}`,
    createdDate: new Date().toISOString(),
  };
  leads.push(newLead);
  saveLeadsToStorage(leads);
  return newLead;
}

export function updateLead(leadId: string, updates: Partial<Lead>): void {
  const leads = getLeadsFromStorage();
  const index = leads.findIndex(l => l.id === leadId);
  if (index !== -1) {
    leads[index] = { ...leads[index], ...updates };
    saveLeadsToStorage(leads);
  }
}

export function convertLead(leadId: string): { accountId: string; contactId: string; opportunityId: string } {
  const leads = getLeadsFromStorage();
  const lead = leads.find(l => l.id === leadId);
  if (!lead) throw new Error('Lead not found');

  // Create Account
  const account: Account = {
    id: `ACC-${Date.now()}`,
    name: lead.company,
    accountType: 'Prospect',
    industry: lead.industry as any,
    website: lead.website,
    phone: lead.phone,
    billingAddress: lead.address,
    billingCity: lead.city,
    billingPostcode: lead.postcode,
    description: lead.description,
    accountOwner: lead.assignedTo,
    createdDate: new Date().toISOString(),
  };
  const accounts = getAccountsFromStorage();
  accounts.push(account);
  saveAccountsToStorage(accounts);

  // Create Contact
  const contact: Contact = {
    id: `CON-${Date.now()}`,
    accountId: account.id,
    firstName: lead.contactName.split(' ')[0] || lead.contactName,
    lastName: lead.contactName.split(' ').slice(1).join(' ') || '',
    title: lead.title,
    email: lead.email,
    phone: lead.phone,
    isPrimaryContact: true,
    isDecisionMaker: true,
    description: `Converted from lead ${lead.id}`,
    contactOwner: lead.assignedTo,
    createdDate: new Date().toISOString(),
  };
  const contacts = getContactsFromStorage();
  contacts.push(contact);
  saveContactsToStorage(contacts);

  // Create Opportunity
  const opportunity: Opportunity = {
    id: `OPP-${Date.now()}`,
    name: `${lead.company} - ${new Date().getFullYear()}`,
    accountId: account.id,
    amount: lead.estimatedValue,
    closeDate: lead.estimatedCloseDate,
    stage: 'Qualification',
    probability: calculateProbability('Qualification'),
    type: 'New Business',
    leadSource: lead.source,
    description: lead.description,
    nextStep: 'Conduct needs analysis meeting',
    opportunityOwner: lead.assignedTo,
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
    expectedRevenue: calculateExpectedRevenue(lead.estimatedValue, calculateProbability('Qualification')),
    isClosed: false,
    isWon: false,
  };
  const opportunities = getOpportunitiesFromStorage();
  opportunities.push(opportunity);
  saveOpportunitiesToStorage(opportunities);

  // Update lead status
  updateLead(leadId, {
    status: 'Converted',
    convertedDate: new Date().toISOString(),
    convertedToAccountId: account.id,
    convertedToContactId: contact.id,
    convertedToOpportunityId: opportunity.id,
  });

  return { accountId: account.id, contactId: contact.id, opportunityId: opportunity.id };
}

// ===== ACCOUNTS =====

export function getAccountsFromStorage(): Account[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(ACCOUNTS_KEY);
  return data ? JSON.parse(data) : getSampleAccounts();
}

export function saveAccountsToStorage(accounts: Account[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function createAccount(account: Omit<Account, 'id' | 'createdDate'>): Account {
  const accounts = getAccountsFromStorage();
  const newAccount: Account = {
    ...account,
    id: `ACC-${Date.now()}`,
    createdDate: new Date().toISOString(),
  };
  accounts.push(newAccount);
  saveAccountsToStorage(accounts);
  return newAccount;
}

export function updateAccount(accountId: string, updates: Partial<Account>): void {
  const accounts = getAccountsFromStorage();
  const index = accounts.findIndex(a => a.id === accountId);
  if (index !== -1) {
    accounts[index] = { ...accounts[index], ...updates, lastActivityDate: new Date().toISOString() };
    saveAccountsToStorage(accounts);
  }
}

// ===== CONTACTS =====

export function getContactsFromStorage(): Contact[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CONTACTS_KEY);
  return data ? JSON.parse(data) : getSampleContacts();
}

export function saveContactsToStorage(contacts: Contact[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

export function getContactsByAccount(accountId: string): Contact[] {
  return getContactsFromStorage().filter(c => c.accountId === accountId);
}

export function createContact(contact: Omit<Contact, 'id' | 'createdDate'>): Contact {
  const contacts = getContactsFromStorage();
  const newContact: Contact = {
    ...contact,
    id: `CON-${Date.now()}`,
    createdDate: new Date().toISOString(),
  };
  contacts.push(newContact);
  saveContactsToStorage(contacts);
  return newContact;
}

// ===== OPPORTUNITIES =====

export function getOpportunitiesFromStorage(): Opportunity[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(OPPORTUNITIES_KEY);
  return data ? JSON.parse(data) : getSampleOpportunities();
}

export function saveOpportunitiesToStorage(opportunities: Opportunity[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(OPPORTUNITIES_KEY, JSON.stringify(opportunities));
}

export function getOpportunitiesByAccount(accountId: string): Opportunity[] {
  return getOpportunitiesFromStorage().filter(o => o.accountId === accountId);
}

export function updateOpportunity(oppId: string, updates: Partial<Opportunity>): void {
  const opportunities = getOpportunitiesFromStorage();
  const index = opportunities.findIndex(o => o.id === oppId);
  if (index !== -1) {
    const updated = { ...opportunities[index], ...updates, lastModifiedDate: new Date().toISOString() };
    
    // Auto-calculate probability if stage changed
    if (updates.stage) {
      updated.probability = calculateProbability(updates.stage);
      updated.expectedRevenue = calculateExpectedRevenue(updated.amount, updated.probability);
      updated.isClosed = updates.stage === 'Closed Won' || updates.stage === 'Closed Lost';
      updated.isWon = updates.stage === 'Closed Won';
    }
    
    opportunities[index] = updated;
    saveOpportunitiesToStorage(opportunities);
    
    // Update account last activity
    const accounts = getAccountsFromStorage();
    const accIndex = accounts.findIndex(a => a.id === updated.accountId);
    if (accIndex !== -1) {
      accounts[accIndex].lastActivityDate = new Date().toISOString();
      saveAccountsToStorage(accounts);
    }
  }
}

export function createOpportunity(opp: Omit<Opportunity, 'id' | 'createdDate' | 'lastModifiedDate' | 'expectedRevenue' | 'probability'>): Opportunity {
  const opportunities = getOpportunitiesFromStorage();
  const probability = calculateProbability(opp.stage);
  const newOpp: Opportunity = {
    ...opp,
    id: `OPP-${Date.now()}`,
    probability,
    expectedRevenue: calculateExpectedRevenue(opp.amount, probability),
    createdDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
  };
  opportunities.push(newOpp);
  saveOpportunitiesToStorage(opportunities);
  return newOpp;
}

// ===== ACTIVITIES =====

export function getActivitiesFromStorage(): Activity[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(ACTIVITIES_KEY);
  return data ? JSON.parse(data) : getSampleActivities();
}

export function saveActivitiesToStorage(activities: Activity[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

export function getActivitiesByRelatedId(relatedId: string): Activity[] {
  return getActivitiesFromStorage().filter(a => a.relatedToId === relatedId);
}

export function createActivity(activity: Omit<Activity, 'id' | 'createdDate'>): Activity {
  const activities = getActivitiesFromStorage();
  const newActivity: Activity = {
    ...activity,
    id: `ACT-${Date.now()}`,
    createdDate: new Date().toISOString(),
  };
  activities.push(newActivity);
  saveActivitiesToStorage(activities);
  return newActivity;
}

export function updateActivity(activityId: string, updates: Partial<Activity>): void {
  const activities = getActivitiesFromStorage();
  const index = activities.findIndex(a => a.id === activityId);
  if (index !== -1) {
    activities[index] = { ...activities[index], ...updates };
    if (updates.status === 'Completed' && !activities[index].completedDate) {
      activities[index].completedDate = new Date().toISOString();
    }
    saveActivitiesToStorage(activities);
  }
}

// ===== CAMPAIGNS =====

export function getCampaignsFromStorage(): Campaign[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(CAMPAIGNS_KEY);
  return data ? JSON.parse(data) : getSampleCampaigns();
}

export function saveCampaignsToStorage(campaigns: Campaign[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
}

// ===== METRICS & ANALYTICS =====

export function calculateCRMMetrics(): CRMMetrics {
  const leads = getLeadsFromStorage();
  const opportunities = getOpportunitiesFromStorage();
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const newLeadsThisMonth = leads.filter(l => new Date(l.createdDate) >= firstDayOfMonth).length;
  const convertedLeads = leads.filter(l => l.status === 'Converted');
  const leadConversionRate = leads.length > 0 ? (convertedLeads.length / leads.length) * 100 : 0;
  
  const openOpps = opportunities.filter(o => !o.isClosed);
  const closedWonOpps = opportunities.filter(o => o.stage === 'Closed Won');
  const closedLostOpps = opportunities.filter(o => o.stage === 'Closed Lost');
  const totalClosed = closedWonOpps.length + closedLostOpps.length;
  const winRate = totalClosed > 0 ? (closedWonOpps.length / totalClosed) * 100 : 0;
  
  const dealsWonThisMonth = closedWonOpps.filter(o => 
    new Date(o.lastModifiedDate) >= firstDayOfMonth
  ).length;
  
  const dealsLostThisMonth = closedLostOpps.filter(o => 
    new Date(o.lastModifiedDate) >= firstDayOfMonth
  ).length;
  
  const revenueThisMonth = closedWonOpps
    .filter(o => new Date(o.lastModifiedDate) >= firstDayOfMonth)
    .reduce((sum, o) => sum + o.amount, 0);
  
  const totalPipelineValue = openOpps.reduce((sum, o) => sum + o.amount, 0);
  const weightedPipelineValue = openOpps.reduce((sum, o) => sum + o.expectedRevenue, 0);
  const averageDealSize = closedWonOpps.length > 0 
    ? closedWonOpps.reduce((sum, o) => sum + o.amount, 0) / closedWonOpps.length 
    : 0;
  
  // Calculate average sales cycle
  const salesCycleDays = closedWonOpps.map(o => {
    const created = new Date(o.createdDate);
    const closed = new Date(o.lastModifiedDate);
    return (closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  });
  const averageSalesCycle = salesCycleDays.length > 0
    ? salesCycleDays.reduce((a, b) => a + b, 0) / salesCycleDays.length
    : 0;
  
  return {
    totalLeads: leads.length,
    newLeadsThisMonth,
    leadConversionRate,
    averageLeadResponseTime: 2.5, // hours - placeholder
    totalOpportunities: opportunities.length,
    openOpportunities: openOpps.length,
    totalPipelineValue,
    weightedPipelineValue,
    averageDealSize,
    winRate,
    averageSalesCycle,
    dealsWonThisMonth,
    dealsLostThisMonth,
    revenueThisMonth,
    forecastThisQuarter: weightedPipelineValue * 1.2, // placeholder
  };
}

// ===== SAMPLE DATA =====

function getSampleLeads(): Lead[] {
  return [
    {
      id: 'LEAD-001',
      company: 'Thames Valley Developments',
      contactName: 'Sarah Mitchell',
      title: 'Development Director',
      email: 'sarah.mitchell@tvd.co.uk',
      phone: '020 7946 0234',
      source: 'Website',
      status: 'Qualified',
      rating: 'Hot',
      estimatedValue: 850000,
      estimatedCloseDate: '2026-04-15',
      industry: 'Residential',
      address: '45 Thames Street',
      city: 'Reading',
      postcode: 'RG1 8BX',
      website: 'www.tvdevelopments.co.uk',
      description: 'New residential development requiring groundworks and drainage',
      assignedTo: 'John Smith',
      createdDate: '2026-02-15T10:00:00Z',
      lastContactDate: '2026-03-01T14:30:00Z',
      notes: 'Very interested. Needs proposal by end of March.',
    },
    {
      id: 'LEAD-002',
      company: 'Metro Infrastructure Ltd',
      contactName: 'David Chen',
      title: 'Project Manager',
      email: 'd.chen@metroinfra.com',
      phone: '0121 496 0789',
      source: 'Tender Portal',
      status: 'Contacted',
      rating: 'Warm',
      estimatedValue: 1200000,
      estimatedCloseDate: '2026-05-30',
      industry: 'Infrastructure',
      address: '12 Station Road',
      city: 'Birmingham',
      postcode: 'B1 1AA',
      description: 'Major road improvement scheme - civils package',
      assignedTo: 'Emma Wilson',
      createdDate: '2026-02-28T09:15:00Z',
      lastContactDate: '2026-03-02T11:00:00Z',
      notes: 'Awaiting detailed specs. Follow up next week.',
    },
  ];
}

function getSampleAccounts(): Account[] {
  return [
    {
      id: 'ACC-001',
      name: 'Redbridge Construction Group',
      accountType: 'Customer',
      industry: 'Construction',
      website: 'www.redbridgegroup.co.uk',
      phone: '020 8518 9900',
      billingAddress: '100 High Street',
      billingCity: 'London',
      billingPostcode: 'E11 2RH',
      description: 'Major construction contractor - ongoing partnership',
      employees: 250,
      annualRevenue: 45000000,
      accountOwner: 'John Smith',
      createdDate: '2024-01-10T00:00:00Z',
      lastActivityDate: '2026-03-02T15:00:00Z',
      rating: 5,
    },
  ];
}

function getSampleContacts(): Contact[] {
  return [
    {
      id: 'CON-001',
      accountId: 'ACC-001',
      firstName: 'James',
      lastName: 'Peterson',
      title: 'Commercial Director',
      department: 'Commercial',
      email: 'j.peterson@redbridgegroup.co.uk',
      phone: '020 8518 9901',
      mobile: '07700 900123',
      linkedIn: 'linkedin.com/in/jamespeterson',
      isPrimaryContact: true,
      isDecisionMaker: true,
      description: 'Key decision maker for civils packages',
      contactOwner: 'John Smith',
      createdDate: '2024-01-10T00:00:00Z',
      lastActivityDate: '2026-03-02T15:00:00Z',
    },
  ];
}

function getSampleOpportunities(): Opportunity[] {
  return [
    {
      id: 'OPP-001',
      name: 'Redbridge - Riverside Quarter Phase 2',
      accountId: 'ACC-001',
      amount: 2400000,
      closeDate: '2026-04-30',
      stage: 'Proposal Submitted',
      probability: 60,
      type: 'Existing Business',
      leadSource: 'Referral',
      description: 'Groundworks and civils package for 150-unit residential development',
      nextStep: 'Follow up on proposal - address technical queries',
      competitorAnalysis: 'Competing against 2 other firms. We have relationship advantage.',
      painPoints: 'Tight timeline, need to start June 2026',
      proposedSolution: 'Phased approach with dedicated team',
      opportunityOwner: 'John Smith',
      createdDate: '2026-01-15T00:00:00Z',
      lastModifiedDate: '2026-03-01T00:00:00Z',
      expectedRevenue: 1440000,
      isClosed: false,
      isWon: false,
    },
    {
      id: 'OPP-002',
      name: 'Thames Valley - Green Park Development',
      accountId: 'ACC-001',
      amount: 850000,
      closeDate: '2026-04-15',
      stage: 'Negotiation',
      probability: 80,
      type: 'New Business',
      leadSource: 'Website',
      description: 'Drainage and infrastructure for mixed-use development',
      nextStep: 'Finalize contract terms',
      opportunityOwner: 'John Smith',
      createdDate: '2026-02-01T00:00:00Z',
      lastModifiedDate: '2026-03-02T00:00:00Z',
      expectedRevenue: 680000,
      isClosed: false,
      isWon: false,
    },
  ];
}

function getSampleActivities(): Activity[] {
  return [
    {
      id: 'ACT-001',
      type: 'Meeting',
      subject: 'Proposal Review Meeting',
      description: 'Review technical proposal with client team',
      relatedToType: 'Opportunity',
      relatedToId: 'OPP-001',
      relatedToName: 'Redbridge - Riverside Quarter Phase 2',
      status: 'Completed',
      priority: 'High',
      assignedTo: 'John Smith',
      dueDate: '2026-03-01',
      dueTime: '14:00',
      completedDate: '2026-03-01T14:30:00Z',
      duration: 90,
      outcome: 'Positive - addressed all technical queries. Waiting for decision.',
      createdDate: '2026-02-25T00:00:00Z',
      createdBy: 'John Smith',
    },
    {
      id: 'ACT-002',
      type: 'Call',
      subject: 'Follow-up call',
      description: 'Check on decision timeline',
      relatedToType: 'Opportunity',
      relatedToId: 'OPP-002',
      relatedToName: 'Thames Valley - Green Park Development',
      status: 'Planned',
      priority: 'High',
      assignedTo: 'John Smith',
      dueDate: '2026-03-05',
      dueTime: '10:00',
      duration: 30,
      createdDate: '2026-03-02T00:00:00Z',
      createdBy: 'John Smith',
      reminderSet: true,
      reminderDateTime: '2026-03-05T09:45:00Z',
    },
  ];
}

function getSampleCampaigns(): Campaign[] {
  return [
    {
      id: 'CAMP-001',
      name: 'Q1 2026 Infrastructure Outreach',
      type: 'Email',
      status: 'Active',
      startDate: '2026-01-15',
      endDate: '2026-03-31',
      budget: 5000,
      actualCost: 3200,
      expectedRevenue: 500000,
      expectedResponse: 50,
      description: 'Email campaign targeting infrastructure project leads',
      targetAudience: 'Infrastructure contractors and developers',
      campaignOwner: 'Emma Wilson',
      leadsGenerated: 12,
      opportunitiesCreated: 3,
      dealsWonCount: 0,
      createdDate: '2026-01-10T00:00:00Z',
    },
  ];
}
