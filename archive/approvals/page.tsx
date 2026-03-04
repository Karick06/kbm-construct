"use client";

import { useState } from "react";
import { formatDate } from "@/lib/date-utils";

type Approval = {
  id: string;
  type: "Change Order" | "Variation" | "Invoice" | "Method Statement" | "Quote" | "Timesheet" | "Purchase Order" | "Risk Assessment";
  title: string;
  description: string;
  project: string;
  submittedBy: string;
  submittedDate: string;
  value?: string;
  urgency: "Low" | "Medium" | "High" | "Urgent";
  status: "pending" | "approved" | "rejected";
  documents?: string[];
};

const approvalData: Approval[] = [
  // Pending
  { id: "APR-001", type: "Change Order", title: "Additional Excavation Works", description: "Client requested additional excavation for extended basement area", project: "Premier Mixed Use", submittedBy: "Emma Davis", submittedDate: "2026-02-15", value: "£42,500", urgency: "High", status: "pending", documents: ["CO-001.pdf", "Drawings-Rev-B.pdf"] },
  { id: "APR-002", type: "Variation", title: "Alternative Cladding System", description: "Substitution of cladding material due to supply chain issues", project: "Thames Retail Park", submittedBy: "Tom Wilson", submittedDate: "2026-02-14", value: "-£8,200", urgency: "Urgent", status: "pending", documents: ["VAR-002.pdf", "Material-Spec.pdf"] },
  { id: "APR-003", type: "Invoice", title: "M&E Subcontractor Payment", description: "Monthly valuation for M&E works completed", project: "Office Complex Tower B", submittedBy: "Karen White", submittedDate: "2026-02-15", value: "£125,000", urgency: "Medium", status: "pending", documents: ["Invoice-12345.pdf"] },
  { id: "APR-004", type: "Method Statement", title: "Tower Crane Installation", description: "Method statement for tower crane erection at Tech Campus", project: "Tech Campus", submittedBy: "James Mitchell", submittedDate: "2026-02-14", urgency: "High", status: "pending", documents: ["MS-Crane-001.pdf", "Lift-Plan.pdf"] },
  { id: "APR-005", type: "Quote", title: "Groundworks Package", description: "Quote for groundworks at North District Complex", project: "North District Complex", submittedBy: "Tom Wilson", submittedDate: "2026-02-13", value: "£185,000", urgency: "Medium", status: "pending", documents: ["Quote-GW-001.pdf"] },
  { id: "APR-006", type: "Purchase Order", title: "Structural Steel Order", description: "Purchase order for steel frame delivery", project: "Central Warehouse", submittedBy: "David Brown", submittedDate: "2026-02-15", value: "£68,400", urgency: "High", status: "pending", documents: ["PO-12456.pdf"] },
  { id: "APR-007", type: "Timesheet", title: "Weekly Timesheet Approval", description: "Timesheet approval for 24 operatives - Week 7", project: "Thames Retail Park", submittedBy: "Rachel Moore", submittedDate: "2026-02-16", value: "£18,750", urgency: "Medium", status: "pending" },
  { id: "APR-008", type: "Risk Assessment", title: "Working at Height - Scaffolding", description: "Risk assessment for scaffolding works on Shopping District", project: "Shopping District", submittedBy: "Sarah Chen", submittedDate: "2026-02-14", urgency: "High", status: "pending", documents: ["RA-001.pdf"] },
  { id: "APR-009", type: "Change Order", title: "Additional Fire Stopping", description: "Extra fire stopping required following building control inspection", project: "Riverside Park", submittedBy: "Mark Thompson", submittedDate: "2026-02-13", value: "£12,800", urgency: "Medium", status: "pending", documents: ["CO-002.pdf"] },
  { id: "APR-010", type: "Invoice", title: "Plant Hire - January", description: "Monthly invoice for excavator and plant hire", project: "General", submittedBy: "Karen White", submittedDate: "2026-02-12", value: "£24,500", urgency: "Low", status: "pending", documents: ["Invoice-PHire-001.pdf"] },

  // Approved
  { id: "APR-011", type: "Method Statement", title: "Concrete Pour Procedure", description: "Method statement for large concrete pour at Central Warehouse", project: "Central Warehouse", submittedBy: "James Mitchell", submittedDate: "2026-02-12", urgency: "High", status: "approved", documents: ["MS-Concrete-001.pdf"] },
  { id: "APR-012", type: "Quote", title: "M&E First Fix Quote", description: "Quote for M&E first fix works", project: "Premier Mixed Use", submittedBy: "Emma Davis", submittedDate: "2026-02-11", value: "£285,000", urgency: "Medium", status: "approved", documents: ["Quote-ME-001.pdf"] },
  { id: "APR-013", type: "Purchase Order", title: "Brickwork Materials", description: "Purchase order for facing bricks and mortar", project: "Thames Retail Park", submittedBy: "Tom Wilson", submittedDate: "2026-02-10", value: "£42,100", urgency: "Medium", status: "approved", documents: ["PO-12401.pdf"] },
  { id: "APR-014", type: "Timesheet", title: "Weekly Timesheet Approval", description: "Timesheet approval for 24 operatives - Week 6", project: "Thames Retail Park", submittedBy: "Rachel Moore", submittedDate: "2026-02-09", value: "£19,200", urgency: "Low", status: "approved" },
  { id: "APR-015", type: "Variation", title: "Upgraded Flooring Specification", description: "Client upgrade to premium flooring finish", project: "Office Complex Tower B", submittedBy: "Sarah Chen", submittedDate: "2026-02-08", value: "£18,500", urgency: "Low", status: "approved", documents: ["VAR-003.pdf"] },

  // Rejected
  { id: "APR-016", type: "Change Order", title: "Extended Project Duration", description: "Request for 2-week extension due to weather delays", project: "Tech Campus", submittedBy: "David Brown", submittedDate: "2026-02-10", urgency: "Medium", status: "rejected", documents: ["CO-003.pdf"] },
  { id: "APR-017", type: "Quote", title: "Alternative Roofing System", description: "Quote for non-standard roofing system", project: "Shopping District", submittedBy: "Tom Wilson", submittedDate: "2026-02-09", value: "£95,000", urgency: "Low", status: "rejected", documents: ["Quote-Roof-001.pdf"] },
];

