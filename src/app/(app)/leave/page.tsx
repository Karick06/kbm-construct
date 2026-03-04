"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/date-utils";
import {
  LeaveRequest,
  LeaveType,
  LeaveStatus,
  ApprovalStep,
  LEAVE_TYPE_CONFIG,
  STATUS_CONFIG,
  initializeApprovalChain,
  canUserApprove,
  getNextApprovalStatus,
} from "@/lib/leave-models";

// Sample leave requests with hierarchical approval chains
const initialLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    employeeId: "3",
    employeeName: "Sarah Mitchell",
    employeeEmail: "sarah.mitchell@kbm.com",
    department: "Operations",
    leaveType: "Annual",
    startDate: "2026-02-17",
    endDate: "2026-02-20",
    days: 4,
    reason: "Half term holiday with family",
    status: "approved",
    lineManagerId: "2",
    lineManagerName: "John Smith",
    deptHeadId: "2",
    deptHeadName: "John Smith",
    approvalChain: [
      { id: "1", role: "line_manager", roleTitle: "Line Manager", approverId: "2", approverName: "John Smith", status: "approved", timestamp: "2026-02-10T09:30:00Z", comments: "Approved - adequate coverage arranged" },
      { id: "2", role: "dept_head", roleTitle: "Department Head", approverId: "2", approverName: "John Smith", status: "approved", timestamp: "2026-02-10T10:15:00Z" },
      { id: "3", role: "hr", roleTitle: "HR Manager", status: "approved", timestamp: "2026-02-10T14:20:00Z", approverName: "Admin User", approverId: "1" },
    ],
    createdAt: "2026-02-08T10:00:00Z",
    updatedAt: "2026-02-10T14:20:00Z",
    submittedAt: "2026-02-08T10:05:00Z",
  },
  {
    id: "2",
    employeeId: "4",
    employeeName: "Emma Patel",
    employeeEmail: "emma.patel@kbm.com",
    department: "Finance",
    leaveType: "Sick",
    startDate: "2026-02-11",
    endDate: "2026-02-11",
    days: 1,
    reason: "Medical appointment - specialist consultation",
    status: "pending_dept_head",
    lineManagerId: "3",
    lineManagerName: "Sarah Jones",
    deptHeadId: "1",
    deptHeadName: "Admin User",
    approvalChain: [
      { id: "1", role: "line_manager", roleTitle: "Line Manager", approverId: "3", approverName: "Sarah Jones", status: "approved", timestamp: "2026-02-09T11:00:00Z", comments: "Approved - medical documentation provided" },
      { id: "2", role: "dept_head", roleTitle: "Department Head", approverId: "1", approverName: "Admin User", status: "pending" },
      { id: "3", role: "hr", roleTitle: "HR Manager", status: "pending" },
    ],
    createdAt: "2026-02-09T08:30:00Z",
    updatedAt: "2026-02-09T11:00:00Z",
    submittedAt: "2026-02-09T08:35:00Z",
  },
  {
    id: "3",
    employeeId: "5",
    employeeName: "David Johnson",
    employeeEmail: "david.johnson@kbm.com",
    department: "Operations",
    leaveType: "Annual",
    startDate: "2026-02-24",
    endDate: "2026-02-28",
    days: 5,
    reason: "Easter holiday",
    status: "pending_line_manager",
    lineManagerId: "2",
    lineManagerName: "John Smith",
    deptHeadId: "2",
    deptHeadName: "John Smith",
    approvalChain: [
      { id: "1", role: "line_manager", roleTitle: "Line Manager", approverId: "2", approverName: "John Smith", status: "pending" },
      { id: "2", role: "dept_head", roleTitle: "Department Head", approverId: "2", approverName: "John Smith", status: "pending" },
      { id: "3", role: "hr", roleTitle: "HR Manager", status: "pending" },
    ],
    createdAt: "2026-02-15T14:00:00Z",
    updatedAt: "2026-02-15T14:05:00Z",
    submittedAt: "2026-02-15T14:05:00Z",
  },
  {
    id: "4",
    employeeId: "6",
    employeeName: "Michael Chen",
    employeeEmail: "michael.chen@kbm.com",
    department: "HR",
    leaveType: "Annual",
    startDate: "2026-03-10",
    endDate: "2026-03-17",
    days: 8,
    reason: "Spring break vacation",
    status: "pending_hr",
    lineManagerId: "1",
    lineManagerName: "Admin User",
    deptHeadId: "1",
    deptHeadName: "Admin User",
    approvalChain: [
      { id: "1", role: "line_manager", roleTitle: "Line Manager", approverId: "1", approverName: "Admin User", status: "approved", timestamp: "2026-02-12T10:00:00Z", comments: "Approved" },
      { id: "2", role: "dept_head", roleTitle: "Department Head", approverId: "1", approverName: "Admin User", status: "approved", timestamp: "2026-02-12T10:05:00Z" },
      { id: "3", role: "hr", roleTitle: "HR Manager", status: "pending" },
    ],
    createdAt: "2026-02-11T16:00:00Z",
    updatedAt: "2026-02-12T10:05:00Z",
    submittedAt: "2026-02-11T16:10:00Z",
  },
];

