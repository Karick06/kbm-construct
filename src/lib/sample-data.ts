export const dashboardStats = [
  {
    label: "Active projects",
    value: "12",
    change: "+2 this week",
    tone: "sunset",
  },
  {
    label: "Pipeline value",
    value: "£1.42m",
    change: "+8% vs last month",
    tone: "ocean",
  },
  {
    label: "Overdue tasks",
    value: "7",
    change: "3 need attention",
    tone: "sage",
  },
  {
    label: "Cash on hand",
    value: "£248k",
    change: "Runway 4.6 months",
    tone: "sand",
  },
] as const;

export const pipeline = [
  {
    name: "Riverside loft conversion",
    owner: "Ava Collins",
    stage: "Proposal",
    value: "£182k",
  },
  {
    name: "Northbank retail fitout",
    owner: "Jonas Pratt",
    stage: "Site survey",
    value: "£96k",
  },
  {
    name: "Harborline residence",
    owner: "Keira Lowe",
    stage: "Negotiation",
    value: "£310k",
  },
  {
    name: "Greenline office refresh",
    owner: "Sofia Diaz",
    stage: "Pricing",
    value: "£74k",
  },
];

export const tasks = [
  {
    title: "Finalize scope for Arbor Park",
    assignee: "Mila",
    due: "Today",
    status: "risk",
  },
  {
    title: "Book steel delivery",
    assignee: "Noah",
    due: "Tomorrow",
    status: "on-track",
  },
  {
    title: "Send progress photos",
    assignee: "Zara",
    due: "Fri",
    status: "on-track",
  },
  {
    title: "Review budget variation",
    assignee: "Theo",
    due: "Mon",
    status: "late",
  },
] as const;

export const invoices = [
  {
    id: "INV-4021",
    client: "Harborline Interiors",
    amount: "£18,400",
    status: "paid",
    due: "Paid",
  },
  {
    id: "INV-4022",
    client: "Riverside Living",
    amount: "£9,800",
    status: "open",
    due: "Mar 3",
  },
  {
    id: "INV-4023",
    client: "Northbank Group",
    amount: "£22,300",
    status: "open",
    due: "Mar 7",
  },
  {
    id: "INV-4024",
    client: "Sunset Creative",
    amount: "£6,150",
    status: "draft",
    due: "Draft",
  },
] as const;

export const clients = [
  {
    name: "Harborline Interiors",
    owner: "Mila Ortega",
    projects: 3,
    status: "Active",
    value: "£128k",
  },
  {
    name: "Northbank Group",
    owner: "Jonas Pratt",
    projects: 2,
    status: "Active",
    value: "£92k",
  },
  {
    name: "Sunset Creative",
    owner: "Ava Collins",
    projects: 1,
    status: "Paused",
    value: "£41k",
  },
  {
    name: "Riverside Living",
    owner: "Sofia Diaz",
    projects: 4,
    status: "Active",
    value: "£210k",
  },
];

export const projects = [
  {
    name: "Arbor Park build",
    manager: "Theo Grant",
    phase: "Framing",
    health: "on-track",
    budget: "£420k",
  },
  {
    name: "Cedar House renovation",
    manager: "Mila Ortega",
    phase: "Finishes",
    health: "risk",
    budget: "£185k",
  },
  {
    name: "Northbank retail fitout",
    manager: "Jonas Pratt",
    phase: "Mobilization",
    health: "on-track",
    budget: "£96k",
  },
  {
    name: "Harborline residence",
    manager: "Ava Collins",
    phase: "Pricing",
    health: "late",
    budget: "£310k",
  },
] as const;

export const team = [
  {
    name: "Mila Ortega",
    role: "Operations lead",
    focus: "Scheduling",
  },
  {
    name: "Theo Grant",
    role: "Project director",
    focus: "Delivery",
  },
  {
    name: "Sofia Diaz",
    role: "Client success",
    focus: "Retention",
  },
  {
    name: "Jonas Pratt",
    role: "Commercial",
    focus: "Pipeline",
  },
];

export const documents = [
  {
    title: "Arbor Park site pack",
    owner: "Theo",
    updated: "2 hours ago",
  },
  {
    title: "Harborline variations",
    owner: "Mila",
    updated: "Yesterday",
  },
  {
    title: "Northbank compliance",
    owner: "Zara",
    updated: "2 days ago",
  },
  {
    title: "Supplier agreement",
    owner: "Jonas",
    updated: "4 days ago",
  },
];

export const reports = [
  { label: "Gross margin", value: "24.5%", trend: "+1.6%" },
  { label: "Invoice cycle", value: "16 days", trend: "-2 days" },
  { label: "Resource load", value: "78%", trend: "+4%" },
];
