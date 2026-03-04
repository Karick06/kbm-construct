/**
 * Client Integration Store
 * Connects Clients with BD Overview, Projects, and Estimates
 * Enables cross-page tracking of won/lost projects and client activities
 */

export type ProjectStatus = 
  | "Opportunity"      // Initial enquiry/lead
  | "Estimating"       // Currently being estimated
  | "Submitted"        // Quote submitted, awaiting decision
  | "Won"              // Project won, moving to mobilisation
  | "Lost"             // Project lost to competitor
  | "Active"           // Project in progress
  | "On Hold"          // Temporarily paused
  | "Completed"        // Successfully delivered
  | "Cancelled";       // Cancelled by client

export type ProjectSource = 
  | "Client Request"
  | "BD Enquiry"
  | "Tender Portal"
  | "Referral"
  | "Direct Contact"
  | "Framework";

export type IntegratedProject = {
  id: string;
  clientId: string;
  clientName: string;
  name: string;
  value: string;
  status: ProjectStatus;
  source: ProjectSource;
  createdDate: string;
  startDate?: string;
  completedDate?: string;
  
  // BD/Estimating tracking
  enquiryId?: string;
  estimateId?: string;
  quoteSubmittedDate?: string;
  decisionDate?: string;
  
  // Project execution
  projectManagerId?: string;
  projectManagerName?: string;
  teamSize?: number;
  progress?: number;
  
  // Outcome tracking
  lostReason?: string;
  lostToCompetitor?: string;
  winReason?: string;
  
  // Cross-references
  linkedDocuments?: string[];
  notes?: string;
};

export type ClientActivity = {
  id: string;
  clientId: string;
  type: "project_created" | "project_won" | "project_lost" | "project_completed" | "email_sent" | "meeting" | "call" | "note";
  description: string;
  date: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, any>;
};

/**
 * Storage keys
 */
const STORAGE_KEYS = {
  INTEGRATED_PROJECTS: "kbm_integrated_projects",
  CLIENT_ACTIVITIES: "kbm_client_activities",
} as const;

/**
 * Get projects from localStorage
 */
export function getIntegratedProjectsFromStorage(): IntegratedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.INTEGRATED_PROJECTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save projects to localStorage
 */
export function saveIntegratedProjectsToStorage(projects: IntegratedProject[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.INTEGRATED_PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save integrated projects:", error);
  }
}

/**
 * Get client activities from localStorage
 */
export function getClientActivitiesFromStorage(): ClientActivity[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CLIENT_ACTIVITIES);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save client activities to localStorage
 */
export function saveClientActivitiesToStorage(activities: ClientActivity[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ACTIVITIES, JSON.stringify(activities));
  } catch (error) {
    console.error("Failed to save client activities:", error);
  }
}

/**
 * Create a new integrated project
 */
