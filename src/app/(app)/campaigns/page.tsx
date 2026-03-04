"use client";

import { useState } from "react";

type CampaignStatus = "Planning" | "In Progress" | "Completed" | "Aborted";
type CampaignType = "Email" | "Webinar" | "Trade Show" | "Direct Mail" | "Telemarketing" | "Advertisement" | "Other";

interface CampaignMember {
  id: string;
  name: string;
  email: string;
  status: "Sent" | "Responded" | "Attended" | "No Response";
  company: string;
}

interface CampaignActivity {
  id: string;
  timestamp: string;
  type: "email_sent" | "response_received" | "lead_created" | "opportunity_created" | "status_changed" | "member_added";
  description: string;
  user: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
}

interface Campaign {
  id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  budgetedCost: number;
  actualCost: number;
  expectedRevenue: number;
  actualRevenue: number;
  numSent: number;
  numResponses: number;
  numLeads: number;
  numOpportunities: number;
  numWonOpportunities: number;
  owner: string;
  description: string;
  members: CampaignMember[];
  parentCampaign?: string;
  activities: CampaignActivity[];
  emailTemplate?: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: "CMP-001",
      name: "Q1 2026 Construction Expo",
      type: "Trade Show",
      status: "In Progress",
      startDate: "2026-03-01",
      endDate: "2026-03-15",
      budgetedCost: 25000,
      actualCost: 18500,
      expectedRevenue: 250000,
      actualRevenue: 125000,
      numSent: 450,
      numResponses: 127,
      numLeads: 45,
      numOpportunities: 12,
      numWonOpportunities: 3,
      owner: "Sarah Mitchell",
      description: "Major industry trade show targeting commercial property developers and construction firms",
      members: [
        { id: "M1", name: "John Davies", email: "j.davies@example.com", status: "Attended", company: "Thames Property Group" },
        { id: "M2", name: "Emma Thompson", email: "e.thompson@example.com", status: "Responded", company: "London Developments Ltd" },
        { id: "M3", name: "Michael Brown", email: "m.brown@example.com", status: "Attended", company: "Brown & Associates" },
      ],
      activities: [
        { id: "A1", timestamp: "2026-03-01T09:00:00", type: "status_changed", description: "Campaign started - Status changed to In Progress", user: "Sarah Mitchell" },
        { id: "A2", timestamp: "2026-03-02T14:30:00", type: "member_added", description: "Added 3 campaign members", user: "Sarah Mitchell" },
        { id: "A3", timestamp: "2026-03-05T11:15:00", type: "response_received", description: "Received response from Emma Thompson", user: "System" },
        { id: "A4", timestamp: "2026-03-08T16:45:00", type: "lead_created", description: "Created new lead from John Davies", user: "Sarah Mitchell" },
      ]
    },
    {
      id: "CMP-002",
      name: "Email - New Service Launch",
      type: "Email",
      status: "Completed",
      startDate: "2026-01-10",
      endDate: "2026-01-31",
      budgetedCost: 5000,
      actualCost: 4200,
      expectedRevenue: 150000,
      actualRevenue: 185000,
      numSent: 1200,
      numResponses: 248,
      numLeads: 67,
      numOpportunities: 18,
      numWonOpportunities: 6,
      owner: "Tom Wilson",
      description: "Email campaign announcing our new design-build services to existing and prospective clients",
      members: [],
      emailTemplate: "TPL-001",
      activities: [
        { id: "A1", timestamp: "2026-01-10T08:00:00", type: "email_sent", description: "Sent campaign to 1,200 recipients", user: "Tom Wilson" },
        { id: "A2", timestamp: "2026-01-12T10:30:00", type: "response_received", description: "Received 48 responses", user: "System" },
        { id: "A3", timestamp: "2026-01-15T14:00:00", type: "lead_created", description: "Created 15 new leads from responses", user: "Tom Wilson" },
        { id: "A4", timestamp: "2026-01-20T16:00:00", type: "opportunity_created", description: "Created 8 opportunities", user: "Tom Wilson" },
        { id: "A5", timestamp: "2026-01-31T17:00:00", type: "status_changed", description: "Campaign completed successfully", user: "Tom Wilson" },
      ]
    },
    {
      id: "CMP-003",
      name: "Webinar - Sustainable Construction",
      type: "Webinar",
      status: "Planning",
      startDate: "2026-04-15",
      endDate: "2026-04-15",
      budgetedCost: 8000,
      actualCost: 0,
      expectedRevenue: 100000,
      actualRevenue: 0,
      numSent: 0,
      numResponses: 0,
      numLeads: 0,
      numOpportunities: 0,
      numWonOpportunities: 0,
      owner: "Sarah Mitchell",
      description: "Educational webinar on sustainable construction practices and green building certifications",
      members: [],
      activities: [
        { id: "A1", timestamp: "2026-02-10T09:00:00", type: "status_changed", description: "Campaign created", user: "Sarah Mitchell" },
      ]
    },
    {
      id: "CMP-004",
      name: "Direct Mail - Local Developers",
      type: "Direct Mail",
      status: "In Progress",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      budgetedCost: 12000,
      actualCost: 8900,
      expectedRevenue: 300000,
      actualRevenue: 45000,
      numSent: 350,
      numResponses: 42,
      numLeads: 18,
      numOpportunities: 5,
      numWonOpportunities: 1,
      owner: "James Parker",
      description: "Targeted direct mail campaign to property developers in the Greater London area",
      members: [],
      activities: [
        { id: "A1", timestamp: "2026-02-01T09:00:00", type: "status_changed", description: "Campaign started", user: "James Parker" },
        { id: "A2", timestamp: "2026-02-03T11:00:00", type: "email_sent", description: "Sent 350 direct mail pieces", user: "James Parker" },
        { id: "A3", timestamp: "2026-02-10T14:30:00", type: "response_received", description: "Received 28 responses", user: "System" },
        { id: "A4", timestamp: "2026-02-14T16:00:00", type: "lead_created", description: "Created 12 new leads", user: "James Parker" },
      ]
    }
  ]);

  const [emailTemplates] = useState<EmailTemplate[]>([
    {
      id: "TPL-001",
      name: "Service Launch Announcement",
      subject: "Introducing Our New Design-Build Services",
      body: "Dear [Contact Name],\n\nWe're excited to announce the launch of our comprehensive design-build services...\n\nBest regards,\n[Your Name]",
      category: "Product Launch"
    },
    {
      id: "TPL-002",
      name: "Event Invitation",
      subject: "You're Invited: [Event Name]",
      body: "Dear [Contact Name],\n\nWe would like to invite you to our upcoming event...\n\nRSVP by [Date]\n\nBest regards,\n[Your Name]",
      category: "Events"
    },
    {
      id: "TPL-003",
      name: "Project Showcase",
      subject: "See Our Latest Projects in Action",
      body: "Dear [Contact Name],\n\nWe're proud to share some of our recent successful projects...\n\nWould you like to learn more?\n\nBest regards,\n[Your Name]",
      category: "Marketing"
    },
    {
      id: "TPL-004",
      name: "Follow-Up",
      subject: "Following Up on Our Recent Conversation",
      body: "Dear [Contact Name],\n\nThank you for your interest in our services. I wanted to follow up...\n\nLooking forward to hearing from you.\n\nBest regards,\n[Your Name]",
      category: "Sales"
    }
  ]);

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showExecuteCampaignModal, setShowExecuteCampaignModal] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "All">("All");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // New Campaign Form State
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "Email" as CampaignType,
    status: "Planning" as CampaignStatus,
    startDate: "",
    endDate: "",
    budgetedCost: 0,
    expectedRevenue: 0,
    owner: "",
    description: ""
  });

  // New Member Form State
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    company: "",
    status: "Sent" as CampaignMember["status"]
  });

  // Handler Functions
  const handleCreateCampaign = () => {
    const now = new Date().toISOString();
    const campaign: Campaign = {
      id: `CMP-${String(campaigns.length + 1).padStart(3, '0')}`,
      name: newCampaign.name,
      type: newCampaign.type,
      status: newCampaign.status,
      startDate: newCampaign.startDate,
      endDate: newCampaign.endDate,
      budgetedCost: newCampaign.budgetedCost,
      actualCost: 0,
      expectedRevenue: newCampaign.expectedRevenue,
      actualRevenue: 0,
      numSent: 0,
      numResponses: 0,
      numLeads: 0,
      numOpportunities: 0,
      numWonOpportunities: 0,
      owner: newCampaign.owner,
      description: newCampaign.description,
      members: [],
      activities: [
        {
          id: "A1",
          timestamp: now,
          type: "status_changed",
          description: `Campaign created with status: ${newCampaign.status}`,
          user: newCampaign.owner
        }
      ]
    };
    
    setCampaigns([...campaigns, campaign]);
    setShowNewCampaignModal(false);
    setNewCampaign({
      name: "",
      type: "Email",
      status: "Planning",
      startDate: "",
      endDate: "",
      budgetedCost: 0,
      expectedRevenue: 0,
      owner: "",
      description: ""
    });
  };

  const handleExecuteCampaign = () => {
    if (!selectedCampaign || !selectedTemplate) return;

    const now = new Date().toISOString();
    const template = emailTemplates.find(t => t.id === selectedTemplate);
    
    // Simulate sending campaign
    const updatedCampaign = {
      ...selectedCampaign,
      status: "In Progress" as CampaignStatus,
      numSent: selectedCampaign.members.length,
      emailTemplate: selectedTemplate,
      activities: [
        {
          id: `A${selectedCampaign.activities.length + 1}`,
          timestamp: now,
          type: "email_sent" as const,
          description: `Sent "${template?.name}" to ${selectedCampaign.members.length} recipients`,
         user: selectedCampaign.owner
        },
        ...selectedCampaign.activities
      ]
    };

    setCampaigns(campaigns.map(c => 
      c.id === selectedCampaign.id ? updatedCampaign : c
    ));
    
    setSelectedCampaign(updatedCampaign);
    setShowExecuteCampaignModal(false);
    setSelectedTemplate(null);
    alert(`Campaign executed! Sent to ${selectedCampaign.members.length} recipients using template: ${template?.name}`);
  };

  const addActivity = (campaignId: string, type: CampaignActivity["type"], description: string, user: string) => {
    const now = new Date().toISOString();
    setCampaigns(campaigns.map(c => {
      if (c.id === campaignId) {
        const newActivity: CampaignActivity = {
          id: `A${c.activities.length + 1}`,
          timestamp: now,
          type,
          description,
          user
        };
        return {
          ...c,
          activities: [newActivity, ...c.activities]
        };
      }
      return c;
    }));
  };

  const handleEditCampaign = () => {
    if (!editingCampaign) return;
    
    setCampaigns(campaigns.map(c => 
      c.id === editingCampaign.id ? editingCampaign : c
    ));
    
    // Update selected campaign if it's the one being edited
    if (selectedCampaign?.id === editingCampaign.id) {
      setSelectedCampaign(editingCampaign);
    }
    
    setShowEditModal(false);
    setEditingCampaign(null);
  };

  const handleCloneCampaign = (campaign: Campaign) => {
    const now = new Date().toISOString();
    const clonedCampaign: Campaign = {
      ...campaign,
      id: `CMP-${String(campaigns.length + 1).padStart(3, '0')}`,
      name: `${campaign.name} (Copy)`,
      status: "Planning",
      actualCost: 0,
      actualRevenue: 0,
      numSent: 0,
      numResponses: 0,
      numLeads: 0,
      numOpportunities: 0,
      numWonOpportunities: 0,
      members: [],
      activities: [
        {
          id: "A1",
          timestamp: now,
          type: "status_changed",
          description: `Campaign cloned from ${campaign.id}`,
          user: campaign.owner
        }
      ]
    };
    
    setCampaigns([...campaigns, clonedCampaign]);
    setSelectedCampaign(null);
  };

  const handleAddMember = () => {
    if (!selectedCampaign) return;
    
    const member: CampaignMember = {
      id: `M${selectedCampaign.members.length + 1}`,
      name: newMember.name,
      email: newMember.email,
      company: newMember.company,
      status: newMember.status
    };
    
    const now = new Date().toISOString();
    const updatedCampaign = {
      ...selectedCampaign,
      members: [...selectedCampaign.members, member],
      activities: [
        {
          id: `A${selectedCampaign.activities.length + 1}`,
          timestamp: now,
          type: "member_added" as const,
          description: `Added campaign member: ${member.name} (${member.company})`,
          user: selectedCampaign.owner
        },
        ...selectedCampaign.activities
      ]
    };
    
    setCampaigns(campaigns.map(c => 
      c.id === selectedCampaign.id ? updatedCampaign : c
    ));
    
    setSelectedCampaign(updatedCampaign);
    setShowAddMembersModal(false);
    setNewMember({
      name: "",
      email: "",
      company: "",
      status: "Sent"
    });
  };

  const openEditModal = (campaign: Campaign) => {
    setEditingCampaign({...campaign});
    setShowEditModal(true);
  };

  const filteredCampaigns = filterStatus === "All" 
    ? campaigns 
    : campaigns.filter(c => c.status === filterStatus);

  const totalBudget = campaigns.reduce((sum, c) => sum + c.budgetedCost, 0);
  const totalActualCost = campaigns.reduce((sum, c) => sum + c.actualCost, 0);
  const totalExpectedRevenue = campaigns.reduce((sum, c) => sum + c.expectedRevenue, 0);
  const totalActualRevenue = campaigns.reduce((sum, c) => sum + c.actualRevenue, 0);
  const totalLeads = campaigns.reduce((sum, c) => sum + c.numLeads, 0);
  const totalOpportunities = campaigns.reduce((sum, c) => sum + c.numOpportunities, 0);
  const totalROI = totalActualCost > 0 ? ((totalActualRevenue - totalActualCost) / totalActualCost * 100) : 0;

  const statusColors = {
    "Planning": "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "In Progress": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "Completed": "bg-green-500/20 text-green-400 border-green-500/30",
    "Aborted": "bg-red-500/20 text-red-400 border-red-500/30"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-end">
        <button 
          onClick={() => setShowNewCampaignModal(true)}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
        >
          + New Campaign
        </button>
      </div>

      {/* Key Metrics */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-orange-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Budget</p>
            <span className="text-xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">
            £{totalBudget.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            Spent: £{totalActualCost.toLocaleString()} ({((totalActualCost/totalBudget)*100).toFixed(0)}%)
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-green-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Revenue Generated</p>
            <span className="text-xl">📈</span>
          </div>
          <p className="text-2xl font-bold text-white">
            £{totalActualRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">
            Expected: £{totalExpectedRevenue.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-blue-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Leads</p>
            <span className="text-xl">👥</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalLeads}</p>
          <p className="text-xs text-gray-400">
            {totalOpportunities} opportunities created
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-gray-700/50 border-l-4 border-l-purple-500 bg-gray-800/80 px-5 py-4">
          <div className="flex items-start justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">ROI</p>
            <span className="text-xl">💎</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalROI.toFixed(0)}%</p>
          <p className="text-xs text-gray-400">
            Return on investment
          </p>
        </div>
      </section>

      {/* Filters */}
      <div className="flex gap-2">
        {(["All", "Planning", "In Progress", "Completed", "Aborted"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterStatus === status
                ? "bg-orange-500 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {status} {status !== "All" && `(${campaigns.filter(c => c.status === status).length})`}
          </button>
        ))}
      </div>

      {/* Campaigns List */}
      <div className="rounded-lg border border-gray-700/50 bg-gray-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50 bg-gray-700/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Date Range</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Budget</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Actual Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Revenue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Leads</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Response Rate</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Owner</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredCampaigns.map((campaign) => {
                const responseRate = campaign.numSent > 0 ? (campaign.numResponses / campaign.numSent * 100) : 0;
                const roi = campaign.actualCost > 0 ? ((campaign.actualRevenue - campaign.actualCost) / campaign.actualCost * 100) : 0;
                
                return (
                  <tr key={campaign.id} className="hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{campaign.name}</p>
                        <p className="text-xs text-gray-500">{campaign.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-300">{campaign.type}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${statusColors[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-300">
                        <div>{new Date(campaign.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div className="text-gray-500">to {new Date(campaign.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-300">
                      £{campaign.budgetedCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-semibold text-white">
                        £{campaign.actualCost.toLocaleString()}
                      </div>
                      <div className={`text-xs ${campaign.actualCost > campaign.budgetedCost ? 'text-red-400' : 'text-green-400'}`}>
                        {campaign.actualCost > campaign.budgetedCost ? '+' : ''}{((campaign.actualCost - campaign.budgetedCost) / campaign.budgetedCost * 100).toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-semibold text-green-400">
                        £{campaign.actualRevenue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        ROI: {roi.toFixed(0)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-semibold text-white">{campaign.numLeads}</div>
                      <div className="text-xs text-gray-500">{campaign.numOpportunities} opps</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm font-semibold text-white">{responseRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">{campaign.numResponses}/{campaign.numSent}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {campaign.owner}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedCampaign(campaign)}
                        className="rounded bg-gray-700 px-3 py-1 text-xs font-semibold text-white hover:bg-gray-600 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-lg border border-gray-700 bg-gray-900 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{selectedCampaign.name}</h2>
                    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${statusColors[selectedCampaign.status]}`}>
                      {selectedCampaign.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-400">{selectedCampaign.id} • {selectedCampaign.type}</p>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="text-gray-400 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Campaign Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Description</label>
                    <p className="mt-1 text-sm text-white">{selectedCampaign.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Start Date</label>
                      <p className="mt-1 text-sm text-white">
                        {new Date(selectedCampaign.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">End Date</label>
                      <p className="mt-1 text-sm text-white">
                        {new Date(selectedCampaign.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Campaign Owner</label>
                    <p className="mt-1 text-sm text-white">{selectedCampaign.owner}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Financial Summary */}
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                    <h3 className="text-sm font-bold text-white mb-3">Financial Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Budgeted Cost:</span>
                        <span className="text-white">£{selectedCampaign.budgetedCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Actual Cost:</span>
                        <span className="text-white font-semibold">£{selectedCampaign.actualCost.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Expected Revenue:</span>
                        <span className="text-white">£{selectedCampaign.expectedRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Actual Revenue:</span>
                        <span className="text-green-400 font-semibold">£{selectedCampaign.actualRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                        <span className="text-gray-400 font-bold">ROI:</span>
                        <span className="text-white font-bold">
                          {selectedCampaign.actualCost > 0 
                            ? ((selectedCampaign.actualRevenue - selectedCampaign.actualCost) / selectedCampaign.actualCost * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                    <h3 className="text-sm font-bold text-white mb-3">Performance Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sent:</span>
                        <span className="text-white">{selectedCampaign.numSent.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Responses:</span>
                        <span className="text-white">{selectedCampaign.numResponses}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Response Rate:</span>
                        <span className="text-white font-semibold">
                          {selectedCampaign.numSent > 0 
                            ? ((selectedCampaign.numResponses / selectedCampaign.numSent) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                        <span className="text-gray-400">Leads:</span>
                        <span className="text-blue-400 font-semibold">{selectedCampaign.numLeads}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Opportunities:</span>
                        <span className="text-purple-400 font-semibold">{selectedCampaign.numOpportunities}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Won Opportunities:</span>
                        <span className="text-green-400 font-semibold">{selectedCampaign.numWonOpportunities}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaign Members */}
              {selectedCampaign.members.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-3">Campaign Members ({selectedCampaign.members.length})</h3>
                  <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700/50">
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Name</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Company</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {selectedCampaign.members.map((member) => (
                          <tr key={member.id} className="hover:bg-gray-700/30">
                            <td className="px-4 py-2 text-sm text-white">{member.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-300">{member.company}</td>
                            <td className="px-4 py-2 text-sm text-gray-400">{member.email}</td>
                            <td className="px-4 py-2">
                              <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${
                                member.status === "Attended" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                                member.status === "Responded" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                                "bg-gray-500/20 text-gray-400 border-gray-500/30"
                              }`}>
                                {member.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-700">
                {selectedCampaign.status !== "Completed" && selectedCampaign.status !== "Aborted" && selectedCampaign.members.length > 0 && (
                  <button 
                    onClick={() => setShowExecuteCampaignModal(true)}
                    className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
                  >
                    ▶ Execute Campaign
                  </button>
                )}
                <button 
                  onClick={() => setShowActivityLog(true)}
                  className="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 transition-colors"
                >
                  📋 Activity Log ({selectedCampaign.activities.length})
                </button>
                <button 
                  onClick={() => openEditModal(selectedCampaign)}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
                >
                  Edit Campaign
                </button>
                <button 
                  onClick={() => setShowAddMembersModal(true)}
                  className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                >
                  Add Members
                </button>
                <button 
                  onClick={() => handleCloneCampaign(selectedCampaign)}
                  className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 transition-colors"
                >
                  Clone Campaign
                </button>
                <button 
                  onClick={() => setSelectedCampaign(null)}
                  className="ml-auto rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Modal */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Create New Campaign</h2>
              <button
                onClick={() => setShowNewCampaignModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter campaign name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Type *</label>
                  <select
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value as CampaignType})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Email">Email</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Direct Mail">Direct Mail</option>
                    <option value="Telemarketing">Telemarketing</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Status *</label>
                  <select
                    value={newCampaign.status}
                    onChange={(e) => setNewCampaign({...newCampaign, status: e.target.value as CampaignStatus})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Aborted">Aborted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={newCampaign.startDate}
                    onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={newCampaign.endDate}
                    onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Budgeted Cost (£) *</label>
                  <input
                    type="number"
                    value={newCampaign.budgetedCost || ''}
                    onChange={(e) => setNewCampaign({...newCampaign, budgetedCost: parseFloat(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Expected Revenue (£) *</label>
                  <input
                    type="number"
                    value={newCampaign.expectedRevenue || ''}
                    onChange={(e) => setNewCampaign({...newCampaign, expectedRevenue: parseFloat(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Campaign Owner *</label>
                <input
                  type="text"
                  value={newCampaign.owner}
                  onChange={(e) => setNewCampaign({...newCampaign, owner: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter owner name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Description</label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Enter campaign description"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleCreateCampaign}
                disabled={!newCampaign.name || !newCampaign.startDate || !newCampaign.endDate || !newCampaign.owner}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Campaign
              </button>
              <button
                onClick={() => setShowNewCampaignModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal */}
      {showEditModal && editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-700 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Edit Campaign</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={editingCampaign.name}
                  onChange={(e) => setEditingCampaign({...editingCampaign, name: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Type *</label>
                  <select
                    value={editingCampaign.type}
                    onChange={(e) => setEditingCampaign({...editingCampaign, type: e.target.value as CampaignType})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Email">Email</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Trade Show">Trade Show</option>
                    <option value="Direct Mail">Direct Mail</option>
                    <option value="Telemarketing">Telemarketing</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Status *</label>
                  <select
                    value={editingCampaign.status}
                    onChange={(e) => setEditingCampaign({...editingCampaign, status: e.target.value as CampaignStatus})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Aborted">Aborted</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={editingCampaign.startDate}
                    onChange={(e) => setEditingCampaign({...editingCampaign, startDate: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={editingCampaign.endDate}
                    onChange={(e) => setEditingCampaign({...editingCampaign, endDate: e.target.value})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Budgeted Cost (£)</label>
                  <input
                    type="number"
                    value={editingCampaign.budgetedCost}
                    onChange={(e) => setEditingCampaign({...editingCampaign, budgetedCost: parseFloat(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Actual Cost (£)</label>
                  <input
                    type="number"
                    value={editingCampaign.actualCost}
                    onChange={(e) => setEditingCampaign({...editingCampaign, actualCost: parseFloat(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Expected Revenue (£)</label>
                  <input
                    type="number"
                    value={editingCampaign.expectedRevenue}
                    onChange={(e) => setEditingCampaign({...editingCampaign, expectedRevenue: parseFloat(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Actual Revenue (£)</label>
                  <input
                    type="number"
                    value={editingCampaign.actualRevenue}
                    onChange={(e) => setEditingCampaign({...editingCampaign, actualRevenue: parseFloat(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Leads</label>
                  <input
                    type="number"
                    value={editingCampaign.numLeads}
                    onChange={(e) => setEditingCampaign({...editingCampaign, numLeads: parseInt(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Opportunities</label>
                  <input
                    type="number"
                    value={editingCampaign.numOpportunities}
                    onChange={(e) => setEditingCampaign({...editingCampaign, numOpportunities: parseInt(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-1">Won</label>
                  <input
                    type="number"
                    value={editingCampaign.numWonOpportunities}
                    onChange={(e) => setEditingCampaign({...editingCampaign, numWonOpportunities: parseInt(e.target.value) || 0})}
                    className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Campaign Owner</label>
                <input
                  type="text"
                  value={editingCampaign.owner}
                  onChange={(e) => setEditingCampaign({...editingCampaign, owner: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Description</label>
                <textarea
                  value={editingCampaign.description}
                  onChange={(e) => setEditingCampaign({...editingCampaign, description: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleEditCampaign}
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

      {/* Add Members Modal */}
      {showAddMembersModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Campaign Member</h2>
              <button
                onClick={() => setShowAddMembersModal(false)}
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
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter member name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Email *</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Company *</label>
                <input
                  type="text"
                  value={newMember.company}
                  onChange={(e) => setNewMember({...newMember, company: e.target.value})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-1">Status *</label>
                <select
                  value={newMember.status}
                  onChange={(e) => setNewMember({...newMember, status: e.target.value as CampaignMember["status"]})}
                  className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Sent">Sent</option>
                  <option value="Responded">Responded</option>
                  <option value="Attended">Attended</option>
                  <option value="No Response">No Response</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleAddMember}
                disabled={!newMember.name || !newMember.email || !newMember.company}
                className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Member
              </button>
              <button
                onClick={() => setShowAddMembersModal(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execute Campaign Modal */}
      {showExecuteCampaignModal && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Execute Campaign</h2>
              <button
                onClick={() => setShowExecuteCampaignModal(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Campaign Summary */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <h3 className="text-lg font-bold text-white mb-3">{selectedCampaign.name}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Type:</span>
                    <span className="ml-2 text-white">{selectedCampaign.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Recipients:</span>
                    <span className="ml-2 text-white font-semibold">{selectedCampaign.members.length}</span>
                  </div>
                </div>
              </div>

              {/* Template Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-3">Select Email Template *</label>
                <div className="grid gap-3">
                  {emailTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        selectedTemplate === template.id
                          ? "border-green-500 bg-green-500/10"
                          : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-white">{template.name}</h4>
                            <span className="text-xs rounded bg-gray-700 px-2 py-0.5 text-gray-300">
                              {template.category}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="font-semibold">Subject:</span> {template.subject}
                          </p>
                          <div className="mt-2 rounded bg-gray-900/50 p-2 text-xs text-gray-300 font-mono whitespace-pre-wrap">
                            {template.body.substring(0, 150)}...
                          </div>
                        </div>
                        {selectedTemplate === template.id && (
                          <div className="ml-3 text-green-400">✓</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recipients Preview */}
              <div className="rounded-lg border border-gray-700/50 bg-gray-800/50 p-4">
                <h3 className="text-sm font-bold text-white mb-3">
                  Recipients ({selectedCampaign.members.length})
                </h3>
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {selectedCampaign.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-white">{member.name}</span>
                        <span className="text-gray-500 ml-2">({member.company})</span>
                      </div>
                      <span className="text-gray-400 text-xs">{member.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={handleExecuteCampaign}
                disabled={!selectedTemplate}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ▶ Execute Campaign Now
              </button>
              <button
                onClick={() => {
                  setShowExecuteCampaignModal(false);
                  setSelectedTemplate(null);
                }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityLog && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-lg border border-gray-700 bg-gray-900 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Activity Log</h2>
                <p className="text-sm text-gray-400">{selectedCampaign.name}</p>
              </div>
              <button
                onClick={() => setShowActivityLog(false)}
                className="text-gray-400 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {selectedCampaign.activities.map((activity, index) => {
                const activityIcons = {
                  email_sent: "📧",
                  response_received: "💬",
                  lead_created: "👤",
                  opportunity_created: "💼",
                  status_changed: "🔄",
                  member_added: "➕"
                };

                const activityColors = {
                  email_sent: "border-l-blue-500",
                  response_received: "border-l-green-500",
                  lead_created: "border-l-purple-500",
                  opportunity_created: "border-l-yellow-500",
                  status_changed: "border-l-orange-500",
                  member_added: "border-l-cyan-500"
                };

                return (
                  <div
                    key={activity.id}
                    className={`rounded-lg border border-gray-700/50 border-l-4 ${activityColors[activity.type]} bg-gray-800/50 p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{activityIcons[activity.type]}</span>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span>👤 {activity.user}</span>
                          <span>•</span>
                          <span>
                            📅 {new Date(activity.timestamp).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedCampaign.activities.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-400">No activities recorded yet</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={() => setShowActivityLog(false)}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
