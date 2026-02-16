"use client";

import { useState, useEffect } from "react";
import {
  createIntegratedProject,
  updateProjectStatus,
  getClientProjects,
  getClientStats,
  getClientActivities,
  initializeSampleProjects,
  linkEnquiryToClient,
  type IntegratedProject,
  type ProjectStatus,
  type ProjectSource,
  type ClientActivity,
} from "@/lib/client-integration";
import {
  type Enquiry,
  type EnquiryDocument,
  getEnquiriesFromStorage,
  saveEnquiriesToStorage,
  convertFilesToDocuments,
} from "@/lib/enquiries-store";

type ClientType = "Corporate" | "Government" | "Private" | "Partnership";
type ClientStatus = "Active" | "Prospective" | "Inactive" | "Preferred";

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

interface Project {
  id: string;
  name: string;
  value: string;
  status: ProjectStatus;
  startDate: string;
  source?: ProjectSource;
  lostReason?: string;
  lostToCompetitor?: string;
  winReason?: string;
  decisionDate?: string;
}

interface Client {
  id: string;
  name: string;
  type: ClientType;
  status: ClientStatus;
  industry: string;
  address: string;
  city: string;
  postcode: string;
  website: string;
  registrationNumber?: string;
  companySize: string;
  yearEstablished: number;
  totalProjectValue: number;
  activeProjects: number;
  completedProjects: number;
  contacts: Contact[];
  projects: Project[];
  notes: string;
  accountManager: string;
  rating: number;
  lastContact: string;
  creditCheck?: CreditCheck;
}

type CreditCheckStatus = "Pending" | "Passed" | "Failed" | "Review";
type CreditRiskBand = "Very Low" | "Low" | "Medium" | "High";

interface CreditCheck {
  provider: string;
  status: CreditCheckStatus;
  score: number;
  limit: number;
  riskBand: CreditRiskBand;
  lastChecked: string;
  sageExposure?: number | null;
}

