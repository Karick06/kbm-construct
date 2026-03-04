export interface InspectionCheckItem {
	id: string;
	description: string;
	requirement: string;
	status: "pass" | "fail" | "n/a" | "pending";
	notes?: string;
	measuredValue?: string;
	photo?: string;
}

export interface QualityInspection {
	id: string;
	inspectionType: InspectionType;
	project: string;
	location: string;
	date: string;
	inspector: string;
	contractor?: string;
	tradePackage: string;
	overallStatus: "pass" | "fail" | "conditional" | "pending";
	checkItems: InspectionCheckItem[];
	generalNotes: string;
	correctiveActions?: string;
	reinspectionRequired: boolean;
	reinspectionDate?: string;
	approvedBy?: string;
	approvalDate?: string;
	attachments: string[];
	createdAt: string;
	updatedAt: string;
}

export type InspectionType =
	| "ITP - Hold Point"
	| "ITP - Witness Point"
	| "ITP - Surveillance"
	| "Concrete Pour"
	| "Reinforcement"
	| "Formwork"
	| "Excavation"
	| "Compaction Testing"
	| "Material Receiving"
	| "Final Inspection"
	| "Pre-handover Inspection"
	| "Drainage Installation"
	| "Road Construction"
	| "Kerbing & Paving"
	| "As-Built Verification";

export const INSPECTION_TYPES: InspectionType[] = [
	"ITP - Hold Point",
	"ITP - Witness Point",
	"ITP - Surveillance",
	"Concrete Pour",
	"Reinforcement",
	"Formwork",
	"Excavation",
	"Compaction Testing",
	"Material Receiving",
	"Final Inspection",
	"Pre-handover Inspection",
	"Drainage Installation",
	"Road Construction",
	"Kerbing & Paving",
	"As-Built Verification",
];

// Inspection templates with predefined check items
export const INSPECTION_TEMPLATES: Record<
	InspectionType,
	Partial<InspectionCheckItem>[]
> = {
	"ITP - Hold Point": [
		{
			description: "Design requirements confirmed",
			requirement: "All design drawings and specifications reviewed",
		},
		{
			description: "Materials approved and verified",
			requirement: "Material test certificates and approvals obtained",
		},
		{
			description: "Method statement approved",
			requirement: "Construction methodology reviewed and signed off",
		},
	],
	"ITP - Witness Point": [
		{
			description: "Client/Engineer notified",
			requirement: "Minimum 24hr notice provided",
		},
		{
			description: "Work ready for inspection",
			requirement: "All preparatory work complete",
		},
	],
	"ITP - Surveillance": [
		{
			description: "Work proceeding per approved method",
			requirement: "Compliance with method statement",
		},
		{
			description: "Quality controls in place",
			requirement: "QA/QC procedures being followed",
		},
	],
	"Concrete Pour": [
		{
			description: "Concrete delivery tickets checked",
			requirement: "Mix design, slump, temperature recorded",
		},
		{
			description: "Formwork clean and approved",
			requirement: "Free from debris, release agent applied",
		},
		{
			description: "Reinforcement fixed and approved",
			requirement: "Cover, spacing, laps per design",
		},
		{
			description: "Concrete samples taken",
			requirement: "Cubes/cylinders for 7/28 day testing",
		},
		{
			description: "Vibration and finishing adequate",
			requirement: "No segregation, honeycombing, or surface defects",
		},
		{
			description: "Curing regime commenced",
			requirement: "Protection/sheeting/curing compound applied",
		},
	],
	Reinforcement: [
		{
			description: "Bar marks verified against schedule",
			requirement: "Correct bars in correct locations",
		},
		{
			description: "Cover requirements met",
			requirement: "Spacers/chairs at required intervals",
		},
		{
			description: "Lap lengths correct",
			requirement: "Per design specification",
		},
		{
			description: "Tie wire secure",
			requirement: "All intersections tied, no movement",
		},
		{
			description: "Cleanliness",
			requirement: "Free from rust scale, mud, oil",
		},
	],
	Formwork: [
		{
			description: "Formwork alignment checked",
			requirement: "Correct line and level, tolerance met",
		},
		{
			description: "Props and bracing adequate",
			requirement: "Temporary works design followed",
		},
		{
			description: "Joints tight",
			requirement: "No gaps for grout loss",
		},
		{
			description: "Release agent applied",
			requirement: "Even coverage, no pooling",
		},
	],
	Excavation: [
		{
			description: "Excavation to correct depth",
			requirement: "TBM levels verified, tolerance within ±25mm",
		},
		{
			description: "Formation clean and stable",
			requirement: "No soft spots, pumping, or contamination",
		},
		{
			description: "Services identified and protected",
			requirement: "All utilities marked and safe",
		},
		{
			description: "Temporary works approved",
			requirement: "Shoring/batters per design",
		},
	],
	"Compaction Testing": [
		{
			description: "Nuclear density gauge calibration valid",
			requirement: "Within calibration date",
		},
		{
			description: "Compaction achieved",
			requirement: "Min 95% MDD (or as specified)",
		},
		{
			description: "Moisture content acceptable",
			requirement: "Within ±2% of OMC",
		},
		{
			description: "Layer thickness correct",
			requirement: "Per specification (typically 150-225mm)",
		},
	],
	"Material Receiving": [
		{
			description: "Delivery note matches order",
			requirement: "Quantity, description, specification correct",
		},
		{
			description: "Material certificates provided",
			requirement: "Test certs, CE marks, COSHH as applicable",
		},
		{
			description: "Condition on arrival",
			requirement: "Undamaged, clean, fit for purpose",
		},
		{
			description: "Storage appropriate",
			requirement: "Protected from weather/contamination",
		},
	],
	"Final Inspection": [
		{
			description: "All work complete per design",
			requirement: "No outstanding works",
		},
		{
			description: "Snagging items cleared",
			requirement: "Defects list resolved",
		},
		{
			description: "As-built drawings provided",
			requirement: "Red-line markup complete",
		},
		{
			description: "Test results acceptable",
			requirement: "All tests passed and filed",
		},
	],
	"Pre-handover Inspection": [
		{
			description: "Site clean and tidy",
			requirement: "Rubbish removed, area swept",
		},
		{
			description: "Statutory inspections complete",
			requirement: "Building control, warranties, etc.",
		},
		{
			description: "O&M manuals prepared",
			requirement: "Handover documentation ready",
		},
	],
	"Drainage Installation": [
		{
			description: "Gradient verified",
			requirement: "Falls per design (typically min 1:40)",
		},
		{
			description: "Bedding and surround correct",
			requirement: "Material type and compaction level met",
		},
		{
			description: "Joints watertight",
			requirement: "Correctly assembled, no gaps",
		},
		{
			description: "CCTV survey passed",
			requirement: "No defects, clear line",
		},
	],
	"Road Construction": [
		{
			description: "Subgrade CBR acceptable",
			requirement: "Min CBR value achieved",
		},
		{
			description: "Layer thicknesses verified",
			requirement: "Capping, subbase, base per design",
		},
		{
			description: "Surface regularity within tolerance",
			requirement: "3m straightedge test passed",
		},
		{
			description: "Compaction results satisfactory",
			requirement: "All tests meet specification",
		},
	],
	"Kerbing & Paving": [
		{
			description: "Line and level correct",
			requirement: "Per setting out, tolerance within ±10mm",
		},
		{
			description: "Joints uniform",
			requirement: "3-5mm width, consistent",
		},
		{
			description: "Bedding adequate",
			requirement: "Full support, no voids",
		},
		{
			description: "No damage or defects",
			requirement: "Units sound, clean, properly laid",
		},
	],
	"As-Built Verification": [
		{
			description: "As-built measurements taken",
			requirement: "Survey data recorded",
		},
		{
			description: "Deviations from design documented",
			requirement: "All changes noted and approved",
		},
		{
			description: "Drawings updated",
			requirement: "Red-line markup complete and clear",
		},
	],
};

