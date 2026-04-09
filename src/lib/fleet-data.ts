export type FleetVehicleStatus = "In Use" | "Available" | "Maintenance" | "Reserved";

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

export const FLEET_STORAGE_KEY = "kbm_fleet_vehicles";

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

export function createNextFleetVehicleId(vehicles: FleetVehicle[]): string {
	const maxId = vehicles.reduce((currentMax, vehicle) => {
		const parsed = Number(vehicle.id.replace("VH-", ""));
		return Number.isFinite(parsed) ? Math.max(currentMax, parsed) : currentMax;
	}, 0);

	return `VH-${String(maxId + 1).padStart(3, "0")}`;
}
