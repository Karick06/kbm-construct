export type PermitType =
	| "Hot Works"
	| "Confined Space"
	| "Excavation"
	| "Working at Height"
	| "Lifting Operations"
	| "Electrical Isolation"
	| "Demolition"
	| "Piling"
	| "Temporary Works"
	| "Permit to Dig";

export interface PermitToWork {
	id: string;
	permitType: PermitType;
	permitNumber: string;
	project: string;
	location: string;
	workDescription: string;
	contractor: string;
	supervisor: string;
	startDate: string;
	endDate: string;
	startTime: string;
	endTime: string;
	status: "pending" | "approved" | "active" | "completed" | "suspended" | "cancelled";
	preconditions: {
		description: string;
		completed: boolean;
	}[];
	authorizedPersonnel: string[];
	emergencyContacts: {
		name: string;
		role: string;
		phone: string;
	}[];
	isolations?: {
		type: string;
		location: string;
		lockedBy: string;
	}[];
	gasTests?: {
		substance: string;
		reading: string;
		acceptableLevel: string;
		time: string;
	}[];
	specialRequirements?: string;
	issuedBy?: string;
	issuedDate?: string;
	approvedBy?: string;
	approvalDate?: string;
	closedBy?: string;
	closedDate?: string;
	createdAt: string;
	updatedAt: string;
}

export const PERMIT_TYPES: PermitType[] = [
	"Hot Works",
	"Confined Space",
	"Excavation",
	"Working at Height",
	"Lifting Operations",
	"Electrical Isolation",
	"Demolition",
	"Piling",
	"Temporary Works",
	"Permit to Dig",
];

export const PERMIT_PRECONDITIONS: Record<PermitType, string[]> = {
	"Hot Works": [
		"Fire extinguisher available on site",
		"Flammable materials removed from work area",
		"Hot work screens/blankets in place",
		"Fire watch assigned",
		"Work area inspected 60 minutes after completion",
	],
	"Confined Space": [
		"Atmosphere tested and acceptable",
		"Rescue equipment available",
		"Communication system established",
		"Attendant stationed outside",
		"Emergency rescue plan briefed",
		"Forced ventilation operational (if required)",
	],
	Excavation: [
		"Services identified and marked",
		"CAT & Genny scan completed",
		"Hand dig trial holes completed",
		"Excavation support designed (if required)",
		"Edge protection installed",
		"Safe access/egress provided",
	],
	"Working at Height": [
		"Scaffold tagged and inspected (if applicable)",
		"Fall protection systems in place",
		"Harnesses & lanyards inspected",
		"Rescue plan established",
		"Weather conditions acceptable",
		"Area below isolated/protected",
	],
	"Lifting Operations": [
		"Lift plan prepared and approved",
		"Crane/lifting equipment inspected",
		"Load weight verified",
		"Slinging checked by competent person",
		"Banksman appointed",
		"Exclusion zone established",
	],
	"Electrical Isolation": [
		"Isolation points identified",
		"Lock-off devices fitted",
		"Isolation tested and confirmed dead",
		"Warning notices displayed",
		"Only authorized electricians to work",
	],
	Demolition: [
		"Structural survey completed",
		"Asbestos survey completed",
		"Services disconnected/isolated",
		"Method statement approved",
		"Exclusion zone established",
		"Dust suppression measures in place",
	],
	Piling: [
		"Ground investigation data reviewed",
		"Services verification complete",
		"Rig stability checked",
		"Noise/vibration monitoring in place",
		"Exclusion zone established",
		"Pile design approved",
	],
	"Temporary Works": [
		"Temporary works design completed",
		"Design checked by TWC",
		"Materials inspected on delivery",
		"Installation supervised by competent person",
		"Handover certificate issued",
	],
	"Permit to Dig": [
		"Service plans obtained",
		"CAT & Genny scan completed",
		"Trial holes dug at locations",
		"Safe digging practice briefed",
		"Emergency contact numbers displayed",
	],
};

export function createPermitToWork(
	data: Partial<PermitToWork>
): PermitToWork {
	const now = new Date().toISOString();
	const permitType = data.permitType || "Hot Works";
	const preconditions = PERMIT_PRECONDITIONS[permitType].map((desc) => ({
		description: desc,
		completed: false,
	}));

	return {
		id: data.id || `PTW-${Date.now()}`,
		permitType,
		permitNumber: data.permitNumber || `PTW-${Math.floor(Math.random() * 10000)}`,
		project: data.project || "",
		location: data.location || "",
		workDescription: data.workDescription || "",
		contractor: data.contractor || "",
		supervisor: data.supervisor || "",
		startDate: data.startDate || new Date().toISOString().split("T")[0],
		endDate: data.endDate || new Date().toISOString().split("T")[0],
		startTime: data.startTime || "08:00",
		endTime: data.endTime || "17:00",
		status: data.status || "pending",
		preconditions: data.preconditions || preconditions,
		authorizedPersonnel: data.authorizedPersonnel || [],
		emergencyContacts: data.emergencyContacts || [],
		isolations: data.isolations,
		gasTests: data.gasTests,
		specialRequirements: data.specialRequirements,
		issuedBy: data.issuedBy,
		issuedDate: data.issuedDate,
		approvedBy: data.approvedBy,
		approvalDate: data.approvalDate,
		closedBy: data.closedBy,
		closedDate: data.closedDate,
		createdAt: data.createdAt || now,
		updatedAt: data.updatedAt || now,
	};
}

// Storage functions
async function getSafeStorage<T>(key: string, fallback: T): Promise<T> {
	if (typeof window === "undefined") return fallback;
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : fallback;
	} catch {
		return fallback;
	}
}

async function setSafeStorage(key: string, value: unknown): Promise<void> {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error("Failed to save to localStorage:", error);
	}
}

export async function savePermitToWork(permit: PermitToWork): Promise<void> {
	const permits = await getPermitsToWork();
	const index = permits.findIndex((p) => p.id === permit.id);
	if (index >= 0) {
		permits[index] = { ...permit, updatedAt: new Date().toISOString() };
	} else {
		permits.push(permit);
	}
	await setSafeStorage("permitsToWork", permits);
}

export async function getPermitsToWork(): Promise<PermitToWork[]> {
	return getSafeStorage<PermitToWork[]>("permitsToWork", []);
}

export async function deletePermitToWork(id: string): Promise<void> {
	const permits = await getPermitsToWork();
	const filtered = permits.filter((p) => p.id !== id);
	await setSafeStorage("permitsToWork", filtered);
}
