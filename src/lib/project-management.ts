// Tool Box Talks
export interface ToolBoxTalk {
	id: string;
	date: string;
	project: string;
	topic: string;
	presenter: string;
	duration: number; // minutes
	keyPoints: string[];
	attendees: { name: string; signature?: string; company?: string }[];
	photos?: string[];
	createdAt: string;
}

// Variation Orders
export interface VariationOrder {
	id: string;
	voNumber: string;
	project: string;
	title: string;
	description: string;
	reason: string;
	status: "draft" | "submitted" | "approved" | "rejected" | "completed";
	estimatedCost: number;
	actualCost?: number;
	estimatedDays: number;
	submittedDate?: string;
	approvedDate?: string;
	approvedBy?: string;
	createdBy: string;
	createdAt: string;
}

// RFIs
export interface RFI {
	id: string;
	rfiNumber: string;
	project: string;
	subject: string;
	question: string;
	discipline: string;
	priority: "low" | "medium" | "high" | "urgent";
	status: "open" | "answered" | "closed";
	raisedBy: string;
	raisedDate: string;
	responseRequired: string;
	response?: string;
	respondedBy?: string;
	respondedDate?: string;
	attachments?: string[];
}

// Defects/Snagging
export interface Defect {
	id: string;
	defectNumber: string;
	project: string;
	location: string;
	description: string;
	severity: "minor" | "major" | "critical";
	status: "open" | "in-progress" | "resolved" | "verified" | "closed";
	trade: string;
	raisedBy: string;
	raisedDate: string;
	assignedTo?: string;
	targetDate?: string;
	resolvedDate?: string;
	photos?: string[];
}

// Photos
export interface Photo {
	id: string;
	project: string;
	location: string;
	description: string;
	category: "progress" | "quality" | "safety" | "defect" | "completion" | "other";
	date: string;
	takenBy: string;
	url: string; // placeholder for actual photo
	tags?: string[];
}

export const COMMON_TOOLBOX_TOPICS = [
	"Working at Height",
	"Manual Handling",
	"Excavation Safety",
	"Traffic Management",
	"PPE Requirements",
	"RAMS Briefing",
	"Confined Spaces",
	"Lifting Operations",
	"Hot Works",
	"Emergency Procedures",
	"Environmental Protection",
	"Site Housekeeping",
	"Noise & Vibration",
	"First Aid",
	"Incident Reporting",
];

export const VO_REASONS = [
	"Client Instruction",
	"Design Change",
	"Site Conditions",
	"Unforeseen Ground Conditions",
	"Additional Works",
	"Omission",
	"Specification Change",
	"Programme Acceleration",
	"Statutory Requirement",
];

export const RFI_DISCIPLINES = [
	"Architectural",
	"Structural",
	"Civil",
	"Groundworks",
	"Drainage",
	"Highways",
	"Mechanical",
	"Electrical",
	"General",
];

export const TRADES = [
	"Groundworks",
	"Civils",
	"Drainage",
	"Steelfixing",
	"Concrete",
	"Brickwork",
	"Surfacing",
	"Kerbing",
	"M&E",
	"General",
];

// Storage helpers
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

// Tool Box Talks storage
export async function saveToolBoxTalk(talk: ToolBoxTalk): Promise<void> {
	const talks = await getSafeStorage<ToolBoxTalk[]>("toolBoxTalks", []);
	const index = talks.findIndex((t) => t.id === talk.id);
	if (index >= 0) {
		talks[index] = talk;
	} else {
		talks.push(talk);
	}
	await setSafeStorage("toolBoxTalks", talks);
}

export async function getToolBoxTalks(): Promise<ToolBoxTalk[]> {
	return getSafeStorage<ToolBoxTalk[]>("toolBoxTalks", []);
}

export async function deleteToolBoxTalk(id: string): Promise<void> {
	const talks = await getToolBoxTalks();
	await setSafeStorage("toolBoxTalks", talks.filter((t) => t.id !== id));
}

// Variation Orders storage
export async function saveVariationOrder(vo: VariationOrder): Promise<void> {
	const vos = await getSafeStorage<VariationOrder[]>("variationOrders", []);
	const index = vos.findIndex((v) => v.id === vo.id);
	if (index >= 0) {
		vos[index] = vo;
	} else {
		vos.push(vo);
	}
	await setSafeStorage("variationOrders", vos);
}

export async function getVariationOrders(): Promise<VariationOrder[]> {
	return getSafeStorage<VariationOrder[]>("variationOrders", []);
}

export async function deleteVariationOrder(id: string): Promise<void> {
	const vos = await getVariationOrders();
	await setSafeStorage("variationOrders", vos.filter((v) => v.id !== id));
}

// RFIs storage
export async function saveRFI(rfi: RFI): Promise<void> {
	const rfis = await getSafeStorage<RFI[]>("rfis", []);
	const index = rfis.findIndex((r) => r.id === rfi.id);
	if (index >= 0) {
		rfis[index] = rfi;
	} else {
		rfis.push(rfi);
	}
	await setSafeStorage("rfis", rfis);
}

export async function getRFIs(): Promise<RFI[]> {
	return getSafeStorage<RFI[]>("rfis", []);
}

export async function deleteRFI(id: string): Promise<void> {
	const rfis = await getRFIs();
	await setSafeStorage("rfis", rfis.filter((r) => r.id !== id));
}

// Defects storage
export async function saveDefect(defect: Defect): Promise<void> {
	const defects = await getSafeStorage<Defect[]>("defects", []);
	const index = defects.findIndex((d) => d.id === defect.id);
	if (index >= 0) {
		defects[index] = defect;
	} else {
		defects.push(defect);
	}
	await setSafeStorage("defects", defects);
}

export async function getDefects(): Promise<Defect[]> {
	return getSafeStorage<Defect[]>("defects", []);
}

export async function deleteDefect(id: string): Promise<void> {
	const defects = await getDefects();
	await setSafeStorage("defects", defects.filter((d) => d.id !== id));
}

// Photos storage
export async function savePhoto(photo: Photo): Promise<void> {
	const photos = await getSafeStorage<Photo[]>("photos", []);
	const index = photos.findIndex((p) => p.id === photo.id);
	if (index >= 0) {
		photos[index] = photo;
	} else {
		photos.push(photo);
	}
	await setSafeStorage("photos", photos);
}

export async function getPhotos(): Promise<Photo[]> {
	return getSafeStorage<Photo[]>("photos", []);
}

export async function deletePhoto(id: string): Promise<void> {
	const photos = await getPhotos();
	await setSafeStorage("photos", photos.filter((p) => p.id !== id));
}