const creditStatusStyles: Record<CreditCheckStatus, string> = {
  Pending: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  Passed: "bg-green-500/20 text-green-400 border-green-500/30",
  Failed: "bg-red-500/20 text-red-400 border-red-500/30",
  Review: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const creditRiskStyles: Record<CreditRiskBand, string> = {
  "Very Low": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Low: "bg-green-500/20 text-green-400 border-green-500/30",
  Medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  High: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([
    {
      id: "CLT-001",
      name: "Thames Property Group",
      type: "Corporate",
      status: "Preferred",
      industry: "Commercial Real Estate",
      address: "25 Canary Wharf",
      city: "London",
      postcode: "E14 5AB",
      website: "www.thamesproperty.co.uk",
      companySize: "500-1000",
      yearEstablished: 2005,
      totalProjectValue: 15500000,
      activeProjects: 3,
      completedProjects: 12,
      contacts: [
        { id: "C1", name: "John Davies", role: "CEO", email: "j.davies@thames.co.uk", phone: "020 7946 0001", isPrimary: true },
        { id: "C2", name: "Sarah Williams", role: "Projects Director", email: "s.williams@thames.co.uk", phone: "020 7946 0002", isPrimary: false }
      ],
      projects: [
        { id: "PRJ-001", name: "Thames Retail Park", value: "£2.5M", status: "Active", startDate: "2026-01-15" },
        { id: "PRJ-008", name: "Office Complex Phase 2", value: "£4.8M", status: "Active", startDate: "2025-11-20" }
      ],
      notes: "Long-standing client. Prefer modern sustainable designs. Quick approval process.",
      accountManager: "Sarah Mitchell",
      rating: 5,
      lastContact: "2026-02-14"
    },
    {
      id: "CLT-002",
      name: "London Developments Ltd",
      type: "Corporate",
      status: "Active",
      industry: "Residential Development",
      address: "120 High Street",
      city: "London",
      postcode: "SW1A 1AA",
      website: "www.londondev.com",
      companySize: "100-250",
      yearEstablished: 2010,
      totalProjectValue: 8700000,
      activeProjects: 2,
      completedProjects: 8,
      contacts: [
        { id: "C1", name: "Emma Thompson", role: "Managing Director", email: "e.thompson@londondev.com", phone: "020 7946 1001", isPrimary: true }
      ],
      projects: [
        { id: "PRJ-004", name: "Riverside Apartments", value: "£3.2M", status: "Active", startDate: "2025-12-10" }
      ],
      notes: "Focus on high-end residential. Budget conscious but quality-driven.",
      accountManager: "Tom Wilson",
      rating: 4,
      lastContact: "2026-02-10"
    },
    {
      id: "CLT-003",
      name: "Westminster Council",
      type: "Government",
      status: "Active",
      industry: "Public Sector",
      address: "City Hall, 64 Victoria Street",
      city: "London",
      postcode: "SW1E 6QP",
      website: "www.westminster.gov.uk",
      companySize: "1000+",
      yearEstablished: 1965,
      totalProjectValue: 12300000,
      activeProjects: 2,
      completedProjects: 15,
      contacts: [
        { id: "C1", name: "David Brown", role: "Head of Infrastructure", email: "d.brown@westminster.gov.uk", phone: "020 7641 6000", isPrimary: true },
        { id: "C2", name: "Lisa Martin", role: "Project Coordinator", email: "l.martin@westminster.gov.uk", phone: "020 7641 6001", isPrimary: false }
      ],
      projects: [
        { id: "PRJ-006", name: "Community Center Renovation", value: "£1.8M", status: "Active", startDate: "2026-01-05" },
        { id: "PRJ-012", name: "Park Infrastructure", value: "£950K", status: "Completed", startDate: "2025-09-01" }
      ],
      notes: "Strict procurement process. Requires full compliance documentation. Long lead times for approvals.",
      accountManager: "James Parker",
      rating: 4,
      lastContact: "2026-02-08"
    },
    {
      id: "CLT-004",
      name: "Green Spaces Ltd",
      type: "Private",
      status: "Prospective",
      industry: "Landscaping & Development",
      address: "45 Garden Road",
      city: "London",
      postcode: "N1 2BQ",
      website: "www.greenspaces.uk",
      companySize: "50-100",
      yearEstablished: 2015,
      totalProjectValue: 0,
      activeProjects: 0,
      completedProjects: 0,
      contacts: [
        { id: "C1", name: "Michael Green", role: "Owner", email: "m.green@greenspaces.uk", phone: "020 7946 2001", isPrimary: true }
      ],
      projects: [],
      notes: "Potential new client. Interested in sustainable construction. Meeting scheduled for March 2026.",
      accountManager: "Sarah Mitchell",
      rating: 3,
      lastContact: "2026-02-05"
    },
    {
      id: "CLT-005",
      name: "City Tech Campus",
      type: "Corporate",
      status: "Active",
      industry: "Technology & Education",
      address: "Innovation Quarter, Tech Street",
      city: "London",
      postcode: "EC2A 4NE",
      website: "www.citytechcampus.edu",
      companySize: "250-500",
      yearEstablished: 2018,
      totalProjectValue: 6200000,
      activeProjects: 1,
      completedProjects: 4,
      contacts: [
        { id: "C1", name: "Dr. Helen Foster", role: "Facilities Director", email: "h.foster@citytechcampus.edu", phone: "020 7946 3001", isPrimary: true }
      ],
      projects: [
        { id: "PRJ-009", name: "Science Block Extension", value: "£2.8M", status: "Active", startDate: "2025-10-15" }
      ],
      notes: "Growing institution. Strong emphasis on technology integration in buildings.",
      accountManager: "Tom Wilson",
      rating: 5,
      lastContact: "2026-02-12"
    }
  ]);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showProjectOutcomeModal, setShowProjectOutcomeModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<IntegratedProject | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ClientStatus | "All">("All");
  const [filterType, setFilterType] = useState<ClientType | "All">("All");
  const [isClient, setIsClient] = useState(false);

  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: "",
    type: "Corporate" as ClientType,
    status: "Prospective" as ClientStatus,
    industry: "",
    address: "",
    city: "",
    postcode: "",
    website: "",
    registrationNumber: "",
    companySize: "",
    yearEstablished: new Date().getFullYear(),
    accountManager: "",
    notes: ""
  });

  // New Contact Form State
  const [newContact, setNewContact] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    isPrimary: false
  });

  // New Project Form State (matches BD Overview enquiry form)
  const [newProject, setNewProject] = useState({
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
  });

  // Project Outcome Form State
  const [projectOutcome, setProjectOutcome] = useState({
    status: "Won" as ProjectStatus,
    winReason: "",
    lostReason: "",
    lostToCompetitor: "",
    decisionDate: new Date().toISOString().split('T')[0]
  });

  // Load integrated projects for current client
  const [integratedProjects, setIntegratedProjects] = useState<IntegratedProject[]>([]);
  const [clientActivities, setClientActivities] = useState<ClientActivity[]>([]);

  // Initialize sample data on first load
  useEffect(() => {
    initializeSampleProjects();
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (selectedClient) {
      setIntegratedProjects(getClientProjects(selectedClient.id));
      setClientActivities(getClientActivities(selectedClient.id));
    }
  }, [selectedClient]);

  // Send Email Form State
  const [emailData, setEmailData] = useState({
    subject: "",
    message: "",
    recipient: ""
  });

  // Handler Functions
  const buildCreditCheck = (name: string, registrationNumber?: string): CreditCheck => {
    const seed = `${name}|${registrationNumber ?? ""}`.trim();
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
    }

    const score = 30 + (hash % 71);
    const limit = (100 + (hash % 900)) * 1000;

    let riskBand: CreditRiskBand = "Very Low";
    if (score < 45) riskBand = "High";
    else if (score < 60) riskBand = "Medium";
    else if (score < 75) riskBand = "Low";

    let status: CreditCheckStatus = "Passed";
    if (score < 45) status = "Failed";
    else if (score < 65) status = "Review";

    return {
      provider: "Creditsafe (placeholder)",
      status,
      score,
      limit,
      riskBand,
      lastChecked: new Date().toISOString(),
      sageExposure: null,
    };
  };

  const handleRunCreditCheck = (clientId: string) => {
    const updatedCheck = buildCreditCheck(selectedClient?.name ?? "", selectedClient?.registrationNumber);

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? {
              ...client,
              creditCheck: buildCreditCheck(client.name, client.registrationNumber),
            }
          : client
      )
    );

    if (selectedClient?.id === clientId) {
      setSelectedClient({
        ...selectedClient,
        creditCheck: updatedCheck,
      });
    }
  };

  const handleCreateClient = () => {
    const client: Client = {
      id: `CLT-${String(clients.length + 1).padStart(3, '0')}`,
      ...newClient,
      creditCheck: buildCreditCheck(newClient.name, newClient.registrationNumber),
      totalProjectValue: 0,
      activeProjects: 0,
      completedProjects: 0,
      contacts: [],
      projects: [],
      rating: 3,
      lastContact: new Date().toISOString().split('T')[0]
    };
    
    setClients([...clients, client]);
    setShowAddClientModal(false);
    setNewClient({
      name: "",
      type: "Corporate",
      status: "Prospective",
      industry: "",
      address: "",
      city: "",
      postcode: "",
      website: "",
      registrationNumber: "",
      companySize: "",
      yearEstablished: new Date().getFullYear(),
      accountManager: "",
      notes: ""
    });
  };

  const handleEditClient = () => {
    if (!editingClient) return;
    
    setClients(clients.map(c => 
      c.id === editingClient.id ? editingClient : c
    ));
    
    if (selectedClient?.id === editingClient.id) {
      setSelectedClient(editingClient);
    }
    
    setShowEditModal(false);
    setEditingClient(null);
  };

  const handleAddContact = () => {
    if (!selectedClient) return;
    
    const contact: Contact = {
      id: `C${selectedClient.contacts.length + 1}`,
      ...newContact
    };
    
    const updatedClient = {
      ...selectedClient,
      contacts: [...selectedClient.contacts, contact]
    };
    
    setClients(clients.map(c => 
      c.id === selectedClient.id ? updatedClient : c
    ));
    
    setSelectedClient(updatedClient);
    setShowAddContactModal(false);
    setNewContact({
      name: "",
      role: "",
      email: "",
      phone: "",
      isPrimary: false
    });
  };

  const openEditModal = (client: Client) => {
    setEditingClient({...client});
    setShowEditModal(true);
  };

  const handleAddProject = async () => {
    if (!selectedClient) return;
    
    // Validate required fields
    if (!newProject.projectName || !newProject.value || !newProject.contact || !newProject.contactEmail) {
      alert("Please fill in all required fields");
      return;
    }
    
    // Get and update enquiries
    const existingEnquiries = getEnquiriesFromStorage();
    const enquiryId = `ENQ-2026-${String(Math.max(...existingEnquiries.map(e => parseInt(e.id.split("-")[2])), 0) + 1).padStart(3, "0")}`;
    
    // Convert files to documents if any
    let documents: EnquiryDocument[] = [];
    if (newProject.documents && newProject.documents.length > 0) {
      try {
        documents = await convertFilesToDocuments(newProject.documents, enquiryId);
      } catch (error) {
        console.error("Failed to process documents:", error);
        alert("Failed to process some documents");
        return;
      }
    }
    
    // Create enquiry (syncs with BD Overview)
    const newEnquiry: Enquiry = {
      id: enquiryId,
      client: selectedClient.name,
      projectName: newProject.projectName,
      projectAddress: newProject.projectAddress,
      value: newProject.value.startsWith("£") ? newProject.value : `£${newProject.value}`,
      contact: newProject.contact,
      contactEmail: newProject.contactEmail,
      source: newProject.source,
      returnDate: newProject.returnDate,
      anticipatedAwardDate: newProject.anticipatedAwardDate,
      anticipatedSosDate: newProject.anticipatedSosDate,
      documents: documents.length > 0 ? documents : undefined,
      status: "new",
      receivedDate: new Date().toISOString().split("T")[0],
    };
    
    saveEnquiriesToStorage([newEnquiry, ...existingEnquiries]);
    
    // Create integrated project linked to client
    const integratedProject = linkEnquiryToClient(
      enquiryId,
      selectedClient.id,
      selectedClient.name,
      {
        projectName: newProject.projectName,
        value: newEnquiry.value,
        source: newProject.source,
      }
    );
    
    // Update local client state
    const project: Project = {
      id: integratedProject.id,
      name: integratedProject.name,
      value: integratedProject.value,
      status: integratedProject.status,
      startDate: integratedProject.startDate || "",
      source: integratedProject.source,
    };
    
    const updatedClient = {
      ...selectedClient,
      projects: [...selectedClient.projects, project],
      activeProjects: selectedClient.activeProjects,
      completedProjects: selectedClient.completedProjects,
      lastContact: new Date().toISOString().split('T')[0],
    };
    
    setClients(clients.map(c => 
      c.id === selectedClient.id ? updatedClient : c
    ));
    
    setSelectedClient(updatedClient);
    setIntegratedProjects([...integratedProjects, integratedProject]);
    setShowNewProjectModal(false);
    
    // Reset form
    setNewProject({
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
    });
    
    alert(`Project enquiry created successfully!\nThis will appear in BD Overview as a new enquiry.`);
  };

  const handleProjectOutcome = () => {
    if (!selectedClient || !selectedProject) return;
    
    // Update integrated project with outcome
    const updated = updateProjectStatus(
      selectedProject.id,
      projectOutcome.status,
      {
        winReason: projectOutcome.status === "Won" ? projectOutcome.winReason : undefined,
        lostReason: projectOutcome.status === "Lost" ? projectOutcome.lostReason : undefined,
        lostToCompetitor: projectOutcome.status === "Lost" ? projectOutcome.lostToCompetitor : undefined,
        decisionDate: projectOutcome.decisionDate,
      }
    );
    
    if (updated) {
      // Update local client state
      const updatedProjects = selectedClient.projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, status: updated.status, lostReason: updated.lostReason, lostToCompetitor: updated.lostToCompetitor, winReason: updated.winReason, decisionDate: updated.decisionDate }
          : p
      );
      
      const updatedClient = {
        ...selectedClient,
        projects: updatedProjects,
        activeProjects: updated.status === "Won" || updated.status === "Active" ? selectedClient.activeProjects + 1 : selectedClient.activeProjects,
        completedProjects: updated.status === "Completed" ? selectedClient.completedProjects + 1 : selectedClient.completedProjects,
      };
      
      setClients(clients.map(c => 
        c.id === selectedClient.id ? updatedClient : c
      ));
      
      setSelectedClient(updatedClient);
      setIntegratedProjects(getClientProjects(selectedClient.id));
      setClientActivities(getClientActivities(selectedClient.id));
    }
    
    setShowProjectOutcomeModal(false);
    setSelectedProject(null);
    setProjectOutcome({
      status: "Won",
      winReason: "",
      lostReason: "",
      lostToCompetitor: "",
      decisionDate: new Date().toISOString().split('T')[0]
    });
  };

  const handleSendEmail = () => {
    if (!selectedClient) return;
    
    // Simulate sending email
    const updatedClient = {
      ...selectedClient,
      lastContact: new Date().toISOString().split('T')[0]
    };
    
    setClients(clients.map(c => 
      c.id === selectedClient.id ? updatedClient : c
    ));
    
    setSelectedClient(updatedClient);
    setShowSendEmailModal(false);
    setEmailData({
      subject: "",
      message: "",
      recipient: ""
    });
    
    alert(`Email sent to ${emailData.recipient}!`);
  };

  // Filter and Search
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "All" || client.status === filterStatus;
    const matchesType = filterType === "All" || client.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const statusColors = {
    "Active": "bg-green-500/20 text-green-400 border-green-500/30",
    "Prospective": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "Inactive": "bg-gray-500/20 text-gray-400 border-gray-500/30",
    "Preferred": "bg-purple-500/20 text-purple-400 border-purple-500/30"
  };

  const creditStatusColors: Record<CreditCheckStatus, string> = {
    "Pending": "bg-gray-500/20 text-gray-300 border-gray-500/30",
    "Passed": "bg-green-500/20 text-green-400 border-green-500/30",
    "Failed": "bg-red-500/20 text-red-400 border-red-500/30",
    "Review": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  const totalActiveProjects = clients.reduce((sum, c) => sum + c.activeProjects, 0);
  const totalValue = clients.reduce((sum, c) => sum + c.totalProjectValue, 0);
  const activeClients = clients.filter(c => c.status === "Active" || c.status === "Preferred").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Client Directory</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage client relationships and project portfolio
          </p>
        </div>
        <button 
          onClick={() => setShowAddClientModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          + Add Client
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Clients</p>
            <span className="text-xl">👥</span>
          </div>
          <p className="text-2xl font-bold text-white">{clients.length}</p>
          <p className="text-xs text-gray-400">{activeClients} active</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Value</p>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">
            £{(totalValue / 1000000).toFixed(1)}M
          </p>
          <p className="text-xs text-gray-400">Portfolio value</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Active Projects</p>
            <span className="text-xl">🏗️</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalActiveProjects}</p>
          <p className="text-xs text-gray-400">Currently in progress</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-purple-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Preferred Clients</p>
            <span className="text-xl">⭐</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {clients.filter(c => c.status === "Preferred").length}
          </p>
          <p className="text-xs text-gray-400">Top tier clients</p>
        </div>
      </section>

      {/* Search and Filters */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <input
            type="text"
            placeholder="Search clients by name, industry, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 rounded bg-gray-700 px-4 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as ClientStatus | "All")}
              className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Prospective">Prospective</option>
              <option value="Preferred">Preferred</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ClientType | "All")}
              className="rounded bg-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Types</option>
              <option value="Corporate">Corporate</option>
              <option value="Government">Government</option>
              <option value="Private">Private</option>
              <option value="Partnership">Partnership</option>
            </select>
          </div>
        </div>
      </div>

      {/* Client Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => {
          const clientProjects = isClient ? getClientProjects(client.id) : [];
          const hasTrackedProjects = clientProjects.length > 0;
          const wonProjects = clientProjects.filter((project) => ["Won", "Active", "Completed"].includes(project.status)).length;
          const lostProjects = clientProjects.filter((project) => project.status === "Lost").length;

          return (
            <div
              key={client.id}
              className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-5 hover:border-orange-500/50 transition-all cursor-pointer relative"
              onClick={() => setSelectedClient(client)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 pr-20">
                  <h3 className="text-lg font-bold text-white mb-1">{client.name}</h3>
                  <p className="text-xs text-gray-400">{client.id}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${statusColors[client.status]}`}>
                    {client.status}
                  </span>
                  <div className="flex text-yellow-400 text-xs">
                    {"⭐".repeat(client.rating)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-gray-500">🏢</span>
                  <span>{client.industry}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-gray-500">📍</span>
                  <span>{client.city}, {client.postcode}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-gray-500">👤</span>
                  <span>{client.accountManager}</span>
                </div>
              </div>

              {hasTrackedProjects && (
                <div className="mt-3 pt-3 border-t border-gray-700/50 flex items-center gap-2 text-xs">
                  {wonProjects > 0 && (
                    <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                      ✅ {wonProjects} won
                    </span>
                  )}
                  {lostProjects > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                      ❌ {lostProjects} lost
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-bold text-white">{client.activeProjects}</div>
                  <div className="text-gray-400">Active</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white">{client.completedProjects}</div>
                  <div className="text-gray-400">Completed</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-white">
                    £{(client.totalProjectValue / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-gray-400">Value</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 p-12 text-center">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-400">No clients found matching your criteria</p>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-lg border border-gray-700 bg-gray-900 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${statusColors[selectedClient.status]}`}>
                      {selectedClient.status}
                    </span>
                    <div className="flex text-yellow-400 text-sm">
                      {"⭐".repeat(selectedClient.rating)}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{selectedClient.id} • {selectedClient.type} • {selectedClient.industry}</p>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                {/* Company Information */}
                <div className="md:col-span-2 space-y-6">
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-5">
                    <h3 className="text-lg font-bold text-white mb-4">Company Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Address</label>
                        <p className="mt-1 text-white">{selectedClient.address}</p>
                        <p className="text-white">{selectedClient.city}, {selectedClient.postcode}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Website</label>
                        <p className="mt-1 text-blue-400 hover:underline cursor-pointer">{selectedClient.website}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Registration Number</label>
                        <p className="mt-1 text-white">{selectedClient.registrationNumber || "Not provided"}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Company Size</label>
                        <p className="mt-1 text-white">{selectedClient.companySize} employees</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Year Established</label>
                        <p className="mt-1 text-white">{selectedClient.yearEstablished}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account Manager</label>
                        <p className="mt-1 text-white">{selectedClient.accountManager}</p>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Last Contact</label>
                        <p className="mt-1 text-white">
                          {new Date(selectedClient.lastContact).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    
                    {selectedClient.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-700/50">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Notes</label>
                        <p className="mt-1 text-sm text-gray-300">{selectedClient.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Contacts */}
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-white">Contacts ({selectedClient.contacts.length})</h3>
                      <button
                        onClick={() => setShowAddContactModal(true)}
                        className="rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                      >
                        + Add Contact
                      </button>
                    </div>
                    
                    {selectedClient.contacts.length > 0 ? (
                      <div className="space-y-3">
                        {selectedClient.contacts.map((contact) => (
                          <div key={contact.id} className="rounded bg-gray-700/30 p-3 hover:bg-gray-700/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-white">{contact.name}</p>
                                  {contact.isPrimary && (
                                    <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded px-1.5 py-0.5">
                                      Primary
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{contact.role}</p>
                              </div>
                            </div>
                            <div className="mt-2 space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-gray-300">
                                <span>📧</span>
                                <a href={`mailto:${contact.email}`} className="hover:text-blue-400">{contact.email}</a>
                              </div>
                              <div className="flex items-center gap-2 text-gray-300">
                                <span>📞</span>
                                <a href={`tel:${contact.phone}`} className="hover:text-blue-400">{contact.phone}</a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">No contacts added yet</p>
                    )}
                  </div>

                  {/* Projects */}
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-5">
                    <h3 className="text-lg font-bold text-white mb-4">Projects ({selectedClient.projects.length})</h3>
                    
                    {selectedClient.projects.length > 0 ? (
                      <div className="space-y-2">
                        {selectedClient.projects.map((project) => (
                          <div key={project.id} className="flex items-center justify-between rounded bg-gray-700/30 p-3 hover:bg-gray-700/50 transition-colors">
                            <div className="flex-1">
                              <p className="font-semibold text-white">{project.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{project.id}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-green-400">{project.value}</span>
                              <span className={`text-xs rounded px-2 py-0.5 ${
                                project.status === "Active" ? "bg-green-500/20 text-green-400" :
                                project.status === "Completed" ? "bg-blue-500/20 text-blue-400" :
                                "bg-yellow-500/20 text-yellow-400"
                              }`}>
                                {project.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">No projects yet</p>
                    )}
                  </div>
                </div>

                {/* Summary Stats Sidebar */}
                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-white">Credit Check</h3>
                      <button
                        onClick={() => handleRunCreditCheck(selectedClient.id)}
                        className="rounded bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
                      >
                        Run Check
                      </button>
                    </div>

                    {selectedClient.creditCheck ? (
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Provider</span>
                          <span className="text-white">{selectedClient.creditCheck.provider}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Status</span>
                          <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${creditStatusColors[selectedClient.creditCheck.status]}`}>
                            {selectedClient.creditCheck.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-gray-400 text-xs">Score</p>
                            <p className="text-white font-semibold">{selectedClient.creditCheck.score}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Limit</p>
                            <p className="text-white font-semibold">£{(selectedClient.creditCheck.limit / 1000).toFixed(0)}k</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Risk Band</p>
                            <p className="text-white font-semibold">{selectedClient.creditCheck.riskBand}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs">Sage Exposure</p>
                            <p className="text-white font-semibold">
                              {selectedClient.creditCheck.sageExposure === null || selectedClient.creditCheck.sageExposure === undefined
                                ? "Not connected"
                                : `£${selectedClient.creditCheck.sageExposure.toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Last checked: {new Date(selectedClient.creditCheck.lastChecked).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No credit check recorded yet.</p>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                    <h3 className="text-sm font-bold text-white mb-3">Portfolio Summary</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Total Value</span>
                          <span className="font-bold text-green-400">
                            £{(selectedClient.totalProjectValue / 1000000).toFixed(2)}M
                          </span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-700">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Active Projects</span>
                          <span className="font-semibold text-white">{selectedClient.activeProjects}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Completed</span>
                          <span className="font-semibold text-white">{selectedClient.completedProjects}</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400">Total Projects</span>
                          <span className="font-semibold text-white">
                            {selectedClient.activeProjects + selectedClient.completedProjects}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                    <h3 className="text-sm font-bold text-white mb-3">Quick Actions</h3>
                    <div className="space-y-2">
                      <button 
                        onClick={() => openEditModal(selectedClient)}
                        className="w-full rounded bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                      >
                        Edit Client
                      </button>
                      <button 
                        onClick={() => {
                          setNewProject({
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
                          });
                          setShowNewProjectModal(true);
                        }}
                        className="w-full rounded bg-blue-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                      >
                        New Project
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedClient.contacts.length > 0) {
                            setEmailData({...emailData, recipient: selectedClient.contacts[0].email});
                          }
                          setShowSendEmailModal(true);
                        }}
                        className="w-full rounded bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
                      >
                        Send Email
                      </button>
                      <button 
                        onClick={() => setShowHistoryModal(true)}
                        className="w-full rounded bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
                      >
                        View History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-700 p-4 flex justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add New Client</h2>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Type *</label>
                  <select
                    value={newClient.type}
                    onChange={(e) => setNewClient({...newClient, type: e.target.value as ClientType})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Corporate">Corporate</option>
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Status *</label>
                  <select
                    value={newClient.status}
                    onChange={(e) => setNewClient({...newClient, status: e.target.value as ClientStatus})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Prospective">Prospective</option>
                    <option value="Active">Active</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Industry *</label>
                  <input
                    type="text"
                    value={newClient.industry}
                    onChange={(e) => setNewClient({...newClient, industry: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Commercial Real Estate"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient({...newClient, address: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">City</label>
                  <input
                    type="text"
                    value={newClient.city}
                    onChange={(e) => setNewClient({...newClient, city: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Postcode</label>
                  <input
                    type="text"
                    value={newClient.postcode}
                    onChange={(e) => setNewClient({...newClient, postcode: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Postcode"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Website</label>
                  <input
                    type="text"
                    value={newClient.website}
                    onChange={(e) => setNewClient({...newClient, website: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="www.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Company Registration Number</label>
                  <input
                    type="text"
                    value={newClient.registrationNumber}
                    onChange={(e) => setNewClient({...newClient, registrationNumber: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Registration number"
                  />
                  <p className="mt-1 text-xs text-gray-500">Used for CrediteSafe checks.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Company Size</label>
                  <input
                    type="text"
                    value={newClient.companySize}
                    onChange={(e) => setNewClient({...newClient, companySize: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., 100-250"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Year Established</label>
                  <input
                    type="number"
                    value={newClient.yearEstablished}
                    onChange={(e) => setNewClient({...newClient, yearEstablished: parseInt(e.target.value)})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Account Manager *</label>
                  <input
                    type="text"
                    value={newClient.accountManager}
                    onChange={(e) => setNewClient({...newClient, accountManager: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Name"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Notes</label>
                  <textarea
                    value={newClient.notes}
                    onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="Additional notes about the client"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleCreateClient}
                disabled={!newClient.name || !newClient.industry || !newClient.accountManager}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Client
              </button>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Edit Client</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={editingClient.name}
                    onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Type</label>
                  <select
                    value={editingClient.type}
                    onChange={(e) => setEditingClient({...editingClient, type: e.target.value as ClientType})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Corporate">Corporate</option>
                    <option value="Government">Government</option>
                    <option value="Private">Private</option>
                    <option value="Partnership">Partnership</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Status</label>
                  <select
                    value={editingClient.status}
                    onChange={(e) => setEditingClient({...editingClient, status: e.target.value as ClientStatus})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Prospective">Prospective</option>
                    <option value="Active">Active</option>
                    <option value="Preferred">Preferred</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Industry</label>
                  <input
                    type="text"
                    value={editingClient.industry}
                    onChange={(e) => setEditingClient({...editingClient, industry: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={editingClient.address}
                    onChange={(e) => setEditingClient({...editingClient, address: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">City</label>
                  <input
                    type="text"
                    value={editingClient.city}
                    onChange={(e) => setEditingClient({...editingClient, city: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Postcode</label>
                  <input
                    type="text"
                    value={editingClient.postcode}
                    onChange={(e) => setEditingClient({...editingClient, postcode: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Rating</label>
                  <select
                    value={editingClient.rating}
                    onChange={(e) => setEditingClient({...editingClient, rating: parseInt(e.target.value)})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="1">⭐ 1 Star</option>
                    <option value="2">⭐⭐ 2 Stars</option>
                    <option value="3">⭐⭐⭐ 3 Stars</option>
                    <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                    <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Account Manager</label>
                  <input
                    type="text"
                    value={editingClient.accountManager}
                    onChange={(e) => setEditingClient({...editingClient, accountManager: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Notes</label>
                  <textarea
                    value={editingClient.notes}
                    onChange={(e) => setEditingClient({...editingClient, notes: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleEditClient}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Contact</h2>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Role *</label>
                <input
                  type="text"
                  value={newContact.role}
                  onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Job title / role"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Phone number"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrimary"
                  checked={newContact.isPrimary}
                  onChange={(e) => setNewContact({...newContact, isPrimary: e.target.checked})}
                  className="rounded border-gray-700 bg-gray-800"
                />
                <label htmlFor="isPrimary" className="text-sm text-gray-300 cursor-pointer">
                  Set as primary contact
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleAddContact}
                disabled={!newContact.name || !newContact.role || !newContact.email || !newContact.phone}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Contact
              </button>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">New Project Enquiry - {selectedClient.name}</h2>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Row 1: Project Name and Address */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProject.projectName}
                    onChange={(e) => setNewProject({ ...newProject, projectName: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Project Address</label>
                  <input
                    type="text"
                    value={newProject.projectAddress}
                    onChange={(e) => setNewProject({ ...newProject, projectAddress: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter project address"
                  />
                </div>
              </div>

              {/* Row 2: Value and Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Project Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProject.value}
                    onChange={(e) => setNewProject({ ...newProject, value: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., £250,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Source</label>
                  <select
                    value={newProject.source}
                    onChange={(e) => setNewProject({ ...newProject, source: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Direct">Direct</option>
                    <option value="Referral">Referral</option>
                    <option value="Campaign">Campaign</option>
                    <option value="Website">Website</option>
                    <option value="Cold Outreach">Cold Outreach</option>
                    <option value="Partner">Partner</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Contact Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProject.contact}
                    onChange={(e) => setNewProject({ ...newProject, contact: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newProject.contactEmail}
                    onChange={(e) => setNewProject({ ...newProject, contactEmail: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="contact@email.com"
                  />
                </div>
              </div>

              {/* Row 4: Return Date and Anticipated Award Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Return Date</label>
                  <input
                    type="date"
                    value={newProject.returnDate}
                    onChange={(e) => setNewProject({ ...newProject, returnDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Anticipated Award Date</label>
                  <input
                    type="date"
                    value={newProject.anticipatedAwardDate}
                    onChange={(e) => setNewProject({ ...newProject, anticipatedAwardDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Row 5: Anticipated SOS Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Anticipated SOS Date</label>
                  <input
                    type="date"
                    value={newProject.anticipatedSosDate}
                    onChange={(e) => setNewProject({ ...newProject, anticipatedSosDate: e.target.value })}
                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Supporting Documents</label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setNewProject({ ...newProject, documents: files });
                  }}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white file:mr-4 file:rounded-lg file:border-0 file:bg-blue-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-600"
                />
                {newProject.documents && newProject.documents.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-400">
                      Selected: {newProject.documents.length} file{newProject.documents.length !== 1 ? 's' : ''}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {newProject.documents.map((file, idx) => (
                        <li key={idx} className="text-xs text-gray-500">
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleAddProject}
                disabled={!newProject.projectName || !newProject.value || !newProject.contact || !newProject.contactEmail}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Project Enquiry
              </button>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Email Modal */}
      {showSendEmailModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Send Email - {selectedClient.name}</h2>
              <button
                onClick={() => setShowSendEmailModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Recipient</label>
                <select
                  value={emailData.recipient}
                  onChange={(e) => setEmailData({...emailData, recipient: e.target.value})}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select contact</option>
                  {selectedClient.contacts.map(contact => (
                    <option key={contact.id} value={contact.email}>
                      {contact.name} - {contact.role} ({contact.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Message</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  rows={8}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your message..."
                />
              </div>

              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-300">
                    This will update the client's last contact date and send the email to the selected recipient.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleSendEmail}
                disabled={!emailData.recipient || !emailData.subject || !emailData.message}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Email
              </button>
              <button
                onClick={() => setShowSendEmailModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View History Modal */}
      {showHistoryModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Client History - {selectedClient.name}</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {/* Client Stats */}
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <h3 className="font-semibold text-white mb-3">Overview & Performance</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Projects Won:</span>
                    <div className="text-white font-medium text-lg">{integratedProjects.filter(p => ["Won", "Active", "Completed"].includes(p.status)).length}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Projects Lost:</span>
                    <div className="text-white font-medium text-lg">{integratedProjects.filter(p => p.status === "Lost").length}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">In Pipeline:</span>
                    <div className="text-white font-medium text-lg">{integratedProjects.filter(p => ["Opportunity", "Estimating", "Submitted"].includes(p.status)).length}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Win Rate:</span>
                    <div className="text-white font-medium text-lg">
                      {integratedProjects.filter(p => ["Won", "Lost"].includes(p.status)).length > 0
                        ? `${Math.round((integratedProjects.filter(p => p.status === "Won").length / integratedProjects.filter(p => ["Won", "Lost"].includes(p.status)).length) * 100)}%`
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects with Status Tracking */}
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Projects & Pipeline</h3>
                  <button
                    onClick={() => {
                      setNewProject({
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
                      });
                      setShowNewProjectModal(true);
                    }}
                    className="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    + Add Project
                  </button>
                </div>
                {integratedProjects.length > 0 ? (
                  <div className="space-y-3">
                    {integratedProjects.map((project) => {
                      const statusColors: Record<ProjectStatus, string> = {
                        "Opportunity": "border-purple-500 bg-purple-500/10",
                        "Estimating": "border-blue-500 bg-blue-500/10",
                        "Submitted": "border-yellow-500 bg-yellow-500/10",
                        "Won": "border-green-500 bg-green-500/10",
                        "Lost": "border-red-500 bg-red-500/10",
                        "Active": "border-emerald-500 bg-emerald-500/10",
                        "On Hold": "border-orange-500 bg-orange-500/10",
                        "Completed": "border-gray-500 bg-gray-500/10",
                        "Cancelled": "border-gray-600 bg-gray-600/10",
                      };
                      
                      const statusBadgeColors: Record<ProjectStatus, string> = {
                        "Opportunity": "bg-purple-500/20 text-purple-400",
                        "Estimating": "bg-blue-500/20 text-blue-400",
                        "Submitted": "bg-yellow-500/20 text-yellow-400",
                        "Won": "bg-green-500/20 text-green-400",
                        "Lost": "bg-red-500/20 text-red-400",
                        "Active": "bg-emerald-500/20 text-emerald-400",
                        "On Hold": "bg-orange-500/20 text-orange-400",
                        "Completed": "bg-gray-500/20 text-gray-400",
                        "Cancelled": "bg-gray-600/20 text-gray-600",
                      };

                      return (
                        <div key={project.id} className={`rounded-lg border-l-4 ${statusColors[project.status]} p-3`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-white">{project.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${statusBadgeColors[project.status]}`}>
                                  {project.status}
                                </span>
                                {project.source && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                                    {project.source}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-400">
                                Value: {project.value} • Created: {project.createdDate}
                                {project.startDate && ` • Start: ${project.startDate}`}
                              </div>
                              {project.status === "Won" && project.winReason && (
                                <div className="text-sm text-green-400 mt-1">
                                  🎉 {project.winReason}
                                </div>
                              )}
                              {project.status === "Lost" && (
                                <div className="text-sm text-red-400 mt-1">
                                  ❌ {project.lostReason}
                                  {project.lostToCompetitor && ` (Lost to: ${project.lostToCompetitor})`}
                                </div>
                              )}
                            </div>
                            {["Opportunity", "Estimating", "Submitted"].includes(project.status) && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setProjectOutcome({...projectOutcome, status: "Won"});
                                    setShowProjectOutcomeModal(true);
                                  }}
                                  className="text-xs px-2 py-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                                >
                                  Mark Won
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setProjectOutcome({...projectOutcome, status: "Lost"});
                                    setShowProjectOutcomeModal(true);
                                  }}
                                  className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                  Mark Lost
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No projects yet</p>
                )}
              </div>

              {/* Activity Timeline */}
              {clientActivities.length > 0 && (
                <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                  <h3 className="font-semibold text-white mb-3">Activity Timeline</h3>
                  <div className="space-y-2">
                    {clientActivities.slice(0, 10).map((activity) => {
                      const activityIcons = {
                        project_created: "📋",
                        project_won: "🎉",
                        project_lost: "❌",
                        project_completed: "✅",
                        email_sent: "📧",
                        meeting: "👥",
                        call: "📞",
                        note: "📝",
                      };
                      
                      return (
                        <div key={activity.id} className="flex items-start gap-2 text-sm py-2 border-b border-gray-700 last:border-0">
                          <span className="text-lg">{activityIcons[activity.type]}</span>
                          <div className="flex-1">
                            <div className="text-gray-300">{activity.description}</div>
                            <div className="text-xs text-gray-500">{activity.date}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contacts */}
              <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-white">Contacts</h3>
                  <button
                    onClick={() => setShowAddContactModal(true)}
                    className="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    + Add Contact
                  </button>
                </div>
                {selectedClient.contacts.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{contact.name}</span>
                            {contact.isPrimary && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-400">{contact.role}</div>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <div>{contact.email}</div>
                          <div>{contact.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No contacts added</p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Outcome Modal (Won/Lost Tracking) */}
      {showProjectOutcomeModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {projectOutcome.status === "Won" ? "🎉 Project Won" : "❌ Project Lost"}
              </h2>
              <button
                onClick={() => {
                  setShowProjectOutcomeModal(false);
                  setSelectedProject(null);
                }}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg border border-gray-700 bg-gray-800">
              <div className="text-sm text-gray-400 mb-1">Project</div>
              <div className="font-medium text-white">{selectedProject.name}</div>
              <div className="text-sm text-gray-400">{selectedProject.value}</div>
            </div>

            <div className="space-y-4">
              {projectOutcome.status === "Won" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Why did we win this project?</label>
                  <textarea
                    value={projectOutcome.winReason}
                    onChange={(e) => setProjectOutcome({...projectOutcome, winReason: e.target.value})}
                    rows={3}
                    className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Competitive pricing, strong relationship, unique solution..."
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Why did we lose this project? *</label>
                    <textarea
                      value={projectOutcome.lostReason}
                      onChange={(e) => setProjectOutcome({...projectOutcome, lostReason: e.target.value})}
                      rows={3}
                      className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., Price too high, timeline issues, technical requirements..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Lost to Competitor (if known)</label>
                    <input
                      type="text"
                      value={projectOutcome.lostToCompetitor}
                      onChange={(e) => setProjectOutcome({...projectOutcome, lostToCompetitor: e.target.value})}
                      className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Competitor name"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Decision Date</label>
                <input
                  type="date"
                  value={projectOutcome.decisionDate}
                  onChange={(e) => setProjectOutcome({...projectOutcome, decisionDate: e.target.value})}
                  className="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleProjectOutcome}
                disabled={projectOutcome.status === "Lost" && !projectOutcome.lostReason}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  projectOutcome.status === "Won"
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                Confirm {projectOutcome.status === "Won" ? "Win" : "Loss"}
              </button>
              <button
                onClick={() => {
                  setShowProjectOutcomeModal(false);
                  setSelectedProject(null);
                }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
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
