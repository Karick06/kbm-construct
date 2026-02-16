/**
 * Bill of Quantities (BoQ) Data Models
 * Supports SMM7, CESMM, and SHW measurement standards
 */

export type MeasurementStandard = 'SMM7' | 'CESMM' | 'SHW';

export interface BoQItem {
  id: string;
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number; // £ per unit
  amount: number; // quantity × rate
  standard: MeasurementStandard;
  section?: string;
  notes?: string;
}

export interface BillOfQuantities {
  id: string;
  projectId: string;
  projectName: string;
  standard: MeasurementStandard;
  title: string;
  date: string;
  preparedBy: string;
  items: BoQItem[];
  sections: BoQSection[];
  subtotal: number;
  contingency: number;
  contingencyPercent: number;
  total: number;
  status: 'draft' | 'issued' | 'priced' | 'approved';
}

export interface BoQSection {
  id: string;
  name: string;
  description?: string;
  items: BoQItem[];
  subtotal: number;
  order: number;
}

/**
 * SMM7 - Standard Method of Measurement (7th Edition)
 * UK standard for building works measurement
 */
export const SMM7_SECTIONS = [
  { id: 'a', name: 'General', description: 'Preliminaries and site works' },
  { id: 'b', name: 'Demolitions', description: 'Demolition and site clearance' },
  { id: 'c', name: 'Ground Works', description: 'Ground works and earthworks' },
  { id: 'd', name: 'Concrete Works', description: 'In-situ and pre-cast concrete' },
  { id: 'e', name: 'Masonry', description: 'Unit masonry and brickwork' },
  { id: 'f', name: 'Steelwork', description: 'Structural and misc steelwork' },
  { id: 'g', name: 'Carpentry', description: 'Timber and carcassing' },
  { id: 'h', name: 'Roofing', description: 'Roof coverings and associated work' },
  { id: 'i', name: 'Cladding', description: 'External walls and cladding' },
  { id: 'j', name: 'Internal Walls', description: 'Partition walls and linings' },
  { id: 'k', name: 'Doors & Windows', description: 'Doors, windows and screens' },
  { id: 'l', name: 'Finishings', description: 'Screed, flooring, finishes' },
  { id: 'm', name: 'Decorations', description: 'Painting and decorative finishes' },
  { id: 'n', name: 'Services', description: 'Mechanical and electrical services' },
  { id: 'p', name: 'Drainage', description: 'Drainage and sewerage' },
  { id: 'r', name: 'External Works', description: 'Landscaping and hardworks' },
];

/**
 * CESMM - Civil Engineering Standard Method of Measurement
 * UK standard for civil engineering works
 */
export const CESMM_SECTIONS = [
  { id: 'a', name: 'General', description: 'General and contract requirements' },
  { id: 'b', name: 'Ground Investigation', description: 'Site investigation works' },
  { id: 'c', name: 'Geotechnical Works', description: 'Ground stabilization' },
  { id: 'd', name: 'Earthworks', description: 'Excavation and filling' },
  { id: 'e', name: 'Concrete Works', description: 'Concrete structures' },
  { id: 'f', name: 'Steelwork', description: 'Structural steel' },
  { id: 'g', name: 'Timber Work', description: 'Timber and timber piles' },
  { id: 'h', name: 'Surface Works', description: 'Pavements and surfacing' },
  { id: 'i', name: 'Drainage', description: 'Drainage systems' },
  { id: 'j', name: 'Utilities', description: 'Water, gas, electricity' },
  { id: 'k', name: 'Rail Works', description: 'Railway systems (if applicable)' },
];

/**
 * SHW - Specification for Highways Works
 * UK standard for highway and road works measurement and specification
 */
export const SHW_SECTIONS = [
  { id: 'a', name: 'General', description: 'General and contract requirements' },
  { id: 'b', name: 'Demolition', description: 'Demolition of existing structures' },
  { id: 'c', name: 'Earthworks', description: 'Site preparation and earthworks' },
  { id: 'd', name: 'Cuttings & Embankments', description: 'Cut and fill works' },
  { id: 'e', name: 'Foundations', description: 'Pavement foundations and base courses' },
  { id: 'f', name: 'Pavement', description: 'Surfacing and wearing courses' },
  { id: 'g', name: 'Drainage', description: 'Highway drainage systems' },
  { id: 'h', name: 'Traffic Features', description: 'Markings, signs, safety barriers' },
  { id: 'i', name: 'Fencing & Boundaries', description: 'Fencing and perimeter works' },
];

/**
 * Standard Units for Construction Measurement
 */
export const MEASUREMENT_UNITS = {
  length: ['m', 'mm', 'cm'],
  area: ['m²', 'mm²'],
  volume: ['m³', 'L', 'ml'],
  mass: ['t', 'kg'],
  quantity: ['no', 'nr'],
  time: ['day', 'week', 'month'],
};

export const COMMON_UNITS = [
  'm',
  'm²',
  'm³',
  'no',
  'nr',
  't',
  'kg',
  'L',
  'day',
  'week',
  'month',
  'sum',
];
