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
	},
	{
		label: "Commercial",
		href: "/commercial-overview",
		permission: "invoices",
		activeMatchPrefixes: ["/commercial/", "/invoices", "/payments", "/contracts"],
	},
	{
		label: "Procurement",
		href: "/procurement-overview",
		permission: "procurement",
		activeMatchPrefixes: ["/suppliers", "/purchase-orders", "/supplier-portal", "/supplier-respond"],
	},
	{
		label: "Resources",
		href: "/resources-overview",
		permission: "resources",
		activeMatchPrefixes: ["/staff", "/skills", "/allocation", "/timesheets-overview", "/my-timesheets"],
	},
	{
		label: "Finance & QS",
		href: "/qs-overview",
		permission: "invoices",
		activeMatchPrefixes: ["/payment-documents"],
	},
	{
		label: "Estimating",
		href: "/estimating-overview",
		permission: "estimates",
		activeMatchPrefixes: ["/labour-rates", "/plant-rates", "/material-rates", "/archive"],
	},
	{
		label: "Safety",
		href: "/hs-overview",
		permission: "compliance",
		activeMatchPrefixes: ["/incidents", "/compliance", "/training"],
	},
	{
		label: "Fleet",
		href: "/fleet-overview",
		permission: "fleet",
		activeMatchPrefixes: ["/fleet", "/maintenance", "/bookings"],
	},
	{
		label: "HR",
		href: "/hr-overview",
		permission: "leave",
		activeMatchPrefixes: ["/team", "/leave", "/payroll"],
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