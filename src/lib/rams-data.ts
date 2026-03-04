export type WorkType =
	| "Excavation & Groundworks"
	| "Earthworks Cut & Fill"
	| "Subbase & Capping Installation"
	| "Civils & Infrastructure Works"
	| "Tarmac / Asphalt Surfacing"
	| "Hand Laying Tarmac"
	| "Hand Laying Tarmac (Footway Reinstatement)"
	| "Hand Laying Tarmac (Carriageway Patching)"
	| "Road Planing / Milling"
	| "Binder Course Surfacing"
	| "Surface Course Surfacing"
	| "Concrete Works"
	| "Trench Fill Foundations"
	| "Pad Foundations"
	| "Piled Foundations"
	| "Mass Concrete Foundations"
	| "Steelfixing / Reinforcement"
	| "Drainage Installation"
	| "Deep Drainage & Manholes"
	| "Utility Ducting & Service Crossings"
	| "Kerbing & Edging Installation"
	| "Footway & Paving Construction"
	| "Road Markings & Street Furniture"
	| "Ironwork Raise & Reset"
	| "Brickwork & Blockwork"
	| "Drylining & Ceilings"
	| "Internal Fit-Out"
	| "Flooring Installation"
	| "Painting & Decorating"
	| "Steel Erection"
	| "Scaffolding"
	| "Roofing"
	| "Facade / Cladding Installation"
	| "Window & Curtain Wall Installation"
	| "Electrical Installation"
	| "MEP Services Installation"
	| "HVAC Installation"
	| "Fire Stopping & Passive Fire Protection"
	| "Traffic Management & Roadworks"
	| "Landscaping & External Works"
	| "Temporary Works Installation"
	| "Confined Space Entry"
	| "Hot Works (Welding/Cutting)"
	| "Demolition";

export type Tier1Profile = "Standard" | "Balfour Beatty" | "Skanska" | "Costain";

export type RiskLevel = "Low" | "Medium" | "High";

export interface RiskItem {
	hazard: string;
	initialRisk: RiskLevel;
	controls: string;
	residualRisk: RiskLevel;
}

export interface RAMSDocument {
	id: string;
	title: string;
	projectId?: string;
	projectName: string;
	projectManager?: string;
	projectPhase?: string;
	location: string;
	sitePostcode?: string;
	siteLat?: number;
	siteLon?: number;
	nearestHospitalName?: string;
	nearestHospitalAddress?: string;
	nearestHospitalDistanceKm?: number;
	nearestHospitalPhone?: string;
	hospitalLat?: number;
	hospitalLon?: number;
	workType: WorkType;
	workTypes?: WorkType[];
	author: string;
	approver?: string;
	issueDate: string;
	reviewDate?: string;
	tier1Profile?: Tier1Profile;
	revision: number;
	approvalStatus: "Draft" | "Pending Approval" | "Approved";
	ppeRequired: string[];
	plantEquipment: string[];
	riskAssessment: RiskItem[];
	methodStatementSteps: string[];
	emergencyProcedures: string[];
	environmentalControls: string[];
	permitsRequired: string[];
	createdDate: string;
	lastModifiedDate: string;
}

export interface RAMSTemplate {
	ppeRequired: string[];
	plantEquipment: string[];
	riskAssessment: RiskItem[];
	methodStatementSteps: string[];
	emergencyProcedures: string[];
	environmentalControls: string[];
	permitsRequired: string[];
}

const STORAGE_KEY = "kbm_rams_documents";

export const TIER1_PROFILE_REQUIREMENTS: Record<Tier1Profile, string[]> = {
	Standard: [
		"Project-specific hazards verified against latest drawings and constraints",
		"Competence records confirmed for all key operatives and supervisors",
		"Permits, emergency arrangements and environmental controls confirmed",
		"Task brief and point-of-work briefings planned and recorded",
	],
	"Balfour Beatty": [
		"Safe System of Work aligns with principal contractor permit process",
		"Temporary works checks and approvals referenced in method sequence",
		"Plant/people interface controls include physical segregation and marshals",
		"Environmental controls include spill, runoff, dust and nuisance monitoring",
		"Assurance evidence pack prepared (briefing sheets, inspections, competence)",
	],
	Skanska: [
		"Frontline hazard identification completed and linked to specific controls",
		"Critical risk controls clearly defined with supervision hold points",
		"Rescue and emergency arrangements tested and site-specific",
		"Supply chain competency and induction evidence available",
		"Quality inspection and testing points embedded in method statement",
	],
	Costain: [
		"Activity controls aligned to project risk register and constraints",
		"Traffic management and public protection controls fully documented",
		"High-risk permits and isolations identified with authorisation path",
		"Environmental compliance controls include waste traceability and incidents",
		"Digital assurance records identified for close-out and audit",
	],
};

