// Additional construction-specific data models

// Plant Booking
export interface PlantBooking {
	id: string;
	equipment: string;
	registration?: string;
	project: string;
	requestedBy: string;
	startDate: string;
	endDate: string;
	status: "requested" | "confirmed" | "on-hire" | "returned" | "cancelled";
	hireCompany?: string;
	dailyRate?: number;
	deliveryAddress?: string;
	notes?: string;
	createdAt: string;
}

// Material Reconciliation
export interface MaterialReconciliation {
	id: string;
	project: string;
	material: string;
	unit: string;
	ordered: number;
	delivered: number;
	used: number;
	wasted: number;
	remaining: number;
	reconciliationDate: string;
	notes?: string;
}

// Weather Log
export interface WeatherLog {
	id: string;
	date: string;
	project: string;
	condition: string;
	temperature: number;
	windSpeed: string;
	rainfall: string;
	workingConditions: "good" | "acceptable" | "poor" | "stopped";
	impact: string;
	loggedBy: string;
}

// As-Built Drawings
export interface AsBuiltDrawing {
	id: string;
	project: string;
	drawingNumber: string;
	title: string;
	discipline: string;
	revisionNumber: string;
	issueDate: string;
	changesDescription: string;
	status: "draft" | "for-review" | "approved" | "superseded";
	redlineMarkup?: string;
	issuedBy: string;
	approvedBy?: string;
}

// Handover Documentation
export interface HandoverDocument {
	id: string;
	project: string;
	documentType: "O&M Manual" | "Warranty" | "Test Certificate" | "As-Built" | "Compliance Cert" | "Other";
	title: string;
	status: "required" | "in-progress" | "review" | "approved" | "handed-over";
	dueDate: string;
	completedDate?: string;
	responsiblePerson: string;
	location?: string;
	notes?: string;
}

// Lessons Learned
export interface LessonLearned {
	id: string;
	project: string;
	category: "technical" | "safety" | "quality" | "commercial" | "programme" | "management";
	title: string;
	description: string;
	whatWentWell?: string;
	challenge?: string;
	solution?: string;
	recommendation: string;
	submittedBy: string;
	date: string;
	tags?: string[];
}

export const PLANT_TYPES = [
	"Excavator (360°)",
	"Excavator (180°)",
	"Mini Digger",
	"Dumper truck",
	"Roller",
	"Plate compactor",
	"Telehandler",
	"Mobile crane",
	"Concrete pump",
	"Paver",
	"Road planer",
	"Sweeper",
	"Bowser",
];

export const MATERIAL_UNITS = ["t", "m³", "m",  "m²", "nr", "loads"];

export const WEATHER_CONDITIONS = [
	"Clear/Sunny",
	"Partly Cloudy",
	"Overcast",
	"Light Rain",
	"Heavy Rain",
	"Snow",
	"Fog",
	"Windy",
	"Stormy",
];

