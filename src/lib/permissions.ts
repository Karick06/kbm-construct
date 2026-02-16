// Permission constants for the application
export const PERMISSIONS = {
  PROJECTS: 'projects',
  ESTIMATES: 'estimates',
  BOQ: 'boq',
  CONTRACTS: 'contracts',
  PROCUREMENT: 'procurement',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  TIMESHEETS: 'timesheets',
  STAFF: 'staff',
  LEAVE: 'leave',
  PAYROLL: 'payroll',
  FLEET: 'fleet',
  RESOURCES: 'resources',
  DOCUMENTS: 'documents',
  REPORTS: 'reports',
  CLIENTS: 'clients',
  COMPLIANCE: 'compliance',
  TRAINING: 'training',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Helper to get permission label
export const PERMISSION_LABELS: Record<string, string> = {
  [PERMISSIONS.PROJECTS]: 'Projects',
  [PERMISSIONS.ESTIMATES]: 'Estimates',
  [PERMISSIONS.BOQ]: 'BOQ Management',
  [PERMISSIONS.CONTRACTS]: 'Contracts',
  [PERMISSIONS.PROCUREMENT]: 'Procurement',
  [PERMISSIONS.INVOICES]: 'Invoices',
  [PERMISSIONS.PAYMENTS]: 'Payments',
  [PERMISSIONS.TIMESHEETS]: 'Timesheets',
  [PERMISSIONS.STAFF]: 'Staff Management',
  [PERMISSIONS.LEAVE]: 'Leave Management',
  [PERMISSIONS.PAYROLL]: 'Payroll',
  [PERMISSIONS.FLEET]: 'Fleet Management',
  [PERMISSIONS.RESOURCES]: 'Resources',
  [PERMISSIONS.DOCUMENTS]: 'Documents',
  [PERMISSIONS.REPORTS]: 'Reports',
  [PERMISSIONS.CLIENTS]: 'Client Management',
  [PERMISSIONS.COMPLIANCE]: 'Compliance',
  [PERMISSIONS.TRAINING]: 'Training',
};

// Usage example:
// import { PERMISSIONS } from '@/lib/permissions';
// import { useAuth } from '@/lib/auth-context';
// 
// const { hasPermission } = useAuth();
// 
// if (hasPermission(PERMISSIONS.PROJECTS)) {
//   // Show projects content
// }
