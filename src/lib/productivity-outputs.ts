// Industry-standard productivity outputs for civils/groundworks
// Based on Spon's, BCIS, and industry best practices
//
// This module provides productivity templates that can be resolved with actual rates from your libraries.
// Use resolveProductivityRates() with your CSV labour, material, and plant rates to get accurate costs.
// Templates include fallback rates that are used if library items are not found.

import type { CSVLabourRate } from './csv-labour-rates';
import type { CSVMaterialRate } from './csv-material-rates';
import type { CSVPlantRate } from './csv-plant-rates';

export type GangMember = {
  role: string;
  count: number;
  rate: number; // £/hour
};

export type MaterialItem = {
  description: string;
  quantityPerUnit: number; // Quantity per unit of work
  unit: string;
  rate: number; // £ per unit
};

export type PlantItem = {
  description: string;
  quantityPerUnit: number; // Hours or days per unit of work
  unit: string; // 'hour' or 'day'
  rate: number; // £ per hour or day
};

// Template structure using library references
export type GangMemberTemplate = {
  role: string;
  count: number;
  labourCode?: string; // Reference to labour library
  fallbackRate?: number; // Used if library item not found
};

export type MaterialItemTemplate = {
  materialCode?: string; // Reference to material library
  description: string;
  quantityPerUnit: number;
  unit: string;
  fallbackRate?: number; // Used if library item not found
};

export type PlantItemTemplate = {
  plantCode?: string; // Reference to plant library
  description: string;
  quantityPerUnit: number;
  unit: string; // 'hour' or 'day'
  fallbackRate?: number; // Used if library item not found
};

export type ProductivityRateTemplate = {
  id: string;
  category: 'excavation' | 'drainage' | 'concrete' | 'roads' | 'brickwork' | 'paving' | 'kerbs' | 'formwork' | 'reinforcement' | 'stonework' | 'general';
  description: string;
  unit: string;
  outputPerDay: number;
  gang: GangMemberTemplate[];
  materials?: MaterialItemTemplate[];
  plant?: PlantItemTemplate[];
  notes?: string;
};

export type ProductivityRate = {
  id: string;
  category: 'excavation' | 'drainage' | 'concrete' | 'roads' | 'brickwork' | 'paving' | 'kerbs' | 'formwork' | 'reinforcement' | 'stonework' | 'general';
  description: string;
  unit: string;
  outputPerDay: number; // Output per gang per day
  gang: GangMember[];
  materials?: MaterialItem[];
  plant?: PlantItem[];
  notes?: string;
};

// Fallback rates if library items not found
const FALLBACK_LABOUR_RATES = {
  ganger: 22.50,
  skilled: 20.00,
  semiskilled: 18.00,
  labourer: 16.00,
  bricklayer: 22.00,
  paver: 20.00,
  finisher: 21.00,
  operator: 24.00,
  driver: 19.00,
};