const WORK_TYPE_TEMPLATES: Record<WorkType, RAMSTemplate> = {
	"Excavation & Groundworks": {
		ppeRequired: [
			"Hard hat",
			"Hi-vis (Class 2 minimum)",
			"Safety boots with midsole protection",
			"Cut-resistant gloves",
			"Eye protection",
			"Hearing protection",
			"Task-specific RPE (FFP3 where required)",
		],
		plantEquipment: [
			"Tracked excavator",
			"Dumper",
			"Trench boxes / hydraulic shoring",
			"Sheet piles (where required)",
			"CAT & Genny",
			"Vacuum excavator for high-risk service zones",
			"Compaction roller / plate compactor",
		],
		riskAssessment: [
			{
				hazard: "Service strike from buried utilities",
				initialRisk: "High",
				controls: "Permit to dig, service plans verification, CAT & Genny sweep, scan-and-mark protocol, hand dig trial holes, exclusion zone for HV assets",
				residualRisk: "Low",
			},
			{
				hazard: "Trench collapse",
				initialRisk: "High",
				controls: "Temporary works design, shoring/boxing, safe battering, appointed excavation supervisor inspections at start-of-shift and after weather/load changes",
				residualRisk: "Medium",
			},
			{
				hazard: "Plant and pedestrian interface",
				initialRisk: "High",
				controls: "Segregated routes, physical barriers, plant marshal/banksman, one-way plan, reversing controls, speed limits",
				residualRisk: "Low",
			},
			{
				hazard: "Ground instability near existing structures",
				initialRisk: "High",
				controls: "Pre-works structural survey, set stand-off distances, engineer approval for deep excavations, vibration monitoring",
				residualRisk: "Medium",
			},
			{
				hazard: "Flooding / water ingress",
				initialRisk: "High",
				controls: "Dewatering plan, pumps and backup, weather monitoring, emergency egress route, stop-work trigger levels",
				residualRisk: "Medium",
			},
			{
				hazard: "Confined access/egress in deep excavation",
				initialRisk: "High",
				controls: "Ladder access at controlled intervals, rescue plan, gas testing where required, no lone working",
				residualRisk: "Medium",
			},
			{
				hazard: "Dust and silica exposure",
				initialRisk: "Medium",
				controls: "Damping down, local suppression, RPE, exposure time controls, occupational hygiene monitoring",
				residualRisk: "Low",
			},
			{
				hazard: "Manual handling injuries",
				initialRisk: "Medium",
				controls: "Mechanical lifting aids, task rotation, team lifts, briefing and supervision",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Pre-start briefing including RAMS, permits, emergency plan, service drawings and hold points.",
			"Establish traffic management, pedestrian segregation, exclusion zones and welfare/emergency access routes.",
			"Complete utility detection and trial pits to verify asset positions before machine excavation.",
			"Excavate in planned sequence with competent operator and banksman supervision at all times.",
			"Install temporary works / support systems as excavation progresses, with supervisor sign-off.",
			"Control groundwater and surface water using approved dewatering and discharge arrangements.",
			"Complete inspections and quality checks at defined hold points before follow-on works.",
			"Reinstate/backfill in layers to specification with compaction testing and records.",
			"Remove temporary controls safely, leave area in stable condition, complete close-out checks.",
		],
		emergencyProcedures: [
			"Stop work and make plant safe immediately.",
			"Raise emergency alarm and initiate incident command hierarchy.",
			"Rescue from excavation only by trained personnel using approved rescue kit.",
			"Contact emergency services and provide precise access coordinates.",
			"Preserve scene for investigation after casualty care is complete.",
		],
		environmentalControls: [
			"Dust suppression and air quality checks",
			"Wheel wash and mud-on-road controls",
			"Silt fences and runoff capture",
			"Spill prevention and fuel storage controls",
			"Segregated spoil and waste tracking",
		],
		permitsRequired: ["Permit to Dig", "Temporary Works Permit", "Excavation Permit", "Environmental Discharge Consent (if required)"],
	},
	"Earthworks Cut & Fill": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Hearing protection"],
		plantEquipment: ["Excavator", "Dozer", "Dumper", "GPS machine control", "Compaction roller"],
		riskAssessment: [
			{
				hazard: "Slope instability during cut operations",
				initialRisk: "High",
				controls: "Engineered batter profiles, phased excavation and supervisor inspections",
				residualRisk: "Medium",
			},
			{
				hazard: "Plant collision in bulk earthworks zone",
				initialRisk: "High",
				controls: "One-way routes, exclusion zones, banksman support and radio comms",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Set out cut/fill boundaries, levels and haul routes.",
			"Strip unsuitable material and stockpile in designated areas.",
			"Execute cut and fill in engineered layers and sequence.",
			"Compact each layer to specified density with testing records.",
			"Trim formation and complete as-built level checks.",
		],
		emergencyProcedures: ["Stop plant and secure workface", "Isolate unstable areas", "Escalate incident response"],
		environmentalControls: ["Dust suppression", "Haul road wheel wash", "Spoil segregation and tracking"],
		permitsRequired: ["Permit to Dig", "Earthworks Permit (where required)"],
	},
	"Subbase & Capping Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection"],
		plantEquipment: ["Grader", "Roller", "Water bowser", "Plate compactor"],
		riskAssessment: [
			{
				hazard: "Insufficient compaction leading to failure",
				initialRisk: "High",
				controls: "Layer thickness control, compaction testing and hold-point sign-off",
				residualRisk: "Medium",
			},
			{
				hazard: "Dust generation in dry conditions",
				initialRisk: "Medium",
				controls: "Water suppression and speed controls",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Verify formation and geotextile requirements before placement.",
			"Place capping/subbase in controlled layer depths.",
			"Grade and compact to line/level and density requirements.",
			"Complete testing regime and release for next layer.",
		],
		emergencyProcedures: ["Stop plant movement", "Provide first aid where required", "Report to site management"],
		environmentalControls: ["Dust suppression", "Material stockpile control", "Runoff management"],
		permitsRequired: ["Permit to Work"],
	},
	"Civils & Infrastructure Works": {
		ppeRequired: [
			"Hard hat",
			"Hi-vis (Class 2 minimum)",
			"Safety boots",
			"Gloves",
			"Eye protection",
			"Hearing protection",
			"Task-specific RPE",
		],
		plantEquipment: [
			"Excavator",
			"Dumper",
			"Compaction roller",
			"Cut-off saw",
			"Lifting accessories and chains",
			"Survey and setting-out instruments",
		],
		riskAssessment: [
			{
				hazard: "Public interface and unauthorised access",
				initialRisk: "High",
				controls: "Secure hoarding, signage, marshals, controlled gates, monitored exclusion zones",
				residualRisk: "Low",
			},
			{
				hazard: "Working adjacent to live traffic",
				initialRisk: "High",
				controls: "Approved traffic management plan, temporary barriers, speed controls, competent TM operatives",
				residualRisk: "Medium",
			},
			{
				hazard: "Lifting operations failure",
				initialRisk: "High",
				controls: "Lift plan, appointed person, LOLER compliant equipment, pre-use checks, exclusion zone",
				residualRisk: "Medium",
			},
			{
				hazard: "Uncontrolled service isolation",
				initialRisk: "High",
				controls: "Permit system, lock-off/tag-out, verification testing, authorised persons only",
				residualRisk: "Low",
			},
			{
				hazard: "Temporary works instability",
				initialRisk: "High",
				controls: "Design checks, TW coordinator approval, staged loading, routine inspections",
				residualRisk: "Medium",
			},
			{
				hazard: "Noise/vibration impact",
				initialRisk: "Medium",
				controls: "Monitoring, low-vibration methods, restricted hours, hearing protection",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Review IFC drawings, utility constraints, temporary works and ITP hold points.",
			"Deliver site induction and activity brief with competency verification.",
			"Implement traffic and pedestrian management controls before workface opening.",
			"Set out works, verify levels and tolerances, complete permit checks.",
			"Execute works in approved sequence with quality checkpoints and sign-offs.",
			"Complete testing/commissioning, snag close-out and as-built record updates.",
		],
		emergencyProcedures: [
			"Stop works and make area safe",
			"Escalate via site emergency matrix",
			"Use project-specific rescue and first aid response",
			"Notify client/Tier 1 representative as required",
		],
		environmentalControls: [
			"Noise and vibration monitoring",
			"Surface water and contamination controls",
			"Waste segregation and transfer notes",
			"Fuel and chemical bunding",
		],
		permitsRequired: ["Permit to Work", "Permit to Dig", "Lifting Permit", "Road Space / Traffic Management Permit"],
	},
	"Tarmac / Asphalt Surfacing": {
		ppeRequired: [
			"Hard hat",
			"Hi-vis (Class 3 for road works)",
			"Heat-resistant gloves",
			"Safety boots",
			"Eye protection",
			"Hearing protection",
			"RPE where fumes/dust require",
		],
		plantEquipment: [
			"Asphalt paver",
			"Tandem roller",
			"Bomag/compaction roller",
			"Bitumen sprayer",
			"Road saw/cutter",
			"Thermal lance/hand tools",
		],
		riskAssessment: [
			{
				hazard: "Burns from hot bitumen/asphalt",
				initialRisk: "High",
				controls: "Heat PPE, controlled discharge zones, no standing behind paver screed, burn kits available",
				residualRisk: "Medium",
			},
			{
				hazard: "Plant movement and reversing",
				initialRisk: "High",
				controls: "Segregation, banksman, reverse alarms/cameras, one-way plan",
				residualRisk: "Low",
			},
			{
				hazard: "Traffic incursion",
				initialRisk: "High",
				controls: "Approved traffic management, lane closures, barriers, lookout/marshal",
				residualRisk: "Medium",
			},
			{
				hazard: "Fume inhalation",
				initialRisk: "Medium",
				controls: "Ventilation/working position controls, RPE where assessed, exposure minimisation",
				residualRisk: "Low",
			},
			{
				hazard: "Manual handling of kerbs/ironwork",
				initialRisk: "Medium",
				controls: "Lifting aids, team lift, training and task rotation",
				residualRisk: "Low",
			},
			{
				hazard: "Weather impact on compaction quality and safety",
				initialRisk: "Medium",
				controls: "Weather checks, revised laying plan, stop-work criteria for rain/low temperature",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm approved mix design, delivery plan, weather window and target layer thickness.",
			"Implement traffic management and workface segregation before surfacing starts.",
			"Prepare substrate (clean, dry, to level) and apply tack coat to specification.",
			"Lay asphalt using paver in controlled passes with joint management plan.",
			"Roll and compact to target density/voids with documented rolling pattern.",
			"Carry out temperature, level and compaction quality checks and record results.",
			"Reinstate road markings/signage and reopen area only after release criteria met.",
		],
		emergencyProcedures: [
			"Isolate hot material/plant area",
			"Cool burns with clean water and seek urgent first aid",
			"Escalate major incident via emergency chain",
			"Secure traffic interface and prevent secondary incidents",
		],
		environmentalControls: [
			"Fume and dust minimisation",
			"Spill control for bitumen/fuels",
			"Noise control and restricted working windows",
			"Waste asphalt recycling and transfer documentation",
		],
		permitsRequired: ["Road Opening / Occupation Permit", "Traffic Management Permit", "Hot Works Permit (where applicable)"],
	},
	"Hand Laying Tarmac": {
		ppeRequired: [
			"Hard hat",
			"Hi-vis (Class 3 for road works)",
			"Heat-resistant gloves",
			"Safety boots",
			"Eye protection",
			"Hearing protection",
			"RPE where fumes/dust require",
		],
		plantEquipment: [
			"Lutes and asphalt rakes",
			"Shovels and hand tampers",
			"Plate compactor / pedestrian roller",
			"Asphalt heater box / hotbox",
			"Road saw/cutter",
			"Bitumen emulsion applicator",
		],
		riskAssessment: [
			{
				hazard: "Burns from hot asphalt and bitumen",
				initialRisk: "High",
				controls: "Heat-resistant PPE, controlled discharge areas, designated hand-lay zones and burn kits at point of work",
				residualRisk: "Medium",
			},
			{
				hazard: "Manual handling strain from hand spreading and tool use",
				initialRisk: "Medium",
				controls: "Task rotation, ergonomic handling technique, correct tool selection and team briefings",
				residualRisk: "Low",
			},
			{
				hazard: "Traffic interface during small patching / localised repairs",
				initialRisk: "High",
				controls: "Approved traffic management, barriers, lookouts/marshals and controlled site access",
				residualRisk: "Medium",
			},
			{
				hazard: "Inadequate compaction and trip edge defects",
				initialRisk: "Medium",
				controls: "Layer thickness control, hand-lay edge detail checks and compaction QA inspections",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm repair extents, approved material type and weather window.",
			"Implement traffic management and establish exclusion/work zones.",
			"Prepare substrate by cutting out defects, cleaning and applying tack coat.",
			"Place and hand-lay asphalt in controlled layers to required profile.",
			"Compact using hand/pedestrian equipment and check levels/edges.",
			"Complete quality checks, reinstate markings if required and reopen only after release criteria are met.",
		],
		emergencyProcedures: [
			"Isolate hot material handling zone immediately",
			"Cool burns with clean water and seek urgent first aid",
			"Escalate major incidents through site emergency plan",
			"Secure traffic interface to prevent secondary incidents",
		],
		environmentalControls: [
			"Fume and dust minimisation",
			"Bitumen/emulsion spill prevention and spill kit controls",
			"Noise control in occupied/residential periods",
			"Waste asphalt segregation and recycling records",
		],
		permitsRequired: ["Road Opening / Occupation Permit", "Traffic Management Permit", "Hot Works Permit (where applicable)"],
	},
	"Hand Laying Tarmac (Footway Reinstatement)": {
		ppeRequired: [
			"Hard hat",
			"Hi-vis (Class 2 minimum)",
			"Heat-resistant gloves",
			"Safety boots",
			"Eye protection",
			"RPE where fumes/dust require",
		],
		plantEquipment: [
			"Lutes and asphalt rakes",
			"Shovels and hand tampers",
			"Plate compactor",
			"Asphalt heater box / hotbox",
			"Footway barriers and pedestrian signs",
			"Road saw/cutter",
		],
		riskAssessment: [
			{
				hazard: "Pedestrian/public contact with hot materials",
				initialRisk: "High",
				controls: "Rigid barriers, signed diversion routes, marshal supervision at crossing points and controlled access",
				residualRisk: "Medium",
			},
			{
				hazard: "Burn injuries during hand laying and compaction",
				initialRisk: "High",
				controls: "Thermal PPE, task zoning, safe handling tools and burn first-aid provision",
				residualRisk: "Medium",
			},
			{
				hazard: "Trips from temporary level differences and incomplete reinstatement",
				initialRisk: "High",
				controls: "Temporary ramping/feathering, edge marking, immediate barrier protection and timely completion",
				residualRisk: "Low",
			},
			{
				hazard: "Manual handling strain from hand tools/material movement",
				initialRisk: "Medium",
				controls: "Task rotation, ergonomic tool use and team lifting where required",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm permit conditions, reinstatement spec and public interface controls.",
			"Install pedestrian management barriers, signage and diversion routes.",
			"Prepare footway excavation by trimming edges, cleaning and applying tack coat.",
			"Hand lay asphalt to required footway profile and tie-ins.",
			"Compact and finish surface, ensuring no abrupt trip edges remain.",
			"Inspect reinstatement compliance and reopen footway only when safe and released.",
		],
		emergencyProcedures: [
			"Stop work and isolate footway/public interface immediately",
			"Administer first aid for burns/trips and call emergency services if needed",
			"Maintain safe diversion routes while incident is managed",
			"Escalate incident through site and client reporting process",
		],
		environmentalControls: [
			"Fume and dust minimisation in pedestrian areas",
			"Bitumen/emulsion spill control",
			"Noise management near occupied premises",
			"Waste asphalt segregation and legal disposal records",
		],
		permitsRequired: ["Street Works Permit", "Footway Occupation Permit", "Traffic/Pedestrian Management Permit", "Hot Works Permit (where applicable)"],
	},
	"Hand Laying Tarmac (Carriageway Patching)": {
		ppeRequired: [
			"Hard hat",
			"Hi-vis (Class 3 for carriageway works)",
			"Heat-resistant gloves",
			"Safety boots",
			"Eye protection",
			"Hearing protection",
			"RPE where fumes/dust require",
		],
		plantEquipment: [
			"Lutes and asphalt rakes",
			"Shovels and hand tampers",
			"Plate compactor / pedestrian roller",
			"Asphalt heater box / hotbox",
			"Traffic management barriers/cones/signage",
			"Road saw/cutter",
		],
		riskAssessment: [
			{
				hazard: "Vehicle strike risk at live carriageway interface",
				initialRisk: "High",
				controls: "Approved lane closure, taper setup, compliant signing and dedicated traffic marshal/lookout",
				residualRisk: "Medium",
			},
			{
				hazard: "Burns from hot asphalt and emulsion",
				initialRisk: "High",
				controls: "Thermal PPE, controlled material handling zones and burn first-aid equipment",
				residualRisk: "Medium",
			},
			{
				hazard: "Poor patch edge tie-in creating road defect",
				initialRisk: "Medium",
				controls: "Saw-cut vertical edges, tack coat use, compaction checks and level/tolerance QA",
				residualRisk: "Low",
			},
			{
				hazard: "Manual handling and repetitive strain",
				initialRisk: "Medium",
				controls: "Task rotation, suitable tool selection and manual handling briefings",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm carriageway patch extents, permit conditions and traffic management layout.",
			"Install lane closure and work zone controls before entering carriageway.",
			"Cut out and clean defective area; apply tack coat to prepared faces/base.",
			"Place and hand-lay asphalt in layers to required profile and camber.",
			"Compact to specification and check joints, levels and ride quality.",
			"Reopen carriageway only after release criteria and safety checks are complete.",
		],
		emergencyProcedures: [
			"Stop works and secure carriageway interface immediately",
			"Call emergency services for vehicle/pedestrian incidents",
			"Provide first aid for burns/injuries and escalate per incident plan",
			"Maintain traffic control until area is made safe",
		],
		environmentalControls: [
			"Fume and dust minimisation",
			"Bitumen/emulsion spill prevention and containment",
			"Waste asphalt segregation and recycling records",
			"Noise controls during constrained working windows",
		],
		permitsRequired: ["Road Space / Occupation Permit", "Traffic Management Permit", "Street Works Permit", "Hot Works Permit (where applicable)"],
	},
	"Road Planing / Milling": {
		ppeRequired: ["Hard hat", "Hi-vis (Class 3)", "Safety boots", "Gloves", "Eye protection", "Hearing protection", "RPE"],
		plantEquipment: ["Road planer", "Sweeper", "Water suppression", "HGV wagons"],
		riskAssessment: [
			{
				hazard: "Traffic interface during live carriageway works",
				initialRisk: "High",
				controls: "Approved TM plan, lane closures, advance signing and lookout",
				residualRisk: "Medium",
			},
			{
				hazard: "High dust/noise and flying debris",
				initialRisk: "High",
				controls: "Water suppression, guarded equipment, PPE and exclusion zones",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Implement traffic management and confirm milling extents.",
			"Plane carriageway to specified depth and profile.",
			"Sweep and inspect milled surface for defects.",
			"Dispose/recycle arisings in accordance with waste controls.",
		],
		emergencyProcedures: ["Stop milling and secure lane", "Escalate incidents via TM supervisor"],
		environmentalControls: ["Dust suppression", "Noise controls", "Recycling of planings"],
		permitsRequired: ["Road Space / Occupation Permit", "Traffic Management Permit"],
	},
	"Binder Course Surfacing": {
		ppeRequired: ["Hard hat", "Hi-vis (Class 3)", "Heat-resistant gloves", "Safety boots", "Eye protection"],
		plantEquipment: ["Asphalt paver", "Rollers", "Bitumen sprayer", "Temperature probe"],
		riskAssessment: [
			{
				hazard: "Burns from hot asphalt",
				initialRisk: "High",
				controls: "Thermal PPE, controlled work zones and burn response kits",
				residualRisk: "Medium",
			},
			{
				hazard: "Poor compaction due to temperature loss",
				initialRisk: "Medium",
				controls: "Delivery timing, rolling pattern and continuous temperature checks",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Prepare substrate and apply tack coat.",
			"Lay binder course to specified thickness and crossfall.",
			"Compact to density requirements using agreed rolling sequence.",
			"Record quality checks and release for surface course.",
		],
		emergencyProcedures: ["Isolate hot zone", "Provide first aid for burns", "Escalate major incidents"],
		environmentalControls: ["Fume minimisation", "Bitumen spill prevention", "Asphalt waste recycling"],
		permitsRequired: ["Traffic Management Permit", "Road Space Permit"],
	},
	"Surface Course Surfacing": {
		ppeRequired: ["Hard hat", "Hi-vis (Class 3)", "Heat-resistant gloves", "Safety boots", "Eye protection"],
		plantEquipment: ["Asphalt paver", "Steel/drum rollers", "Joint heaters", "Line and level tools"],
		riskAssessment: [
			{
				hazard: "Traffic interface at final surfacing stage",
				initialRisk: "High",
				controls: "Strict closures, marshals and controlled reopening criteria",
				residualRisk: "Medium",
			},
			{
				hazard: "Inadequate skid resistance due to workmanship",
				initialRisk: "Medium",
				controls: "Approved mix, laying temperature checks and QA sign-off",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Verify binder readiness and weather window.",
			"Lay surface course with controlled joints and finish.",
			"Complete rolling sequence and texture compliance checks.",
			"Open to traffic only after release criteria are met.",
		],
		emergencyProcedures: ["Stop paving activity", "Secure carriageway and incident area", "Contact emergency services as required"],
		environmentalControls: ["Noise and fume management", "Prevent runoff contamination", "Material waste control"],
		permitsRequired: ["Traffic Management Permit", "Road Space Permit"],
	},
	"Concrete Works": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Impermeable gloves", "Eye protection"],
		plantEquipment: ["Concrete pump", "Vibrating poker", "Wheelbarrows", "Power float"],
		riskAssessment: [
			{
				hazard: "Cement burns and dermatitis",
				initialRisk: "High",
				controls: "Use suitable gloves/sleeves, avoid prolonged skin contact, wash facilities available",
				residualRisk: "Low",
			},
			{
				hazard: "Manual handling injuries",
				initialRisk: "Medium",
				controls: "Use mechanical aids and team lifts, brief on correct lifting technique",
				residualRisk: "Low",
			},
			{
				hazard: "Slip/trip on wet concrete and trailing hoses",
				initialRisk: "Medium",
				controls: "Housekeeping, hose management, maintain clear access routes",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Verify formwork, reinforcement, and pour sequence before concrete arrives.",
			"Brief all operatives on pour areas, communication signals, and responsibilities.",
			"Discharge concrete in planned sequence and compact with vibrating equipment.",
			"Finish surfaces to specification while controlling access to fresh concrete.",
			"Apply curing regime and protect finished surfaces from damage.",
			"Clean equipment and dispose of washout waste in designated containment area.",
		],
		emergencyProcedures: ["Flush skin/eyes immediately with clean water", "Seek first aid and medical assistance", "Isolate damaged equipment"],
		environmentalControls: ["Concrete washout controls", "Spill kits available", "Noise control during pours"],
		permitsRequired: [],
	},
	"Trench Fill Foundations": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Impermeable gloves for concrete"],
		plantEquipment: ["Excavator", "Concrete skip/pump", "Vibrating poker", "Leveling tools", "Shoring equipment"],
		riskAssessment: [
			{
				hazard: "Trench collapse during excavation/pour",
				initialRisk: "High",
				controls: "Temporary works support where required, safe battering, competent supervision and routine inspections",
				residualRisk: "Medium",
			},
			{
				hazard: "Service strike from buried utilities",
				initialRisk: "High",
				controls: "Service plans verification, CAT & Genny sweep, trial holes and permit to dig controls",
				residualRisk: "Low",
			},
			{
				hazard: "Concrete skin burns and dermatitis",
				initialRisk: "High",
				controls: "Impermeable gloves, barrier cream, wash facilities and immediate skin decontamination",
				residualRisk: "Low",
			},
			{
				hazard: "Ground instability near existing structures",
				initialRisk: "High",
				controls: "Pre-works structural survey, stand-off distances and monitoring regime",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Mark out foundation trench lines and confirm depths from design drawings.",
			"Complete utility verification and obtain permit to dig.",
			"Excavate trenches to formation level with temporary support where needed.",
			"Inspect formation, place blinding layer if specified and confirm engineer approval.",
			"Place reinforcement cages and starter bars to design requirements.",
			"Pour concrete in controlled sequence with poker compaction.",
			"Finish to required level, cure and protect until strength gain complete.",
		],
		emergencyProcedures: ["Stop work and evacuate trench", "Flush concrete contact from skin immediately", "Call emergency services for serious incidents"],
		environmentalControls: ["Concrete washout containment", "Groundwater/dewatering controls", "Spoil segregation and waste tracking"],
		permitsRequired: ["Permit to Dig", "Temporary Works Permit (where applicable)", "Excavation Permit"],
	},
	"Pad Foundations": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Impermeable gloves"],
		plantEquipment: ["Excavator", "Concrete skip/pump", "Vibrating poker", "Spirit levels", "Formwork and props"],
		riskAssessment: [
			{
				hazard: "Excavation collapse during pad construction",
				initialRisk: "High",
				controls: "Safe excavation batters, inspection regime and exclusion zones",
				residualRisk: "Medium",
			},
			{
				hazard: "Lifting injuries from reinforcement and formwork",
				initialRisk: "Medium",
				controls: "Mechanical aids, team lifts and manual handling training",
				residualRisk: "Low",
			},
			{
				hazard: "Concrete pour quality failures",
				initialRisk: "Medium",
				controls: "Pour plan, slump testing, vibration control and engineer supervision",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Set out pad positions and verify against structural grid.",
			"Excavate to formation with safe access/egress provision.",
			"Install blinding concrete and verify levels.",
			"Fix reinforcement cages and holding-down bolts to tolerance.",
			"Install formwork, check alignment and obtain pre-pour inspection sign-off.",
			"Pour concrete with controlled discharge and poker compaction.",
			"Cure, strip formwork safely and complete as-built checks.",
		],
		emergencyProcedures: ["Stop pour and make area safe", "Flush skin contact immediately", "Escalate structural concerns to engineer"],
		environmentalControls: ["Concrete washout controls", "Surface water protection", "Formwork waste segregation"],
		permitsRequired: ["Permit to Dig", "Temporary Works Permit (for formwork)"],
	},
	"Piled Foundations": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Hearing protection", "RPE where required"],
		plantEquipment: ["Piling rig", "Crane", "Concrete pump", "Integrity testing equipment", "Tremie pipes"],
		riskAssessment: [
			{
				hazard: "Piling rig instability and tip-over",
				initialRisk: "High",
				controls: "Ground bearing checks, rig setup inspection, exclusion zones and competent operator",
				residualRisk: "Medium",
			},
			{
				hazard: "Underground service damage from pile drilling",
				initialRisk: "High",
				controls: "Comprehensive service verification, trial pits at pile locations and watching brief",
				residualRisk: "Medium",
			},
			{
				hazard: "Noise and vibration impact on adjacent structures",
				initialRisk: "High",
				controls: "Monitoring regime, restricted working hours and vibration trigger levels",
				residualRisk: "Medium",
			},
			{
				hazard: "Confined space risk during pile cage installation",
				initialRisk: "High",
				controls: "No personnel entry into pile bores, use lifting/guiding equipment only",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Set out pile positions and confirm ground investigation data.",
			"Establish exclusion zones and install piling rig on verified stable ground.",
			"Drill/bore piles to design depth with spoil management controls.",
			"Install reinforcement cages using crane and guide ropes (no personnel entry).",
			"Concrete piles using tremie method with continuous pour.",
			"Carry out integrity testing and record as-built pile depths/positions.",
			"Break down to cut-off level and prepare pile heads for capping beam.",
		],
		emergencyProcedures: ["Stop piling operations and isolate rig", "Evacuate exclusion zone", "Contact structural engineer for pile failures"],
		environmentalControls: ["Noise and vibration monitoring", "Arisings disposal and contamination checks", "Concrete washout controls"],
		permitsRequired: ["Piling Permit", "Noise/Vibration Permit (where required)", "Temporary Works Permit"],
	},
	"Mass Concrete Foundations": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Impermeable gloves", "Eye protection"],
		plantEquipment: ["Concrete pump/skip", "Vibrating poker", "Screeds and floats", "Excavator for placement"],
		riskAssessment: [
			{
				hazard: "Large volume concrete pour heat generation and cracking",
				initialRisk: "Medium",
				controls: "Approved mix design, pour sequence plan and temperature monitoring",
				residualRisk: "Low",
			},
			{
				hazard: "Access/egress difficulties in deep excavations",
				initialRisk: "High",
				controls: "Safe ladder access at intervals, designated egress routes and no lone working",
				residualRisk: "Medium",
			},
			{
				hazard: "Prolonged concrete contact and dermatitis",
				initialRisk: "High",
				controls: "Barrier PPE, task rotation and immediate wash facilities",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm formation readiness, blinding installation and pre-pour inspection.",
			"Brief team on pour sequence, quality checks and communication plan.",
			"Pour mass concrete in planned layers/sections to minimize heat buildup.",
			"Vibrate and compact to eliminate voids, especially at corners/edges.",
			"Apply curing regime (protection/wet curing) immediately after finishing.",
			"Monitor pour temperature if required and record quality test results.",
		],
		emergencyProcedures: ["Stop pour if defects identified", "Flush skin/eye contact immediately", "Escalate pour failures to structural engineer"],
		environmentalControls: ["Concrete washout containment", "Prevent contaminated runoff", "Waste concrete disposal controls"],
		permitsRequired: ["Permit to Work", "Excavation Permit (where applicable)"],
	},
	"Steelfixing / Reinforcement": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Cut-resistant gloves", "Eye protection", "Knee pads"],
		plantEquipment: ["Rebar cutters/shears", "Bar benders", "Tie guns", "Crane/telehandler for lifting", "Spacers and bar chairs"],
		riskAssessment: [
			{
				hazard: "Manual handling injuries from heavy reinforcement bundles",
				initialRisk: "High",
				controls: "Mechanical lifting aids, team lifts, manual handling training and lift plans for heavy cages",
				residualRisk: "Medium",
			},
			{
				hazard: "Cuts and puncture wounds from rebar ends",
				initialRisk: "High",
				controls: "Cut-resistant gloves, mushroom caps on exposed bar ends, segregated work areas and PPE enforcement",
				residualRisk: "Medium",
			},
			{
				hazard: "Trip hazards from ground-level reinforcement",
				initialRisk: "Medium",
				controls: "Clear walkways, organized material storage and high-visibility marking of protruding bars",
				residualRisk: "Low",
			},
			{
				hazard: "Lifting incidents with reinforcement cages",
				initialRisk: "High",
				controls: "Certified lifting points, test lifts, exclusion zones and appointed banksman",
				residualRisk: "Medium",
			},
			{
				hazard: "Collapse of unsecured reinforcement assemblies",
				initialRisk: "High",
				controls: "Progressive tying sequence, temporary bracing and competent supervision throughout",
				residualRisk: "Medium",
			},
			{
				hazard: "Working at height injuries (elevated slabs/walls)",
				initialRisk: "High",
				controls: "Edge protection, working platforms, harnesses where required and rescue plan in place",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Check reinforcement delivery against schedule and verify bar marks/sizes.",
			"Set out and mark fixing positions from structural drawings.",
			"Cut and bend reinforcement to required shapes using designated equipment.",
			"Fix bottom/first layer of bars with spacers to maintain cover requirements.",
			"Install subsequent layers, chairs and links according to fixing schedule.",
			"Tie intersections securely and install mushroom caps on exposed bar ends.",
			"Complete pre-concrete inspection and obtain engineer sign-off.",
		],
		emergencyProcedures: ["First aid for cuts/punctures immediately", "Stop work if cage instability detected", "Emergency rescue for working at height incidents"],
		environmentalControls: ["Segregate steel waste for recycling", "Tie wire and cap waste collection", "Prevent offcuts entering drainage"],
		permitsRequired: ["Permit to Work", "Working at Height Permit (where applicable)", "Lifting Operations Permit"],
	},
	"Drainage Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves"],
		plantEquipment: ["Excavator", "Pipe laser", "Compaction equipment"],
		riskAssessment: [
			{
				hazard: "Confined excavation hazards",
				initialRisk: "High",
				controls: "Support excavation and control access",
				residualRisk: "Medium",
			},
			{
				hazard: "Pipe lifting and positioning",
				initialRisk: "Medium",
				controls: "Use lifting accessories and trained operators",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm line and level requirements from latest drawings.",
			"Excavate trench and install temporary support where required.",
			"Prepare bedding material and place pipes to line/level.",
			"Connect joints, install chambers, and verify falls.",
			"Backfill and compact in specified layers after inspection.",
			"Complete testing and handover records.",
		],
		emergencyProcedures: ["Stop work and secure area", "Call emergency services where needed", "Report incident to supervisor"],
		environmentalControls: ["Prevent contaminated runoff", "Control muddy water", "Segregate spoil materials"],
		permitsRequired: ["Permit to Dig"],
	},
	"Deep Drainage & Manholes": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "RPE where required"],
		plantEquipment: ["Excavator", "Lifting chains", "Trench support", "Pipe laser", "Pumps"],
		riskAssessment: [
			{
				hazard: "Deep excavation collapse",
				initialRisk: "High",
				controls: "Temporary works support, inspection regime and exclusion zones",
				residualRisk: "Medium",
			},
			{
				hazard: "Manhole ring/component lifting incidents",
				initialRisk: "High",
				controls: "Lift plans, certified gear and competent slinger/signaller",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Set out alignment and confirm utility clearances.",
			"Excavate and install trench/manhole support systems.",
			"Install manholes, channels and pipe runs to level/fall.",
			"Test, backfill in layers and record as-built details.",
		],
		emergencyProcedures: ["Stop all work and evacuate excavation", "Initiate rescue plan and call emergency services"],
		environmentalControls: ["Dewatering controls", "Silt/runoff management", "Wastewater containment"],
		permitsRequired: ["Permit to Dig", "Excavation Permit", "Temporary Works Permit"],
	},
	"Utility Ducting & Service Crossings": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection"],
		plantEquipment: ["Mini excavator", "Vac-ex unit", "Cable/duct rollers", "Compaction equipment"],
		riskAssessment: [
			{
				hazard: "Live service damage during crossing works",
				initialRisk: "High",
				controls: "Service verification, hand dig/vac-ex near assets and permit-to-dig controls",
				residualRisk: "Low",
			},
			{
				hazard: "Backfill settlement over crossings",
				initialRisk: "Medium",
				controls: "Specified bedding/backfill and compaction testing",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm crossing locations and isolate if required.",
			"Excavate in controlled stages around live services.",
			"Install ducts, marker tape and protection slabs as required.",
			"Backfill, compact and complete compliance records.",
		],
		emergencyProcedures: ["Stop work and isolate area", "Escalate service strike protocol immediately"],
		environmentalControls: ["Spoil segregation", "Dust and runoff controls", "Material traceability"],
		permitsRequired: ["Permit to Dig", "Service Isolation Permit (where applicable)"],
	},
	"Kerbing & Edging Installation": {
		ppeRequired: ["Hard hat", "Hi-vis (Class 3)", "Safety boots", "Gloves", "Eye protection"],
		plantEquipment: ["Kerb lifting clamps", "Mini excavator", "Saw cutter", "Compactor"],
		riskAssessment: [
			{
				hazard: "Manual handling strain from kerbs",
				initialRisk: "Medium",
				controls: "Mechanical lifting aids, team handling and ergonomic techniques",
				residualRisk: "Low",
			},
			{
				hazard: "Traffic exposure on edge-of-carriageway works",
				initialRisk: "High",
				controls: "Traffic management, barriers and safe access routes",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Set out line/level and verify substrate readiness.",
			"Install kerbs/edgings on concrete bed and haunch.",
			"Check alignment, upstand and jointing quality.",
			"Protect and cure before adjacent surfacing works.",
		],
		emergencyProcedures: ["Stop work and isolate cutting/lifting activities", "Provide first aid and escalate incidents"],
		environmentalControls: ["Concrete washout controls", "Dust suppression for cutting", "Waste segregation"],
		permitsRequired: ["Traffic Management Permit", "Permit to Work"],
	},
	"Footway & Paving Construction": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Knee protection"],
		plantEquipment: ["Block splitter", "Compactor", "Screed rails", "Cutting tools"],
		riskAssessment: [
			{
				hazard: "Hand-arm vibration and cutting dust",
				initialRisk: "Medium",
				controls: "Low-vibration tools, task rotation, wet cutting and RPE",
				residualRisk: "Low",
			},
			{
				hazard: "Trips on uneven unfinished footway",
				initialRisk: "Medium",
				controls: "Pedestrian diversions, barriers and clear signage",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Prepare formation and install edge restraints.",
			"Place and level bedding layer to tolerance.",
			"Lay paving units to pattern and jointing spec.",
			"Compact, sand joints and complete quality checks.",
		],
		emergencyProcedures: ["Stop cutting/compaction equipment", "Provide first aid", "Escalate if public interface incident"],
		environmentalControls: ["Dust control", "Waste paving segregation", "Noise controls near residents"],
		permitsRequired: ["Permit to Work", "Traffic/Pedestrian Management Permit (where applicable)"],
	},
	"Road Markings & Street Furniture": {
		ppeRequired: ["Hard hat", "Hi-vis (Class 3)", "Safety boots", "Gloves", "Eye protection", "RPE where required"],
		plantEquipment: ["Line marking machine", "Thermoplastic kettle", "Core drill", "Fixing tools"],
		riskAssessment: [
			{
				hazard: "Vehicle strike during short-duration lane closures",
				initialRisk: "High",
				controls: "Mobile lane closure setup, lookout and compliant signing",
				residualRisk: "Medium",
			},
			{
				hazard: "Burns from thermoplastic materials",
				initialRisk: "Medium",
				controls: "Heat-resistant PPE and controlled application zones",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Set traffic management and clean application surfaces.",
			"Apply road markings to layout drawings and standards.",
			"Install studs/signage/furniture with compliant fixings.",
			"Inspect visibility, alignment and retroreflectivity where required.",
		],
		emergencyProcedures: ["Stop operations and secure live lane interface", "Call emergency services for significant incidents"],
		environmentalControls: ["Material spill control", "Packaging and cartridge waste segregation", "Noise minimisation"],
		permitsRequired: ["Traffic Management Permit", "Road Space Permit"],
	},
	"Ironwork Raise & Reset": {
		ppeRequired: ["Hard hat", "Hi-vis (Class 3)", "Safety boots", "Gloves", "Eye protection"],
		plantEquipment: ["Lifting keys", "Cutting tools", "Rapid-set materials", "Compaction tools"],
		riskAssessment: [
			{
				hazard: "Manual handling injuries when moving covers/frames",
				initialRisk: "Medium",
				controls: "Mechanical lifting keys and team lifts where required",
				residualRisk: "Low",
			},
			{
				hazard: "Trips/open chamber risk during reset",
				initialRisk: "High",
				controls: "Immediate guarding, barrier controls and supervised access",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Set local traffic management and isolate work area.",
			"Remove and prepare existing frame and surrounding surfacing.",
			"Raise/reset frame to finished level and reinstate surround.",
			"Verify level tolerance and reopen on cure completion.",
		],
		emergencyProcedures: ["Secure open chamber immediately", "Stop traffic interface works and escalate incidents"],
		environmentalControls: ["Waste asphalt/concrete segregation", "Dust suppression", "Spill control"],
		permitsRequired: ["Traffic Management Permit", "Road Space Permit", "Permit to Work"],
	},
	"Brickwork & Blockwork": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "RPE for silica dust"],
		plantEquipment: ["Mixer", "Cut-off saw", "Hop-ups / scaffold", "Lifting aids for blocks"],
		riskAssessment: [
			{
				hazard: "Silica dust from cutting",
				initialRisk: "High",
				controls: "Wet cutting, extraction, suitable RPE, exposure minimisation and supervision",
				residualRisk: "Medium",
			},
			{
				hazard: "Manual handling of blocks and lintels",
				initialRisk: "Medium",
				controls: "Mechanical aids, team lifts, task rotation and handling brief",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Review drawings and set out wall lines, openings and levels.",
			"Prepare materials and mixing area with safe access/egress.",
			"Build in sequence to specified bond with line and level checks.",
			"Install lintels, ties and movement joints to design requirements.",
			"Complete quality checks and leave work area tidy and stable.",
		],
		emergencyProcedures: ["Stop work and isolate area", "Administer first aid", "Escalate incidents via site procedure"],
		environmentalControls: ["Dust suppression during cutting", "Mortar washout control", "Segregate packaging waste"],
		permitsRequired: ["Work at Height Permit (where scaffold used)"],
	},
	"Drylining & Ceilings": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Dust mask"],
		plantEquipment: ["Board lifter", "MEWP / podium", "Screw guns", "Laser level"],
		riskAssessment: [
			{
				hazard: "Overhead work and falling materials",
				initialRisk: "High",
				controls: "Exclusion zones, material securing, supervised work at height and inspections",
				residualRisk: "Medium",
			},
			{
				hazard: "Musculoskeletal strain",
				initialRisk: "Medium",
				controls: "Board lifters, team handling and ergonomic task planning",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm setting-out, service zones and interface details.",
			"Install framing to specification and verify fixing centres.",
			"Board and secure walls/ceilings in planned sequence.",
			"Tape/joint and finish to required quality level.",
			"Complete snag checks and protect finished surfaces.",
		],
		emergencyProcedures: ["Stop activity and secure overhead zone", "Provide first aid and escalate as required"],
		environmentalControls: ["Dust control when cutting boards", "Offcut segregation", "Noise minimisation in occupied areas"],
		permitsRequired: ["Work at Height Permit (where applicable)"],
	},
	"Internal Fit-Out": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection"],
		plantEquipment: ["Hand/power tools", "Podium steps", "Dust extraction units"],
		riskAssessment: [
			{
				hazard: "Multiple trades working in shared areas",
				initialRisk: "High",
				controls: "Daily coordination briefings, area zoning, permit checks and sequencing",
				residualRisk: "Medium",
			},
			{
				hazard: "Trips from materials and temporary services",
				initialRisk: "Medium",
				controls: "Strict housekeeping, cable management and walkway controls",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Coordinate workface with other trades and confirm access windows.",
			"Install partitions, doors, joinery and fixtures in approved sequence.",
			"Complete service penetrations and fire stopping interfaces.",
			"Carry out quality checks, snagging and progressive handover.",
		],
		emergencyProcedures: ["Stop all local activity", "Make area safe", "Notify supervisor and first aider"],
		environmentalControls: ["Dust/noise controls", "Waste stream segregation", "Protection of completed finishes"],
		permitsRequired: ["Permit to Work", "Hot Works Permit (if required)"],
	},
	"Flooring Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Knee protection", "RPE where required"],
		plantEquipment: ["Floor grinder", "Mixing drill", "Adhesive applicators", "Cutting tools"],
		riskAssessment: [
			{
				hazard: "Chemical exposure from adhesives/primers",
				initialRisk: "Medium",
				controls: "COSHH controls, ventilation, glove selection and spill management",
				residualRisk: "Low",
			},
			{
				hazard: "Slips on wet surfaces",
				initialRisk: "Medium",
				controls: "Barrier off curing areas, signage and controlled access",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Survey substrate condition and moisture levels.",
			"Prepare surface by cleaning/grinding and priming.",
			"Install flooring materials to manufacturer specification.",
			"Protect curing area and complete finish checks.",
		],
		emergencyProcedures: ["Contain spill and ventilate", "Provide first aid for exposure", "Escalate significant incidents"],
		environmentalControls: ["VOC control and ventilation", "Adhesive waste segregation", "Dust extraction during prep"],
		permitsRequired: ["Permit to Work"],
	},
	"Painting & Decorating": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "RPE where required"],
		plantEquipment: ["Podium / MEWP", "Spray equipment", "Rollers and brushes", "Extraction/ventilation fans"],
		riskAssessment: [
			{
				hazard: "Exposure to paint fumes/solvents",
				initialRisk: "Medium",
				controls: "Low-VOC products where possible, ventilation, COSHH controls and RPE",
				residualRisk: "Low",
			},
			{
				hazard: "Work at height from access equipment",
				initialRisk: "Medium",
				controls: "Pre-use checks, correct equipment selection and user competence",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Prepare and protect area, including masking and floor coverings.",
			"Prepare surfaces by cleaning, filling and sanding.",
			"Apply coatings in specified system and drying intervals.",
			"Inspect finish quality, remove protection and clear waste.",
		],
		emergencyProcedures: ["Stop spraying activity", "Ventilate and isolate sources", "Follow COSHH first aid guidance"],
		environmentalControls: ["Overspray control", "VOC management", "Segregated paint and solvent waste"],
		permitsRequired: ["Hot Works Permit (if thermal methods used)", "Work at Height Permit (where applicable)"],
	},
	"Steel Erection": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Fall arrest harness"],
		plantEquipment: ["Mobile crane", "MEWP", "Tag lines", "Torque tools"],
		riskAssessment: [
			{
				hazard: "Working at height",
				initialRisk: "High",
				controls: "Use edge protection/MEWP and fall arrest, rescue plan in place",
				residualRisk: "Medium",
			},
			{
				hazard: "Dropped objects",
				initialRisk: "High",
				controls: "Exclusion zones, tool lanyards, controlled lifting plans",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Review lift plan and sequence with crane supervisor and erection team.",
			"Set exclusion zones and ensure communication methods are in place.",
			"Lift and position steel members using tag lines and approved slings.",
			"Bolt and plumb members progressively, checking stability at each stage.",
			"Carry out final torque checks and quality inspection.",
		],
		emergencyProcedures: ["Stop lifting operations", "Lower suspended loads safely", "Initiate height rescue plan if required"],
		environmentalControls: ["Wind speed monitoring", "Noise control", "Waste steel segregation"],
		permitsRequired: ["Lifting Permit", "Work at Height Permit"],
	},
	Scaffolding: {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Harness"],
		plantEquipment: ["Scaffold tools", "Gin wheel", "Harness and lanyard"],
		riskAssessment: [
			{
				hazard: "Falls from height",
				initialRisk: "High",
				controls: "Use advanced guardrail systems, clipped on while erecting/dismantling",
				residualRisk: "Medium",
			},
			{
				hazard: "Unstable scaffold base",
				initialRisk: "High",
				controls: "Ground assessment, base plates/sole boards, tie pattern to design",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Inspect ground and establish safe work area.",
			"Erect scaffold to design using compliant components.",
			"Install ties, bracing, and platforms progressively.",
			"Complete handover inspection and issue scaffold tag.",
			"Inspect scaffold at required intervals and after weather events.",
		],
		emergencyProcedures: ["Stop scaffold use", "Secure structure", "Call emergency services if injury occurred"],
		environmentalControls: ["Netting to reduce debris", "Control noise in sensitive areas"],
		permitsRequired: ["Work at Height Permit"],
	},
	Roofing: {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Harness"],
		plantEquipment: ["MEWP", "Ladders", "Fall arrest system"],
		riskAssessment: [
			{
				hazard: "Falls from roof edge or openings",
				initialRisk: "High",
				controls: "Edge protection, covers, harness systems and supervised access",
				residualRisk: "Medium",
			},
			{
				hazard: "Weather exposure",
				initialRisk: "Medium",
				controls: "Monitor weather, stop work in high winds/rain/ice",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Assess roof condition and access arrangements.",
			"Install edge protection and establish exclusion zone below.",
			"Deliver and position materials to avoid overload of roof areas.",
			"Complete roofing works in planned sequence with secure footing.",
			"Inspect finished works and remove temporary controls safely.",
		],
		emergencyProcedures: ["Suspend works during unsafe weather", "Use rescue arrangements for fall incidents", "Call emergency services"],
		environmentalControls: ["Debris containment", "Weatherproof waste storage"],
		permitsRequired: ["Work at Height Permit"],
	},
	"Facade / Cladding Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Harness", "Eye protection"],
		plantEquipment: ["MEWP", "Crane / hoist", "Vacuum lifters", "Torque tools"],
		riskAssessment: [
			{
				hazard: "Dropped panels/tools from height",
				initialRisk: "High",
				controls: "Exclusion zones, tethered tools, controlled lifting plans and banksman",
				residualRisk: "Medium",
			},
			{
				hazard: "High wind affecting panel stability",
				initialRisk: "High",
				controls: "Wind monitoring, stop-work thresholds and staged installation",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Review façade sequence, tolerances and temporary restraints.",
			"Set exclusion zones and verify access equipment certification.",
			"Lift and install panels in planned order with alignment checks.",
			"Complete fixing, sealing and QA inspection records.",
		],
		emergencyProcedures: ["Suspend lifting and secure partially installed elements", "Escalate via emergency chain"],
		environmentalControls: ["Packaging segregation", "Noise management", "Prevent debris release to public areas"],
		permitsRequired: ["Lifting Permit", "Work at Height Permit"],
	},
	"Window & Curtain Wall Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Cut-resistant gloves", "Harness", "Eye protection"],
		plantEquipment: ["Glass vacuum lifters", "MEWP", "Crane/hoist", "Torque tools"],
		riskAssessment: [
			{
				hazard: "Glass breakage and laceration",
				initialRisk: "High",
				controls: "Approved lifting gear, edge protection, handling protocols and exclusion zones",
				residualRisk: "Medium",
			},
			{
				hazard: "Falls from height",
				initialRisk: "High",
				controls: "Work positioning systems, edge protection and rescue plan",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Confirm opening readiness, dimensions and setting-out.",
			"Install brackets/frames and verify alignment tolerances.",
			"Lift and secure glazing units with approved equipment.",
			"Seal interfaces and complete weatherproofing checks.",
		],
		emergencyProcedures: ["Stop lifts and secure glass", "Treat cuts immediately and escalate serious injuries"],
		environmentalControls: ["Glass waste segregation", "Packaging recycling", "Control sealant and solvent waste"],
		permitsRequired: ["Lifting Permit", "Work at Height Permit"],
	},
	"Electrical Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Insulated gloves", "Eye protection"],
		plantEquipment: ["Voltage tester", "Insulated tools", "Lock-off kit"],
		riskAssessment: [
			{
				hazard: "Electric shock",
				initialRisk: "High",
				controls: "Isolate and lock off supplies, test for dead, competent electricians only",
				residualRisk: "Low",
			},
			{
				hazard: "Fire from faulty installation",
				initialRisk: "Medium",
				controls: "Inspection/testing regime, compliant materials and certification",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Review circuit drawings and isolate supply before work.",
			"Apply lock-off and verify dead using approved test equipment.",
			"Install containment and wiring to specification.",
			"Terminate and test circuits in accordance with regulations.",
			"Energise only after completion checks and sign-off.",
		],
		emergencyProcedures: ["Isolate power immediately", "Use suitable fire extinguisher for electrical fires", "Call emergency services"],
		environmentalControls: ["Cable waste segregation", "Battery and lamp disposal controls"],
		permitsRequired: ["Electrical Isolation Permit"],
	},
	"MEP Services Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Hearing protection"],
		plantEquipment: ["Pipe press tools", "Threading/cutting tools", "Cable pulling equipment", "Access towers"],
		riskAssessment: [
			{
				hazard: "Interface clashes with concurrent trades",
				initialRisk: "Medium",
				controls: "Coordinated service zones, permit checks and phased workface planning",
				residualRisk: "Low",
			},
			{
				hazard: "Struck by falling tools/materials",
				initialRisk: "Medium",
				controls: "Tool lanyards, exclusion zones and controlled material storage",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Review coordinated services drawings and planned routes.",
			"Set out supports, brackets and access zones.",
			"Install containment, pipework and cable systems in sequence.",
			"Complete pressure/electrical tests and commissioning pre-checks.",
		],
		emergencyProcedures: ["Stop task and isolate affected service", "Report and escalate incidents promptly"],
		environmentalControls: ["Control cutting dust and debris", "Segregate metal/plastic offcuts", "Manage chemical sealants under COSHH"],
		permitsRequired: ["Permit to Work", "Electrical Isolation Permit (where applicable)"],
	},
	"HVAC Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Hearing protection"],
		plantEquipment: ["Duct lifters", "MEWP", "Core drill", "Refrigerant charging tools"],
		riskAssessment: [
			{
				hazard: "Work at height during duct/fan installation",
				initialRisk: "High",
				controls: "Certified access equipment, exclusion zones and trained operatives",
				residualRisk: "Medium",
			},
			{
				hazard: "Exposure to refrigerants",
				initialRisk: "Medium",
				controls: "F-gas competent personnel, leak testing, ventilation and emergency procedures",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Confirm routes, supports and plant positions from coordinated drawings.",
			"Install supports and hangers to approved loading details.",
			"Install ductwork/pipework and connect equipment.",
			"Complete testing, balancing and commissioning checks.",
		],
		emergencyProcedures: ["Isolate system and ventilate area", "Escalate refrigerant leaks and seek specialist support"],
		environmentalControls: ["Refrigerant handling controls", "Noise management during testing", "Waste metal segregation"],
		permitsRequired: ["Permit to Work", "Work at Height Permit", "Hot Works Permit (if brazing required)"],
	},
	"Fire Stopping & Passive Fire Protection": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "RPE"],
		plantEquipment: ["Sealant guns", "Core drill", "Fire stopping installation tools", "Access towers"],
		riskAssessment: [
			{
				hazard: "Incorrect installation compromising fire integrity",
				initialRisk: "High",
				controls: "Use approved systems only, trained installers, QA sign-off with photographic records",
				residualRisk: "Medium",
			},
			{
				hazard: "Dust/fume exposure during prep",
				initialRisk: "Medium",
				controls: "Local extraction, suitable RPE and controlled cutting methods",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Verify penetration schedules and approved product details.",
			"Prepare substrates and ensure service supports are complete.",
			"Install fire stopping systems to manufacturer specification.",
			"Label and record installations for QA and handover.",
		],
		emergencyProcedures: ["Stop work and isolate unsafe area", "Escalate any fire event immediately via site plan"],
		environmentalControls: ["Controlled waste for cartridges/foams", "Dust control and clean-as-you-go"],
		permitsRequired: ["Permit to Work", "Hot Works Permit (if applicable)"],
	},
	"Traffic Management & Roadworks": {
		ppeRequired: ["Hard hat", "Hi-vis (Class 3)", "Safety boots", "Gloves", "Weather PPE"],
		plantEquipment: ["Chapter 8 signage", "Barriers/cones", "Traffic lights", "Impact protection vehicles"],
		riskAssessment: [
			{
				hazard: "Vehicle strike from live traffic",
				initialRisk: "High",
				controls: "Approved TM plan, advance signing, taper setup and competent operatives",
				residualRisk: "Medium",
			},
			{
				hazard: "Public/pedestrian conflict",
				initialRisk: "High",
				controls: "Safe pedestrian diversions, marshals and clear information signage",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Brief team on approved traffic management layout and sequence.",
			"Deploy signs, cones and barriers from safe zones.",
			"Monitor traffic flow and maintain controls throughout shift.",
			"Dismantle traffic management in reverse safe sequence.",
		],
		emergencyProcedures: ["Stop roadworks and protect incident scene", "Contact emergency services and traffic authority"],
		environmentalControls: ["Minimise idling and emissions", "Control debris onto carriageway", "Night noise controls"],
		permitsRequired: ["Road Space / Traffic Management Permit"],
	},
	"Landscaping & External Works": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection", "Hearing protection"],
		plantEquipment: ["Mini excavator", "Compactor", "Cutting tools", "Hand landscaping tools"],
		riskAssessment: [
			{
				hazard: "Underground service strike",
				initialRisk: "High",
				controls: "Service checks, CAT scan, trial holes and controlled excavation",
				residualRisk: "Low",
			},
			{
				hazard: "Plant-pedestrian interface in open areas",
				initialRisk: "Medium",
				controls: "Segregation barriers, banksman and defined routes",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Survey area, identify services and mark exclusion zones.",
			"Undertake ground preparation and levels.",
			"Install hard/soft landscaping elements to specification.",
			"Complete snagging, reinstatement and waste removal.",
		],
		emergencyProcedures: ["Stop plant activity and secure area", "Provide first aid and escalate"],
		environmentalControls: ["Soil and spoil segregation", "Dust and noise controls", "Protection of existing vegetation"],
		permitsRequired: ["Permit to Dig (where required)"],
	},
	"Temporary Works Installation": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Eye protection"],
		plantEquipment: ["Lifting equipment", "Torque tools", "Survey instruments", "Access platforms"],
		riskAssessment: [
			{
				hazard: "Installation deviates from temporary works design",
				initialRisk: "High",
				controls: "Approved design brief, TW coordinator checks, hold points and sign-off",
				residualRisk: "Medium",
			},
			{
				hazard: "Premature loading of temporary works",
				initialRisk: "High",
				controls: "Load controls, exclusion zones and permit-to-load process",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Review approved temporary works design and constraints.",
			"Set out and install components in defined sequence.",
			"Undertake staged inspections and hold-point approvals.",
			"Issue permit-to-load/use on completion checks.",
		],
		emergencyProcedures: ["Stop work and evacuate exclusion zone", "Escalate to TW coordinator and emergency services if required"],
		environmentalControls: ["Control material storage", "Manage timber/steel waste", "Prevent ground contamination"],
		permitsRequired: ["Temporary Works Permit", "Permit to Load/Use"],
	},
	"Confined Space Entry": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Gas monitor", "Escape set / RPE as required"],
		plantEquipment: ["Gas detector", "Tripod and winch", "Ventilation fan", "Communication equipment"],
		riskAssessment: [
			{
				hazard: "Oxygen deficiency or toxic atmosphere",
				initialRisk: "High",
				controls: "Atmospheric testing, continuous monitoring, ventilation and entry permit",
				residualRisk: "Medium",
			},
			{
				hazard: "Entrapment / difficult rescue",
				initialRisk: "High",
				controls: "Trained rescue team, standby person, retrieval systems and rehearsed rescue plan",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Complete confined space risk assessment and issue permit.",
			"Set up barriers, ventilation and rescue equipment.",
			"Conduct pre-entry atmospheric tests and communication checks.",
			"Perform task with continuous monitoring and top-man supervision.",
			"Exit, close permit and debrief team.",
		],
		emergencyProcedures: ["No unauthorised rescue entry", "Initiate trained rescue response and call emergency services immediately"],
		environmentalControls: ["Contain contaminated residues", "Manage washout and decontamination waste"],
		permitsRequired: ["Confined Space Entry Permit", "Isolation Permit"],
	},
	"Hot Works (Welding/Cutting)": {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Welding gauntlets", "Face shield / welding mask", "FR clothing"],
		plantEquipment: ["Welding set", "Gas cutting equipment", "Fire blankets", "Fire extinguishers"],
		riskAssessment: [
			{
				hazard: "Fire from sparks and heat",
				initialRisk: "High",
				controls: "Hot works permit, area clearance, fire watch and extinguishers at point of work",
				residualRisk: "Medium",
			},
			{
				hazard: "Fume inhalation",
				initialRisk: "Medium",
				controls: "Local exhaust ventilation, suitable RPE and exposure control",
				residualRisk: "Low",
			},
		],
		methodStatementSteps: [
			"Inspect area and remove/protect combustibles.",
			"Issue hot works permit and confirm fire watch arrangements.",
			"Carry out welding/cutting using approved equipment and PPE.",
			"Complete post-work fire watch and permit close-out.",
		],
		emergencyProcedures: ["Stop hot works and raise alarm", "Use first-aid firefighting where safe", "Call emergency services"],
		environmentalControls: ["Fume extraction", "Gas cylinder storage controls", "Metal waste segregation"],
		permitsRequired: ["Hot Works Permit", "Fire Watch Record"],
	},
	Demolition: {
		ppeRequired: ["Hard hat", "Hi-vis", "Safety boots", "Gloves", "Respiratory protection", "Eye protection"],
		plantEquipment: ["Excavator with breaker", "Dust suppression", "Waste skips"],
		riskAssessment: [
			{
				hazard: "Structural collapse",
				initialRisk: "High",
				controls: "Engineered sequence, exclusion zones, competent supervision",
				residualRisk: "Medium",
			},
			{
				hazard: "Dust and airborne contaminants",
				initialRisk: "High",
				controls: "Suppression system, monitoring, RPE controls",
				residualRisk: "Medium",
			},
		],
		methodStatementSteps: [
			"Complete pre-demolition survey and isolate services.",
			"Set exclusion zones and install protective hoarding.",
			"Demolish in engineered sequence from top-down where applicable.",
			"Manage waste streams by segregation and controlled loading.",
			"Inspect area for remaining hazards and complete clearance.",
		],
		emergencyProcedures: ["Stop demolition and clear area", "Call emergency services", "Secure unstable structures"],
		environmentalControls: ["Dust suppression", "Noise/vibration monitoring", "Waste transfer records"],
		permitsRequired: ["Demolition Permit", "Permit to Dig"],
	},
};

export const FOCUSED_WORK_TYPES: WorkType[] = [
	"Earthworks Cut & Fill",
	"Excavation & Groundworks",
	"Subbase & Capping Installation",
	"Civils & Infrastructure Works",
	"Utility Ducting & Service Crossings",
	"Drainage Installation",
	"Deep Drainage & Manholes",
	"Kerbing & Edging Installation",
	"Footway & Paving Construction",
	"Ironwork Raise & Reset",
	"Road Planing / Milling",
	"Binder Course Surfacing",
	"Surface Course Surfacing",
	"Road Markings & Street Furniture",
	"Traffic Management & Roadworks",
	"Concrete Works",
	"Trench Fill Foundations",
	"Pad Foundations",
	"Piled Foundations",
	"Mass Concrete Foundations",
	"Steelfixing / Reinforcement",
	"Tarmac / Asphalt Surfacing",
	"Hand Laying Tarmac",
	"Hand Laying Tarmac (Footway Reinstatement)",
	"Hand Laying Tarmac (Carriageway Patching)",
	"Landscaping & External Works",
	"Temporary Works Installation",
];

function getSafeStorage<T>(key: string, fallback: T): T {
	if (typeof window === "undefined") {
		return fallback;
	}

	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

export function getRAMSDocumentsFromStorage(): RAMSDocument[] {
	return getSafeStorage<RAMSDocument[]>(STORAGE_KEY, []);
}

export function saveRAMSDocumentsToStorage(docs: RAMSDocument[]): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// API-based storage functions (async)
export async function loadRAMSDocumentsFromAPI(): Promise<RAMSDocument[]> {
	try {
		const response = await fetch("/api/rams", { cache: "no-store" });
		if (!response.ok) throw new Error("Failed to load documents");
		const data = await response.json();
		return data.success ? data.documents : [];
	} catch (error) {
		console.error("Error loading RAMS from API:", error);
		return [];
	}
}

export async function saveRAMSDocumentToAPI(doc: RAMSDocument): Promise<boolean> {
	try {
		const response = await fetch("/api/rams", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(doc),
		});
		const data = await response.json();
		return data.success;
	} catch (error) {
		console.error("Error saving RAMS to API:", error);
		return false;
	}
}

export async function deleteRAMSDocumentFromAPI(id: string): Promise<boolean> {
	try {
		const response = await fetch(`/api/rams?id=${encodeURIComponent(id)}`, {
			method: "DELETE",
		});
		const data = await response.json();
		return data.success;
	} catch (error) {
		console.error("Error deleting RAMS from API:", error);
		return false;
	}
}

export function getWorkTypeTemplates(): Record<WorkType, RAMSTemplate> {
	return WORK_TYPE_TEMPLATES;
}

function uniqueStrings(items: string[]): string[] {
	return Array.from(new Set(items));
}

function uniqueRiskItems(items: RiskItem[]): RiskItem[] {
	const seen = new Set<string>();
	const result: RiskItem[] = [];

	for (const item of items) {
		const key = `${item.hazard}|${item.controls}`;
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(item);
	}

	return result;
}

export function getMergedTemplateForWorkTypes(workTypes: WorkType[]): RAMSTemplate {
	const selectedWorkTypes = workTypes.length > 0 ? workTypes : [FOCUSED_WORK_TYPES[0]];

	const ppeRequired: string[] = [];
	const plantEquipment: string[] = [];
	const riskAssessment: RiskItem[] = [];
	const methodStatementSteps: string[] = [];
	const emergencyProcedures: string[] = [];
	const environmentalControls: string[] = [];
	const permitsRequired: string[] = [];

	for (const workType of selectedWorkTypes) {
		const template = WORK_TYPE_TEMPLATES[workType];
		ppeRequired.push(...template.ppeRequired);
		plantEquipment.push(...template.plantEquipment);
		riskAssessment.push(...template.riskAssessment.map((item) => ({ ...item })));
		methodStatementSteps.push(...template.methodStatementSteps);
		emergencyProcedures.push(...template.emergencyProcedures);
		environmentalControls.push(...template.environmentalControls);
		permitsRequired.push(...template.permitsRequired);
	}

	return {
		ppeRequired: uniqueStrings(ppeRequired),
		plantEquipment: uniqueStrings(plantEquipment),
		riskAssessment: uniqueRiskItems(riskAssessment),
		methodStatementSteps: uniqueStrings(methodStatementSteps),
		emergencyProcedures: uniqueStrings(emergencyProcedures),
		environmentalControls: uniqueStrings(environmentalControls),
		permitsRequired: uniqueStrings(permitsRequired),
	};
}

export function createRAMSDocument(input: {
	title: string;
	projectId?: string;
	projectName: string;
	projectManager?: string;
	projectPhase?: string;
	location: string;
	sitePostcode?: string;
	siteLat?: number;
	siteLon?: number;
	nearestHospitalName?: string;
	nearestHospitalAddress?: string;
	nearestHospitalDistanceKm?: number;
	nearestHospitalPhone?: string;
	hospitalLat?: number;
	hospitalLon?: number;
	workType: WorkType;
	workTypes?: WorkType[];
	author: string;
	approver?: string;
	issueDate: string;
	reviewDate?: string;
	tier1Profile?: Tier1Profile;
	revision?: number;
	approvalStatus?: "Draft" | "Pending Approval" | "Approved";
}): RAMSDocument {
	const selectedWorkTypes = input.workTypes && input.workTypes.length > 0 ? input.workTypes : [input.workType];
	const template = getMergedTemplateForWorkTypes(selectedWorkTypes);
	const now = new Date().toISOString();

	const doc: RAMSDocument = {
		id: `RAMS-${Date.now()}`,
		title: input.title,
		projectId: input.projectId,
		projectName: input.projectName,
		projectManager: input.projectManager,
		projectPhase: input.projectPhase,
		location: input.location,
		sitePostcode: input.sitePostcode,
		siteLat: input.siteLat,
		siteLon: input.siteLon,
		nearestHospitalName: input.nearestHospitalName,
		nearestHospitalAddress: input.nearestHospitalAddress,
		nearestHospitalDistanceKm: input.nearestHospitalDistanceKm,
		nearestHospitalPhone: input.nearestHospitalPhone,
		hospitalLat: input.hospitalLat,
		hospitalLon: input.hospitalLon,
		workType: input.workType,
		workTypes: selectedWorkTypes,
		author: input.author,
		approver: input.approver,
		issueDate: input.issueDate,
		reviewDate: input.reviewDate,
		tier1Profile: input.tier1Profile ?? "Standard",
		revision: input.revision ?? 1,
		approvalStatus: input.approvalStatus ?? "Draft",
		ppeRequired: [...template.ppeRequired],
		plantEquipment: [...template.plantEquipment],
		riskAssessment: template.riskAssessment.map((item) => ({ ...item })),
		methodStatementSteps: [...template.methodStatementSteps],
		emergencyProcedures: [...template.emergencyProcedures],
		environmentalControls: [...template.environmentalControls],
		permitsRequired: [...template.permitsRequired],
		createdDate: now,
		lastModifiedDate: now,
	};

	const existing = getRAMSDocumentsFromStorage();
	saveRAMSDocumentsToStorage([doc, ...existing]);
	return doc;
}

export function updateRAMSDocument(updatedDoc: RAMSDocument): RAMSDocument {
	const docs = getRAMSDocumentsFromStorage();
	const updated: RAMSDocument = {
		...updatedDoc,
		lastModifiedDate: new Date().toISOString(),
	};

	saveRAMSDocumentsToStorage(docs.map((doc) => (doc.id === updated.id ? updated : doc)));
	return updated;
}

export function deleteRAMSDocument(id: string): void {
	const docs = getRAMSDocumentsFromStorage();
	saveRAMSDocumentsToStorage(docs.filter((doc) => doc.id !== id));
}

export function splitMultiline(value: string): string[] {
	return value
		.split("\n")
		.map((item) => item.trim())
		.filter(Boolean);
}

