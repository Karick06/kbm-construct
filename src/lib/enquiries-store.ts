/**
 * Shared enquiry and estimate job data store
 * Used across BD Overview and Estimating Overview pages
 */

export type EnquiryDocument = {
  id: string;
  enquiryId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  dataUrl: string; // Base64 encoded file data
};

export type Enquiry = {
  id: string;
  client: string;
  projectName: string;
  projectAddress?: string;
  value: string;
  receivedDate: string;
  contact: string;
  contactEmail?: string;
  source: string;
  returnDate?: string;
  anticipatedAwardDate?: string;
  anticipatedSosDate?: string;
  documents?: EnquiryDocument[];
  status: "new" | "under-review" | "accepted" | "declined" | "sent-to-estimating";
  reviewedBy?: string;
  notes?: string;
};

export type EstimateJob = {
  id: string;
  enquiryId: string;
  client: string;
  projectName: string;
  projectAddress?: string;
  value: string;
  receivedDate: string;
  assignedTo?: string;
  estimator?: string;
  status: "new-assignment" | "in-progress" | "quote-submitted" | "won" | "lost";
  progress?: number;
  quoteRef?: string;
  submittedDate?: string;
  outcome?: string;
  notes?: string;
};

export type RateComponent = {
  componentId: string;
  type: 'labour' | 'plant' | 'materials';
  description: string;
  outputPerUnit: number;
  quantity?: number;
  unit?: string;
  unitRate: number;
  cost: number;
};

export type BOQItem = {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  baseRate: number;
  total: number;
  components?: RateComponent[];
};

/**
 * Initial enquiry data
 */
export const initialEnquiries: Enquiry[] = [
  // New Enquiries
  { id: "ENQ-2026-018", client: "Fortis Developments", projectName: "Residential Estate Phase 2", projectAddress: "Orpington, Kent", value: "£3.2M", receivedDate: "2026-02-14", contact: "Sarah Williams", contactEmail: "sarah.williams@fortis.co.uk", source: "Website", status: "new" },
  { id: "ENQ-2026-017", client: "Greenwich Properties", projectName: "Office Refurbishment", projectAddress: "Greenwich, London", value: "£580K", receivedDate: "2026-02-13", contact: "James Parker", contactEmail: "james.parker@greenwich.co.uk", source: "Referral", status: "new" },
  { id: "ENQ-2026-016", client: "Apex Construction", projectName: "Warehouse Fit-Out", projectAddress: "Slough, Berkshire", value: "£1.1M", receivedDate: "2026-02-12", contact: "Michael Chen", contactEmail: "m.chen@apex.co.uk", source: "Direct", status: "new" },
  { id: "ENQ-2026-015", client: "Sterling Group", projectName: "School Extension", projectAddress: "Manchester", value: "£890K", receivedDate: "2026-02-11", contact: "Emma Foster", contactEmail: "emma.foster@sterling.co.uk", source: "Tender Portal", status: "new" },
  
  // Under Review
  { id: "ENQ-2026-014", client: "Thames Developments", projectName: "Mixed Use Complex", projectAddress: "Reading, Berkshire", value: "£4.8M", receivedDate: "2026-02-09", contact: "David Brown", contactEmail: "david.brown@thames.co.uk", source: "Direct", status: "under-review", reviewedBy: "Sarah Mitchell" },
  { id: "ENQ-2026-013", client: "Central Properties", projectName: "Hotel Renovation", projectAddress: "Birmingham", value: "£2.3M", receivedDate: "2026-02-08", contact: "Lisa Wang", contactEmail: "lisa.wang@central.co.uk", source: "Website", status: "under-review", reviewedBy: "James Bradford" },
  { id: "ENQ-2026-012", client: "Metro Estates", projectName: "Distribution Centre", projectAddress: "Coventry", value: "£6.5M", receivedDate: "2026-02-07", contact: "Tom Wilson", contactEmail: "tom.wilson@metro.co.uk", source: "Referral", status: "under-review", reviewedBy: "Sarah Mitchell" },
  
  // Sent to Estimating (accepted and moved)
  { id: "ENQ-2026-011", client: "Premier Group", projectName: "Retail Park Development", projectAddress: "Leeds", value: "£5.2M", receivedDate: "2026-02-05", contact: "Rachel Green", contactEmail: "rachel.green@premier.co.uk", source: "Direct", status: "sent-to-estimating", reviewedBy: "Sarah Mitchell", notes: "Fast track - client deadline 28 Feb" },
  { id: "ENQ-2026-010", client: "Riverside Developers", projectName: "Residential Tower", projectAddress: "Bristol", value: "£8.9M", receivedDate: "2026-02-04", contact: "Andrew Clark", contactEmail: "andrew.clark@riverside.co.uk", source: "Tender Portal", status: "sent-to-estimating", reviewedBy: "James Bradford", notes: "High value - assign senior estimator" },
  { id: "ENQ-2026-009", client: "Olympia Construction", projectName: "Sports Facility", projectAddress: "Newcastle", value: "£3.7M", receivedDate: "2026-02-03", contact: "Sophie Turner", contactEmail: "sophie.turner@olympia.co.uk", source: "Website", status: "sent-to-estimating", reviewedBy: "Sarah Mitchell" },
  
  // Declined
  { id: "ENQ-2026-008", client: "Budget Builders", projectName: "Residential Units", projectAddress: "Liverpool", value: "£420K", receivedDate: "2026-02-01", contact: "Mark Jones", contactEmail: "mark.jones@budget.co.uk", source: "Direct", status: "declined", reviewedBy: "James Bradford", notes: "Below minimum contract value" },
  { id: "ENQ-2026-007", client: "Quick Fix Ltd", projectName: "Factory Repairs", projectAddress: "Sheffield", value: "£180K", receivedDate: "2026-01-30", contact: "Peter Grant", contactEmail: "peter.grant@quickfix.co.uk", source: "Website", status: "declined", reviewedBy: "Sarah Mitchell", notes: "Outside core competency" },
];

