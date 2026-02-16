# Hierarchical Leave Management System

## Overview

The hierarchical leave management system implements a multi-level approval workflow for employee leave requests. Each request must pass through multiple approval stages before being fully approved.

## Approval Hierarchy

The system uses a three-tier approval process:

### 1. Line Manager Approval
- **Role**: Line Manager
- **Responsibility**: First level of approval, reviews direct reports' leave requests
- **Checks**: 
  - Adequate coverage during absence
  - Team scheduling conflicts
  - Workload distribution

### 2. Department Head Approval
- **Role**: Department Head
- **Responsibility**: Second level of approval, ensures department-wide resource planning
- **Checks**:
  - Department capacity
  - Multiple absences in same period
  - Critical project timelines

### 3. HR Approval
- **Role**: HR Manager or Administrator
- **Responsibility**: Final approval, ensures policy compliance
- **Checks**:
  - Leave balance verification
  - Company policy compliance
  - Legal requirements (sick leave, maternity/paternity, etc.)

## Leave Request Statuses

### Pending States
- `pending_line_manager`: Awaiting line manager approval
- `pending_dept_head`: Line manager approved, awaiting department head
- `pending_hr`: Department head approved, awaiting HR final approval

### Approved States
- `approved_line_manager`: Approved by line manager, moving to next stage
- `approved_dept_head`: Approved by department head, moving to HR
- `approved`: Fully approved by all levels

### Rejected States
- `rejected_line_manager`: Rejected at line manager stage
- `rejected_dept_head`: Rejected at department head stage
- `rejected`: Rejected at HR stage

### Other States
- `draft`: Request created but not submitted

## Leave Types

The system supports six leave types:

### 1. Annual Leave
- Requires advance notice
- Counted against annual allowance
- Approval through full hierarchy

### 2. Sick Leave
- Can be submitted retroactively
- Requires medical documentation for extended periods
- Fast-tracked through approval chain

### 3. Compassionate Leave
- For family emergencies or bereavements
- Expedited approval process
- Usually granted with minimal documentation

### 4. Unpaid Leave
- Does not count against allowance
- Requires strongest justification
- Full hierarchy approval required

### 5. Maternity Leave
- Statutory leave type
- Requires advance notice (typically 8 weeks)
- HR must verify legal compliance

### 6. Paternity Leave
- Statutory leave type
- Requires proof of partner's pregnancy/birth
- HR final approval required

## Approval Chain Tracking

Each leave request maintains an `approvalChain` array that tracks:
- Approval stage (line_manager, dept_head, hr)
- Designated approver
- Status (pending, approved, rejected)
- Timestamp of action
- Comments/notes from approver

Example approval chain:
```typescript
approvalChain: [
  {
    id: "1",
    role: "line_manager",
    roleTitle: "Line Manager",
    approverId: "user_123",
    approverName: "John Smith",
    status: "approved",
    timestamp: "2026-02-10T09:30:00Z",
    comments: "Approved - adequate coverage arranged"
  },
  {
    id: "2",
    role: "dept_head",
    roleTitle: "Department Head",
    approverId: "user_456",
    approverName: "Sarah Jones",
    status: "pending"
  },
  {
    id: "3",
    role: "hr",
    roleTitle: "HR Manager",
    status: "pending"
  }
]
```

## Permission System

### Can Approve?
The system checks multiple conditions before allowing approval:
1. User cannot approve their own request
2. User must be designated approver for current stage
3. User role must match approval stage requirements
4. Previous stages must be completed

### Administrator Override
- Administrators can approve at any stage
- Bypasses designated approver checks
- Useful for emergency approvals or covering absent approvers

## User Interface

### Action Required Section
- Prominently displays requests awaiting the logged-in user's approval
- Shows urgent visual indicators (⚠ icon, orange highlighting)
- Quick approve/reject buttons