const approvalsByStatus = {
  pending: approvalData.filter((a) => a.status === "pending"),
  approved: approvalData.filter((a) => a.status === "approved"),
  rejected: approvalData.filter((a) => a.status === "rejected"),
};

const urgencyColors = {
  Low: "bg-green-500/20 border-green-500/30 text-green-400",
  Medium: "bg-yellow-500/20 border-yellow-500/30 text-yellow-400",
  High: "bg-orange-500/20 border-orange-500/30 text-orange-400",
  Urgent: "bg-red-500/20 border-red-500/30 text-red-400",
};

const typeColors = {
  "Change Order": "bg-purple-500/20 text-purple-400",
  "Variation": "bg-blue-500/20 text-blue-400",
  "Invoice": "bg-green-500/20 text-green-400",
  "Method Statement": "bg-orange-500/20 text-orange-400",
  "Quote": "bg-cyan-500/20 text-cyan-400",
  "Timesheet": "bg-yellow-500/20 text-yellow-400",
  "Purchase Order": "bg-pink-500/20 text-pink-400",
  "Risk Assessment": "bg-red-500/20 text-red-400",
};

export default function ApprovalsPage() {
  const [view, setView] = useState<"pending" | "all">("pending");
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  const displayData = view === "pending" ? approvalsByStatus.pending : approvalData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <div className="flex gap-3">
          <button
            onClick={() => setView("pending")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "pending"
                ? "bg-yellow-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            Pending Only
          </button>
          <button
            onClick={() => setView("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              view === "all"
                ? "bg-yellow-500 text-white"
                : "bg-gray-800/80 text-gray-300 hover:bg-gray-700/80"
            }`}
          >
            All Approvals
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/80 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-3xl font-bold text-white mt-1">{approvalsByStatus.pending.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center text-2xl">
              ⏳
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-3xl font-bold text-white mt-1">{approvalsByStatus.approved.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center text-2xl">
              ✅
            </div>
          </div>
        </div>

        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-white mt-1">{approvalsByStatus.rejected.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center text-2xl">
              ❌
            </div>
          </div>
        </div>
      </div>

      {/* Approvals List */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column - Approvals List */}
        <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2">
          {displayData.map((approval) => (
            <div
              key={approval.id}
              onClick={() => setSelectedApproval(approval)}
              className={`bg-gray-800/80 border rounded-lg p-4 cursor-pointer transition-all ${
                selectedApproval?.id === approval.id
                  ? "border-yellow-500 shadow-lg shadow-yellow-500/20"
                  : "border-gray-700/50 hover:border-gray-600/50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-mono">{approval.id}</span>
                  <span className={`text-xs px-2 py-1 rounded ${typeColors[approval.type]}`}>
                    {approval.type}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded border ${urgencyColors[approval.urgency]}`}>
                  {approval.urgency}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-white mb-1">{approval.title}</h4>
              <p className="text-xs text-gray-400 mb-3">{approval.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span className="text-gray-500">Project:</span>
                  <p className="text-gray-300 font-medium">{approval.project}</p>
                </div>
                {approval.value && (
                  <div>
                    <span className="text-gray-500">Value:</span>
                    <p className="text-gray-300 font-medium">{approval.value}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                <div className="text-xs text-gray-400">
                  <p>{approval.submittedBy}</p>
                  <p className="text-gray-500">{formatDate(approval.submittedDate)}</p>
                </div>
                
                {approval.status === "pending" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Rejected: ${approval.title}`);
                      }}
                      className="px-3 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/30 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Approved: ${approval.title}`);
                      }}
                      className="px-3 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium hover:bg-green-500/30 transition-colors"
                    >
                      Approve
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-xs px-3 py-1 rounded border ${
                      approval.status === "approved"
                        ? "bg-green-500/20 border-green-500/30 text-green-400"
                        : "bg-red-500/20 border-red-500/30 text-red-400"
                    }`}
                  >
                    {approval.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column - Approval Details */}
        <div className="bg-gray-800/80 border border-gray-700/50 rounded-lg p-6 sticky top-6">
          {selectedApproval ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">{selectedApproval.title}</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs px-2 py-1 rounded ${typeColors[selectedApproval.type]}`}>
                    {selectedApproval.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded border ${urgencyColors[selectedApproval.urgency]}`}>
                    {selectedApproval.urgency}
                  </span>
                  {selectedApproval.status !== "pending" && (
                    <span
                      className={`text-xs px-2 py-1 rounded border ${
                        selectedApproval.status === "approved"
                          ? "bg-green-500/20 border-green-500/30 text-green-400"
                          : "bg-red-500/20 border-red-500/30 text-red-400"
                      }`}
                    >
                      {selectedApproval.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Description</h4>
                <p className="text-sm text-gray-400">{selectedApproval.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <h4 className="text-xs font-semibold text-gray-400 mb-1">Project</h4>
                  <p className="text-sm text-white">{selectedApproval.project}</p>
                </div>
                {selectedApproval.value && (
                  <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                    <h4 className="text-xs font-semibold text-gray-400 mb-1">Value</h4>
                    <p className="text-sm text-white font-bold">{selectedApproval.value}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-gray-400 mb-1">Submitted By</h4>
                <p className="text-sm text-white">{selectedApproval.submittedBy}</p>
                <p className="text-xs text-gray-500 mt-1">{formatDate(selectedApproval.submittedDate)}</p>
              </div>

              {selectedApproval.documents && selectedApproval.documents.length > 0 && (
                <div className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Documents</h4>
                  <div className="space-y-2">
                    {selectedApproval.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-gray-800/50 border border-gray-700/50 rounded px-3 py-2 hover:border-gray-600/50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📄</span>
                          <span className="text-sm text-gray-300">{doc}</span>
                        </div>
                        <button className="text-xs text-blue-400 hover:text-blue-300">
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedApproval.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-gray-700/50">
                  <button
                    onClick={() => alert(`Rejected: ${selectedApproval.title}`)}
                    className="flex-1 px-4 py-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                  >
                    Reject Approval
                  </button>
                  <button
                    onClick={() => alert(`Approved: ${selectedApproval.title}`)}
                    className="flex-1 px-4 py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center text-3xl mb-4">
                👀
              </div>
              <p className="text-gray-400 text-sm">Select an approval to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
