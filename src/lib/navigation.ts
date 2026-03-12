export type NavItem = {
	label: string;
	href: string;
	permission?: string;
};

export type NavSection = {
	label: string;
	items: NavItem[];
};

export const appNavSections: NavSection[] = [
	{
		label: "Business Overview",
		items: [
			{ label: "Dashboard", href: "/" },
			{ label: "Chat", href: "/chat" },
		],
	},
	{
		label: "Business Development",
		items: [
			{ label: "CRM Dashboard", href: "/crm", permission: "clients" },
			{ label: "Campaigns", href: "/campaigns", permission: "clients" },
			{ label: "Clients", href: "/clients", permission: "clients" },
			{ label: "Tender Portal", href: "/tender-portal", permission: "clients" },
		],
	},
	{
		label: "Estimating",
		items: [
			{ label: "Estimating Overview", href: "/estimating-overview", permission: "estimates" },
			{ label: "Labour Rates", href: "/labour-rates", permission: "estimates" },
			{ label: "Plant Rates", href: "/plant-rates", permission: "estimates" },
			{ label: "Material Rates", href: "/material-rates", permission: "estimates" },
			{ label: "Archive", href: "/archive", permission: "estimates" },
		],
	},
	{
		label: "Operations",
		items: [
			{ label: "Operations Overview", href: "/operations-overview", permission: "projects" },
			{ label: "Projects", href: "/projects", permission: "projects" },
			{ label: "Tasks", href: "/tasks", permission: "projects" },
			{ label: "Schedule", href: "/schedule", permission: "projects" },
		],
	},
	{
		label: "Commercial",
		items: [
			{ label: "Commercial Overview", href: "/commercial-overview", permission: "invoices" },
			{ label: "Invoices", href: "/invoices", permission: "invoices" },
			{ label: "Payments", href: "/payments", permission: "payments" },
			{ label: "Contracts", href: "/contracts", permission: "contracts" },
		],
	},
	{
		label: "Finance & QS",
		items: [
			{ label: "QS Overview", href: "/qs-overview", permission: "invoices" },
			{ label: "Payment Documents", href: "/payment-documents", permission: "payments" },
		],
	},
	{
		label: "Procurement",
		items: [
			{ label: "Procurement Overview", href: "/procurement-overview", permission: "procurement" },
			{ label: "Suppliers", href: "/suppliers", permission: "procurement" },
			{ label: "Purchase Orders", href: "/purchase-orders", permission: "procurement" },
		],
	},
	{
		label: "Resources",
		items: [
			{ label: "Resources Overview", href: "/resources-overview", permission: "resources" },
			{ label: "Staff", href: "/staff", permission: "staff" },
			{ label: "Skills", href: "/skills", permission: "staff" },
			{ label: "Allocation", href: "/allocation", permission: "resources" },
			{ label: "Timesheets", href: "/timesheets-overview", permission: "timesheets" },
			{ label: "My Timesheets", href: "/my-timesheets" },
			{ label: "Geofences", href: "/geofences", permission: "timesheets" },
		],
	},
	{
		label: "Project Management",
		items: [
			{ label: "Site Diary", href: "/site-diary", permission: "projects" },
			{ label: "Quality Inspections", href: "/quality-inspections", permission: "projects" },
			{ label: "Permits to Work", href: "/permits-to-work", permission: "projects" },
			{ label: "Toolbox Talks", href: "/toolbox-talks", permission: "projects" },
			{ label: "Variation Orders", href: "/variation-orders", permission: "projects" },
			{ label: "RFIs", href: "/rfis", permission: "projects" },
			{ label: "Defects/Snagging", href: "/defects", permission: "projects" },
			{ label: "Photo Documentation", href: "/photos", permission: "projects" },
			{ label: "As-Built Drawings", href: "/as-built-drawings", permission: "projects" },
			{ label: "Handover Documentation", href: "/handover-documentation", permission: "projects" },
			{ label: "Lessons Learned", href: "/lessons-learned", permission: "projects" },
			{ label: "Plant Booking", href: "/plant-booking", permission: "projects" },
			{ label: "Material Reconciliation", href: "/material-reconciliation", permission: "projects" },
			{ label: "Weather Logging", href: "/weather-logging", permission: "projects" },
		],
	},
	{
		label: "H&S",
		items: [
			{ label: "H&S Overview", href: "/hs-overview", permission: "compliance" },
			{ label: "Incidents", href: "/incidents", permission: "compliance" },
			{ label: "Compliance & RAMS", href: "/compliance", permission: "compliance" },
			{ label: "Training", href: "/training", permission: "training" },
		],
	},
	{
		label: "Vehicles / Plant",
		items: [
			{ label: "Fleet Overview", href: "/fleet-overview", permission: "fleet" },
			{ label: "Fleet", href: "/fleet", permission: "fleet" },
			{ label: "Maintenance", href: "/maintenance", permission: "fleet" },
			{ label: "Bookings", href: "/bookings", permission: "fleet" },
		],
	},
	{
		label: "Libraries",
		items: [
			{ label: "Documents", href: "/documents", permission: "documents" },
			{ label: "Templates", href: "/library-templates", permission: "documents" },
			{ label: "Resources", href: "/library-resources", permission: "documents" },
		],
	},
	{
		label: "Tools",
		items: [
			{ label: "Drawing Measurement", href: "/drawing-measurement" },
			{ label: "Materials Calculator", href: "/tools/materials-calculator" },
			{ label: "Civils & Groundworks Rate Builder", href: "/tools/civils-rate-builder" },
		],
	},
	{
		label: "HR",
		items: [
			{ label: "HR Overview", href: "/hr-overview", permission: "leave" },
			{ label: "Team", href: "/team", permission: "staff" },
			{ label: "Leave", href: "/leave", permission: "leave" },
			{ label: "Payroll", href: "/payroll", permission: "payroll" },
		],
	},
	{
		label: "Settings",
		items: [
			{ label: "User Settings", href: "/settings" },
			{ label: "User Management", href: "/admin", permission: "user_management" },
			{ label: "Sage Integration", href: "/sage-settings" },
		],
	},
];

export function getVisibleNavSections(hasPermission: (permission: string) => boolean): NavSection[] {
	return appNavSections
		.map((section) => ({
			...section,
			items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
		}))
		.filter((section) => section.items.length > 0);
}