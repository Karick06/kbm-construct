export type FleetVehicleStatus = "In Use" | "Available" | "Maintenance" | "Reserved";

export type FleetAssetStatus = FleetVehicleStatus;

export type FleetVehicle = {
	id: string;
	reg: string;
	brand: string;
	model: string;
	type: string;
	status: FleetVehicleStatus;
	allocated: string;
	mileage: string;
	nextService: string;
};

export type PlantAsset = {
	id: string;
	assetNumber: string;
	name: string;
	type: string;
	status: FleetAssetStatus;
	allocated: string;
	nextService: string;
	value: number;
};

export type ToolAsset = {
	id: string;
	assetNumber: string;
	name: string;
	type: string;
	status: FleetAssetStatus;
	allocated: string;
	nextService: string;
	value: number;
};

export const VEHICLE_TYPE_OPTIONS = [
	"Small Car",
	"Saloon Car",
	"Estate Car",
	"SUV / 4x4",
	"Panel Van",
	"Crew Van",
	"Pickup",
	"Minibus",
	"Rigid Lorry",
	"Articulated Lorry",
	"Specialist HGV",
] as const;

export const PLANT_TYPE_OPTIONS = [
	"Mini Excavator",
	"Tracked Excavator",
	"Ride-on Roller",
	"Telehandler",
	"Tipper",
	"Skid Steer",
	"Road Sweeper",
	"Asphalt Paver",
	"Planer",
] as const;

export const TOOL_TYPE_OPTIONS = [
	"Wacker Plate",
	"Breaker",
	"Cut-off Saw",
	"Floor Saw",
	"Laser Level",
	"Compactor",
	"Concrete Mixer",
	"Generator",
	"Pump",
] as const;

export const FLEET_STATUS_OPTIONS: FleetVehicleStatus[] = ["Available", "In Use", "Maintenance", "Reserved"];

export const DEFAULT_FLEET_VEHICLES: FleetVehicle[] = [
	{
		id: "VH-001",
		reg: "TS24 KBM",
		brand: "Ford",
		model: "Transit",
		type: "Panel Van",
		status: "In Use",
		allocated: "Thames Site",
		mileage: "45,230",
		nextService: "2026-02-18",
	},
	{
		id: "VH-002",
		reg: "TS24 OPS",
		brand: "Ford",
		model: "Transit",
		type: "Panel Van",
		status: "In Use",
		allocated: "Premier Site",
		mileage: "32,450",
		nextService: "2026-02-25",
	},
	{
		id: "VH-003",
		reg: "TS24 BDV",
		brand: "BMW",
		model: "X3",
		type: "SUV / 4x4",
		status: "Available",
		allocated: "Unallocated",
		mileage: "28,120",
		nextService: "2026-03-10",
	},
	{
		id: "VH-004",
		reg: "TS24 MGT",
		brand: "BMW",
		model: "3 Series",
		type: "Saloon Car",
		status: "In Use",
		allocated: "HQ",
		mileage: "12,340",
		nextService: "2026-02-20",
	},
];

export const DEFAULT_PLANT_ASSETS: PlantAsset[] = [
	{
		id: "PL-001",
		assetNumber: "PL-001",
		name: "Kubota KX080",
		type: "Mini Excavator",
		status: "In Use",
		allocated: "Thames Site",
		nextService: "2026-04-22",
		value: 58000,
	},
	{
		id: "PL-002",
		assetNumber: "PL-002",
		name: "Bomag BW120",
		type: "Ride-on Roller",
		status: "Available",
		allocated: "Depot",
		nextService: "2026-05-10",
		value: 46000,
	},
	{
		id: "PL-003",
		assetNumber: "PL-003",
		name: "JCB 535-95",
		type: "Telehandler",
		status: "Maintenance",
		allocated: "Workshop",
		nextService: "2026-04-14",
		value: 71000,
	},
];

export const DEFAULT_TOOL_ASSETS: ToolAsset[] = [
	{
		id: "TL-001",
		assetNumber: "TL-001",
		name: "Wacker Neuson DPU6555",
		type: "Compactor",
		status: "In Use",
		allocated: "Premier Site",
		nextService: "2026-06-01",
		value: 7600,
	},
	{
		id: "TL-002",
		assetNumber: "TL-002",
		name: "Husqvarna K770",
		type: "Cut-off Saw",
		status: "Available",
		allocated: "Depot",
		nextService: "2026-05-02",
		value: 1200,
	},
	{
		id: "TL-003",
		assetNumber: "TL-003",
		name: "Belle Plate Compactor",
		type: "Wacker Plate",
		status: "Reserved",
		allocated: "A13 Resurfacing",
		nextService: "2026-04-30",
		value: 1800,
	},
];

export const FLEET_STORAGE_KEY = "kbm_fleet_vehicles";
export const PLANT_STORAGE_KEY = "kbm_plant_assets";
export const TOOL_STORAGE_KEY = "kbm_tool_assets";