// Productivity templates (to be resolved with library rates)
export const PRODUCTIVITY_TEMPLATES: ProductivityRateTemplate[] = [
  // EXCAVATION
  {
    id: 'exc-topsoil-strip',
    category: 'excavation',
    description: 'Strip topsoil to 150mm depth (SMM7 E.5.1.1)',
    unit: 'm²',
    outputPerDay: 250,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Banksman', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P06', description: '9t Excavator', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 237.0 },
      { plantCode: 'P13', description: 'Dumper 6t', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 178.40 },
    ],
    notes: 'Strip and set aside topsoil for reuse',
  },
  {
    id: 'exc-reduced-level-soft',
    category: 'excavation',
    description: 'Excavate to reduced level - soft material (CESSM4 E.4.2)',
    unit: 'm³',
    outputPerDay: 150,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Banksman', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P07', description: '14t Excavator', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 315.0 },
      { plantCode: 'P14', description: 'Dumper 9t', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 210.80 },
    ],
    notes: 'Bulk excavation to formation level',
  },
  {
    id: 'exc-reduced-level-rock',
    category: 'excavation',
    description: 'Excavate to reduced level - rock (CESSM4 E.4.3)',
    unit: 'm³',
    outputPerDay: 35,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Banksman', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P08', description: '21t Excavator', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 382.20 },
      { plantCode: 'P10', description: 'Pecker (breaker)', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 38.50 },
    ],
    notes: 'Rock excavation with hydraulic breaker',
  },
  {
    id: 'exc-trench-services-600mm',
    category: 'excavation',
    description: 'Excavate trench 600mm wide max 1m deep (SMM7 E.6.1)',
    unit: 'm',
    outputPerDay: 40,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Service trench excavation - utilities',
  },
  {
    id: 'exc-trench-services-1500mm',
    category: 'excavation',
    description: 'Excavate trench 1.5m wide 1-2m deep (SMM7 E.6.2)',
    unit: 'm',
    outputPerDay: 25,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P06', description: '9t Excavator', quantityPerUnit: 0.35, unit: 'day', fallbackRate: 237.0 },
    ],
    notes: 'Deep service trench - may require shoring',
  },
  {
    id: 'exc-foundation-strip',
    category: 'excavation',
    description: 'Excavate strip foundation trench 600mm wide (SMM7 E.7.1)',
    unit: 'm',
    outputPerDay: 35,
    gang: [
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Building foundation trench excavation',
  },
  {
    id: 'exc-pit-base-1m',
    category: 'excavation',
    description: 'Excavate pit or base pad not exceeding 1m² (SMM7 E.8)',
    unit: 'nr',
    outputPerDay: 8,
    gang: [
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    notes: 'Hand excavation for column bases and small pits',
  },
  {
    id: 'exc-machine-medium',
    category: 'excavation',
    description: 'Machine excavation - medium ground',
    unit: 'm³',
    outputPerDay: 45,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Banksman/Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.375, unit: 'day', fallbackRate: 159.80 },
    ],
  },
  {
    id: 'exc-machine-hard',
    category: 'excavation',
    description: 'Machine excavation - hard ground/breaking',
    unit: 'm³',
    outputPerDay: 25,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Banksman/Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P06', description: '6t Excavator', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 209.0 },
    ],
  },
  {
    id: 'exc-hand-soft',
    category: 'excavation',
    description: 'Hand excavation - soft ground',
    unit: 'm³',
    outputPerDay: 4,
    gang: [
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
  },
  {
    id: 'exc-hand-medium',
    category: 'excavation',
    description: 'Hand excavation - medium ground',
    unit: 'm³',
    outputPerDay: 2.5,
    gang: [
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
  },
  {
    id: 'exc-trim-formation',
    category: 'excavation',
    description: 'Trim and level formation',
    unit: 'm²',
    outputPerDay: 80,
    gang: [
      { role: 'Skilled Labourer', count: 1, labourCode: 'L09', fallbackRate: 22.0 /* Skilled Labourer */ },
    ],
  },
  
  // DRAINAGE
  {
    id: 'drain-100mm-trench',
    category: 'drainage',
    description: 'Lay 100mm drainage pipe in trench (inc. bedding)',
    unit: 'm',
    outputPerDay: 16,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 /* Ganger/Foreman */ },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: '100mm PVC-U drainage pipe', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 3.50 },
      { description: 'Sharp sand (bedding)', materialCode: 'MG0020UKS', quantityPerUnit: 0.12, unit: 'm³', fallbackRate: 28.0 },
    ],
    plant: [
      { plantCode: 'P03', description: '1.5t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 128.0 },
    ],
  },
  {
    id: 'drain-150mm-trench',
    category: 'drainage',
    description: 'Lay 150mm drainage pipe in trench (inc. bedding)',
    unit: 'm',
    outputPerDay: 14,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: '150mm PVC-U drainage pipe', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 5.20 },
      { description: 'Sharp sand (bedding)', materialCode: 'MG0020UKS', quantityPerUnit: 0.15, unit: 'm³', fallbackRate: 28.0 },
    ],
    plant: [
      { plantCode: 'P03', description: '1.5t Excavator', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 128.0 },
    ],
  },
  {
    id: 'drain-225mm-trench',
    category: 'drainage',
    description: 'Lay 225mm drainage pipe in trench (inc. bedding)',
    unit: 'm',
    outputPerDay: 12,
    gang: [
      { role: 'Ganger', count: 1, fallbackRate: FALLBACK_LABOUR_RATES.ganger },
      { role: 'Labourer', count: 2, fallbackRate: FALLBACK_LABOUR_RATES.labourer },
    ],
    materials: [
      { description: '225mm PVC-U drainage pipe', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 12.50 },
      { description: 'Pea gravel bedding', quantityPerUnit: 0.20, unit: 'm³', fallbackRate: 35.00 },
    ],
    plant: [
      { description: 'Mini excavator', quantityPerUnit: 0.7, unit: 'hour', fallbackRate: 25.00 },
    ],
  },
  {
    id: 'drain-manhole-1200',
    category: 'drainage',
    description: 'Construct precast manhole 1200mm diameter (1.5m deep)',
    unit: 'nr',
    outputPerDay: 1.5,
    gang: [
      { role: 'Ganger', count: 1, fallbackRate: FALLBACK_LABOUR_RATES.ganger },
      { role: 'Skilled Worker', count: 1, fallbackRate: FALLBACK_LABOUR_RATES.skilled },
      { role: 'Labourer', count: 2, fallbackRate: FALLBACK_LABOUR_RATES.labourer },
    ],
    materials: [
      { description: 'Precast concrete chamber ring 1200mm', quantityPerUnit: 3, unit: 'nr', fallbackRate: 180.00 },
      { description: 'Manhole cover and frame D400', quantityPerUnit: 1, unit: 'nr', fallbackRate: 145.00 },
      { description: 'Benching concrete C20', quantityPerUnit: 0.3, unit: 'm³', fallbackRate: 120.00 },
    ],
    plant: [
      { description: 'Excavator 3-5 tonne', quantityPerUnit: 4, unit: 'hour', fallbackRate: 35.00 },
      { description: 'Concrete mixer', quantityPerUnit: 2, unit: 'hour', fallbackRate: 15.00 },
    ],
  },
  {
    id: 'drain-inspection-chamber',
    category: 'drainage',
    description: 'Install plastic inspection chamber',
    unit: 'nr',
    outputPerDay: 3,
    gang: [
      { role: 'Ganger', count: 1, fallbackRate: FALLBACK_LABOUR_RATES.ganger },
      { role: 'Labourer', count: 1, fallbackRate: FALLBACK_LABOUR_RATES.labourer },
    ],
    materials: [
      { description: 'Plastic inspection chamber 450mm', quantityPerUnit: 1, unit: 'nr', fallbackRate: 65.00 },
      { description: 'Pea gravel surround', quantityPerUnit: 0.15, unit: 'm³', fallbackRate: 35.00 },
    ],
    plant: [
      { description: 'Mini excavator', quantityPerUnit: 0.8, unit: 'hour', fallbackRate: 25.00 },
    ],
  },
  {
    id: 'drain-300mm-pipe',
    category: 'drainage',
    description: 'Lay 300mm drainage pipe in trench (CESSM4 J)',
    unit: 'm',
    outputPerDay: 10,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: '300mm PVC-U drainage pipe', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 18.50 },
      { description: 'Pea gravel bedding 150mm', quantityPerUnit: 0.25, unit: 'm³', fallbackRate: 35.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.4, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Main sewer - depths 1-2m',
  },
  {
    id: 'drain-375mm-pipe',
    category: 'drainage',
    description: 'Lay 375mm drainage pipe in trench (CESSM4 J)',
    unit: 'm',
    outputPerDay: 8,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: '375mm PVC-U drainage pipe', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 28.00 },
      { description: 'Pea gravel bedding 150mm', quantityPerUnit: 0.30, unit: 'm³', fallbackRate: 35.0 },
    ],
    plant: [
      { plantCode: 'P06', description: '9t Excavator', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 237.0 },
    ],
    notes: 'Main sewer - depths 2-3m',
  },
  {
    id: 'drain-450mm-pipe',
    category: 'drainage',
    description: 'Lay 450mm drainage pipe in trench (CESSM4 J)',
    unit: 'm',
    outputPerDay: 6,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: '450mm PVC-U drainage pipe', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 42.00 },
      { description: 'Pea gravel bedding 200mm', quantityPerUnit: 0.40, unit: 'm³', fallbackRate: 35.0 },
    ],
    plant: [
      { plantCode: 'P06', description: '9t Excavator', quantityPerUnit: 0.6, unit: 'day', fallbackRate: 237.0 },
    ],
    notes: 'Large sewer - depths 2-3m',
  },
  {
    id: 'drain-600mm-pipe',
    category: 'drainage',
    description: 'Lay 600mm drainage pipe in trench (CESSM4 J)',
    unit: 'm',
    outputPerDay: 4,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: '600mm PVC-U drainage pipe', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 75.00 },
      { description: 'Pea gravel bedding 250mm', quantityPerUnit: 0.55, unit: 'm³', fallbackRate: 35.0 },
    ],
    plant: [
      { plantCode: 'P07', description: '14t Excavator', quantityPerUnit: 0.8, unit: 'day', fallbackRate: 315.0 },
      { plantCode: 'P13', description: 'Dumper 6t', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 178.40 },
    ],
    notes: 'Trunk sewer - depths 2.5-4m',
  },
  {
    id: 'drain-manhole-900-deep',
    category: 'drainage',
    description: 'Precast manhole 900mm dia. up to 2.5m deep (CESSM4 K)',
    unit: 'nr',
    outputPerDay: 2,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Precast chamber ring 900mm', quantityPerUnit: 4, unit: 'nr', fallbackRate: 125.00 },
      { description: 'Manhole cover & frame D400', quantityPerUnit: 1, unit: 'nr', fallbackRate: 145.00 },
      { description: 'Benching concrete C20', quantityPerUnit: 0.25, unit: 'm³', fallbackRate: 120.00 },
    ],
    plant: [
      { plantCode: 'P06', description: '9t Excavator', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 237.0 },
    ],
    notes: 'Standard access chamber',
  },
  {
    id: 'drain-manhole-1500-deep',
    category: 'drainage',
    description: 'Precast manhole 1500mm dia. 2.5-4m deep (CESSM4 K)',
    unit: 'nr',
    outputPerDay: 0.8,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 2, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Precast chamber ring 1500mm', quantityPerUnit: 6, unit: 'nr', fallbackRate: 245.00 },
      { description: 'Manhole cover & frame D400 double triangle', quantityPerUnit: 1, unit: 'nr', fallbackRate: 325.00 },
      { description: 'Benching concrete C20', quantityPerUnit: 0.5, unit: 'm³', fallbackRate: 120.00 },
    ],
    plant: [
      { plantCode: 'P07', description: '14t Excavator', quantityPerUnit: 1.25, unit: 'day', fallbackRate: 315.0 },
    ],
    notes: 'Deep chamber - may require shoring',
  },
  {
    id: 'drain-gully-road',
    category: 'drainage',
    description: 'Road gully with trapped outlet (MCHW Series 500)',
    unit: 'nr',
    outputPerDay: 4,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Gully pot trapped 375mm', quantityPerUnit: 1, unit: 'nr', fallbackRate: 52.00 },
      { description: 'Cast iron grating D400', quantityPerUnit: 1, unit: 'nr', fallbackRate: 38.00 },
      { description: 'Concrete surround C20', quantityPerUnit: 0.15, unit: 'm³', fallbackRate: 120.00 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Standard highway gully',
  },
  {
    id: 'drain-carrier-pipe',
    category: 'drainage',
    description: 'Highway carrier drain 100mm perforated (MCHW 500)',
    unit: 'm',
    outputPerDay: 18,
    gang: [
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: '100mm perforated land drain', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 4.25 },
      { description: 'Pea gravel 20-40mm', quantityPerUnit: 0.10, unit: 'm³', fallbackRate: 35.0 },
    ],
    plant: [
      { plantCode: 'P03', description: '1.5t Excavator', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 128.0 },
    ],
    notes: 'Edge of carriageway drainage',
  },
  
  // CONCRETE WORKS
  {
    id: 'conc-pour-slab',
    category: 'concrete',
    description: 'Pour and level concrete slab (ready-mix)',
    unit: 'm³',
    outputPerDay: 20,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Worker', count: 2, labourCode: 'L13', fallbackRate: 28.0 /* Groundworker */ },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C25', materialCode: 'MC0020UKS', quantityPerUnit: 1.05, unit: 'm³', fallbackRate: 125.0 },
      { description: 'Mesh reinforcement A142', materialCode: 'MS0030UKS', quantityPerUnit: 10, unit: 'm²', fallbackRate: 4.50 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 750.0 },
      { description: 'Poker vibrator', quantityPerUnit: 0.5, unit: 'hour', fallbackRate: 8.00 },
    ],
  },
  {
    id: 'conc-finish-floor',
    category: 'concrete',
    description: 'Power float concrete floor finish',
    unit: 'm²',
    outputPerDay: 60,
    gang: [
      { role: 'Finisher', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    plant: [
      { plantCode: 'P30', description: 'Power Float', quantityPerUnit: 0.13, unit: 'day', fallbackRate: 81.80 },
    ],
  },
  {
    id: 'conc-finish-trowel',
    category: 'concrete',
    description: 'Hand trowel concrete finish',
    unit: 'm²',
    outputPerDay: 30,
    gang: [
      { role: 'Finisher', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
    ],
  },
  {
    id: 'conc-foundation',
    category: 'concrete',
    description: 'Pour concrete foundations/footings',
    unit: 'm³',
    outputPerDay: 15,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Worker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 3, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C20', materialCode: 'MC0010UKS', quantityPerUnit: 1.05, unit: 'm³', fallbackRate: 115.0 },
    ],
    plant: [
      { description: 'Concrete skip', quantityPerUnit: 0.7, unit: 'hour', fallbackRate: 12.00 },
    ],
  },
  {
    id: 'conc-strip-foundation',
    category: 'concrete',
    description: 'Strip foundation 600mm wide C20 (SMM7 E.10)',
    unit: 'm',
    outputPerDay: 20,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C20', materialCode: 'MC0010UKS', quantityPerUnit: 0.42, unit: 'm³', fallbackRate: 115.0 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.05, unit: 'day', fallbackRate: 750.0 },
    ],
    notes: 'Traditional strip foundation 600×700mm',
  },
  {
    id: 'conc-trench-fill',
    category: 'concrete',
    description: 'Trench fill foundation 600mm wide C20 (SMM7 E.10)',
    unit: 'm',
    outputPerDay: 18,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C20', materialCode: 'MC0010UKS', quantityPerUnit: 0.65, unit: 'm³', fallbackRate: 115.0 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.055, unit: 'day', fallbackRate: 750.0 },
    ],
    notes: 'Trench fill to underside of DPC - 600×1100mm',
  },
  {
    id: 'conc-pad-base-1m',
    category: 'concrete',
    description: 'Pad foundation 1.5×1.5×0.6m C30 (SMM7 E.11)',
    unit: 'nr',
    outputPerDay: 4,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C30', materialCode: 'MC0030UKS', quantityPerUnit: 1.35, unit: 'm³', fallbackRate: 135.0 },
      { description: 'Mesh reinforcement A193', materialCode: 'MS0040UKS', quantityPerUnit: 2.25, unit: 'm²', fallbackRate: 5.50 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 750.0 },
    ],
    notes: 'Commercial column base foundation',
  },
  {
    id: 'conc-ground-beam',
    category: 'concrete',
    description: 'Ground beam 300×450mm C30 (SMM7 E.20)',
    unit: 'm',
    outputPerDay: 12,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C30', materialCode: 'MC0030UKS', quantityPerUnit: 0.14, unit: 'm³', fallbackRate: 135.0 },
      { description: 'Reinforcement bar T16', quantityPerUnit: 12, unit: 'kg', fallbackRate: 1.85 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.083, unit: 'day', fallbackRate: 750.0 },
    ],
    notes: 'Reinforced ground beam between pads',
  },
  {
    id: 'conc-slab-100mm',
    category: 'concrete',
    description: 'Slab on grade 100mm C25 with A142 mesh (SMM7 E.30)',
    unit: 'm²',
    outputPerDay: 80,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 3, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C25', materialCode: 'MC0020UKS', quantityPerUnit: 0.105, unit: 'm³', fallbackRate: 125.0 },
      { description: 'Mesh reinforcement A142', materialCode: 'MS0030UKS', quantityPerUnit: 1.05, unit: 'm²', fallbackRate: 4.50 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.0125, unit: 'day', fallbackRate: 750.0 },
      { plantCode: 'P30', description: 'Power Float', quantityPerUnit: 0.0125, unit: 'day', fallbackRate: 81.80 },
    ],
    notes: 'Ground floor slab - commercial/industrial',
  },
  {
    id: 'conc-slab-150mm',
    category: 'concrete',
    description: 'Slab on grade 150mm C25 with A193 mesh (SMM7 E.30)',
    unit: 'm²',
    outputPerDay: 70,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 3, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C25', materialCode: 'MC0020UKS', quantityPerUnit: 0.158, unit: 'm³', fallbackRate: 125.0 },
      { description: 'Mesh reinforcement A193', materialCode: 'MS0040UKS', quantityPerUnit: 1.05, unit: 'm²', fallbackRate: 5.50 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.014, unit: 'day', fallbackRate: 750.0 },
      { plantCode: 'P30', description: 'Power Float', quantityPerUnit: 0.014, unit: 'day', fallbackRate: 81.80 },
    ],
    notes: 'Heavy duty industrial slab',
  },
  {
    id: 'conc-slab-200mm',
    category: 'concrete',
    description: 'Slab on grade 200mm C30 with A252 mesh (SMM7 E.30)',
    unit: 'm²',
    outputPerDay: 60,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 3, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 3, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C30', materialCode: 'MC0030UKS', quantityPerUnit: 0.21, unit: 'm³', fallbackRate: 135.0 },
      { description: 'Mesh reinforcement A252', materialCode: 'MS0050UKS', quantityPerUnit: 1.05, unit: 'm²', fallbackRate: 6.80 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.0167, unit: 'day', fallbackRate: 750.0 },
      { plantCode: 'P30', description: 'Power Float', quantityPerUnit: 0.0167, unit: 'day', fallbackRate: 81.80 },
    ],
    notes: 'Extra heavy duty slab - warehouses',
  },
  {
    id: 'conc-blinding-50mm',
    category: 'concrete',
    description: 'Blinding concrete 50mm thick C10 (SMM7 E.31)',
    unit: 'm²',
    outputPerDay: 120,
    gang: [
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C10', quantityPerUnit: 0.053, unit: 'm³', fallbackRate: 105.0 },
    ],
    notes: 'Blinding layer - foundation preparation',
  },
  
  // BRICKWORK
  // BRICKWORK
  {
    id: 'brick-commons-half',
    category: 'brickwork',
    description: 'Commons brickwork - half brick wall',
    unit: 'm²',
    outputPerDay: 4.5,
    gang: [
      { role: 'Bricklayer', count: 1, labourCode: 'L01', fallbackRate: 32.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Common bricks', materialCode: 'MB0010UKS', quantityPerUnit: 60, unit: 'nr', fallbackRate: 325.0 },
      { description: 'Mortar ready-mixed', materialCode: 'MM0010UKS', quantityPerUnit: 0.03, unit: 'm³', fallbackRate: 85.0 },
    ],
    notes: '60 bricks/m² - Based on 60 bricks/hour output',
  },
  {
    id: 'brick-commons-one',
    category: 'brickwork',
    description: 'Commons brickwork - one brick wall',
    unit: 'm²',
    outputPerDay: 3,
    gang: [
      { role: 'Bricklayer', count: 1, labourCode: 'L01', fallbackRate: 32.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Common bricks', materialCode: 'MB0010UKS', quantityPerUnit: 120, unit: 'nr', fallbackRate: 325.0 },
      { description: 'Mortar ready-mixed', materialCode: 'MM0010UKS', quantityPerUnit: 0.06, unit: 'm³', fallbackRate: 85.0 },
    ],
    notes: '120 bricks/m²',
  },
  {
    id: 'brick-facing',
    category: 'brickwork',
    description: 'Facing brickwork - half brick wall',
    unit: 'm²',
    outputPerDay: 3.5,
    gang: [
      { role: 'Bricklayer', count: 1, labourCode: 'L01', fallbackRate: 32.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Facing bricks', materialCode: 'MB0020UKS', quantityPerUnit: 60, unit: 'nr', fallbackRate: 475.0 },
      { description: 'Mortar ready-mixed', materialCode: 'MM0010UKS', quantityPerUnit: 0.03, unit: 'm³', fallbackRate: 85.0 },
    ],
    notes: 'Higher quality, slower output (~45 bricks/hour)',
  },
  {
    id: 'brick-manhole',
    category: 'brickwork',
    description: 'Brick manhole construction',
    unit: 'nr',
    outputPerDay: 1,
    gang: [
      { role: 'Bricklayer', count: 1, labourCode: 'L01', fallbackRate: 32.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    notes: 'Standard 1200mm diameter, 1.5m deep',
  },
  
  // PAVING
  {
    id: 'pave-block-200x100',
    category: 'paving',
    description: 'Block paving 200x100mm (herringbone)',
    unit: 'm²',
    outputPerDay: 10,
    gang: [
      { role: 'Paver', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Block pavers 200x100x60mm', quantityPerUnit: 50, unit: 'nr', fallbackRate: 0.65 },
      { description: 'Sharp sand bedding', materialCode: 'MG0020UKS', quantityPerUnit: 0.04, unit: 'm³', fallbackRate: 28.0 },
      { description: 'Kiln dried sand jointing', materialCode: 'MG0020UKS', quantityPerUnit: 0.005, unit: 'm³', fallbackRate: 28.0 },
    ],
    plant: [
      { plantCode: 'P17', description: 'Ped Roller', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 46.8 },
    ],
  },
  {
    id: 'pave-block-200x100-stretcher',
    category: 'paving',
    description: 'Block paving 200x100mm (stretcher bond)',
    unit: 'm²',
    outputPerDay: 12,
    gang: [
      { role: 'Paver', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Block pavers 200x100x60mm', quantityPerUnit: 50, unit: 'nr', fallbackRate: 0.65 },
      { description: 'Sharp sand bedding', materialCode: 'MG0020UKS', quantityPerUnit: 0.04, unit: 'm³', fallbackRate: 28.0 },
      { description: 'Kiln dried sand jointing', materialCode: 'MG0020UKS', quantityPerUnit: 0.005, unit: 'm³', fallbackRate: 28.0 },
    ],
    plant: [
      { plantCode: 'P17', description: 'Ped Roller', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 46.8 },
    ],
    notes: 'Simpler pattern - higher output',
  },
  {
    id: 'pave-block-80mm-heavy',
    category: 'paving',
    description: 'Heavy duty block paving 200x100x80mm (SMM7)',
    unit: 'm²',
    outputPerDay: 9,
    gang: [
      { role: 'Paver', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Heavy duty block pavers 80mm', quantityPerUnit: 50, unit: 'nr', fallbackRate: 0.85 },
      { description: 'Sharp sand bedding', materialCode: 'MG0020UKS', quantityPerUnit: 0.05, unit: 'm³', fallbackRate: 28.0 },
      { description: 'Kiln dried sand jointing', materialCode: 'MG0020UKS', quantityPerUnit: 0.006, unit: 'm³', fallbackRate: 28.0 },
    ],
    plant: [
      { plantCode: 'P18', description: '80 Roller', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 78.0 },
    ],
    notes: 'Heavy duty - driveways and light traffic',
  },
  {
    id: 'pave-slab-450x450',
    category: 'paving',
    description: 'Paving slabs 450x450mm',
    unit: 'm²',
    outputPerDay: 15,
    gang: [
      { role: 'Paver', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Concrete paving slabs 450x450mm', quantityPerUnit: 5, unit: 'nr', fallbackRate: 4.50 },
      { description: 'Sharp sand bedding', materialCode: 'MG0020UKS', quantityPerUnit: 0.03, unit: 'm³', fallbackRate: 28.0 },
    ],
  },
  {
    id: 'pave-slab-600x600',
    category: 'paving',
    description: 'Paving slabs 600x600mm (SMM7 Q.25)',
    unit: 'm²',
    outputPerDay: 18,
    gang: [
      { role: 'Paver', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Concrete paving slabs 600x600mm', quantityPerUnit: 2.8, unit: 'nr', fallbackRate: 6.20 },
      { description: 'Sharp sand bedding', materialCode: 'MG0020UKS', quantityPerUnit: 0.03, unit: 'm³', fallbackRate: 28.0 },
    ],
    notes: 'Larger slabs - quicker laying',
  },
  {
    id: 'pave-natural-stone',
    category: 'paving',
    description: 'Natural stone paving 600x400mm (SMM7 Q.22)',
    unit: 'm²',
    outputPerDay: 8,
    gang: [
      { role: 'Paver Specialist', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Natural stone paving 600x400mm', quantityPerUnit: 4.2, unit: 'nr', fallbackRate: 18.50 },
      { description: 'Sharp sand bedding', materialCode: 'MG0020UKS', quantityPerUnit: 0.035, unit: 'm³', fallbackRate: 28.0 },
    ],
    notes: 'Premium natural stone - careful laying required',
  },
  {
    id: 'pave-permeable-blocks',
    category: 'paving',
    description: 'Permeable block paving (MCHW 1100)',
    unit: 'm²',
    outputPerDay: 9,
    gang: [
      { role: 'Paver', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Permeable block pavers 200x100x80mm', quantityPerUnit: 50, unit: 'nr', fallbackRate: 1.15 },
      { description: 'Permeable jointing grit', quantityPerUnit: 0.008, unit: 'm³', fallbackRate: 45.0 },
    ],
    plant: [
      { plantCode: 'P17', description: 'Ped Roller', quantityPerUnit: 0.28, unit: 'day', fallbackRate: 46.8 },
    ],
    notes: 'SUDS compliant - sustainable drainage',
  },
  {
    id: 'pave-sub-base',
    category: 'paving',
    description: 'Lay and compact sub-base (Type 1)',
    unit: 'm²',
    outputPerDay: 50,
    gang: [
      { role: 'Plant Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Type 1 MOT sub-base', materialCode: 'MG0010UKS', quantityPerUnit: 0.15, unit: 'm³', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P20', description: '120 Roller', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 134.8 },
    ],
    notes: '150mm depth, includes compaction',
  },
  {
    id: 'pave-edging',
    category: 'paving',
    description: 'Concrete edging course',
    unit: 'm',
    outputPerDay: 25,
    gang: [
      { role: 'Skilled Worker', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
  },
  {
    id: 'footway-bitumen-macadam',
    category: 'paving',
    description: 'Footway construction - bitumen macadam 75mm (MCHW 1100)',
    unit: 'm²',
    outputPerDay: 80,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'Bitumen macadam surfacing', quantityPerUnit: 0.15, unit: 'tonne', fallbackRate: 48.0 },
    ],
    plant: [
      { plantCode: 'P17', description: 'Ped Roller', quantityPerUnit: 0.125, unit: 'day', fallbackRate: 46.8 },
    ],
    notes: 'Footway surfacing - 75mm depth',
  },
  
  // KERBS
  {
    id: 'kerb-precast-straight',
    category: 'kerbs',
    description: 'Lay precast concrete kerbs - straight',
    unit: 'm',
    outputPerDay: 20,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Precast concrete kerb HB2', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 12.50 },
      { description: 'Concrete C10 bed/haunch', materialCode: 'MC0010UKS', quantityPerUnit: 0.05, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Includes bed and haunch',
  },
  {
    id: 'kerb-hb2-125mm',
    category: 'kerbs',
    description: 'HB2 half battered kerb 125mm high (MCHW 1100)',
    unit: 'm',
    outputPerDay: 20,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'HB2 kerb 125mm x 255mm', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 12.50 },
      { description: 'Concrete C10 bed 100mm', materialCode: 'MC0010UKS', quantityPerUnit: 0.045, unit: 'm³', fallbackRate: 115.0 },
      { description: 'Concrete C10 haunch', materialCode: 'MC0010UKS', quantityPerUnit: 0.02, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Standard highway kerb - straight',
  },
  {
    id: 'kerb-hb1-150mm',
    category: 'kerbs',
    description: 'HB1 half battered kerb 150mm high (MCHW 1100)',
    unit: 'm',
    outputPerDay: 18,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'HB1 kerb 150mm x 300mm', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 15.80 },
      { description: 'Concrete C10 bed 100mm', materialCode: 'MC0010UKS', quantityPerUnit: 0.05, unit: 'm³', fallbackRate: 115.0 },
      { description: 'Concrete C10 haunch', materialCode: 'MC0010UKS', quantityPerUnit: 0.025, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Higher kerb - main roads',
  },
  {
    id: 'kerb-bn-straight',
    category: 'kerbs',
    description: 'BN bull nose kerb 125mm (MCHW 1100)',
    unit: 'm',
    outputPerDay: 18,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'BN bull nose kerb 125mm', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 14.25 },
      { description: 'Concrete C10 bed/haunch', materialCode: 'MC0010UKS', quantityPerUnit: 0.055, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Rounded kerb - pedestrian areas',
  },
  {
    id: 'kerb-sp-sloped',
    category: 'kerbs',
    description: 'SP splay kerb 125mm (MCHW 1100)',
    unit: 'm',
    outputPerDay: 18,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'SP splay kerb 125mm', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 13.50 },
      { description: 'Concrete C10 bed/haunch', materialCode: 'MC0010UKS', quantityPerUnit: 0.05, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Sloped top - accessible crossings',
  },
  {
    id: 'kerb-precast-radial',
    category: 'kerbs',
    description: 'Lay precast concrete kerbs - radial/curved',
    unit: 'm',
    outputPerDay: 15,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Radial kerb units HB2', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 18.00 },
      { description: 'Concrete C10 bed/haunch', materialCode: 'MC0010UKS', quantityPerUnit: 0.055, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Includes bed and haunch',
  },
  {
    id: 'kerb-radius-6m',
    category: 'kerbs',
    description: 'Radius kerb HB2 6m radius (MCHW 1100)',
    unit: 'm',
    outputPerDay: 12,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Radius kerb 6m HB2', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 22.00 },
      { description: 'Concrete C10 bed/haunch', materialCode: 'MC0010UKS', quantityPerUnit: 0.058, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Tight radius - junctions',
  },
  {
    id: 'kerb-edging-flat',
    category: 'kerbs',
    description: 'Lay flat top edging (914mm units)',
    unit: 'm',
    outputPerDay: 25,
    gang: [
      { role: 'Skilled Worker', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Flat top edging 914mm', quantityPerUnit: 1.1, unit: 'nr', fallbackRate: 5.50 },
      { description: 'Concrete C10 bed', materialCode: 'MC0010UKS', quantityPerUnit: 0.03, unit: 'm³', fallbackRate: 115.0 },
    ],
  },
  
  // FORMWORK
  {
    id: 'form-wall-basic',
    category: 'formwork',
    description: 'Formwork to walls - basic',
    unit: 'm²',
    outputPerDay: 12,
    gang: [
      { role: 'Skilled Carpenter', count: 1, labourCode: 'L02', fallbackRate: 32.0 /* Carpenter */ },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Plywood 18mm', materialCode: 'MT0030UKS', quantityPerUnit: 0.6, unit: 'sheet', fallbackRate: 42.0 },
    ],
    notes: 'Includes erecting and striking',
  },
  {
    id: 'form-edge-slab',
    category: 'formwork',
    description: 'Formwork to slab edges',
    unit: 'm',
    outputPerDay: 20,
    gang: [
      { role: 'Skilled Carpenter', count: 1, labourCode: 'L02', fallbackRate: 32.0 },
    ],
    materials: [
      { description: 'Plywood 18mm', materialCode: 'MT0030UKS', quantityPerUnit: 0.3, unit: 'sheet', fallbackRate: 42.0 },
    ],
  },
  {
    id: 'form-column',
    category: 'formwork',
    description: 'Formwork to columns',
    unit: 'm²',
    outputPerDay: 8,
    gang: [
      { role: 'Skilled Carpenter', count: 1, labourCode: 'L02', fallbackRate: 32.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Plywood 18mm', materialCode: 'MT0030UKS', quantityPerUnit: 0.8, unit: 'sheet', fallbackRate: 42.0 },
    ],
  },
  
  // REINFORCEMENT
  {
    id: 'rebar-fix-slab',
    category: 'reinforcement',
    description: 'Fix reinforcement to slabs',
    unit: 'tonne',
    outputPerDay: 0.4,
    gang: [
      { role: 'Steel Fixer', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Reinforcement steel bars', materialCode: 'MS0010UKS', quantityPerUnit: 1.05, unit: 'tonne', fallbackRate: 550.0 },
    ],
  },
  {
    id: 'rebar-fix-wall',
    category: 'reinforcement',
    description: 'Fix reinforcement to walls',
    unit: 'tonne',
    outputPerDay: 0.35,
    gang: [
      { role: 'Steel Fixer', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Reinforcement steel bars', materialCode: 'MS0010UKS', quantityPerUnit: 1.05, unit: 'tonne', fallbackRate: 550.0 },
    ],
  },
  {
    id: 'mesh-fix',
    category: 'reinforcement',
    description: 'Fix fabric mesh reinforcement',
    unit: 'm²',
    outputPerDay: 120,
    gang: [
      { role: 'Steel Fixer', count: 1, labourCode: 'L09', fallbackRate: 22.0 },
    ],
    materials: [
      { description: 'Mesh reinforcement A142', materialCode: 'MS0030UKS', quantityPerUnit: 1.05, unit: 'm²', fallbackRate: 4.50 },
    ],
  },
  
  // GENERAL
  {
    id: 'gen-backfill-compact',
    category: 'general',
    description: 'Backfill and compact trenches',
    unit: 'm³',
    outputPerDay: 30,
    gang: [
      { role: 'Plant Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
  },
  {
    id: 'gen-backfill-granular',
    category: 'general',
    description: 'Backfill with granular material (CESSM4 E.8)',
    unit: 'm³',
    outputPerDay: 25,
    gang: [
      { role: 'Plant Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Type 1 granular fill', materialCode: 'MG0010UKS', quantityPerUnit: 1.1, unit: 'm³', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 159.80 },
      { plantCode: 'P16', description: 'Ped Compactor', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 31.20 },
    ],
    notes: 'Granular backfill to trenches - compacted in layers',
  },
  {
    id: 'gen-fill-selected',
    category: 'general',
    description: 'Fill with selected excavated material (CESSM4 E.6)',
    unit: 'm³',
    outputPerDay: 35,
    gang: [
      { role: 'Plant Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.28, unit: 'day', fallbackRate: 159.80 },
      { plantCode: 'P17', description: '8t Roller', quantityPerUnit: 0.28, unit: 'day', fallbackRate: 62.40 },
    ],
    notes: 'Reuse excavated material - compacted',
  },
  {
    id: 'gen-disposal-skip',
    category: 'general',
    description: 'Load spoil to skip/wagon',
    unit: 'm³',
    outputPerDay: 40,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
  },
  {
    id: 'gen-disposal-offsite',
    category: 'general',
    description: 'Disposal of excavated material offsite (CESSM4 E.7)',
    unit: 'm³',
    outputPerDay: 80,
    gang: [
      { role: 'Banksman', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Disposal charges', quantityPerUnit: 1, unit: 'm³', fallbackRate: 15.0 },
    ],
    notes: 'Disposal only - excludes loading/hauling',
  },
  {
    id: 'gen-topsoil-spread',
    category: 'general',
    description: 'Spread and level topsoil',
    unit: 'm²',
    outputPerDay: 100,
    gang: [
      { role: 'Plant Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: '150mm depth average',
  },
  {
    id: 'gen-geotextile',
    category: 'general',
    description: 'Lay geotextile membrane (MCHW Series 700)',
    unit: 'm²',
    outputPerDay: 200,
    gang: [
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Geotextile membrane', quantityPerUnit: 1.1, unit: 'm²', fallbackRate: 1.85 },
    ],
    notes: 'Separation/filtration membrane - 10% overlap',
  },
  {
    id: 'gen-dpm-membrane',
    category: 'general',
    description: 'Lay DPM membrane 1200 gauge (SMM7 E.40)',
    unit: 'm²',
    outputPerDay: 180,
    gang: [
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'DPM 1200 gauge polythene', quantityPerUnit: 1.15, unit: 'm²', fallbackRate: 0.95 },
    ],
    notes: 'Damp proof membrane - 150mm laps',
  },
  {
    id: 'gen-hardcore-fill',
    category: 'general',
    description: 'Hardcore filling 150mm (SMM7 E.50)',
    unit: 'm²',
    outputPerDay: 60,
    gang: [
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Hardcore Type 1', materialCode: 'MG0010UKS', quantityPerUnit: 0.35, unit: 'm³', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P16', description: 'Ped Compactor', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 31.20 },
    ],
    notes: '150mm compacted hardcore - building works',
  },
  {
    id: 'gen-vibrating-compact',
    category: 'general',
    description: 'Vibrating compaction of fill (CESSM4 E.9)',
    unit: 'm²',
    outputPerDay: 250,
    gang: [
      { role: 'Plant Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
    ],
    plant: [
      { plantCode: 'P16', description: 'Ped Compactor', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 31.20 },
    ],
    notes: 'Compaction only - per layer pass',
  },

  // STONEWORK / STONING UP
  {
    id: 'stone-aggregate-20mm',
    category: 'stonework',
    description: 'Stoning up with aggregate 20mm stone',
    unit: 'm³',
    outputPerDay: 12,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Stone aggregate 20-40mm', materialCode: 'MG0040UKS', quantityPerUnit: 1.1, unit: 'tonne', fallbackRate: 24.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'General stoning up - 20-40mm aggregate, includes compaction',
  },
  {
    id: 'stone-aggregate-40mm',
    category: 'stonework',
    description: 'Stoning up with aggregate 40mm stone',
    unit: 'm³',
    outputPerDay: 11,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Stone aggregate 40mm', materialCode: 'MG0050UKS', quantityPerUnit: 1.1, unit: 'tonne', fallbackRate: 26.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'General stoning up - 40mm aggregate, includes compaction',
  },
  {
    id: 'stone-granite-20mm',
    category: 'stonework',
    description: 'Stoning up with granite chips 20mm',
    unit: 'm³',
    outputPerDay: 10,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Granite chips 20mm', materialCode: 'MG0060UKS', quantityPerUnit: 1.1, unit: 'tonne', fallbackRate: 35.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Premium finish stoning up - granite 20mm chips',
  },
  {
    id: 'stone-granite-40mm',
    category: 'stonework',
    description: 'Stoning up with granite chips 40mm',
    unit: 'm³',
    outputPerDay: 9,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Granite chips 40mm', materialCode: 'MG0070UKS', quantityPerUnit: 1.1, unit: 'tonne', fallbackRate: 38.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Premium finish stoning up - granite 40mm chips',
  },
  {
    id: 'stone-flint-20mm',
    category: 'stonework',
    description: 'Stoning up with flint gravel 20mm',
    unit: 'm³',
    outputPerDay: 10,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Flint gravel 20mm', materialCode: 'MG0080UKS', quantityPerUnit: 1.1, unit: 'tonne', fallbackRate: 32.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Flint gravel stoning up - 20mm, decorative finish',
  },
  {
    id: 'stone-decorative',
    category: 'stonework',
    description: 'Stoning up with decorative stone chips',
    unit: 'm³',
    outputPerDay: 8,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Decorative stone chips', materialCode: 'MG0090UKS', quantityPerUnit: 1.1, unit: 'tonne', fallbackRate: 45.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Premium finish - decorative stone chips, precision work',
  },

  // ROADS & HIGHWAYS
  {
    id: 'road-excavation-bulk',
    category: 'excavation',
    description: 'Road excavation - bulk earthworks',
    unit: 'm³',
    outputPerDay: 120,
    gang: [
      { role: 'Excavator Operator', count: 1, labourCode: 'L11', fallbackRate: 30.0 },
      { role: 'Banksman', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P08', description: '21t Excavator', quantityPerUnit: 0.375, unit: 'day', fallbackRate: 382.20 },
      { plantCode: 'P15', description: 'Dumper 20t', quantityPerUnit: 0.375, unit: 'day', fallbackRate: 316.0 },
    ],
    notes: 'Road construction - bulk cut to level, includes loading',
  },
  {
    id: 'road-capping-layer',
    category: 'roads',
    description: 'Capping layer 150mm (MCHW Series 600)',
    unit: 'm²',
    outputPerDay: 100,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'Capping material (6F2)', quantityPerUnit: 0.35, unit: 'm³', fallbackRate: 15.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 159.80 },
      { plantCode: 'P17', description: '8t Roller', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 62.40 },
    ],
    notes: 'Capping to improve subgrade - 150mm compacted',
  },
  {
    id: 'road-subbase-mot1-150',
    category: 'roads',
    description: 'MOT Type 1 sub-base 150mm (MCHW Series 800)',
    unit: 'm²',
    outputPerDay: 120,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'MOT Type 1 sub-base', materialCode: 'MG0010UKS', quantityPerUnit: 0.35, unit: 'm³', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
      { plantCode: 'P18', description: '80 Roller', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 78.0 },
    ],
    notes: '150mm depth compacted - standard roads',
  },
  {
    id: 'road-subbase-mot1',
    category: 'roads',
    description: 'Road sub-base MOT Type 1 - lay & compact',
    unit: 'm²',
    outputPerDay: 120,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'MOT Type 1 sub-base', materialCode: 'MG0010UKS', quantityPerUnit: 0.35, unit: 'm³', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 159.80 },
      { plantCode: 'P18', description: '80 Roller', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 78.0 },
    ],
    notes: '150mm depth compacted - road construction',
  },
  {
    id: 'road-subbase-mot1-225',
    category: 'roads',
    description: 'MOT Type 1 sub-base 225mm (MCHW Series 800)',
    unit: 'm²',
    outputPerDay: 100,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'MOT Type 1 sub-base', materialCode: 'MG0010UKS', quantityPerUnit: 0.52, unit: 'm³', fallbackRate: 18.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 159.80 },
      { plantCode: 'P18', description: '80 Roller', quantityPerUnit: 0.3, unit: 'day', fallbackRate: 78.0 },
    ],
    notes: '225mm depth compacted - heavy traffic roads',
  },
  {
    id: 'road-subbase-mot2',
    category: 'roads',
    description: 'MOT Type 2 sub-base 150mm (MCHW Series 800)',
    unit: 'm²',
    outputPerDay: 110,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'MOT Type 2 sub-base', quantityPerUnit: 0.35, unit: 'm³', fallbackRate: 16.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.27, unit: 'day', fallbackRate: 159.80 },
      { plantCode: 'P18', description: '80 Roller', quantityPerUnit: 0.27, unit: 'day', fallbackRate: 78.0 },
    ],
    notes: '150mm depth compacted - lighter specification',
  },
  {
    id: 'road-asphalt-base',
    category: 'roads',
    description: 'Asphalt base course - lay & compact',
    unit: 'm²',
    outputPerDay: 160,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Labourer', count: 3, labourCode: 'L09', fallbackRate: 22.0 },
    ],
    materials: [
      { description: 'Asphalt base course', quantityPerUnit: 0.16, unit: 'tonne', fallbackRate: 52.0 },
    ],
    plant: [
      { plantCode: 'P18', description: '80 Roller', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 78.0 },
    ],
    notes: '80mm depth - road base course layer',
  },
  {
    id: 'road-asphalt-base-100mm',
    category: 'roads',
    description: 'Asphalt base course 100mm (MCHW Series 900)',
    unit: 'm²',
    outputPerDay: 140,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Labourer', count: 3, labourCode: 'L09', fallbackRate: 22.0 },
    ],
    materials: [
      { description: 'Asphalt base course AC 32 base', quantityPerUnit: 0.20, unit: 'tonne', fallbackRate: 52.0 },
    ],
    plant: [
      { plantCode: 'P19', description: '100 Roller', quantityPerUnit: 0.28, unit: 'day', fallbackRate: 93.60 },
    ],
    notes: '100mm depth - heavy duty base',
  },
  {
    id: 'road-asphalt-binder',
    category: 'roads',
    description: 'Asphalt binder course - lay & compact',
    unit: 'm²',
    outputPerDay: 200,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Labourer', count: 3, labourCode: 'L09', fallbackRate: 22.0 },
    ],
    materials: [
      { description: 'Asphalt binder course', materialCode: 'MA0020UKS', quantityPerUnit: 0.12, unit: 'tonne', fallbackRate: 55.0 },
    ],
    plant: [
      { plantCode: 'P19', description: '100 Roller', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 93.60 },
    ],
    notes: '60mm depth - road binder course',
  },
  {
    id: 'road-asphalt-binder-sbs',
    category: 'roads',
    description: 'SBS modified binder course 60mm (MCHW 900)',
    unit: 'm²',
    outputPerDay: 180,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Labourer', count: 3, labourCode: 'L09', fallbackRate: 22.0 },
    ],
    materials: [
      { description: 'SBS modified binder course', quantityPerUnit: 0.12, unit: 'tonne', fallbackRate: 68.0 },
    ],
    plant: [
      { plantCode: 'P19', description: '100 Roller', quantityPerUnit: 0.22, unit: 'day', fallbackRate: 93.60 },
    ],
    notes: 'Polymer modified - high specification roads',
  },
  {
    id: 'road-asphalt-wearing',
    category: 'roads',
    description: 'Asphalt wearing course - lay & compact',
    unit: 'm²',
    outputPerDay: 180,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Labourer', count: 3, labourCode: 'L09', fallbackRate: 22.0 },
    ],
    materials: [
      { description: 'Asphalt wearing course', materialCode: 'MA0010UKS', quantityPerUnit: 0.10, unit: 'tonne', fallbackRate: 65.0 },
    ],
    plant: [
      { plantCode: 'P19', description: '100 Roller', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 93.60 },
    ],
    notes: '40mm depth - road surface course',
  },
  {
    id: 'road-asphalt-wearing-hfs',
    category: 'roads',
    description: 'HFS wearing course 40mm (MCHW 900)',
    unit: 'm²',
    outputPerDay: 170,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Skilled Labourer', count: 3, labourCode: 'L09', fallbackRate: 22.0 },
    ],
    materials: [
      { description: 'Hot friction surfacing course', quantityPerUnit: 0.10, unit: 'tonne', fallbackRate: 78.0 },
    ],
    plant: [
      { plantCode: 'P19', description: '100 Roller', quantityPerUnit: 0.23, unit: 'day', fallbackRate: 93.60 },
    ],
    notes: 'High friction surface - urban roads',
  },
  {
    id: 'road-tack-coat',
    category: 'roads',
    description: 'Tack coat application (MCHW Series 900)',
    unit: 'm²',
    outputPerDay: 800,
    gang: [
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Bitumen emulsion K1-40', quantityPerUnit: 0.35, unit: 'litre', fallbackRate: 1.25 },
    ],
    plant: [
      { plantCode: 'P01', description: 'Van', quantityPerUnit: 0.01, unit: 'day', fallbackRate: 38.50 },
    ],
    notes: 'Bond coat between asphalt layers',
  },
  {
    id: 'road-surface-dressing',
    category: 'roads',
    description: 'Surface dressing (MCHW Series 900)',
    unit: 'm²',
    outputPerDay: 300,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'Bitumen emulsion', quantityPerUnit: 1.2, unit: 'litre', fallbackRate: 1.35 },
      { description: 'Chippings 10mm', quantityPerUnit: 12, unit: 'kg', fallbackRate: 0.18 },
    ],
    notes: 'Surface treatment - maintenance',
  },
  {
    id: 'highway-gully',
    category: 'drainage',
    description: 'Install highway gully and connect to drainage',
    unit: 'nr',
    outputPerDay: 3,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Precast concrete gully pot', quantityPerUnit: 1, unit: 'nr', fallbackRate: 120.0 },
      { description: 'Cast iron gully grating', quantityPerUnit: 1, unit: 'nr', fallbackRate: 85.0 },
      { description: 'Concrete C20', materialCode: 'MC0010UKS', quantityPerUnit: 0.25, unit: 'm³', fallbackRate: 115.0 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Highway drainage gully installation - includes excavation and bedding',
  },
  {
    id: 'highway-catchpit',
    category: 'drainage',
    description: 'Install highway catch pit chamber',
    unit: 'nr',
    outputPerDay: 2,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Drainage Specialist', count: 1, labourCode: 'L12', fallbackRate: 30.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Precast concrete catch pit', quantityPerUnit: 1, unit: 'nr', fallbackRate: 350.0 },
      { description: 'Cast iron cover and frame', quantityPerUnit: 1, unit: 'nr', fallbackRate: 220.0 },
      { description: 'Concrete C20', materialCode: 'MC0010UKS', quantityPerUnit: 0.5, unit: 'm³', fallbackRate: 115.0 },
    ],
    plant: [
      { plantCode: 'P06', description: '6t Excavator', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 209.0 },
    ],
    notes: 'Highway catch pit - includes excavation, bedding, and benching',
  },
  {
    id: 'road-channel-block',
    category: 'kerbs',
    description: 'Lay precast concrete channel blocks',
    unit: 'm',
    outputPerDay: 25,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'Precast concrete channel block', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 15.50 },
      { description: 'Concrete C10 bed', materialCode: 'MC0010UKS', quantityPerUnit: 0.025, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Highway/road channel drainage - precast units',
  },

  // EXTERNAL STRUCTURES & RETAINING WALLS
  {
    id: 'retaining-wall-concrete',
    category: 'concrete',
    description: 'Retaining wall 300mm thick RC (SMM7 E.20)',
    unit: 'm²',
    outputPerDay: 8,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Ready-mix concrete C30', materialCode: 'MC0030UKS', quantityPerUnit: 0.315, unit: 'm³', fallbackRate: 135.0 },
      { description: 'Reinforcement bar T16', quantityPerUnit: 15, unit: 'kg', fallbackRate: 1.85 },
    ],
    plant: [
      { plantCode: 'P28', description: 'Boom Pump', quantityPerUnit: 0.125, unit: 'day', fallbackRate: 750.0 },
    ],
    notes: 'Includes formwork erection/striking',
  },

  // FLOOR SCREEDS & BASES
  {
    id: 'floor-screed-50mm',
    category: 'concrete',
    description: 'Floor screed 50mm thick (SMM7 M.10)',
    unit: 'm²',
    outputPerDay: 40,
    gang: [
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Floor screed mix', quantityPerUnit: 0.053, unit: 'm³', fallbackRate: 85.0 },
    ],
    notes: 'Sand/cement floor screed',
  },
  {
    id: 'floor-screed-75mm',
    category: 'concrete',
    description: 'Floor screed 75mm thick (SMM7 M.10)',
    unit: 'm²',
    outputPerDay: 35,
    gang: [
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Floor screed mix', quantityPerUnit: 0.079, unit: 'm³', fallbackRate: 85.0 },
    ],
    notes: 'Thicker screed for services',
  },

  // SERVICES GROUNDWORK
  {
    id: 'duct-electric-100mm',
    category: 'drainage',
    description: 'Electric cable duct 100mm (CESSM4 J)',
    unit: 'm',
    outputPerDay: 20,
    gang: [
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Electric cable duct 100mm', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 4.25 },
      { description: 'Warning tape', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 0.35 },
    ],
    plant: [
      { plantCode: 'P03', description: '1.5t Excavator', quantityPerUnit: 0.2, unit: 'day', fallbackRate: 128.0 },
    ],
    notes: 'Underground electric ducting',
  },
  {
    id: 'chamber-inspection-300mm',
    category: 'drainage',
    description: 'Inspection chamber 300mm dia. (CESSM4 K)',
    unit: 'nr',
    outputPerDay: 4,
    gang: [
      { role: 'Ganger', count: 1, labourCode: 'L10', fallbackRate: 35.0 },
      { role: 'Groundworker', count: 1, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'Inspection chamber 300mm', quantityPerUnit: 1, unit: 'nr', fallbackRate: 85.0 },
      { description: 'Cover and frame', quantityPerUnit: 1, unit: 'nr', fallbackRate: 28.0 },
    ],
    plant: [
      { plantCode: 'P03', description: '1.5t Excavator', quantityPerUnit: 0.25, unit: 'day', fallbackRate: 128.0 },
    ],
    notes: 'Shallow inspection chamber',
  },
  {
    id: 'soakaway-1m-cube',
    category: 'drainage',
    description: 'Soakaway 1m³ filled with stone (CESSM4)',
    unit: 'nr',
    outputPerDay: 2,
    gang: [
      { role: 'Groundworker', count: 2, labourCode: 'L13', fallbackRate: 28.0 },
    ],
    materials: [
      { description: 'Clean stone 40-75mm', quantityPerUnit: 1.2, unit: 'm³', fallbackRate: 28.0 },
      { description: 'Geotextile membrane', quantityPerUnit: 6, unit: 'm²', fallbackRate: 1.85 },
    ],
    plant: [
      { plantCode: 'P04', description: '3t Excavator', quantityPerUnit: 0.5, unit: 'day', fallbackRate: 159.80 },
    ],
    notes: 'Surface water soakaway',
  },

  // FENCING & BOUNDARIES
  {
    id: 'fence-close-board-1.8m',
    category: 'general',
    description: 'Close board fencing 1.8m high (MCHW 300)',
    unit: 'm',
    outputPerDay: 10,
    gang: [
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Fence post 100x100mm', quantityPerUnit: 0.35, unit: 'nr', fallbackRate: 12.50 },
      { description: 'Featherboard fencing', quantityPerUnit: 1.8, unit: 'm²', fallbackRate: 18.50 },
      { description: 'Gravel board', quantityPerUnit: 0.35, unit: 'nr', fallbackRate: 8.50 },
      { description: 'Postcrete', quantityPerUnit: 8, unit: 'kg', fallbackRate: 0.85 },
    ],
    notes: 'Includes posts at 3m centres',
  },
  {
    id: 'fence-post-rail-2m',
    category: 'general',
    description: 'Post and rail fencing 2m high (MCHW 300)',
    unit: 'm',
    outputPerDay: 15,
    gang: [
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Fence post 125x125mm', quantityPerUnit: 0.33, unit: 'nr', fallbackRate: 15.80 },
      { description: 'Rails 100x50mm', quantityPerUnit: 2, unit: 'm', fallbackRate: 4.25 },
      { description: 'Postcrete', quantityPerUnit: 10, unit: 'kg', fallbackRate: 0.85 },
    ],
    notes: 'Open post and rail - 3m centres',
  },
  {
    id: 'fence-chain-link-1.8m',
    category: 'general',
    description: 'Chain link fencing 1.8m high (MCHW 300)',
    unit: 'm',
    outputPerDay: 20,
    gang: [
      { role: 'Labourer', count: 2, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Metal fence post 1.8m', quantityPerUnit: 0.33, unit: 'nr', fallbackRate: 18.50 },
      { description: 'Chain link mesh 1.8m', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 12.50 },
      { description: 'Concrete for posts', quantityPerUnit: 0.03, unit: 'm³', fallbackRate: 115.0 },
    ],
    notes: 'Security chain link fencing',
  },
  {
    id: 'wall-brick-garden-1m',
    category: 'brickwork',
    description: 'Garden wall brick 1m high (SMM7 F.10)',
    unit: 'm',
    outputPerDay: 5,
    gang: [
      { role: 'Bricklayer', count: 1, labourCode: 'L01', fallbackRate: 32.0 },
      { role: 'Labourer', count: 1, labourCode: 'L08', fallbackRate: 18.0 },
    ],
    materials: [
      { description: 'Facing bricks', quantityPerUnit: 60, unit: 'nr', fallbackRate: 0.65 },
      { description: 'Mortar', materialCode: 'MM0010UKS', quantityPerUnit: 0.03, unit: 'm³', fallbackRate: 85.0 },
      { description: 'Coping stones', quantityPerUnit: 1.05, unit: 'm', fallbackRate: 12.50 },
    ],
    notes: 'Half brick garden wall with coping',
  },

];

// Helper functions
export function getProductivityByCategory(category: string): ProductivityRate[] {
  return PRODUCTIVITY_OUTPUTS.filter(p => p.category === category);
}

export function getProductivityById(id: string): ProductivityRate | undefined {
  return PRODUCTIVITY_OUTPUTS.find(p => p.id === id);
}

export function calculateProductivityCost(productivity: ProductivityRate, quantity: number): {
  days: number;
  gangDailyCost: number;
  totalLabourCost: number;
  totalMaterialsCost: number;
  totalPlantCost: number;
  grandTotal: number;
  labourBreakdown: { role: string; count: number; rate: number; dailyCost: number; totalCost: number }[];
  materialsBreakdown: { description: string; quantity: number; unit: string; rate: number; totalCost: number }[];
  plantBreakdown: { description: string; quantity: number; unit: string; rate: number; totalCost: number }[];
} {
  const days = quantity / productivity.outputPerDay;
  const hoursPerDay = 8;
  
  // Labour calculations
  const labourBreakdown = productivity.gang.map(member => {
    const dailyCost = member.count * member.rate * hoursPerDay;
    const totalCost = dailyCost * days;
    return {
      role: member.role,
      count: member.count,
      rate: member.rate,
      dailyCost,
      totalCost,
    };
  });
  
  const gangDailyCost = labourBreakdown.reduce((sum, b) => sum + b.dailyCost, 0);
  const totalLabourCost = labourBreakdown.reduce((sum, b) => sum + b.totalCost, 0);
  
  // Materials calculations
  const materialsBreakdown = (productivity.materials || []).map(material => {
    const totalQuantity = material.quantityPerUnit * quantity;
    const totalCost = totalQuantity * material.rate;
    return {
      description: material.description,
      quantity: totalQuantity,
      unit: material.unit,
      rate: material.rate,
      totalCost,
    };
  });
  
  const totalMaterialsCost = materialsBreakdown.reduce((sum, m) => sum + m.totalCost, 0);
  
  // Plant calculations
  const plantBreakdown = (productivity.plant || []).map(plant => {
    const totalQuantity = plant.quantityPerUnit * quantity;
    const totalCost = totalQuantity * plant.rate;
    return {
      description: plant.description,
      quantity: totalQuantity,
      unit: plant.unit,
      rate: plant.rate,
      totalCost,
    };
  });
  
  const totalPlantCost = plantBreakdown.reduce((sum, p) => sum + p.totalCost, 0);
  
  const grandTotal = totalLabourCost + totalMaterialsCost + totalPlantCost;
  
  return {
    days,
    gangDailyCost,
    totalLabourCost,
    totalMaterialsCost,
    totalPlantCost,
    grandTotal,
    labourBreakdown,
    materialsBreakdown,
    plantBreakdown,
  };
}

// Legacy function for backwards compatibility
export function calculateLabourCost(productivity: ProductivityRate, quantity: number): {
  days: number;
  gangDailyCost: number;
  totalLabourCost: number;
  breakdown: { role: string; count: number; rate: number; dailyCost: number; totalCost: number }[];
} {
  const result = calculateProductivityCost(productivity, quantity);
  return {
    days: result.days,
    gangDailyCost: result.gangDailyCost,
    totalLabourCost: result.totalLabourCost,
    breakdown: result.labourBreakdown,
  };
}

// Resolve productivity templates with actual library rates
export function resolveProductivityRates(
  templates: ProductivityRateTemplate[],
  labourRates: CSVLabourRate[],
  materialRates: CSVMaterialRate[],
  plantRates: CSVPlantRate[]
): ProductivityRate[] {
  return templates.map(template => {
    // Resolve gang members with labour rates
    const gang: GangMember[] = template.gang.map(member => {
      let rate = member.fallbackRate || 20.0; // Default fallback
      
      if (member.labourCode) {
        const labourItem = labourRates.find(l => 
          l.id === member.labourCode || 
          (member.labourCode && l.trade.toLowerCase().includes(member.labourCode.toLowerCase()))
        );
        if (labourItem) {
          rate = labourItem.hourlyRate;
        }
      }
      
      return {
        role: member.role,
        count: member.count,
        rate
      };
    });
    
    // Resolve materials with material rates
    const materials: MaterialItem[] | undefined = template.materials?.map(material => {
      let rate = material.fallbackRate || 0;
      let description = material.description;
      let unit = material.unit;
      
      if (material.materialCode) {
        const materialItem = materialRates.find(m => m.id === material.materialCode || m.code === material.materialCode);
        if (materialItem) {
          rate = materialItem.rate;
          description = materialItem.description;
          unit = materialItem.unit;
        }
      }
      
      return {
        description,
        quantityPerUnit: material.quantityPerUnit,
        unit,
        rate
      };
    });
    
    // Resolve plant with plant rates  
    const plant: PlantItem[] | undefined = template.plant?.map(plantItem => {
      let rate = plantItem.fallbackRate || 0;
      let description = plantItem.description;
      let unit = plantItem.unit;
      
      if (plantItem.plantCode) {
        const libraryPlant = plantRates.find(p => p.id === plantItem.plantCode || p.code === plantItem.plantCode);
        if (libraryPlant) {
          rate = libraryPlant.rate;
          description = libraryPlant.name || libraryPlant.description;
          unit = libraryPlant.unit;
        }
      }
      
      return {
        description,
        quantityPerUnit: plantItem.quantityPerUnit,
        unit,
        rate
      };
    });
    
    return {
      id: template.id,
      category: template.category,
      description: template.description,
      unit: template.unit,
      outputPerDay: template.outputPerDay,
      gang,
      materials,
      plant,
      notes: template.notes
    };
  });
}

// Export default productivity outputs (using fallback rates)
export const PRODUCTIVITY_OUTPUTS: ProductivityRate[] = resolveProductivityRates(
  PRODUCTIVITY_TEMPLATES,
  [], // Empty arrays mean fallbacks will be used
  [],
  []
);

export const CATEGORIES = [
  { id: 'roads', label: 'Roads & Highways' },
  { id: 'excavation', label: 'Excavation' },
  { id: 'drainage', label: 'Drainage' },
  { id: 'concrete', label: 'Concrete Works' },
  { id: 'kerbs', label: 'Kerbs & Edging' },
  { id: 'paving', label: 'Paving' },
  { id: 'stonework', label: 'Stonework' },
  { id: 'brickwork', label: 'Brickwork' },
  { id: 'formwork', label: 'Formwork' },
  { id: 'reinforcement', label: 'Reinforcement' },
  { id: 'general', label: 'General Works' },
];