### Filter Tabs
- **All Requests**: Complete view of all leave requests
- **Pending**: Only requests with pending approvals
- **Approved**: Fully approved requests
- **Rejected**: Rejected requests at any stage

### Approval Progress Visualization
Each request displays visual approval chain:
- ✓ Green checkmark: Approved stage
- ✕ Red cross: Rejected stage
- Number in yellow circle: Current pending stage
- Gray number: Future pending stage

### Detailed Request Cards
Each request shows:
- Employee details (name, department, email)
- Leave type badge with color coding
- Duration (start date, end date, days)
- Reason for leave
- Full approval chain with timestamps and comments
- Action buttons (if user can approve)

### Approval Modal
When approving/rejecting:
- Confirms request details
- Allows optional comments
- Clear approve/reject actions
- Cancel option

## Implementation Files

### Core Models
- `/src/lib/leave-models.ts`: TypeScript interfaces and approval logic
  - `LeaveRequest` interface
  - `ApprovalStep` interface
  - `canUserApprove()` function
  - `initializeApprovalChain()` function
  - Status and type configurations

### Page Component
- `/src/app/(app)/leave/page.tsx`: Main leave management UI
  - Request list with filtering
  - Approval action buttons
  - Approval chain visualization
  - Modal for approval/rejection

## Usage Examples

### For Employees
1. Navigate to Leave Management page
2. Click "Request Leave" button
3. Fill in leave details (type, dates, reason)
4. Submit request
5. Track approval progress in "My Requests" section

### For Line Managers
1. Check "Action Required" section
2. Review request details and approval chain
3. Click "Approve" or "Reject"
4. Add optional comments
5. Confirm decision

### For Department Heads
1. Filter by "Pending" to see requests awaiting approval
2. Review line manager's comments and decision
3. Consider department-wide impact
4. Approve or reject with reasoning

### For HR Managers
1. Review all previous approvals in chain
2. Verify leave balance and policy compliance
3. Provide final approval or rejection
4. Request is now fully approved or rejected

## Future Enhancements

### Potential Improvements
1. **Email Notifications**: Alert approvers when action required
2. **Calendar Integration**: Sync approved leave to Outlook/Google Calendar
3. **Leave Balance Tracking**: Display remaining days for each type
4. **Bulk Actions**: Approve multiple requests simultaneously
5. **Delegation**: Allow approvers to delegate during absence
6. **Auto-Approval Rules**: Configure criteria for automatic approval
7. **Reporting**: Generate leave analytics and reports
8. **Mobile App**: Native mobile interface for on-the-go approvals
9. **Integration**: Connect with payroll and timesheet systems
10. **Audit Trail**: Complete history of all changes and approvals

## Best Practices

### For Employees
- Submit requests well in advance
- Provide detailed reasons
- Check team calendar before requesting
- Respond promptly to questions from approvers

### For Approvers
- Review requests within 24-48 hours
- Provide clear comments when rejecting
- Consider team capacity and coverage
- Communicate with other approvers if needed

### For Administrators
- Monitor pending requests regularly
- Intervene only when necessary
- Maintain approval chain integrity
- Use override sparingly

## Security Considerations

1. **Authentication**: Only logged-in users can view/approve
2. **Authorization**: Role-based access control enforced
3. **Audit Trail**: All actions timestamped and attributed
4. **Data Privacy**: Leave reasons and medical info protected
5. **Self-Approval Prevention**: Cannot approve own requests

## Support and Troubleshooting

### Common Issues

**Request Stuck in Approval**
- Check who the designated approver is
- Contact approver directly if urgent
- Administrator can override if approver unavailable

**Cannot Approve Request**
- Verify you have correct role
- Check if you're designated approver
- Ensure previous stages are completed

**Rejected Request**
- Review rejection comments
- Address concerns raised
- Resubmit with modifications

**Missing Request**
- Check filter settings (All/Pending/Approved/Rejected)
- Verify request was submitted (not draft)
- Contact administrator if still missing

---

For questions or support, contact the system administrator or HR department.