export const DRAWING_DISCIPLINES = [
	"Architectural",
	"Structural",
	"Civil",
	"Drainage",
	"Highways",
	"M&E",
	"Landscaping",
	"General Arrangement",
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

// Plant Booking storage
export async function savePlantBooking(booking: PlantBooking): Promise<void> {
	const bookings = await getSafeStorage<PlantBooking[]>("plantBookings", []);
	const index = bookings.findIndex((b) => b.id === booking.id);
	if (index >= 0) {
		bookings[index] = booking;
	} else {
		bookings.push(booking);
	}
	await setSafeStorage("plantBookings", bookings);
}

export async function getPlantBookings(): Promise<PlantBooking[]> {
	return getSafeStorage<PlantBooking[]>("plantBookings", []);
}

export async function deletePlantBooking(id: string): Promise<void> {
	const bookings = await getPlantBookings();
	await setSafeStorage("plantBookings", bookings.filter((b) => b.id !== id));
}

// Material Reconciliation storage
export async function saveMaterialReconciliation(rec: MaterialReconciliation): Promise<void> {
	const recs = await getSafeStorage<MaterialReconciliation[]>("materialReconciliations", []);
	const index = recs.findIndex((r) => r.id === rec.id);
	if (index >= 0) {
		recs[index] = rec;
	} else {
		recs.push(rec);
	}
	await setSafeStorage("materialReconciliations", recs);
}

export async function getMaterialReconciliations(): Promise<MaterialReconciliation[]> {
	return getSafeStorage<MaterialReconciliation[]>("materialReconciliations", []);
}

export async function deleteMaterialReconciliation(id: string): Promise<void> {
	const recs = await getMaterialReconciliations();
	await setSafeStorage("materialReconciliations", recs.filter((r) => r.id !== id));
}

// Weather Log storage
export async function saveWeatherLog(log: WeatherLog): Promise<void> {
	const logs = await getSafeStorage<WeatherLog[]>("weatherLogs", []);
	const index = logs.findIndex((l) => l.id === log.id);
	if (index >= 0) {
		logs[index] = log;
	} else {
		logs.push(log);
	}
	await setSafeStorage("weatherLogs", logs);
}

export async function getWeatherLogs(): Promise<WeatherLog[]> {
	return getSafeStorage<WeatherLog[]>("weatherLogs", []);
}

export async function deleteWeatherLog(id: string): Promise<void> {
	const logs = await getWeatherLogs();
	await setSafeStorage("weatherLogs", logs.filter((l) => l.id !== id));
}

// As-Built Drawings storage
export async function saveAsBuiltDrawing(drawing: AsBuiltDrawing): Promise<void> {
	const drawings = await getSafeStorage<AsBuiltDrawing[]>("asBuiltDrawings", []);
	const index = drawings.findIndex((d) => d.id === drawing.id);
	if (index >= 0) {
		drawings[index] = drawing;
	} else {
		drawings.push(drawing);
	}
	await setSafeStorage("asBuiltDrawings", drawings);
}

export async function getAsBuiltDrawings(): Promise<AsBuiltDrawing[]> {
	return getSafeStorage<AsBuiltDrawing[]>("asBuiltDrawings", []);
}

export async function deleteAsBuiltDrawing(id: string): Promise<void> {
	const drawings = await getAsBuiltDrawings();
	await setSafeStorage("asBuiltDrawings", drawings.filter((d) => d.id !== id));
}

// Handover Documentation storage
export async function saveHandoverDocument(doc: HandoverDocument): Promise<void> {
	const docs = await getSafeStorage<HandoverDocument[]>("handoverDocuments", []);
	const index = docs.findIndex((d) => d.id === doc.id);
	if (index >= 0) {
		docs[index] = doc;
	} else {
		docs.push(doc);
	}
	await setSafeStorage("handoverDocuments", docs);
}

export async function getHandoverDocuments(): Promise<HandoverDocument[]> {
	return getSafeStorage<HandoverDocument[]>("handoverDocuments", []);
}

export async function deleteHandoverDocument(id: string): Promise<void> {
	const docs = await getHandoverDocuments();
	await setSafeStorage("handoverDocuments", docs.filter((d) => d.id !== id));
}

// Lessons Learned storage
export async function saveLessonLearned(lesson: LessonLearned): Promise<void> {
	const lessons = await getSafeStorage<LessonLearned[]>("lessonsLearned", []);
	const index = lessons.findIndex((l) => l.id === lesson.id);
	if (index >= 0) {
		lessons[index] = lesson;
	} else {
		lessons.push(lesson);
	}
	await setSafeStorage("lessonsLearned", lessons);
}

export async function getLessonsLearned(): Promise<LessonLearned[]> {
	return getSafeStorage<LessonLearned[]>("lessonsLearned", []);
}

export async function deleteLessonLearned(id: string): Promise<void> {
	const lessons = await getLessonsLearned();
	await setSafeStorage("lessonsLearned", lessons.filter((l) => l.id !== id));
}
