/**
 * Seed data utility for development/testing
 * Run this in the browser console to populate modules with sample data
 */

// Helper functions for localStorage
async function getSafeStorage<T>(key: string, fallback: T): Promise<T> {
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : fallback;
	} catch (error) {
		console.warn(`Failed to read from localStorage key "${key}":`, error);
		return fallback;
	}
}

async function setSafeStorage(key: string, value: unknown): Promise<void> {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error("Failed to save to localStorage:", error);
	}
}

export async function seedAllModules() {
	// RFIs
	await setSafeStorage("rfis", [
		{
			id: "RFI-001",
			rfiNumber: "RFI-0001",
			project: "Riverside Development",
			subject: "Foundation depth clarification",
			discipline: "Structural",
			question: "Please clarify the foundation depth for grid lines A1-A5. Drawing shows 2.5m but spec says 3.0m.",
			priority: "high",
			raisedBy: "John Smith",
			raisedDate: "2026-02-15",
			responseRequired: "2026-02-22",
			status: "answered",
			response: "Foundation depth should be 3.0m as per specification. Drawing will be revised.",
			respondedBy: "Sarah Chen",
			respondedDate: "2026-02-20",
		},
		{
			id: "RFI-002",
			rfiNumber: "RFI-0002",
			project: "City Centre Tower",
			subject: "MEP equipment location",
			discipline: "MEP",
			question: "Proposed location for main electrical panel conflicts with architectural layout.",
			priority: "urgent",
			raisedBy: "Mike Johnson",
			raisedDate: "2026-03-01",
			responseRequired: "2026-03-05",
			status: "open",
		},
	]);

	// Defects
	await setSafeStorage("defects", [
		{
			id: "DEF-001",
			defectNumber: "DEF-0001",
			project: "Riverside Development",
			location: "Block A - Level 3",
			description: "Concrete honeycombing visible on column C3",
			severity: "major",
			status: "in-progress",
			trade: "Concrete",
			raisedBy: "Quality Inspector",
			raisedDate: "2026-02-28",
			assignedTo: "Main Contractor",
			targetDate: "2026-03-10",
		},
		{
			id: "DEF-002",
			defectNumber: "DEF-0002",
			project: "City Centre Tower",
			location: "Basement - Car Park",
			description: "Waterproofing membrane damage near joint",
			severity: "critical",
			status: "open",
			trade: "Waterproofing",
			raisedBy: "Site Engineer",
			raisedDate: "2026-03-02",
			assignedTo: "Specialist Subcontractor",
			targetDate: "2026-03-08",
		},
	]);

	// Photos
	await setSafeStorage("photos", [
		{
			id: "PHOTO-001",
			project: "Riverside Development",
			location: "Block A - Foundation",
			category: "progress",
			date: "2026-02-20",
			url: "https://placeholder.com/600x400",
			description: "Foundation excavation complete, ready for steel fixing",
			tags: ["excavation", "foundation", "stage-1"],
			createdAt: "2026-02-20T10:30:00Z",
		},
		{
			id: "PHOTO-002",
			project: "City Centre Tower",
			location: "Level 5 - Slab",
			category: "quality",
			date: "2026-03-01",
			url: "https://placeholder.com/600x400",
			description: "Concrete pour quality check",
			tags: ["concrete", "quality", "slab"],
			createdAt: "2026-03-01T14:15:00Z",
		},
	]);

	// Plant Booking
	await setSafeStorage("plantBookings", [
		{
			id: "PB-001",
			equipmentType: "Tower Crane",
			supplier: "ABC Plant Hire",
			project: "City Centre Tower",
			startDate: "2026-03-05",
			endDate: "2026-06-30",
			quantity: 1,
			rate: 2500,
			status: "confirmed",
			operator: "Licensed Operator Included",
			deliveryDate: "2026-03-04",
		},
		{
			id: "PB-002",
			equipmentType: "Excavator",
			supplier: "Heavy Plant Ltd",
			project: "Riverside Development",
			startDate: "2026-03-10",
			endDate: "2026-03-20",
			quantity: 2,
			rate: 450,
			status: "requested",
			operator: "Client to provide",
		},
	]);

	// Material Reconciliation
	await setSafeStorage("materialReconciliations", [
		{
			id: "MR-001",
			date: "2026-03-01",
			project: "Riverside Development",
			materialCode: "CON-C40-01",
			materialDescription: "C40 Concrete",
			ordered: 150,
			delivered: 145,
			used: 142,
			unit: "m³",
			wastagePercent: 2.1,
			notes: "Minor wastage within acceptable limits",
		},
		{
			id: "MR-002",
			date: "2026-03-02",
			project: "City Centre Tower",
			materialCode: "STL-R16-01",
			materialDescription: "16mm Rebar",
			ordered: 5000,
			delivered: 5000,
			used: 4850,
			unit: "kg",
			wastagePercent: 3.0,
			notes: "Some off-cuts saved for next phase",
		},
	]);

	// Weather Logging
	await setSafeStorage("weatherLogs", [
		{
			id: "WL-001",
			date: "2026-03-01",
			project: "Riverside Development",
			condition: "Sunny",
			temperature: 18,
			windSpeed: 15,
			rainfall: 0,
			workable: true,
			notes: "Perfect conditions for concrete pour",
		},
		{
			id: "WL-002",
			date: "2026-03-02",
			project: "City Centre Tower",
			condition: "Rain",
			temperature: 12,
			windSpeed: 25,
			rainfall: 8,
			workable: false,
			notes: "Work suspended due to heavy rain",
		},
	]);

	// Quality Inspections
	await setSafeStorage("qualityInspections", [
		{
			id: "QI-001",
			date: "2026-03-01",
			project: "Riverside Development",
			inspectionType: "concrete-pour",
			inspector: "John Smith",
			location: "Block A - Level 2 Slab",
			overallStatus: "pass",
			checkItems: [
				{
					id: "check-1",
					description: "Formwork alignment",
					specification: "±5mm tolerance",
					status: "pass",
					actualMeasurement: "2mm deviation",
					notes: "Within tolerance",
				},
				{
					id: "check-2",
					description: "Rebar spacing",
					specification: "200mm centers",
					status: "pass",
					actualMeasurement: "195-202mm",
					notes: "Acceptable",
				},
			],
			photos: [],
			signOffBy: "QA Manager",
			signOffDate: "2026-03-01",
		},
	]);

	// Permits to Work
	await setSafeStorage("permitsToWork", [
		{
			id: "PTW-001",
			permitNumber: "PTW-2026-001",
			permitType: "Hot Work",
			project: "City Centre Tower",
			location: "Level 3 - Steel Frame",
			activity: "Welding of structural steel connections",
			startDate: "2026-03-05",
			endDate: "2026-03-05",
			startTime: "08:00",
			endTime: "17:00",
			applicant: "Steel Erection Team",
			status: "approved",
			preconditions: [
				{
					id: "pre-1",
					description: "Fire extinguisher on site",
					completed: true,
					completedBy: "Safety Officer",
				},
				{
					id: "pre-2",
					description: "Hot work area isolated",
					completed: true,
					completedBy: "Site Supervisor",
				},
			],
			approvedBy: "HSE Manager",
			approvedDate: "2026-03-04",
		},
	]);

	// Toolbox Talks
	await setSafeStorage("toolBoxTalks", [
		{
			id: "TBT-001",
			date: "2026-03-01",
			project: "Riverside Development",
			topic: "Working at Height Safety",
			presenter: "Safety Officer - Mike Chen",
			duration: 20,
			keyPoints: [
				"Always use full body harness when above 2m",
				"Inspect equipment before each use",
				"Maintain 3 points of contact on ladders",
			],
			attendees: [
				{ name: "John Smith" },
				{ name: "Sarah Jones" },
				{ name: "Tom Wilson" },
				{ name: "Emma Brown" },
			],
			createdAt: "2026-03-01T07:30:00Z",
		},
		{
			id: "TBT-002",
			date: "2026-03-02",
			project: "City Centre Tower",
			topic: "Manual Handling Techniques",
			presenter: "HSE Coordinator",
			duration: 15,
			keyPoints: [
				"Assess the load before lifting",
				"Keep back straight, bend knees",
				"Use mechanical aids where possible",
			],
			attendees: [
				{ name: "David Lee" },
				{ name: "Lisa Chen" },
				{ name: "Mark Taylor" },
			],
			createdAt: "2026-03-02T07:30:00Z",
		},
	]);

	console.log("✅ Seed data loaded successfully!");
	console.log("📦 Modules populated:");
	console.log("  - RFIs (2 records)");
	console.log("  - Defects (2 records)");
	console.log("  - Photos (2 records)");
	console.log("  - Plant Booking (2 records)");
	console.log("  - Material Reconciliation (2 records)");
	console.log("  - Weather Logging (2 records)");
	console.log("  - Quality Inspections (1 record)");
	console.log("  - Permits to Work (1 record)");
	console.log("  - Toolbox Talks (2 records)");
	console.log("\n🔄 Refresh the page to see the data!");
}

// Check if data exists
export async function checkDataExists(): Promise<boolean> {
	try {
		const rfis = await getSafeStorage("rfis", []);
		return rfis.length > 0;
	} catch {
		return false;
	}
}
