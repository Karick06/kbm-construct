export interface SiteDiaryEntry {
	id: string;
	date: string; // ISO date string
	project: string;
	weather: {
		condition: string; // "Sunny", "Rainy", "Overcast", etc.
		temperature: string;
		windSpeed?: string;
	};
	labourOnSite: {
		company: string;
		trade: string;
		count: number;
	}[];
	plantOnSite: {
		type: string;
		quantity: number;
		operator?: string;
	}[];
	visitors: {
		name: string;
		company: string;
		purpose: string;
		timeIn: string;
		timeOut?: string;
	}[];
	workCompleted: string; // Free text description
	issuesDelays: string; // Free text description
	healthSafety: {
		toolboxTalk?: string;
		incidents?: string;
		nearMisses?: string;
	};
	materialDeliveries: {
		supplier: string;
		description: string;
		quantity: string;
		deliveryNote?: string;
	}[];
	photos: string[]; // Photo URLs or IDs
	notes: string;
	createdBy: string;
	lastModified: string;
}

export const WEATHER_CONDITIONS = [
	"Clear/Sunny",
	"Partly Cloudy",
	"Overcast",
	"Light Rain",
	"Heavy Rain",
	"Drizzle",
	"Snow",
	"Fog/Mist",
	"Windy",
	"Stormy",
] as const;

export const COMMON_TRADES = [
	"Site Management",
	"General Labourers",
	"Groundworkers",
	"Steelfixers",
	"Concreters",
	"Formwork Carpenters",
	"Bricklayers",
	"Drainage Gangs",
	"Road Workers",
	"Plant Operators",
	"Electricians",
	"Subcontractors",
] as const;

export const COMMON_PLANT = [
	"Excavator (360deg)",
	"Excavator (180deg)",
	"Dumper",
	"Roller",
	"Telehandler",
	"Crane",
	"Paver",
	"Concrete Pump",
	"Bowser/Water Tanker",
	"Welfare Unit",
] as const;

export function createSiteDiaryEntry(
	data: Partial<SiteDiaryEntry>
): SiteDiaryEntry {
	const now = new Date().toISOString();
	return {
		id: data.id || `DIARY-${Date.now()}`,
		date: data.date || new Date().toISOString().split("T")[0],
		project: data.project || "",
		weather: data.weather || {
			condition: "Clear/Sunny",
			temperature: "",
		},
		labourOnSite: data.labourOnSite || [],
		plantOnSite: data.plantOnSite || [],
		visitors: data.visitors || [],
		workCompleted: data.workCompleted || "",
		issuesDelays: data.issuesDelays || "",
		healthSafety: data.healthSafety || {},
		materialDeliveries: data.materialDeliveries || [],
		photos: data.photos || [],
		notes: data.notes || "",
		createdBy: data.createdBy || "Current User",
		lastModified: data.lastModified || now,
	};
}

// API storage functions
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

export async function saveSiteDiaryEntry(
	entry: SiteDiaryEntry
): Promise<void> {
	const entries = await getSiteDiaryEntries();
	const index = entries.findIndex((e) => e.id === entry.id);
	if (index >= 0) {
		entries[index] = { ...entry, lastModified: new Date().toISOString() };
	} else {
		entries.push(entry);
	}
	await setSafeStorage("siteDiaryEntries", entries);
}

export async function getSiteDiaryEntries(): Promise<SiteDiaryEntry[]> {
	return getSafeStorage<SiteDiaryEntry[]>("siteDiaryEntries", []);
}

export async function deleteSiteDiaryEntry(id: string): Promise<void> {
	const entries = await getSiteDiaryEntries();
	const filtered = entries.filter((e) => e.id !== id);
	await setSafeStorage("siteDiaryEntries", filtered);
}