export function createIntegratedProject(
  projectData: Omit<IntegratedProject, "id" | "createdDate">
): IntegratedProject {
  const projects = getIntegratedProjectsFromStorage();
  const newProject: IntegratedProject = {
    ...projectData,
    id: `IPJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdDate: new Date().toISOString().split('T')[0],
  };
  
  saveIntegratedProjectsToStorage([...projects, newProject]);
  
  // Log activity
  logClientActivity({
    clientId: newProject.clientId,
    type: "project_created",
    description: `New project created: ${newProject.name} (${newProject.value})`,
    date: newProject.createdDate,
  });
  
  return newProject;
}

/**
 * Update project status with outcome tracking
 */
export function updateProjectStatus(
  projectId: string,
  newStatus: ProjectStatus,
  additionalData?: {
    lostReason?: string;
    lostToCompetitor?: string;
    winReason?: string;
    decisionDate?: string;
  }
): IntegratedProject | null {
  const projects = getIntegratedProjectsFromStorage();
  const projectIndex = projects.findIndex(p => p.id === projectId);
  
  if (projectIndex === -1) return null;
  
  const updatedProject = {
    ...projects[projectIndex],
    status: newStatus,
    ...additionalData,
  };
  
  projects[projectIndex] = updatedProject;
  saveIntegratedProjectsToStorage(projects);
  
  // Log activity based on status change
  if (newStatus === "Won") {
    logClientActivity({
      clientId: updatedProject.clientId,
      type: "project_won",
      description: `🎉 Project won: ${updatedProject.name} (${updatedProject.value})${additionalData?.winReason ? ` - ${additionalData.winReason}` : ''}`,
      date: additionalData?.decisionDate || new Date().toISOString().split('T')[0],
    });
  } else if (newStatus === "Lost") {
    logClientActivity({
      clientId: updatedProject.clientId,
      type: "project_lost",
      description: `Project lost: ${updatedProject.name}${additionalData?.lostReason ? ` - ${additionalData.lostReason}` : ''}${additionalData?.lostToCompetitor ? ` (to ${additionalData.lostToCompetitor})` : ''}`,
      date: additionalData?.decisionDate || new Date().toISOString().split('T')[0],
    });
  } else if (newStatus === "Completed") {
    logClientActivity({
      clientId: updatedProject.clientId,
      type: "project_completed",
      description: `✅ Project completed: ${updatedProject.name}`,
      date: new Date().toISOString().split('T')[0],
    });
  }
  
  return updatedProject;
}

/**
 * Get all projects for a client
 */
export function getClientProjects(clientId: string): IntegratedProject[] {
  const projects = getIntegratedProjectsFromStorage();
  return projects.filter(p => p.clientId === clientId);
}

/**
 * Get client statistics
 */
export function getClientStats(clientId: string) {
  const projects = getClientProjects(clientId);
  
  return {
    totalProjects: projects.length,
    opportunityCount: projects.filter(p => p.status === "Opportunity").length,
    estimatingCount: projects.filter(p => p.status === "Estimating").length,
    submittedCount: projects.filter(p => p.status === "Submitted").length,
    wonCount: projects.filter(p => p.status === "Won").length,
    lostCount: projects.filter(p => p.status === "Lost").length,
    activeCount: projects.filter(p => p.status === "Active").length,
    completedCount: projects.filter(p => p.status === "Completed").length,
    
    // Financial metrics
    totalValue: calculateTotalValue(projects),
    wonValue: calculateTotalValue(projects.filter(p => p.status === "Won" || p.status === "Active" || p.status === "Completed")),
    opportunityValue: calculateTotalValue(projects.filter(p => p.status === "Opportunity" || p.status === "Estimating" || p.status === "Submitted")),
    lostValue: calculateTotalValue(projects.filter(p => p.status === "Lost")),
    
    // Win rate
    winRate: calculateWinRate(projects),
  };
}

/**
 * Calculate total value from projects
 */
function calculateTotalValue(projects: IntegratedProject[]): number {
  return projects.reduce((sum, p) => {
    const valueStr = p.value.replace(/[£,MKmk]/gi, '');
    let value = parseFloat(valueStr);
    
    // Handle M/K suffixes
    if (p.value.match(/M/i)) value *= 1000000;
    else if (p.value.match(/K/i)) value *= 1000;
    
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
}

/**
 * Format currency value
 */
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `£${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `£${(value / 1000).toFixed(0)}K`;
  }
  return `£${value.toFixed(0)}`;
}

/**
 * Calculate win rate
 */
function calculateWinRate(projects: IntegratedProject[]): number {
  const decidedProjects = projects.filter(p => p.status === "Won" || p.status === "Lost");
  if (decidedProjects.length === 0) return 0;
  
  const wonProjects = decidedProjects.filter(p => p.status === "Won");
  return Math.round((wonProjects.length / decidedProjects.length) * 100);
}

/**
 * Log client activity
 */
export function logClientActivity(
  activityData: Omit<ClientActivity, "id">
): ClientActivity {
  const activities = getClientActivitiesFromStorage();
  const newActivity: ClientActivity = {
    ...activityData,
    id: `ACT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };
  
  saveClientActivitiesToStorage([newActivity, ...activities]);
  return newActivity;
}

/**
 * Get activities for a client
 */
export function getClientActivities(clientId: string): ClientActivity[] {
  const activities = getClientActivitiesFromStorage();
  return activities.filter(a => a.clientId === clientId);
}

/**
 * Link enquiry to client
 */
export function linkEnquiryToClient(
  enquiryId: string,
  clientId: string,
  clientName: string,
  enquiryData: {
    projectName: string;
    value: string;
    source?: string;
  }
): IntegratedProject {
  return createIntegratedProject({
    clientId,
    clientName,
    name: enquiryData.projectName,
    value: enquiryData.value,
    status: "Opportunity",
    source: (enquiryData.source as ProjectSource) || "BD Enquiry",
    enquiryId,
  });
}

/**
 * Get all projects by status
 */
export function getProjectsByStatus(status: ProjectStatus): IntegratedProject[] {
  const projects = getIntegratedProjectsFromStorage();
  return projects.filter(p => p.status === status);
}

/**
 * Get pipeline summary
 */
export function getPipelineSummary() {
  const projects = getIntegratedProjectsFromStorage();
  
  return {
    opportunities: {
      count: projects.filter(p => p.status === "Opportunity").length,
      value: calculateTotalValue(projects.filter(p => p.status === "Opportunity")),
    },
    estimating: {
      count: projects.filter(p => p.status === "Estimating").length,
      value: calculateTotalValue(projects.filter(p => p.status === "Estimating")),
    },
    submitted: {
      count: projects.filter(p => p.status === "Submitted").length,
      value: calculateTotalValue(projects.filter(p => p.status === "Submitted")),
    },
    won: {
      count: projects.filter(p => p.status === "Won").length,
      value: calculateTotalValue(projects.filter(p => p.status === "Won")),
    },
    active: {
      count: projects.filter(p => p.status === "Active").length,
      value: calculateTotalValue(projects.filter(p => p.status === "Active")),
    },
    completed: {
      count: projects.filter(p => p.status === "Completed").length,
      value: calculateTotalValue(projects.filter(p => p.status === "Completed")),
    },
    lost: {
      count: projects.filter(p => p.status === "Lost").length,
      value: calculateTotalValue(projects.filter(p => p.status === "Lost")),
    },
  };
}

/**
 * Initialize sample integrated projects for demo purposes
 */
export function initializeSampleProjects(): void {
  const existing = getIntegratedProjectsFromStorage();
  if (existing.length > 0) return; // Already initialized

  const sampleProjects: IntegratedProject[] = [
    // Thames Property Group (CLT-001) - Mix of Won, Active, Completed, Opportunity
    {
      id: "IPJ-001",
      clientId: "CLT-001",
      clientName: "Thames Property Group",
      name: "Thames Retail Park",
      value: "£2.5M",
      status: "Active",
      source: "Framework",
      createdDate: "2025-12-10",
      startDate: "2026-01-15",
      enquiryId: "ENQ-2025-088",
      estimateId: "EST-2025-042",
      quoteSubmittedDate: "2025-12-20",
      decisionDate: "2026-01-05",
      winReason: "Strong existing relationship and competitive pricing",
    },
    {
      id: "IPJ-002",
      clientId: "CLT-001",
      clientName: "Thames Property Group",
      name: "Office Complex Phase 2",
      value: "£4.8M",
      status: "Won",
      source: "Client Request",
      createdDate: "2025-10-15",
      startDate: "2025-11-20",
      enquiryId: "ENQ-2025-075",
      decisionDate: "2025-11-10",
      winReason: "Successful completion of Phase 1, client trust",
    },
    {
      id: "IPJ-003",
      clientId: "CLT-001",
      clientName: "Thames Property Group",
      name: "Mixed Use Development",
      value: "£6.2M",
      status: "Submitted",
      source: "Client Request",
      createdDate: "2026-01-20",
      quoteSubmittedDate: "2026-02-10",
    },
    {
      id: "IPJ-004",
      clientId: "CLT-001",
      clientName: "Thames Property Group",
      name: "Warehouse Conversion",
      value: "£1.8M",
      status: "Completed",
      source: "Direct Contact",
      createdDate: "2024-08-10",
      startDate: "2024-09-15",
      completedDate: "2025-11-30",
    },
    {
      id: "IPJ-005",
      clientId: "CLT-001",
      clientName: "Thames Property Group",
      name: "Shopping District Phase 3",
      value: "£5.5M",
      status: "Lost",
      source: "Tender Portal",
      createdDate: "2025-11-01",
      decisionDate: "2026-01-15",
      lostReason: "Price 8% above budget, client went with lower bid",
      lostToCompetitor: "Balfour Beatty",
    },

    // London Developments Ltd (CLT-002)
    {
      id: "IPJ-006",
      clientId: "CLT-002",
      clientName: "London Developments Ltd",
      name: "Riverside Apartments",
      value: "£3.2M",
      status: "Active",
      source: "Referral",
      createdDate: "2025-11-25",
      startDate: "2025-12-10",
      decisionDate: "2025-12-05",
      winReason: "Excellent portfolio of residential projects",
    },
    {
      id: "IPJ-007",
      clientId: "CLT-002",
      clientName: "London Developments Ltd",
      name: "City Centre Housing",
      value: "£4.5M",
      status: "Estimating",
      source: "BD Enquiry",
      createdDate: "2026-02-01",
      enquiryId: "ENQ-2026-015",
    },
    {
      id: "IPJ-008",
      clientId: "CLT-002",
      clientName: "London Developments Ltd",
      name: "Luxury Townhouses",
      value: "£2.1M",
      status: "Lost",
      source: "Tender Portal",
      createdDate: "2025-09-10",
      decisionDate: "2025-10-20",
      lostReason: "Timeline didn't align with client's aggressive schedule",
      lostToCompetitor: "McLaren Construction",
    },

    // Westminster Council (CLT-003)
    {
      id: "IPJ-009",
      clientId: "CLT-003",
      clientName: "Westminster Council",
      name: "Community Center Renovation",
      value: "£1.8M",
      status: "Active",
      source: "Framework",
      createdDate: "2025-11-10",
      startDate: "2026-01-05",
      decisionDate: "2025-12-15",
      winReason: "Framework agreement, excellent public sector track record",
    },
    {
      id: "IPJ-010",
      clientId: "CLT-003",
      clientName: "Westminster Council",
      name: "Park Infrastructure",
      value: "£950K",
      status: "Completed",
      source: "Framework",
      createdDate: "2025-07-01",
      startDate: "2025-09-01",
      completedDate: "2026-01-30",
    },
    {
      id: "IPJ-011",
      clientId: "CLT-003",
      clientName: "Westminster Council",
      name: "School Extension Project",
      value: "£3.5M",
      status: "Opportunity",
      source: "Framework",
      createdDate: "2026-02-10",
    },

    // Green Spaces Ltd (CLT-004)
    {
      id: "IPJ-012",
      clientId: "CLT-004",
      clientName: "Green Spaces Ltd",
      name: "Eco Development Phase 1",
      value: "£2.9M",
      status: "Submitted",
      source: "Tender Portal",
      createdDate: "2026-01-15",
      quoteSubmittedDate: "2026-02-05",
      enquiryId: "ENQ-2026-012",
    },

    // City Tech Campus (CLT-005)
    {
      id: "IPJ-013",
      clientId: "CLT-005",
      clientName: "City Tech Campus",
      name: "Research Facility Build",
      value: "£4.2M",
      status: "Won",
      source: "Direct Contact",
      createdDate: "2025-12-01",
      startDate: "2026-01-20",
      decisionDate: "2025-12-20",
      winReason: "Specialized experience with technical facilities",
    },
    {
      id: "IPJ-014",
      clientId: "CLT-005",
      clientName: "City Tech Campus",
      name: "Data Center Expansion",
      value: "£2.0M",
      status: "Active",
      source: "Client Request",
      createdDate: "2025-10-01",
      startDate: "2025-11-15",
    },
  ];

  saveIntegratedProjectsToStorage(sampleProjects);

  // Also create some sample activities
  const sampleActivities: ClientActivity[] = [
    {
      id: "ACT-001",
      clientId: "CLT-001",
      type: "project_won",
      description: "🎉 Project won: Thames Retail Park (£2.5M) - Strong existing relationship and competitive pricing",
      date: "2026-01-05",
    },
    {
      id: "ACT-002",
      clientId: "CLT-001",
      type: "project_created",
      description: "New project created: Mixed Use Development (£6.2M)",
      date: "2026-01-20",
    },
    {
      id: "ACT-003",
      clientId: "CLT-001",
      type: "project_lost",
      description: "Project lost: Shopping District Phase 3 - Price 8% above budget, client went with lower bid (to Balfour Beatty)",
      date: "2026-01-15",
    },
    {
      id: "ACT-004",
      clientId: "CLT-001",
      type: "project_completed",
      description: "✅ Project completed: Warehouse Conversion",
      date: "2025-11-30",
    },
    {
      id: "ACT-005",
      clientId: "CLT-002",
      type: "project_won",
      description: "🎉 Project won: Riverside Apartments (£3.2M) - Excellent portfolio of residential projects",
      date: "2025-12-05",
    },
    {
      id: "ACT-006",
      clientId: "CLT-002",
      type: "project_created",
      description: "New project created: City Centre Housing (£4.5M)",
      date: "2026-02-01",
    },
    {
      id: "ACT-007",
      clientId: "CLT-002",
      type: "project_lost",
      description: "Project lost: Luxury Townhouses - Timeline didn't align with client's aggressive schedule (to McLaren Construction)",
      date: "2025-10-20",
    },
    {
      id: "ACT-008",
      clientId: "CLT-003",
      type: "project_won",
      description: "🎉 Project won: Community Center Renovation (£1.8M) - Framework agreement, excellent public sector track record",
      date: "2025-12-15",
    },
    {
      id: "ACT-009",
      clientId: "CLT-003",
      type: "project_completed",
      description: "✅ Project completed: Park Infrastructure",
      date: "2026-01-30",
    },
    {
      id: "ACT-010",
      clientId: "CLT-003",
      type: "project_created",
      description: "New project created: School Extension Project (£3.5M)",
      date: "2026-02-10",
    },
    {
      id: "ACT-011",
      clientId: "CLT-005",
      type: "project_won",
      description: "🎉 Project won: Research Facility Build (£4.2M) - Specialized experience with technical facilities",
      date: "2025-12-20",
    },
  ];

  saveClientActivitiesToStorage(sampleActivities);
}

/**
 * Client name to ID mapping (can be expanded as needed)
 * This maps client names from estimates/enquiries to client IDs
 */
const CLIENT_NAME_TO_ID_MAP: Record<string, string> = {
  "Thames Property Group": "CLT-001",
  "London Developments Ltd": "CLT-002",
  "London Developments": "CLT-002",
  "Westminster Council": "CLT-003",
  "Green Spaces Ltd": "CLT-004",
  "Green Spaces": "CLT-004",
  "City Tech Campus": "CLT-005",
  "Thames Developments": "CLT-001", // Likely same as Thames Property Group
  "Central Properties": "CLT-002", // Map to similar client
  "Metro Estates": "CLT-002",
  "Premier Group": "CLT-001",
  "Riverside Developers": "CLT-002",
  "Olympia Construction": "CLT-003",
  "Fortis Developments": "CLT-002",
  "Greenwich Properties": "CLT-001",
};

/**
 * Get client ID from client name
 */
export function getClientIdFromName(clientName: string): string | null {
  return CLIENT_NAME_TO_ID_MAP[clientName] || null;
}

/**
 * Link estimate to integrated project and update status
 * Called when an estimate is marked as won or lost in Estimating Overview
 */
export function syncEstimateToIntegratedProject(
  estimateData: {
    estimateId: string;
    enquiryId: string;
    clientName: string;
    projectName: string;
    value: string;
    status: "won" | "lost";
    submittedDate?: string;
    outcome?: string;
    winReason?: string;
    lostReason?: string;
    lostToCompetitor?: string;
  }
): IntegratedProject | null {
  const clientId = getClientIdFromName(estimateData.clientName);
  
  if (!clientId) {
    console.warn(`Client ID not found for client name: ${estimateData.clientName}`);
    // Create a placeholder client ID for unknown clients
    const placeholderClientId = `CLT-UNKNOWN-${estimateData.clientName.substring(0, 3).toUpperCase()}`;
    return syncEstimateToIntegratedProjectWithClientId(
      { ...estimateData, clientId: placeholderClientId }
    );
  }
  
  return syncEstimateToIntegratedProjectWithClientId({
    ...estimateData,
    clientId,
  });
}

/**
 * Internal function to sync estimate with known client ID
 */
function syncEstimateToIntegratedProjectWithClientId(
  data: {
    estimateId: string;
    enquiryId: string;
    clientId: string;
    clientName: string;
    projectName: string;
    value: string;
    status: "won" | "lost";
    submittedDate?: string;
    outcome?: string;
    winReason?: string;
    lostReason?: string;
    lostToCompetitor?: string;
  }
): IntegratedProject {
  const projects = getIntegratedProjectsFromStorage();
  
  // Try to find existing project by estimate ID or enquiry ID
  let existingProject = projects.find(
    p => p.estimateId === data.estimateId || p.enquiryId === data.enquiryId
  );
  
  const now = new Date().toISOString().split('T')[0];
  
  if (existingProject) {
    // Update existing project
    const updatedProject: IntegratedProject = {
      ...existingProject,
      status: data.status === "won" ? "Won" : "Lost",
      estimateId: data.estimateId,
      decisionDate: now,
      ...(data.status === "won" && data.winReason && { winReason: data.winReason }),
      ...(data.status === "lost" && data.lostReason && { lostReason: data.lostReason }),
      ...(data.status === "lost" && data.lostToCompetitor && { lostToCompetitor: data.lostToCompetitor }),
    };
    
    const updatedProjects = projects.map(p =>
      p.id === existingProject!.id ? updatedProject : p
    );
    saveIntegratedProjectsToStorage(updatedProjects);
    
    // Log activity
    logClientActivity({
      clientId: data.clientId,
      type: data.status === "won" ? "project_won" : "project_lost",
      description: data.status === "won"
        ? `🎉 Project won: ${data.projectName} (${data.value})${data.winReason ? ` - ${data.winReason}` : ''}`
        : `Project lost: ${data.projectName}${data.lostReason ? ` - ${data.lostReason}` : ''}${data.lostToCompetitor ? ` (to ${data.lostToCompetitor})` : ''}`,
      date: now,
    });
    
    return updatedProject;
  } else {
    // Create new integrated project
    const newProject: IntegratedProject = {
      id: `IPJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientId: data.clientId,
      clientName: data.clientName,
      name: data.projectName,
      value: data.value,
      status: data.status === "won" ? "Won" : "Lost",
      source: "BD Enquiry",
      createdDate: now,
      enquiryId: data.enquiryId,
      estimateId: data.estimateId,
      decisionDate: now,
      quoteSubmittedDate: data.submittedDate,
      ...(data.status === "won" && data.winReason && { winReason: data.winReason }),
      ...(data.status === "lost" && data.lostReason && { lostReason: data.lostReason }),
      ...(data.status === "lost" && data.lostToCompetitor && { lostToCompetitor: data.lostToCompetitor }),
    };
    
    saveIntegratedProjectsToStorage([...projects, newProject]);
    
    // Log activity
    logClientActivity({
      clientId: data.clientId,
      type: data.status === "won" ? "project_won" : "project_lost",
      description: data.status === "won"
        ? `🎉 Project won: ${data.projectName} (${data.value})${data.winReason ? ` - ${data.winReason}` : ''}`
        : `Project lost: ${data.projectName}${data.lostReason ? ` - ${data.lostReason}` : ''}${data.lostToCompetitor ? ` (to ${data.lostToCompetitor})` : ''}`,
      date: now,
    });
    
    return newProject;
  }
}

