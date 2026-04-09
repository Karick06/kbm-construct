export type NavItem = {
	label: string;
	href: string;
	permission?: string;
};

export type NavSection = {
	label: string;
	href?: string;
	permission?: string;
	activeMatchPrefixes?: string[];
	items?: NavItem[];
};

export const appNavSections: NavSection[] = [
	{
		label: "Business Overview",
		href: "/",
	},
	{
		label: "Email",
		href: "/mail",
		activeMatchPrefixes: ["/mail-settings", "/approvals"],
		items: [
			{ label: "Mail", href: "/mail" },
			{ label: "Chat", href: "/chat" },
			{ label: "Approvals", href: "/approvals" },
			{ label: "Mail Settings", href: "/mail-settings" },
		],
	},
	{
		label: "Operations",
		href: "/operations-overview",
		permission: "projects",
		activeMatchPrefixes: [
			"/projects",
			"/tasks",
			"/schedule",
			"/geofences",
			"/site-diary",
			"/quality-inspections",
			"/permits-to-work",
			"/toolbox-talks",
			"/variation-orders",
			"/rfis",
			"/defects",
			"/photos",
			"/as-built-drawings",
			"/handover-documentation",
			"/lessons-learned",
			"/plant-booking",
			"/material-reconciliation",
			"/weather-logging",
		],
		items: [
			{ label: "Overview", href: "/operations-overview" },
			{ label: "Projects", href: "/projects" },
			{ label: "Tasks", href: "/tasks" },
			{ label: "Schedule", href: "/schedule" },
			{ label: "Geofences", href: "/geofences" },
			{ label: "Site Diary", href: "/site-diary" },
			{ label: "Quality Inspections", href: "/quality-inspections" },
			{ label: "Permits to Work", href: "/permits-to-work" },
			{ label: "Toolbox Talks", href: "/toolbox-talks" },
			{ label: "RFIs", href: "/rfis" },
			{ label: "Variation Orders", href: "/variation-orders" },
			{ label: "Defects", href: "/defects" },
			{ label: "Photos", href: "/photos" },
			{ label: "As-Built Drawings", href: "/as-built-drawings" },
			{ label: "Handover Docs", href: "/handover-documentation" },
			{ label: "Lessons Learned", href: "/lessons-learned" },
			{ label: "Plant Booking", href: "/plant-booking" },
			{ label: "Material Reconciliation", href: "/material-reconciliation" },
			{ label: "Weather Logging", href: "/weather-logging" },
		],
	},
	{
		label: "Commercial",
		href: "/commercial-overview",
		permission: "invoices",
		activeMatchPrefixes: ["/commercial/", "/invoices", "/payments", "/contracts"],
		items: [
			{ label: "Overview", href: "/commercial-overview" },
			{ label: "Invoices", href: "/invoices" },
			{ label: "Payments", href: "/payments" },
			{ label: "Contracts", href: "/contracts" },
		],
	},
	{
		label: "Procurement",
		href: "/procurement-overview",
		permission: "procurement",
		activeMatchPrefixes: ["/suppliers", "/purchase-orders", "/supplier-portal", "/supplier-respond"],
		items: [
			{ label: "Overview", href: "/procurement-overview" },
			{ label: "Suppliers", href: "/suppliers" },
			{ label: "Purchase Orders", href: "/purchase-orders" },
			{ label: "Supplier Portal", href: "/supplier-portal" },
		],
	},
	{
		label: "Resources",
		href: "/resources-overview",
		permission: "resources",
		activeMatchPrefixes: ["/staff", "/skills", "/allocation", "/timesheets-overview", "/my-timesheets"],
		items: [
			{ label: "Overview", href: "/resources-overview" },
			{ label: "Staff", href: "/staff" },
			{ label: "Skills", href: "/skills" },
			{ label: "Allocation", href: "/allocation" },
			{ label: "Timesheets", href: "/timesheets-overview" },
			{ label: "My Timesheets", href: "/my-timesheets" },
		],
	},
	{
		label: "Finance & QS",
		href: "/qs-overview",
		permission: "invoices",
		activeMatchPrefixes: ["/payment-documents"],
		items: [
			{ label: "QS Overview", href: "/qs-overview" },
			{ label: "Payment Docs", href: "/payment-documents" },
		],
	},
	{
		label: "Estimating",
		href: "/estimating-overview",
		permission: "estimates",
		activeMatchPrefixes: ["/labour-rates", "/plant-rates", "/material-rates", "/archive"],
		items: [
			{ label: "Overview", href: "/estimating-overview" },
			{ label: "Labour Rates", href: "/labour-rates" },
			{ label: "Plant Rates", href: "/plant-rates" },
			{ label: "Material Rates", href: "/material-rates" },
			{ label: "Archive", href: "/archive" },
		],
	},
	{
		label: "Safety",
		href: "/hs-overview",
		permission: "compliance",
		activeMatchPrefixes: ["/incidents", "/compliance", "/rams", "/training"],
		items: [
			{ label: "Overview", href: "/hs-overview" },
			{ label: "RAMS", href: "/rams" },
			{ label: "Incidents", href: "/incidents" },
			{ label: "Training", href: "/training" },
		],
	},
	{
		label: "Fleet",
		href: "/fleet-overview",
		permission: "fleet",
		activeMatchPrefixes: ["/fleet", "/maintenance", "/bookings"],
		items: [
			{ label: "Overview", href: "/fleet-overview" },
			{ label: "Fleet", href: "/fleet" },
			{ label: "Maintenance", href: "/maintenance" },
			{ label: "Bookings", href: "/bookings" },
		],
	},
	{
		label: "HR",
		href: "/hr-overview",
		permission: "leave",
		activeMatchPrefixes: ["/team", "/leave", "/payroll"],
		items: [
			{ label: "Overview", href: "/hr-overview" },
			{ label: "Team", href: "/team" },
			{ label: "Leave", href: "/leave" },
			{ label: "Payroll", href: "/payroll" },
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
			{ label: "Site Audit Pro", href: "/tools/site-audit-pro" },
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
			items: (section.items || []).filter((item) => !item.permission || hasPermission(item.permission)),
		}))
		.filter((section) => {
			const canViewSection = !section.permission || hasPermission(section.permission);
			return (section.href && canViewSection) || section.items.length > 0;
		});
}