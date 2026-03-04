import type { ApplicationForPayment, FinalAccount, ApplicationLineItem, RetentionRelease } from './payment-document-models';

const APPLICATIONS_KEY = 'kbm_applications_for_payment:';
const FINAL_ACCOUNTS_KEY = 'kbm_final_accounts:';
const RETENTION_RELEASES_KEY = 'kbm_retention_releases:';

// Application for Payment CRUD
export function getApplicationsForPaymentFromStorage(): ApplicationForPayment[] {
  try {
    const data = localStorage.getItem(APPLICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveApplicationsForPaymentToStorage(applications: ApplicationForPayment[]): void {
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(applications));
}

export function getApplicationForPaymentById(id: string): ApplicationForPayment | null {
  const apps = getApplicationsForPaymentFromStorage();
  return apps.find(app => app.id === id) || null;
}

export function getApplicationsForProject(projectId: string): ApplicationForPayment[] {
  const apps = getApplicationsForPaymentFromStorage();
  return apps.filter(app => app.projectId === projectId);
}

export function createApplicationForPayment(projectId: string, data: Partial<ApplicationForPayment>): ApplicationForPayment {
  const apps = getApplicationsForPaymentFromStorage();
  const nextNumber = Math.max(...apps.filter(a => a.projectId === projectId).map(a => a.applicationNumber), 0) + 1;
  
  const newApp: ApplicationForPayment = {
    id: Math.random().toString(36).substr(2, 9),
    projectId,
    applicationNumber: nextNumber,
    submissionDate: new Date(),
    periodStart: data.periodStart || new Date(),
    periodEnd: data.periodEnd || new Date(),
    contractSum: data.contractSum || 0,
    totalVariations: data.totalVariations || 0,
    adjustedContractSum: data.adjustedContractSum || 0,
    previouslyValued: data.previouslyValued || 0,
    thisValuation: data.thisValuation || 0,
    totalValuation: data.totalValuation || 0,
    retentionPercentage: data.retentionPercentage || 5,
    retentionAmount: data.retentionAmount || 0,
    defectsDeduction: data.defectsDeduction || 0,
    otherDeductions: data.otherDeductions || 0,
    totalDeductions: data.totalDeductions || 0,
    grossPayment: data.grossPayment || 0,
    netPayment: data.netPayment || 0,
    status: 'draft',
    contractorSigned: false,
    architectSigned: false,
    clientApproved: false,
    description: data.description || '',
    notes: data.notes || '',
    lineItems: data.lineItems || []
  };
  
  apps.push(newApp);
  saveApplicationsForPaymentToStorage(apps);
  return newApp;
}

export function updateApplicationForPayment(id: string, updates: Partial<ApplicationForPayment>): ApplicationForPayment | null {
  const apps = getApplicationsForPaymentFromStorage();
  const index = apps.findIndex(app => app.id === id);
  
  if (index === -1) return null;
  
  apps[index] = { ...apps[index], ...updates };
  saveApplicationsForPaymentToStorage(apps);
  return apps[index];
}

export function deleteApplicationForPayment(id: string): boolean {
  const apps = getApplicationsForPaymentFromStorage();
  const filtered = apps.filter(app => app.id !== id);
  
  if (filtered.length === apps.length) return false;
  
  saveApplicationsForPaymentToStorage(filtered);
  return true;
}

// Final Account CRUD
export function getFinalAccountsFromStorage(): FinalAccount[] {
  try {
    const data = localStorage.getItem(FINAL_ACCOUNTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveFinalAccountsToStorage(accounts: FinalAccount[]): void {
  localStorage.setItem(FINAL_ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getFinalAccountByProjectId(projectId: string): FinalAccount | null {
  const accounts = getFinalAccountsFromStorage();
  return accounts.find(acc => acc.projectId === projectId) || null;
}

export function createFinalAccount(projectId: string, data: Partial<FinalAccount>): FinalAccount {
  const accounts = getFinalAccountsFromStorage();
  
  const newAccount: FinalAccount = {
    id: Math.random().toString(36).substr(2, 9),
    projectId,
    dateGenerated: new Date(),
    originalContractSum: data.originalContractSum || 0,
    authorizedVariations: data.authorizedVariations || 0,
    contractualAdjustments: data.contractualAdjustments || 0,
    finalContractSum: data.finalContractSum || 0,
    totalClaimedToDate: data.totalClaimedToDate || 0,
    retentionHeld: data.retentionHeld || 0,
    totalNetPayments: data.totalNetPayments || 0,
    finalBalance: data.finalBalance || 0,
    retentionToBeReleased: data.retentionToBeReleased || 0,
    variations: data.variations || [],
    projectName: data.projectName || '',
    client: data.client || '',
    contractor: data.contractor || '',
    startDate: data.startDate || new Date(),
    completionDate: data.completionDate || new Date(),
    valueOfWorkCompleted: data.valueOfWorkCompleted || 0,
    signedByContractor: false,
    signedByArchitect: false
  };
  
  accounts.push(newAccount);
  saveFinalAccountsToStorage(accounts);
  return newAccount;
}

export function updateFinalAccount(id: string, updates: Partial<FinalAccount>): FinalAccount | null {
  const accounts = getFinalAccountsFromStorage();
  const index = accounts.findIndex(acc => acc.id === id);
  
  if (index === -1) return null;
  
  accounts[index] = { ...accounts[index], ...updates };
  saveFinalAccountsToStorage(accounts);
  return accounts[index];
}

// Retention Release CRUD
export function getRetentionReleasesFromStorage(): RetentionRelease[] {
  try {
    const data = localStorage.getItem(RETENTION_RELEASES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveRetentionReleasesToStorage(releases: RetentionRelease[]): void {
  localStorage.setItem(RETENTION_RELEASES_KEY, JSON.stringify(releases));
}

export function getRetentionReleasesForProject(projectId: string): RetentionRelease[] {
  const releases = getRetentionReleasesFromStorage();
  return releases.filter(r => r.projectId === projectId);
}

export function createRetentionRelease(data: Partial<RetentionRelease>): RetentionRelease {
  const releases = getRetentionReleasesFromStorage();
  
  const newRelease: RetentionRelease = {
    id: Math.random().toString(36).substr(2, 9),
    projectId: data.projectId || '',
    releaseDate: data.releaseDate || new Date(),
    retentionPercentage: data.retentionPercentage || 0,
    retentionAmount: data.retentionAmount || 0,
    reason: data.reason || 'interim',
    approvedBy: data.approvedBy || ''
  };
  
  releases.push(newRelease);
  saveRetentionReleasesToStorage(releases);
  return newRelease;
}

export function updateRetentionRelease(id: string, updates: Partial<RetentionRelease>): RetentionRelease | null {
  const releases = getRetentionReleasesFromStorage();
  const index = releases.findIndex(r => r.id === id);
  
  if (index === -1) return null;
  
  releases[index] = { ...releases[index], ...updates };
  saveRetentionReleasesToStorage(releases);
  return releases[index];
}

export function deleteRetentionRelease(id: string): boolean {
  const releases = getRetentionReleasesFromStorage();
  const filtered = releases.filter(r => r.id !== id);
  
  if (filtered.length === releases.length) return false;
  
  saveRetentionReleasesToStorage(filtered);
  return true;
}

// Calculate totals for application
export function calculateApplicationTotals(app: ApplicationForPayment) {
  const retention = app.adjustedContractSum * (app.retentionPercentage / 100);
  const totalDeductions = retention + app.defectsDeduction + app.otherDeductions;
  const netPayment = app.thisValuation - totalDeductions;
  
  return {
    grossPayment: app.thisValuation,
    retention,
    totalDeductions,
    netPayment
  };
}