/**
 * Update project status from estimate - used when estimate moves to "Submitted" status
 */
export function updateProjectFromEstimate(
  estimateData: {
    estimateId: string;
    enquiryId: string;
    clientName: string;
    projectName: string;
    value: string;
    submittedDate: string;
  }
): IntegratedProject | null {
  const clientId = getClientIdFromName(estimateData.clientName);
  
  if (!clientId) {
    console.warn(`Client ID not found for client name: ${estimateData.clientName}`);
    return null;
  }
  
  const projects = getIntegratedProjectsFromStorage();
  
  // Try to find existing project
  let existingProject = projects.find(
    p => p.estimateId === estimateData.estimateId || 
         p.enquiryId === estimateData.enquiryId ||
         (p.clientId === clientId && p.name === estimateData.projectName)
  );
  
  if (existingProject) {
    // Update to "Submitted" status
    const updatedProject: IntegratedProject = {
      ...existingProject,
      status: "Submitted",
      estimateId: estimateData.estimateId,
      quoteSubmittedDate: estimateData.submittedDate,
    };
    
    const updatedProjects = projects.map(p =>
      p.id === existingProject!.id ? updatedProject : p
    );
    saveIntegratedProjectsToStorage(updatedProjects);
    
    return updatedProject;
  } else {
    // Create new project in "Submitted" status
    const newProject: IntegratedProject = {
      id: `IPJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      clientId,
      clientName: estimateData.clientName,
      name: estimateData.projectName,
      value: estimateData.value,
      status: "Submitted",
      source: "BD Enquiry",
      createdDate: estimateData.submittedDate,
      enquiryId: estimateData.enquiryId,
      estimateId: estimateData.estimateId,
      quoteSubmittedDate: estimateData.submittedDate,
    };
    
    saveIntegratedProjectsToStorage([...projects, newProject]);
    
    return newProject;
  }
}

