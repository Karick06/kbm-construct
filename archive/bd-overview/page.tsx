"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  initialEnquiries, 
  type Enquiry,
  type EnquiryDocument,
  type DrawingFile,
  getEnquiriesFromStorage,
  saveEnquiriesToStorage,
  createEstimateJobFromEnquiry,
  getEstimateJobsFromStorage,
  saveEstimateJobsToStorage,
  convertFilesToDocuments,
  convertFilesToDrawings,
  formatFileSize,
  getFileIcon,
} from "@/lib/enquiries-store";
import { formatDate } from "@/lib/date-utils";

export default function BDOverviewPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>(initialEnquiries);
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [showNewEnquiryModal, setShowNewEnquiryModal] = useState(false);
  const [newEnquiryForm, setNewEnquiryForm] = useState({
    client: "",
    projectName: "",
    projectAddress: "",
    value: "",
    contact: "",
    contactEmail: "",
    source: "Website" as string,
    returnDate: "",
    anticipatedAwardDate: "",
    anticipatedSosDate: "",
    documents: [] as File[],
    drawings: [] as File[],
  });

  // Load enquiries from localStorage on mount to avoid hydration mismatch
  useEffect(() => {
    const storedEnquiries = getEnquiriesFromStorage();
    setEnquiries(storedEnquiries);
  }, []);

  // Save enquiries to localStorage whenever they change
  useEffect(() => {
    saveEnquiriesToStorage(enquiries);
  }, [enquiries]);

  // Compute enquiries by status
  const enquiriesByStatus = {
    new: enquiries.filter((e) => e.status === "new"),
    declined: enquiries.filter((e) => e.status === "declined"),
  };

  // Compute dynamic stats
  const currentBdStats = [
    { label: "New Enquiries", value: enquiriesByStatus.new.length.toString(), change: "Awaiting review", icon: "📨" },
    { label: "Declined", value: enquiriesByStatus.declined.length.toString(), change: "Archived", icon: "❌" },
    { label: "Total Pipeline Value", value: `£${(enquiries.filter(e => e.status !== "declined").reduce((sum, e) => sum + parseFloat(e.value.replace(/[£MK,]/g, "")), 0) / 1000).toFixed(1)}M`, change: "Active enquiries", icon: "💰" },
  ];

  // Handle creating new enquiry
  const handleCreateEnquiry = async () => {
    if (!newEnquiryForm.client || !newEnquiryForm.projectName || !newEnquiryForm.value || !newEnquiryForm.contact || !newEnquiryForm.contactEmail) {
      alert("Please fill in all required fields");
      return;
    }

    const enquiryId = `ENQ-2026-${String(Math.max(...enquiries.map(e => parseInt(e.id.split("-")[2])), 0) + 1).padStart(3, "0")}`;
    
    // Convert files to documents
    let documents: EnquiryDocument[] = [];
    if (newEnquiryForm.documents && newEnquiryForm.documents.length > 0) {
      try {
        documents = await convertFilesToDocuments(newEnquiryForm.documents, enquiryId);
      } catch (error) {
        console.error("Failed to process documents:", error);
        alert("Failed to process some documents");
        return;
      }
    }

    // Convert drawing files
    let drawingFiles: DrawingFile[] = [];
    if (newEnquiryForm.drawings && newEnquiryForm.drawings.length > 0) {
      try {
        drawingFiles = await convertFilesToDrawings(newEnquiryForm.drawings);
      } catch (error) {
        console.error("Failed to process drawings:", error);
        alert("Failed to process some drawing files");
        return;
      }
    }

    const newEnquiry: Enquiry = {
      id: enquiryId,
      client: newEnquiryForm.client,
      projectName: newEnquiryForm.projectName,
      projectAddress: newEnquiryForm.projectAddress,
      value: newEnquiryForm.value.startsWith("£") ? newEnquiryForm.value : `£${newEnquiryForm.value}`,
      contact: newEnquiryForm.contact,
      contactEmail: newEnquiryForm.contactEmail,
      source: newEnquiryForm.source,
      returnDate: newEnquiryForm.returnDate,
      anticipatedAwardDate: newEnquiryForm.anticipatedAwardDate,
      anticipatedSosDate: newEnquiryForm.anticipatedSosDate,
      documents: documents.length > 0 ? documents : undefined,
      drawingFiles: drawingFiles.length > 0 ? drawingFiles : undefined,
      status: "new",
      receivedDate: new Date().toISOString().split("T")[0],
    };

    setEnquiries([newEnquiry, ...enquiries]);
    setShowNewEnquiryModal(false);
    setNewEnquiryForm({
      client: "",
      projectName: "",
      projectAddress: "",
      value: "",
      contact: "",
      contactEmail: "",
      source: "Website",
      returnDate: "",
      anticipatedAwardDate: "",
      anticipatedSosDate: "",
      documents: [],
      drawings: [],
    });
  };

  // Handle declining enquiry
  const handleDeclineEnquiry = (enquiryId: string) => {
    setEnquiries(enquiries.map(e => e.id === enquiryId ? { ...e, status: "declined" } : e));
  };

  // Handle moving new enquiry to under-review
  const handleMoveToReview = (enquiryId: string) => {
    // Find the enquiry being sent
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry) {
      console.error('Enquiry not found:', enquiryId);
      return;
    }

    // Create and save estimate job FIRST
    const newJob = createEstimateJobFromEnquiry(enquiry);
    const existingJobs = getEstimateJobsFromStorage();
    const updatedJobs = [newJob, ...existingJobs];
    saveEstimateJobsToStorage(updatedJobs);
    
    // Update status to sent-to-estimating and save to localStorage
    const updatedEnquiries = enquiries.map(e => e.id === enquiryId ? { ...e, status: "sent-to-estimating" as const } : e);
    setEnquiries(updatedEnquiries);
    saveEnquiriesToStorage(updatedEnquiries);

    // Navigate after ensuring storage operations complete
    setTimeout(() => {
      router.push(`/estimating-overview?enquiry=${enquiryId}`);
    }, 100);
  };

  // Handle accepting enquiry
  const handleAcceptEnquiry = (enquiryId: string, reviewedBy: string = "Current User") => {
    // Find the enquiry being accepted
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry) return;

    // Create and save estimate job FIRST
    const newJob = createEstimateJobFromEnquiry(enquiry);
    const existingJobs = getEstimateJobsFromStorage();
    saveEstimateJobsToStorage([newJob, ...existingJobs]);

    setEnquiries(enquiries.map(e => e.id === enquiryId ? { ...e, status: "sent-to-estimating", reviewedBy } : e));
    setTimeout(() => {
      router.push(`/estimating-overview?enquiry=${enquiryId}`);
    }, 300);
  };

  // Handle sending to estimating
  const router = useRouter();
  const handleSendToEstimating = (enquiryId: string) => {
    // Find the enquiry being sent
    const enquiry = enquiries.find(e => e.id === enquiryId);
    if (!enquiry) {
      console.error('Enquiry not found:', enquiryId);
      return;
    }

    // Create and save estimate job FIRST
    const newJob = createEstimateJobFromEnquiry(enquiry);
    const existingJobs = getEstimateJobsFromStorage();
    const updatedJobs = [newJob, ...existingJobs];
    saveEstimateJobsToStorage(updatedJobs);
    
    // Update status to sent-to-estimating and save to localStorage
    const updatedEnquiries = enquiries.map(e => e.id === enquiryId ? { ...e, status: "sent-to-estimating" as const } : e);
    setEnquiries(updatedEnquiries);
    saveEnquiriesToStorage(updatedEnquiries);
    
    // Close detail modal
    setSelectedEnquiry(null);

    // Navigate after ensuring storage operations complete
    setTimeout(() => {
      router.push(`/estimating-overview?enquiry=${enquiryId}`);
    }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button 
          onClick={() => setShowNewEnquiryModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
          + New Enquiry
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {currentBdStats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {stat.label}
              </p>
              <span className="text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.change}</p>
          </div>
        ))}
      </section>

      {/* Pipeline Workflow */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white">Enquiry Pipeline</h2>
          <p className="text-sm text-gray-400 mt-1">Track enquiries from receipt to acceptance/decline</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* New Enquiries Column */}
          <div className="flex flex-col rounded-lg border-2 border-blue-700/50 bg-blue-500/10 p-4 min-h-[600px]">
            <div className="mb-4 pb-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  📨 New Enquiries
                </h3>
                <span className="text-sm font-semibold text-blue-400">{enquiriesByStatus.new.length}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="space-y-3 flex-1">
              {enquiriesByStatus.new.map((enquiry) => (
                <div
                  key={enquiry.id}
                  onClick={() => setSelectedEnquiry(enquiry)}
                  className="rounded-lg bg-gray-700/40 p-3 hover:bg-gray-700/60 cursor-pointer border border-gray-700/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-blue-400">{enquiry.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400">
                      New
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{enquiry.projectName}</h4>
                  <p className="text-xs text-gray-400 mb-2">{enquiry.client}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-700/30">
                    <span className="text-gray-500">{enquiry.source}</span>
                    <span className="font-semibold text-orange-400">{enquiry.value}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Received: {formatDate(enquiry.receivedDate)}</p>
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-700/30">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeclineEnquiry(enquiry.id);
                      }}
                      className="flex-1 text-xs px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveToReview(enquiry.id);
                      }}
                      className="flex-1 text-xs px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors"
                    >
                      Send to Estimating →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Declined Column */}
          <div className="flex flex-col rounded-lg border-2 border-red-700/50 bg-red-500/10 p-4 min-h-[600px]">
            <div className="mb-4 pb-3 border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white flex items-center gap-2">
                  ❌ Declined
                </h3>
                <span className="text-sm font-semibold text-red-400">{enquiriesByStatus.declined.length}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Archived</p>
            </div>
            <div className="space-y-3 flex-1">
              {enquiriesByStatus.declined.map((enquiry) => (
                <div
                  key={enquiry.id}
                  onClick={() => setSelectedEnquiry(enquiry)}
                  className="rounded-lg bg-gray-700/40 p-3 hover:bg-gray-700/60 cursor-pointer border border-red-700/50 transition-all opacity-60"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-mono text-red-400">{enquiry.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400">
                      Declined
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{enquiry.projectName}</h4>
                  <p className="text-xs text-gray-400 mb-2">{enquiry.client}</p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-700/30">
                    <span className="text-gray-500">{enquiry.value}</span>
                    <span className="text-gray-500">{formatDate(enquiry.receivedDate)}</span>
                  </div>
                  {enquiry.notes && (
                    <p className="text-xs text-red-400 mt-2">Reason: {enquiry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Detail Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setSelectedEnquiry(null)}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4 sticky top-0 bg-gray-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedEnquiry.projectName}</h3>
                <p className="text-sm text-gray-400 mt-1">{selectedEnquiry.client}</p>
              </div>
              <button onClick={() => setSelectedEnquiry(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Key Information */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400">Enquiry ID</p>
                <p className="text-sm font-mono text-white mt-1">{selectedEnquiry.id}</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400">Estimated Value</p>
                <p className="text-sm font-bold text-orange-400 mt-1">{selectedEnquiry.value}</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm text-white mt-1">{selectedEnquiry.status.replace("-", " ").toUpperCase()}</p>
              </div>
            </div>

            {/* Project Details */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-4">
              <h4 className="text-xs font-semibold text-blue-400 mb-3">PROJECT DETAILS</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Project Name</p>
                  <p className="text-sm text-white mt-1">{selectedEnquiry.projectName}</p>
                </div>
                {selectedEnquiry.projectAddress && (
                  <div>
                    <p className="text-xs text-gray-400">Project Address</p>
                    <p className="text-sm text-white mt-1">{selectedEnquiry.projectAddress}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
              <h4 className="text-xs font-semibold text-purple-400 mb-3">CONTACT INFORMATION</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-400">Contact Name</p>
                  <p className="text-sm text-white mt-1">{selectedEnquiry.contact}</p>
                </div>
                {selectedEnquiry.contactEmail && (
                  <div>
                    <p className="text-xs text-gray-400">Contact Email</p>
                    <p className="text-sm text-white mt-1">{selectedEnquiry.contactEmail}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Information */}
            {(selectedEnquiry.returnDate || selectedEnquiry.anticipatedAwardDate || selectedEnquiry.anticipatedSosDate) && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-semibold text-green-400 mb-3">TIMELINE</h4>
                <div className="grid grid-cols-3 gap-3">
                  {selectedEnquiry.returnDate && (
                    <div>
                      <p className="text-xs text-gray-400">Return Date</p>
                      <p className="text-sm text-white mt-1">{formatDate(selectedEnquiry.returnDate)}</p>
                    </div>
                  )}
                  {selectedEnquiry.anticipatedAwardDate && (
                    <div>
                      <p className="text-xs text-gray-400">Anticipated Award Date</p>
                      <p className="text-sm text-white mt-1">{formatDate(selectedEnquiry.anticipatedAwardDate)}</p>
                    </div>
                  )}
                  {selectedEnquiry.anticipatedSosDate && (
                    <div>
                      <p className="text-xs text-gray-400">Anticipated Start of Service</p>
                      <p className="text-sm text-white mt-1">{formatDate(selectedEnquiry.anticipatedSosDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Source & Reception */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400">Source</p>
                <p className="text-sm text-white mt-1">{selectedEnquiry.source}</p>
              </div>
              <div className="bg-gray-700/30 rounded-lg p-3">
                <p className="text-xs text-gray-400">Received Date</p>
                <p className="text-sm text-white mt-1">{formatDate(selectedEnquiry.receivedDate)}</p>
              </div>
            </div>

            {selectedEnquiry.reviewedBy && (
              <div className="bg-gray-700/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-gray-400">Reviewed By</p>
                <p className="text-sm text-white mt-1">{selectedEnquiry.reviewedBy}</p>
              </div>
            )}

            {selectedEnquiry.notes && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-400 font-semibold">Notes</p>
                <p className="text-sm text-white mt-1">{selectedEnquiry.notes}</p>
              </div>
            )}

            {/* Documents Section */}
            {selectedEnquiry.documents && selectedEnquiry.documents.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-4">
                <h4 className="text-xs font-semibold text-amber-400 mb-3">📎 DOCUMENTS ({selectedEnquiry.documents.length})</h4>
                <div className="space-y-2">
                  {selectedEnquiry.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-700/40 rounded p-2 hover:bg-gray-700/60 transition-colors">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(doc.fileType)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-200 truncate">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                        </div>
                      </div>
                      <a
                        href={doc.dataUrl}
                        download={doc.fileName}
                        className="ml-2 px-2 py-1 rounded bg-amber-500/30 border border-amber-500/50 text-amber-300 hover:bg-amber-500/40 transition-colors text-xs font-medium"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedEnquiry(null)}
                className="flex-1 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              {(selectedEnquiry.status === "new" || selectedEnquiry.status === "under-review" || selectedEnquiry.status === "accepted") && (
                <button 
                  onClick={() => handleSendToEstimating(selectedEnquiry.id)}
                  className="flex-1 px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors font-medium">
                  Send to Estimating →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Enquiry Modal */}
      {showNewEnquiryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowNewEnquiryModal(false)}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-800 pb-3">
              <h3 className="text-xl font-bold text-white">New Enquiry</h3>
              <button onClick={() => setShowNewEnquiryModal(false)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* First Row: Client & Project Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Client Name *</label>
                  <input
                    type="text"
                    value={newEnquiryForm.client}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, client: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., ABC Construction Ltd"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Project Name *</label>
                  <input
                    type="text"
                    value={newEnquiryForm.projectName}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, projectName: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Residential Complex"
                  />
                </div>
              </div>

              {/* Project Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Project Address</label>
                <input
                  type="text"
                  value={newEnquiryForm.projectAddress}
                  onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, projectAddress: e.target.value })}
                  className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., 123 High Street, London"
                />
              </div>

              {/* Second Row: Value & Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Estimated Value *</label>
                  <input
                    type="text"
                    value={newEnquiryForm.value}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, value: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 2.5M or £2.5M"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contact Name *</label>
                  <input
                    type="text"
                    value={newEnquiryForm.contact}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, contact: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., John Smith"
                  />
                </div>
              </div>

              {/* Contact Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Contact Email *</label>
                <input
                  type="email"
                  value={newEnquiryForm.contactEmail}
                  onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, contactEmail: e.target.value })}
                  className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g., john.smith@client.com"
                />
              </div>

              {/* Third Row: Source & Return Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Source</label>
                  <select
                    value={newEnquiryForm.source}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, source: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Website">Website</option>
                    <option value="Referral">Referral</option>
                    <option value="Direct">Direct</option>
                    <option value="Tender Portal">Tender Portal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Return Date</label>
                  <input
                    type="date"
                    value={newEnquiryForm.returnDate}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, returnDate: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Fourth Row: Award Date & SoS Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Anticipated Award Date</label>
                  <input
                    type="date"
                    value={newEnquiryForm.anticipatedAwardDate}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, anticipatedAwardDate: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">Anticipated Start of Service</label>
                  <input
                    type="date"
                    value={newEnquiryForm.anticipatedSosDate}
                    onChange={(e) => setNewEnquiryForm({ ...newEnquiryForm, anticipatedSosDate: e.target.value })}
                    className="w-full rounded bg-gray-700 border border-gray-600 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Documents (Optional)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    multiple
                    id="enquiry-documents"
                    onChange={(e) => {
                      if (e.target.files) {
                        setNewEnquiryForm({
                          ...newEnquiryForm,
                          documents: Array.from(e.target.files),
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="enquiry-documents"
                    className="flex-1 px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white text-sm cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    📎 Choose Files
                  </label>
                  {newEnquiryForm.documents && newEnquiryForm.documents.length > 0 && (
                    <span className="text-xs text-gray-400">{newEnquiryForm.documents.length} file(s)</span>
                  )}
                </div>
              </div>

              {/* Drawing Upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Drawings (PDF/Images for Measurement)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    id="enquiry-drawings"
                    onChange={(e) => {
                      if (e.target.files) {
                        setNewEnquiryForm({
                          ...newEnquiryForm,
                          drawings: Array.from(e.target.files),
                        });
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="enquiry-drawings"
                    className="flex-1 px-3 py-2 rounded bg-blue-600 border border-blue-500 text-white text-sm cursor-pointer hover:bg-blue-700 transition-colors"
                  >
                    📐 Choose Drawings
                  </label>
                  {newEnquiryForm.drawings && newEnquiryForm.drawings.length > 0 && (
                    <span className="text-xs text-gray-400">{newEnquiryForm.drawings.length} drawing(s)</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Upload drawings for quantity takeoff measurement</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewEnquiryModal(false)}
                className="flex-1 px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEnquiry}
                className="flex-1 px-4 py-2 rounded bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
              >
                Create Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
