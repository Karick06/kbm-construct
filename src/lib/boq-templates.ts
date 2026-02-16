/**
 * BoQ Template Library
 * Pre-built templates for each measurement standard
 */

import type { BoQItem, BillOfQuantities } from './boq-models';

export interface BoQTemplate {
  id: string;
  name: string;
  standard: 'SMM7' | 'CESMM' | 'SHW';
  description: string;
  category: string;
  items: Omit<BoQItem, 'id'>[];
}

export const BOQ_TEMPLATES: BoQTemplate[] = [
  // SMM7 Templates
  {
    id: 'smm7-residential',
    name: 'Residential Building',
    standard: 'SMM7',
    description: 'Standard template for residential construction',
    category: 'Building',
    items: [
      {
        itemNumber: 'A.1',
        description: 'Preliminaries and general conditions',
        unit: 'sum',
        quantity: 1,
        rate: 25000,
        amount: 25000,
        standard: 'SMM7',
        section: 'General',
      },
      {
        itemNumber: 'C.1',
        description: 'Excavation and foundation works per m³',
        unit: 'm³',
        quantity: 150,
        rate: 85,
        amount: 12750,
        standard: 'SMM7',
        section: 'Ground Works',
      },
      {
        itemNumber: 'D.1',
        description: 'Reinforced concrete slab per m²',
        unit: 'm²',
        quantity: 250,
        rate: 65,
        amount: 16250,
        standard: 'SMM7',
        section: 'Concrete Works',
      },
      {
        itemNumber: 'E.1',
        description: 'Brickwork per m²',
        unit: 'm²',
        quantity: 800,
        rate: 45,
        amount: 36000,
        standard: 'SMM7',
        section: 'Masonry',
      },
    ],
  },
  {
    id: 'smm7-extension',
    name: 'Building Extension',
    standard: 'SMM7',
    description: 'Template for residential extensions',
    category: 'Building',
    items: [
      {
        itemNumber: 'A.1',
        description: 'Site preliminaries',
        unit: 'sum',
        quantity: 1,
        rate: 15000,
        amount: 15000,
        standard: 'SMM7',
        section: 'General',
      },
      {
        itemNumber: 'G.1',
        description: 'Timber framing per m²',
        unit: 'm²',
        quantity: 120,
        rate: 55,
        amount: 6600,
        standard: 'SMM7',
        section: 'Carpentry',
      },
      {
        itemNumber: 'H.1',
        description: 'Roof covering per m²',
        unit: 'm²',
        quantity: 120,
        rate: 75,
        amount: 9000,
        standard: 'SMM7',
        section: 'Roofing',
      },
    ],
  },
  {
    id: 'smm7-commercial',
    name: 'Commercial Office Building',
    standard: 'SMM7',
    description: 'Comprehensive template for commercial office construction',
    category: 'Building',
    items: [
      // General
      {
        itemNumber: 'A.1.1',
        description: 'Attendance on site, welfare facilities and site management',
        unit: 'sum',
        quantity: 1,
        rate: 85000,
        amount: 85000,
        standard: 'SMM7',
        section: 'General',
      },
      {
        itemNumber: 'A.2.1',
        description: 'Site Insurance and Safety compliance',
        unit: 'sum',
        quantity: 1,
        rate: 45000,
        amount: 45000,
        standard: 'SMM7',
        section: 'General',
      },
      // Demolitions
      {
        itemNumber: 'B.1.1',
        description: 'Demolition of existing structures',
        unit: 'sum',
        quantity: 1,
        rate: 35000,
        amount: 35000,
        standard: 'SMM7',
        section: 'Demolitions',
      },
      // Ground Works
      {
        itemNumber: 'C.1.1',
        description: 'Excavation for foundations per m³',
        unit: 'm³',
        quantity: 2500,
        rate: 28,
        amount: 70000,
        standard: 'SMM7',
        section: 'Ground Works',
      },
      // Concrete Works
      {
        itemNumber: 'D.1.1',
        description: 'Reinforced concrete foundations per m³',
        unit: 'm³',
        quantity: 800,
        rate: 320,
        amount: 256000,
        standard: 'SMM7',
        section: 'Concrete Works',
      },
      {
        itemNumber: 'D.2.1',
        description: 'Concrete floor slabs per m²',
        unit: 'm²',
        quantity: 8500,
        rate: 85,
        amount: 722500,
        standard: 'SMM7',
        section: 'Concrete Works',
      },
      // Masonry
      {
        itemNumber: 'E.1.1',
        description: 'External brickwork per m²',
        unit: 'm²',
        quantity: 6200,
        rate: 65,
        amount: 403000,
        standard: 'SMM7',
        section: 'Masonry',
      },
      // Steelwork
      {
        itemNumber: 'F.1.1',
        description: 'Structural steelwork per tonne',
        unit: 't',
        quantity: 450,
        rate: 1400,
        amount: 630000,
        standard: 'SMM7',
        section: 'Steelwork',
      },
      // Roofing
      {
        itemNumber: 'H.1.1',
        description: 'Flat roof with bituminous covering per m²',
        unit: 'm²',
        quantity: 3500,
        rate: 95,
        amount: 332500,
        standard: 'SMM7',
        section: 'Roofing',
      },
      // Services
      {
        itemNumber: 'N.1.1',
        description: 'Mechanical and electrical services - Main items',
        unit: 'sum',
        quantity: 1,
        rate: 580000,
        amount: 580000,
        standard: 'SMM7',
        section: 'Services',
      },
    ],
  },

  // CESMM Templates
  {
    id: 'cesmm-highways',
    name: 'Highway Works',
    standard: 'CESMM',
    description: 'Standard template for road and highway projects',
    category: 'Civil Engineering',
    items: [
      {
        itemNumber: 'A.1',
        description: 'General and site requirements',
        unit: 'sum',
        quantity: 1,
        rate: 50000,
        amount: 50000,
        standard: 'CESMM',
        section: 'General',
      },
      {
        itemNumber: 'D.1',
        description: 'Earthworks - excavation per m³',
        unit: 'm³',
        quantity: 2000,
        rate: 12,
        amount: 24000,
        standard: 'CESMM',
        section: 'Earthworks',
      },
      {
        itemNumber: 'H.1',
        description: 'Surface layers - bitumen per m²',
        unit: 'm²',
        quantity: 3000,
        rate: 28,
        amount: 84000,
        standard: 'CESMM',
        section: 'Surface Works',
      },
      {
        itemNumber: 'I.1',
        description: 'Drainage - pipes per m',
        unit: 'm',
        quantity: 500,
        rate: 85,
        amount: 42500,
        standard: 'CESMM',
        section: 'Drainage',
      },
    ],
  },
  {
    id: 'cesmm-highway-comprehensive',
    name: 'Highway Resurfacing Project',
    standard: 'CESMM',
    description: 'Comprehensive highway resurfacing with drainage',
    category: 'Civil Engineering',
    items: [
      // General
      {
        itemNumber: 'A.1.1',
        description: 'General and site requirements',
        unit: 'sum',
        quantity: 1,
        rate: 125000,
        amount: 125000,
        standard: 'CESMM',
        section: 'General',
      },
      // Earthworks
      {
        itemNumber: 'D.1.1',
        description: 'General excavation and site preparation per m³',
        unit: 'm³',
        quantity: 8500,
        rate: 18,
        amount: 153000,
        standard: 'CESMM',
        section: 'Earthworks',
      },
      {
        itemNumber: 'D.2.1',
        description: 'Foundation material laying per m²',
        unit: 'm²',
        quantity: 12000,
        rate: 15,
        amount: 180000,
        standard: 'CESMM',
        section: 'Earthworks',
      },
      // Surface Works
      {
        itemNumber: 'H.1.1',
        description: 'Base course bituminous material per m²',
        unit: 'm²',
        quantity: 12000,
        rate: 35,
        amount: 420000,
        standard: 'CESMM',
        section: 'Surface Works',
      },
      {
        itemNumber: 'H.2.1',
        description: 'Wearing course bituminous material per m²',
        unit: 'm²',
        quantity: 12000,
        rate: 42,
        amount: 504000,
        standard: 'CESMM',
        section: 'Surface Works',
      },
      // Drainage
      {
        itemNumber: 'I.1.1',
        description: 'Drainage pipework 225mm dia per m',
        unit: 'm',
        quantity: 2500,
        rate: 125,
        amount: 312500,
        standard: 'CESMM',
        section: 'Drainage',
      },
      // Traffic Features
      {
        itemNumber: 'K.1.1',
        description: 'Road markings and centre lines per m',
        unit: 'm',
        quantity: 15000,
        rate: 4.50,
        amount: 67500,
        standard: 'CESMM',
        section: 'Traffic Features',
      },
    ],
  },
  {
    id: 'cesmm-bridge',
    name: 'Bridge Construction',
    standard: 'CESMM',
    description: 'Template for bridge and structural projects',
    category: 'Civil Engineering',
    items: [
      {
        itemNumber: 'A.1',
        description: 'General and preliminary items',
        unit: 'sum',
        quantity: 1,
        rate: 100000,
        amount: 100000,
        standard: 'CESMM',
        section: 'General',
      },
      {
        itemNumber: 'E.1',
        description: 'Concrete for bridge deck per m³',
        unit: 'm³',
        quantity: 500,
        rate: 250,
        amount: 125000,
        standard: 'CESMM',
        section: 'Concrete Works',
      },
      {
        itemNumber: 'F.1',
        description: 'Structural steelwork per tonne',
        unit: 't',
        quantity: 150,
        rate: 1200,
        amount: 180000,
        standard: 'CESMM',
        section: 'Steelwork',
      },
    ],
  },

  // SHW Templates - Specification for Highways Works
  {
    id: 'shw-motorway',
    name: 'Motorway Resurfacing',
    standard: 'SHW',
    description: 'Major motorway or trunk road resurfacing project',
    category: 'Highways',
    items: [
      {
        itemNumber: 'A.1',
        description: 'General and site requirements',
        unit: 'sum',
        quantity: 1,
        rate: 150000,
        amount: 150000,
        standard: 'SHW',
        section: 'General',
      },
      {
        itemNumber: 'B.1',
        description: 'Existing pavement removal and disposal per m²',
        unit: 'm²',
        quantity: 8000,
        rate: 8,
        amount: 64000,
        standard: 'SHW',
        section: 'Demolition',
      },
      {
        itemNumber: 'E.1',
        description: 'New base course per m²',
        unit: 'm²',
        quantity: 8000,
        rate: 18,
        amount: 144000,
        standard: 'SHW',
        section: 'Foundations',
      },
      {
        itemNumber: 'F.1',
        description: 'New surfacing - wearing course per m²',
        unit: 'm²',
        quantity: 8000,
        rate: 35,
        amount: 280000,
        standard: 'SHW',
        section: 'Pavement',
      },
      {
        itemNumber: 'H.1',
        description: 'Road markings and signage',
        unit: 'sum',
        quantity: 1,
        rate: 45000,
        amount: 45000,
        standard: 'SHW',
        section: 'Traffic Features',
      },
    ],
  },
  {
    id: 'shw-rural-road',
    name: 'Rural Road Construction',
    standard: 'SHW',
    description: 'New or upgraded rural road construction',
    category: 'Highways',
    items: [
      {
        itemNumber: 'A.1',
        description: 'General and site preliminaries',
        unit: 'sum',
        quantity: 1,
        rate: 75000,
        amount: 75000,
        standard: 'SHW',
        section: 'General',
      },
      {
        itemNumber: 'C.1',
        description: 'Site clearance and preparation per m²',
        unit: 'm²',
        quantity: 5000,
        rate: 4,
        amount: 20000,
        standard: 'SHW',
        section: 'Earthworks',
      },
      {
        itemNumber: 'D.1',
        description: 'Fill material, compacted per m³',
        unit: 'm³',
        quantity: 800,
        rate: 15,
        amount: 12000,
        standard: 'SHW',
        section: 'Cuttings & Embankments',
      },
      {
        itemNumber: 'E.1',
        description: 'Gravel base layer per m²',
        unit: 'm²',
        quantity: 5000,
        rate: 12,
        amount: 60000,
        standard: 'SHW',
        section: 'Foundations',
      },
      {
        itemNumber: 'F.1',
        description: 'Bitumen surface per m²',
        unit: 'm²',
        quantity: 5000,
        rate: 22,
        amount: 110000,
        standard: 'SHW',
        section: 'Pavement',
      },
      {
        itemNumber: 'G.1',
        description: 'Drainage and culverts',
        unit: 'sum',
        quantity: 1,
        rate: 35000,
        amount: 35000,
        standard: 'SHW',
        section: 'Drainage',
      },
      {
        itemNumber: 'I.1',
        description: 'Boundary fencing',
        unit: 'sum',
        quantity: 1,
        rate: 25000,
        amount: 25000,
        standard: 'SHW',
        section: 'Fencing & Boundaries',
      },
    ],
  },
];

/**
 * Get templates by standard
 */
export function getTemplatesByStandard(standard: 'SMM7' | 'CESMM' | 'SHW') {
  return BOQ_TEMPLATES.filter((t) => t.standard === standard);
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): BoQTemplate | undefined {
  return BOQ_TEMPLATES.find((t) => t.id === id);
}

/**
 * Create BoQ from template
 */
export function createBoQFromTemplate(
  template: BoQTemplate,
  projectName: string,
  preparedBy: string
): BillOfQuantities {
  const items: BoQItem[] = template.items.map((item) => ({
    ...item,
    id: `item-${Date.now()}-${Math.random()}`,
  }));

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const contingency = (subtotal * 10) / 100; // Default 10%

  return {
    id: `boq-${Date.now()}`,
    projectId: `proj-${Date.now()}`,
    projectName,
    standard: template.standard,
    title: template.name,
    date: new Date().toISOString().split('T')[0],
    preparedBy,
    items,
    sections: [],
    subtotal,
    contingency,
    contingencyPercent: 10,
    total: subtotal + contingency,
    status: 'draft',
  };
}