export function createQualityInspection(
	data: Partial<QualityInspection>
): QualityInspection {
	const now = new Date().toISOString();
	const template = data.inspectionType
		? INSPECTION_TEMPLATES[data.inspectionType]
		: [];

	const checkItems: InspectionCheckItem[] =
		data.checkItems ||
		template.map((item, idx) => ({
			id: `CHECK-${idx}`,
			description: item.description || "",
			requirement: item.requirement || "",
			status: "pending" as const,
			notes: item.notes,
		}));

	return {
		id: data.id || `INSPECT-${Date.now()}`,
		inspectionType: data.inspectionType || "ITP - Surveillance",
		project: data.project || "",
		location: data.location || "",
		date: data.date || new Date().toISOString().split("T")[0],
		inspector: data.inspector || "",
		contractor: data.contractor,
		tradePackage: data.tradePackage || "",
		overallStatus: data.overallStatus || "pending",
		checkItems,
		generalNotes: data.generalNotes || "",
		correctiveActions: data.correctiveActions,
		reinspectionRequired: data.reinspectionRequired || false,
		reinspectionDate: data.reinspectionDate,
		approvedBy: data.approvedBy,
		approvalDate: data.approvalDate,
		attachments: data.attachments || [],
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

export async function saveQualityInspection(
	inspection: QualityInspection
): Promise<void> {
	const inspections = await getQualityInspections();
	const index = inspections.findIndex((i) => i.id === inspection.id);
	if (index >= 0) {
		inspections[index] = {
			...inspection,
			updatedAt: new Date().toISOString(),
		};
	} else {
		inspections.push(inspection);
	}
	await setSafeStorage("qualityInspections", inspections);
}

export async function getQualityInspections(): Promise<QualityInspection[]> {
	return getSafeStorage<QualityInspection[]>("qualityInspections", []);
}

export async function deleteQualityInspection(id: string): Promise<void> {
	const inspections = await getQualityInspections();
	const filtered = inspections.filter((i) => i.id !== id);
	await setSafeStorage("qualityInspections", filtered);
}