export default function LeavePage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalComments, setApprovalComments] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  // Request Leave Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Get requests where user needs to take action
  const myActionItems = requests.filter(req => {
    if (!user) return false;
    const { canApprove } = canUserApprove(req, user.id, user.role);
    return canApprove;
  });

  // Get requests submitted by current user
  const myRequests = requests.filter(req => req.employeeId === user?.id);

  // Filter requests based on selected filter
  const filteredRequests = requests.filter(req => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return req.status.includes('pending');
    if (filterStatus === 'approved') return req.status === 'approved';
    if (filterStatus === 'rejected') return req.status.includes('rejected');
    return true;
  });

  const handleApproveReject = (request: LeaveRequest, approved: boolean) => {
    setSelectedRequest(request);
    setApprovalComments("");
    setShowApprovalModal(true);
  };

  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  const handleSubmitLeaveRequest = () => {
    if (!user || !startDate || !endDate || !reason.trim()) return;

    const days = calculateDays(startDate, endDate);
    const newRequest: LeaveRequest = {
      id: Date.now().toString(),
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      department: user.role === 'admin' ? 'HR' : 'Operations',
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      status: 'pending_line_manager',
      lineManagerId: user.role === 'admin' ? undefined : '1', // Admin as line manager for demo
      lineManagerName: user.role === 'admin' ? undefined : 'Admin User',
      deptHeadId: '1',
      deptHeadName: 'Admin User',
      approvalChain: initializeApprovalChain(leaveType),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    setRequests([newRequest, ...requests]);
    
    // Reset form
    setLeaveType('Annual');
    setStartDate('');
    setEndDate('');
    setReason('');
    setShowRequestModal(false);
  };

  const submitApproval = (approved: boolean) => {
    if (!selectedRequest || !user) return;

    const updatedRequests = requests.map(req => {
      if (req.id !== selectedRequest.id) return req;

      // Find the current pending step
      const currentStepIndex = req.approvalChain.findIndex(step => step.status === 'pending');
      if (currentStepIndex === -1) return req;

      const updatedChain = [...req.approvalChain];
      updatedChain[currentStepIndex] = {
        ...updatedChain[currentStepIndex],
        status: approved ? 'approved' : 'rejected',
        approverId: user.id,
        approverName: user.name,
        timestamp: new Date().toISOString(),
        comments: approvalComments || undefined,
      };

      let newStatus: LeaveStatus = req.status;
      
      if (approved) {
        // Move to next step in approval chain
        if (currentStepIndex === 0) {
          newStatus = 'approved_line_manager';
        } else if (currentStepIndex === 1) {
          newStatus = 'approved_dept_head';
        } else if (currentStepIndex === 2) {
          newStatus = 'approved';
        }
      } else {
        // Rejected at current step
        if (currentStepIndex === 0) {
          newStatus = 'rejected_line_manager';
        } else if (currentStepIndex === 1) {
          newStatus = 'rejected_dept_head';
        } else {
          newStatus = 'rejected';
        }
      }

      return {
        ...req,
        status: newStatus,
        approvalChain: updatedChain,
        updatedAt: new Date().toISOString(),
      };
    });

    setRequests(updatedRequests);
    setShowApprovalModal(false);
    setSelectedRequest(null);
    setApprovalComments("");
  };

  const getStatusBadge = (status: LeaveStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color} bg-opacity-20 ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const getLeaveTypeBadge = (type: LeaveType) => {
    const config = LEAVE_TYPE_CONFIG[type];
    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${config.color} bg-opacity-20 ${config.textColor}`}>
        {type}
      </span>
    );
  };

  const renderApprovalChain = (request: LeaveRequest) => {
    return (
      <div className="space-y-2">
        {request.approvalChain.map((step, index) => {
          const isActive = step.status === 'pending' && request.approvalChain.slice(0, index).every(s => s.status === 'approved');
          const isCompleted = step.status === 'approved';
          const isRejected = step.status === 'rejected';

          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Status Icon */}
              <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full ${
                isCompleted ? 'bg-green-500/20 text-green-400' :
                isRejected ? 'bg-red-500/20 text-red-400' :
                isActive ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-700/50 text-gray-500'
              }`}>
                {isCompleted ? '✓' : isRejected ? '✕' : index + 1}
              </div>

              {/* Step Details */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-semibold ${
                      isActive ? 'text-yellow-400' :
                      isCompleted ? 'text-green-400' :
                      isRejected ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {step.roleTitle}
                      {step.approverName && ` - ${step.approverName}`}
                    </p>
                    {step.timestamp && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(step.timestamp).toLocaleString()}
                      </p>
                    )}
                    {step.comments && (
                      <p className="text-xs text-gray-400 mt-1 italic">"{step.comments}"</p>
                    )}
                  </div>
                  <div>
                    {isCompleted && <span className="text-xs text-green-400">Approved</span>}
                    {isRejected && <span className="text-xs text-red-400">Rejected</span>}
                    {isActive && <span className="text-xs text-yellow-400">Pending</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button 
          onClick={() => setShowRequestModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + Request Leave
        </button>
      </div>

      {/* Quick Stats */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Pending My Action</p>
          <p className="mt-2 text-2xl font-bold text-orange-400">{myActionItems.length}</p>
          <p className="mt-1 text-xs text-gray-500">Requests awaiting your approval</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">My Requests</p>
          <p className="mt-2 text-2xl font-bold text-white">{myRequests.length}</p>
          <p className="mt-1 text-xs text-gray-500">
            {myRequests.filter(r => r.status === 'approved').length} approved, {myRequests.filter(r => r.status.includes('pending')).length} pending
          </p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">All Pending</p>
          <p className="mt-2 text-2xl font-bold text-yellow-400">
            {requests.filter(r => r.status.includes('pending')).length}
          </p>
          <p className="mt-1 text-xs text-gray-500">Total pending across all levels</p>
        </div>
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Approved This Month</p>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {requests.filter(r => r.status === 'approved').length}
          </p>
          <p className="mt-1 text-xs text-gray-500">Fully approved requests</p>
        </div>
      </section>

      {/* Action Required Section */}
      {myActionItems.length > 0 && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-900/10 p-6">
          <h2 className="mb-4 text-xl font-bold text-orange-400">⚠ Action Required</h2>
          <div className="space-y-3">
            {myActionItems.map(request => {
              const nextStep = request.approvalChain.find(s => s.status === 'pending');
              return (
                <div key={request.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-white">{request.employeeName}</p>
                        {getLeaveTypeBadge(request.leaveType)}
                        <span className="text-xs text-gray-500">
                          {request.days} {request.days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(request.startDate)} to {formatDate(request.endDate)}
                      </p>
                      <p className="mt-2 text-sm text-gray-300">{request.reason}</p>
                      {nextStep && (
                        <p className="mt-2 text-xs text-orange-400">
                          ⏳ Awaiting your approval as {nextStep.roleTitle}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveReject(request, true)}
                        className="rounded bg-green-900/30 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-900/50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveReject(request, false)}
                        className="rounded bg-red-900/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-900/50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-700/50">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition ${
              filterStatus === status
                ? 'border-b-2 border-orange-500 text-orange-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {status === 'all' ? 'All Requests' : status}
            {status !== 'all' && (
              <span className="ml-2 rounded-full bg-gray-700/50 px-2 py-0.5 text-xs">
                {status === 'pending' && requests.filter(r => r.status.includes('pending')).length}
                {status === 'approved' && requests.filter(r => r.status === 'approved').length}
                {status === 'rejected' && requests.filter(r => r.status.includes('rejected')).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Leave Requests List */}
      <div className="space-y-4">
        {filteredRequests.map(request => (
          <div key={request.id} className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{request.employeeName}</h3>
                  {getLeaveTypeBadge(request.leaveType)}
                  {getStatusBadge(request.status)}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>📅 {formatDate(request.startDate)} → {formatDate(request.endDate)}</span>
                  <span>⏱ {request.days} {request.days === 1 ? 'day' : 'days'}</span>
                  <span>🏢 {request.department}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-400 mb-1">Reason:</p>
              <p className="text-sm text-gray-300">{request.reason}</p>
            </div>

            {/* Approval Chain */}
            <div>
              <p className="text-sm font-semibold text-gray-400 mb-3">Approval Progress:</p>
              {renderApprovalChain(request)}
            </div>

            {/* Action Buttons for Approvers */}
            {user && canUserApprove(request, user.id, user.role).canApprove && (
              <div className="mt-4 flex gap-3 pt-4 border-t border-gray-700/50">
                <button
                  onClick={() => handleApproveReject(request, true)}
                  className="flex-1 rounded-lg bg-green-900/30 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-900/50"
                >
                  ✓ Approve Request
                </button>
                <button
                  onClick={() => handleApproveReject(request, false)}
                  className="flex-1 rounded-lg bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/50"
                >
                  ✕ Reject Request
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredRequests.length === 0 && (
          <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-12 text-center">
            <p className="text-gray-400">No leave requests found</p>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700/50 bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-bold text-white">
              {approvalComments ? 'Confirm' : 'Add Comments (Optional)'}
            </h2>
            
            <div className="mb-4 rounded-lg bg-gray-900/50 p-4">
              <p className="text-sm text-gray-400">Request from:</p>
              <p className="text-lg font-semibold text-white">{selectedRequest.employeeName}</p>
              <p className="mt-2 text-sm text-gray-400">
                {selectedRequest.leaveType} • {selectedRequest.days} days
              </p>
              <p className="text-sm text-gray-400">
                {formatDate(selectedRequest.startDate)} to {formatDate(selectedRequest.endDate)}
              </p>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-semibold text-gray-400">
                Comments (Optional)
              </label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                placeholder="Add any comments about this decision..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => submitApproval(true)}
                className="flex-1 rounded-lg bg-green-900/30 px-4 py-2 text-sm font-semibold text-green-400 hover:bg-green-900/50"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => submitApproval(false)}
                className="flex-1 rounded-lg bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/50"
              >
                ✕ Reject
              </button>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                  setApprovalComments("");
                }}
                className="rounded-lg bg-gray-700/50 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Leave Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h3 className="mb-4 text-xl font-bold text-white">Request Leave</h3>
            
            <div className="space-y-4">
              {/* Leave Type */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-400">
                  Leave Type *
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {Object.keys(LEAVE_TYPE_CONFIG).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-400">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-400">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Days Calculation */}
              {startDate && endDate && (
                <div className="rounded-lg bg-gray-900 px-3 py-2">
                  <p className="text-sm text-gray-400">
                    Duration: <span className="font-semibold text-white">{calculateDays(startDate, endDate)} days</span>
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-400">
                  Reason *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for your leave request..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  rows={4}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleSubmitLeaveRequest}
                disabled={!startDate || !endDate || !reason.trim()}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Request
              </button>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setLeaveType('Annual');
                  setStartDate('');
                  setEndDate('');
                  setReason('');
                }}
                className="rounded-lg bg-gray-700/50 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
