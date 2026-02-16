export type LeaveType = 'Annual' | 'Sick' | 'Compassionate' | 'Unpaid' | 'Maternity' | 'Paternity';

export type LeaveStatus = 
  | 'draft'
  | 'pending_line_manager'
  | 'approved_line_manager'
  | 'rejected_line_manager'
  | 'pending_dept_head'
  | 'approved_dept_head'
  | 'rejected_dept_head'
  | 'pending_hr'
  | 'approved'
  | 'rejected';

export type ApprovalRole = 'line_manager' | 'dept_head' | 'hr' | 'admin';

export interface ApprovalStep {
  id: string;
  role: ApprovalRole;
  roleTitle: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp?: string;
  comments?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  
  // Approval hierarchy
  lineManagerId?: string;
  lineManagerName?: string;
  deptHeadId?: string;
  deptHeadName?: string;
  hrApproverId?: string;
  hrApproverName?: string;
  
  // Approval chain
  approvalChain: ApprovalStep[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

export interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annualTotal: number;
  annualUsed: number;
  annualRemaining: number;
  sickTotal: number;
  sickUsed: number;
  compassionateTotal: number;
  compassionateUsed: number;
  year: number;
}

export const LEAVE_TYPE_CONFIG = {
  Annual: {
    color: 'bg-blue-500',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-400',
    requiresApproval: true,
    maxDaysWithoutNotice: 2,
  },
  Sick: {
    color: 'bg-red-500',
    textColor: 'text-red-400',
    borderColor: 'border-red-400',
    requiresApproval: true,
    maxDaysWithoutNotice: 0,
  },
  Compassionate: {
    color: 'bg-yellow-500',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-400',
    requiresApproval: true,
    maxDaysWithoutNotice: 0,
  },
  Unpaid: {
    color: 'bg-gray-500',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-400',
    requiresApproval: true,
    maxDaysWithoutNotice: 0,
  },
  Maternity: {
    color: 'bg-pink-500',
    textColor: 'text-pink-400',
    borderColor: 'border-pink-400',
    requiresApproval: true,
    maxDaysWithoutNotice: 0,
  },
  Paternity: {
    color: 'bg-purple-500',
    textColor: 'text-purple-400',
    borderColor: 'border-purple-400',
    requiresApproval: true,
    maxDaysWithoutNotice: 0,
  },
};

export const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-500', textColor: 'text-gray-400' },
  pending_line_manager: { label: 'Pending Line Manager', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  approved_line_manager: { label: 'Approved by Line Manager', color: 'bg-blue-500', textColor: 'text-blue-400' },
  rejected_line_manager: { label: 'Rejected by Line Manager', color: 'bg-red-500', textColor: 'text-red-400' },
  pending_dept_head: { label: 'Pending Dept Head', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  approved_dept_head: { label: 'Approved by Dept Head', color: 'bg-blue-500', textColor: 'text-blue-400' },
  rejected_dept_head: { label: 'Rejected by Dept Head', color: 'bg-red-500', textColor: 'text-red-400' },
  pending_hr: { label: 'Pending HR', color: 'bg-yellow-500', textColor: 'text-yellow-400' },
  approved: { label: 'Fully Approved', color: 'bg-green-500', textColor: 'text-green-400' },
  rejected: { label: 'Rejected', color: 'bg-red-500', textColor: 'text-red-400' },
};

export function initializeApprovalChain(
  lineManagerId?: string,
  lineManagerName?: string,
  deptHeadId?: string,
  deptHeadName?: string
): ApprovalStep[] {
  const chain: ApprovalStep[] = [];
  
  // Step 1: Line Manager
  if (lineManagerId && lineManagerName) {
    chain.push({
      id: '1',
      role: 'line_manager',
      roleTitle: 'Line Manager',
      approverId: lineManagerId,
      approverName: lineManagerName,
      status: 'pending',
    });
  }
  
  // Step 2: Department Head (if different from line manager)
  if (deptHeadId && deptHeadName && deptHeadId !== lineManagerId) {
    chain.push({
      id: '2',
      role: 'dept_head',
      roleTitle: 'Department Head',
      approverId: deptHeadId,
      approverName: deptHeadName,
      status: 'pending',
    });
  }
  
  // Step 3: HR (for leave > 5 days or specific types)
  chain.push({
    id: '3',
    role: 'hr',
    roleTitle: 'HR Manager',
    status: 'pending',
  });
  
  return chain;
}

export function canUserApprove(
  request: LeaveRequest,
  userId: string,
  userRole: string
): { canApprove: boolean; reason?: string } {
  // Admin can approve anything
  if (userRole === 'Administrator') {
    return { canApprove: true };
  }
  
  // Can't approve own request
  if (request.employeeId === userId) {
    return { canApprove: false, reason: 'Cannot approve own leave request' };
  }
  
  // Find next pending approval in chain
  const nextApproval = request.approvalChain.find(step => step.status === 'pending');
  
  if (!nextApproval) {
    return { canApprove: false, reason: 'No pending approvals' };
  }
  
  // Check if user is the designated approver
  if (nextApproval.approverId && nextApproval.approverId !== userId) {
    return { canApprove: false, reason: `Awaiting approval from ${nextApproval.approverName}` };
  }
  
  // Check role-based permissions
  if (nextApproval.role === 'line_manager' && userRole !== 'Line Manager' && userRole !== 'Administrator') {
    return { canApprove: false, reason: 'Only Line Managers can approve at this stage' };
  }
  
  if (nextApproval.role === 'dept_head' && !['Department Head', 'Administrator'].includes(userRole)) {
    return { canApprove: false, reason: 'Only Department Heads can approve at this stage' };
  }
  
  if (nextApproval.role === 'hr' && !['HR Manager', 'Administrator'].includes(userRole)) {
    return { canApprove: false, reason: 'Only HR Managers can approve at this stage' };
  }
  
  return { canApprove: true };
}

export function getNextApprovalStatus(currentStatus: LeaveStatus, approved: boolean): LeaveStatus {
  if (!approved) {
    switch (currentStatus) {
      case 'pending_line_manager':
        return 'rejected_line_manager';
      case 'pending_dept_head':
        return 'rejected_dept_head';
      case 'pending_hr':
        return 'rejected';
      default:
        return 'rejected';
    }
  }
  
  switch (currentStatus) {
    case 'pending_line_manager':
      return 'approved_line_manager';
    case 'approved_line_manager':
      return 'pending_dept_head';
    case 'pending_dept_head':
      return 'approved_dept_head';
    case 'approved_dept_head':
      return 'pending_hr';
    case 'pending_hr':
      return 'approved';
    default:
      return currentStatus;
  }
}