/**
 * Initial estimate job data - linked to enquiries via enquiryId
 */
export const initialEstimateJobs: EstimateJob[] = [
  // New Assignments (from sent-to-estimating enquiries)
  {
    id: "EST-2026-048",
    enquiryId: "ENQ-2026-011",
    client: "Premier Group",
    projectName: "Retail Park Development",
    projectAddress: "Leeds",
    value: "£5.2M",
    receivedDate: "2026-02-05",
    status: "new-assignment",
  },
  {
    id: "EST-2026-049",
    enquiryId: "ENQ-2026-010",
    client: "Riverside Developers",
    projectName: "Residential Tower",
    projectAddress: "Bristol",
    value: "£8.9M",
    receivedDate: "2026-02-04",
    status: "new-assignment",
  },
  {
    id: "EST-2026-050",
    enquiryId: "ENQ-2026-009",
    client: "Olympia Construction",
    projectName: "Sports Facility",
    projectAddress: "Newcastle",
    value: "£3.7M",
    receivedDate: "2026-02-03",
    status: "new-assignment",
  },
  
  // In Progress (assigned)
  {
    id: "EST-2026-045",
    enquiryId: "ENQ-2026-014",
    client: "Thames Developments",
    projectName: "Mixed Use Complex",
    projectAddress: "Reading, Berkshire",
    value: "£4.8M",
    receivedDate: "2026-02-09",
    assignedTo: "Sarah Johnson",
    estimator: "Sarah Johnson",
    status: "in-progress",
    progress: 65,
    notes: "BOQ buildup 65% complete, awaiting subcontractor quotes for M&E works",
  },
  {
    id: "EST-2026-046",
    enquiryId: "ENQ-2026-013",
    client: "Central Properties",
    projectName: "Hotel Renovation",
    projectAddress: "Birmingham",
    value: "£2.3M",
    receivedDate: "2026-02-08",
    assignedTo: "Mark Thompson",
    estimator: "Mark Thompson",
    status: "in-progress",
    progress: 40,
    notes: "Materials pricing complete, working on preliminaries and plant costs",
  },
  {
    id: "EST-2026-047",
    enquiryId: "ENQ-2026-012",
    client: "Metro Estates",
    projectName: "Distribution Centre",
    projectAddress: "Coventry",
    value: "£6.5M",
    receivedDate: "2026-02-07",
    assignedTo: "Lisa Park",
    estimator: "Lisa Park",
    status: "in-progress",
    progress: 25,
    notes: "Initial scope review complete, beginning detailed BOQ breakdown",
  },
];

/**
 * Helper function to get estimate job details with linked enquiry data
 */
export const enrichEstimateJobWithEnquiry = (job: EstimateJob, enquiries: Enquiry[]): EstimateJob => {
  const linkedEnquiry = enquiries.find(e => e.id === job.enquiryId);
  if (linkedEnquiry) {
    return {
      ...job,
      projectAddress: linkedEnquiry.projectAddress || job.projectAddress,
      // Other fields could be synced here if needed
    };
  }
  return job;
};

/**
 * Helper function to create an estimate job from an enquiry
 */