function safeParseFleetVehicles(raw: string | null): FleetVehicle[] {
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((entry) => ({
				id: typeof entry?.id === "string" ? entry.id : "",
				reg: typeof entry?.reg === "string" ? entry.reg : "",
				brand: typeof entry?.brand === "string" ? entry.brand : "",
				model: typeof entry?.model === "string" ? entry.model : "",
				type: typeof entry?.type === "string" ? entry.type : "",
				status: (entry?.status as FleetVehicleStatus) || "Available",
				allocated: typeof entry?.allocated === "string" ? entry.allocated : "Unallocated",
				mileage: typeof entry?.mileage === "string" ? entry.mileage : "0",
				nextService: typeof entry?.nextService === "string" ? entry.nextService : "TBC",
			}))
			.filter((entry) => entry.id && entry.reg && entry.type);
	} catch {
		return [];
	}
}

function safeParsePlantAssets(raw: string | null): PlantAsset[] {
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((entry) => ({
				id: typeof entry?.id === "string" ? entry.id : "",
				assetNumber: typeof entry?.assetNumber === "string" ? entry.assetNumber : (typeof entry?.id === "string" ? entry.id : ""),
				name: typeof entry?.name === "string" ? entry.name : "",
				type: typeof entry?.type === "string" ? entry.type : "",
				status: (entry?.status as FleetAssetStatus) || "Available",
				allocated: typeof entry?.allocated === "string" ? entry.allocated : "Unallocated",
				nextService: typeof entry?.nextService === "string" ? entry.nextService : "TBC",
				value: typeof entry?.value === "number" ? entry.value : 0,
			}))
			.filter((entry) => entry.id && entry.name && entry.type);
	} catch {
		return [];
	}
}

function safeParseToolAssets(raw: string | null): ToolAsset[] {
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((entry) => ({
				id: typeof entry?.id === "string" ? entry.id : "",
				assetNumber: typeof entry?.assetNumber === "string" ? entry.assetNumber : (typeof entry?.id === "string" ? entry.id : ""),
				name: typeof entry?.name === "string" ? entry.name : "",
				type: typeof entry?.type === "string" ? entry.type : "",
				status: (entry?.status as FleetAssetStatus) || "Available",
				allocated: typeof entry?.allocated === "string" ? entry.allocated : "Unallocated",
				nextService: typeof entry?.nextService === "string" ? entry.nextService : "TBC",
				value: typeof entry?.value === "number" ? entry.value : 0,
			}))
			.filter((entry) => entry.id && entry.name && entry.type);
	} catch {
		return [];
	}
}

export function getFleetVehiclesFromStorage(): FleetVehicle[] {
	if (typeof window === "undefined") return DEFAULT_FLEET_VEHICLES;

	const parsed = safeParseFleetVehicles(window.localStorage.getItem(FLEET_STORAGE_KEY));
	if (parsed.length > 0) return parsed;

	window.localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(DEFAULT_FLEET_VEHICLES));
	return DEFAULT_FLEET_VEHICLES;
}

export function saveFleetVehiclesToStorage(vehicles: FleetVehicle[]): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(FLEET_STORAGE_KEY, JSON.stringify(vehicles));
}

export function getPlantAssetsFromStorage(): PlantAsset[] {
	if (typeof window === "undefined") return DEFAULT_PLANT_ASSETS;

	const parsed = safeParsePlantAssets(window.localStorage.getItem(PLANT_STORAGE_KEY));
	if (parsed.length > 0) return parsed;

	window.localStorage.setItem(PLANT_STORAGE_KEY, JSON.stringify(DEFAULT_PLANT_ASSETS));
	return DEFAULT_PLANT_ASSETS;
}

export function savePlantAssetsToStorage(assets: PlantAsset[]): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(PLANT_STORAGE_KEY, JSON.stringify(assets));
}

export function getToolAssetsFromStorage(): ToolAsset[] {
	if (typeof window === "undefined") return DEFAULT_TOOL_ASSETS;

	const parsed = safeParseToolAssets(window.localStorage.getItem(TOOL_STORAGE_KEY));
	if (parsed.length > 0) return parsed;

	window.localStorage.setItem(TOOL_STORAGE_KEY, JSON.stringify(DEFAULT_TOOL_ASSETS));
	return DEFAULT_TOOL_ASSETS;
}

export function saveToolAssetsToStorage(assets: ToolAsset[]): void {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(TOOL_STORAGE_KEY, JSON.stringify(assets));
}

export function createNextFleetVehicleId(vehicles: FleetVehicle[]): string {
	const maxId = vehicles.reduce((currentMax, vehicle) => {
		const parsed = Number(vehicle.id.replace("VH-", ""));
		return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
	}, 0);

	return `VH-${String(maxId + 1).padStart(3, "0")}`;
}

export function createNextPlantId(assets: PlantAsset[]): string {
	const maxId = assets.reduce((currentMax, asset) => {
		const parsed = Number(asset.id.replace("PL-", ""));
		return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
	}, 0);

	return `PL-${String(maxId + 1).padStart(3, "0")}`;
}

export function createNextToolId(assets: ToolAsset[]): string {
	const maxId = assets.reduce((currentMax, asset) => {
		const parsed = Number(asset.id.replace("TL-", ""));
		return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
	}, 0);

	return `TL-${String(maxId + 1).padStart(3, "0")}`;
}