export const createEstimateJobFromEnquiry = (enquiry: Enquiry): EstimateJob => {
  const jobNumber = Math.random().toString().substring(2, 5);
  return {
    id: `EST-2026-${jobNumber}`,
    enquiryId: enquiry.id,
    client: enquiry.client,
    projectName: enquiry.projectName,
    projectAddress: enquiry.projectAddress,
    value: enquiry.value,
    receivedDate: enquiry.receivedDate,
    status: "new-assignment",
  };
};

/**
 * localStorage persistence functions
 */
const ENQUIRIES_STORAGE_KEY = "kbm_enquiries";
const ESTIMATE_JOBS_STORAGE_KEY = "kbm_estimate_jobs";

/**
 * Get enquiries from localStorage, or return initial data if not found
 */
export const getEnquiriesFromStorage = (): Enquiry[] => {
  if (typeof window === "undefined") {
    return initialEnquiries;
  }
  try {
    const stored = localStorage.getItem(ENQUIRIES_STORAGE_KEY);
    let enquiries = stored ? JSON.parse(stored) : initialEnquiries;
    
    // Remove duplicates by keeping only the last occurrence of each ID
    const seen = new Set<string>();
    enquiries = enquiries.filter((enquiry: Enquiry) => {
      if (seen.has(enquiry.id)) {
        console.warn(`Duplicate enquiry ID found: ${enquiry.id}, removing duplicate`);
        return false;
      }
      seen.add(enquiry.id);
      return true;
    });
    
    return enquiries;
  } catch (error) {
    console.error("Failed to parse enquiries from localStorage:", error);
  }
  return initialEnquiries;
};

/**
 * Save enquiries to localStorage
 */
export const saveEnquiriesToStorage = (enquiries: Enquiry[]): void => {
  if (typeof window === "undefined") return;
  try {
    // Deduplicate before saving
    const seen = new Set<string>();
    const deduplicated = enquiries.filter((enquiry: Enquiry) => {
      if (seen.has(enquiry.id)) {
        return false;
      }
      seen.add(enquiry.id);
      return true;
    });
    localStorage.setItem(ENQUIRIES_STORAGE_KEY, JSON.stringify(deduplicated));
  } catch (error) {
    console.error("Failed to save enquiries to localStorage:", error);
  }
};

/**
 * Get estimate jobs from localStorage, or return initial data if not found
 */
export const getEstimateJobsFromStorage = (): EstimateJob[] => {
  if (typeof window === "undefined") {
    return initialEstimateJobs;
  }
  try {
    const stored = localStorage.getItem(ESTIMATE_JOBS_STORAGE_KEY);
    let jobs = stored ? JSON.parse(stored) : initialEstimateJobs;
    
    // Remove duplicates by keeping only the last occurrence of each ID
    const seen = new Set<string>();
    jobs = jobs.filter((job: EstimateJob) => {
      if (seen.has(job.id)) {
        console.warn(`Duplicate job ID found: ${job.id}, removing duplicate`);
        return false;
      }
      seen.add(job.id);
      return true;
    });
    
    return jobs;
  } catch (error) {
    console.error("Failed to parse estimate jobs from localStorage:", error);
  }
  return initialEstimateJobs;
};

/**
 * Save estimate jobs to localStorage
 */
export const saveEstimateJobsToStorage = (jobs: EstimateJob[]): void => {
  if (typeof window === "undefined") return;
  try {
    // Deduplicate before saving
    const seen = new Set<string>();
    const deduplicated = jobs.filter((job: EstimateJob) => {
      if (seen.has(job.id)) {
        return false;
      }
      seen.add(job.id);
      return true;
    });
    localStorage.setItem(ESTIMATE_JOBS_STORAGE_KEY, JSON.stringify(deduplicated));
  } catch (error) {
    console.error("Failed to save estimate jobs to localStorage:", error);
  }
};

/**
 * Clear all stored data (useful for reset/testing)
 */
export const clearAllStoredData = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ENQUIRIES_STORAGE_KEY);
  localStorage.removeItem(ESTIMATE_JOBS_STORAGE_KEY);
};

/**
 * Convert File objects to storable EnquiryDocument objects
 */
export const convertFilesToDocuments = async (
  files: File[],
  enquiryId: string
): Promise<EnquiryDocument[]> => {
  return Promise.all(
    files.map(
      (file) =>
        new Promise<EnquiryDocument>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            resolve({
              id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              enquiryId,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date().toISOString(),
              dataUrl,
            });
          };
          reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
          reader.readAsDataURL(file);
        })
    )
  );
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

/**
 * Get file icon based on file type
 */
export const getFileIcon = (fileType: string): string => {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
  return "📎";
};
