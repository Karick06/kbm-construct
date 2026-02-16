/**
 * Rate Builder Library
 * Build SMM7 rates from labour, plant, and material components
 * Based on output rates (per shift, per hour, per m², etc.)
 */

import type { LabourRate } from './labour-rates';
import type { PlantRate } from './plant-rates';
import type { MaterialRate } from './material-rates';

export interface RateComponent {
  componentId: string;
  type: 'labour' | 'plant' | 'material' | 'overhead';
  description: string;
  outputPerUnit?: number;
  quantity: number;
  unit: string;
  unitRate: number;
  cost: number;
}

export interface BuiltRate {
  id: string;
  smmNumber: string;
  description: string;
  measurementUnit: string; // m², m, no., tonne, etc.
  outputPerShift: number; // output in measurement units per shift
  outputPerHour?: number; // alternative if hourly-based
  hoursPerShift: number;
  components: RateComponent[];
  subtotal: number;
  profitMargin: number; // percentage
  contingency: number; // percentage
  finalRate: number; // £ per measurement unit
}

export const createLabourComponent = (
  labour: LabourRate,
  workersRequired: number,
  hoursPerShift: number = 8,
  productivityFactor: number = 1.0
): RateComponent => {
  const hoursCost = labour.hourlyRate * workersRequired * hoursPerShift * productivityFactor;

  return {
    componentId: labour.id,
    type: 'labour',
    description: `${labour.trade} (${workersRequired} worker${workersRequired > 1 ? 's' : ''})`,
    quantity: workersRequired * hoursPerShift,
    unit: 'labour hours',
    unitRate: labour.hourlyRate,
    cost: hoursCost,
  };
};

export const createPlantComponent = (
  plant: PlantRate,
  quantityRequired: number,
  quantity: number = 1
): RateComponent => {
  const totalCost = plant.rate * quantityRequired * quantity;

  return {
    componentId: plant.id,
    type: 'plant',
    description: `${plant.name} (${quantity} unit${quantity > 1 ? 's' : ''})`,
    quantity: quantityRequired * quantity,
    unit: plant.unit,
    unitRate: plant.rate,
    cost: totalCost,
  };
};

export const createMaterialComponent = (
  material: MaterialRate,
  quantityRequired: number
): RateComponent => {
  const totalCost = material.rate * quantityRequired * material.wasteFactor;

  return {
    componentId: material.id,
    type: 'material',
    description: material.description,
    quantity: quantityRequired,
    unit: material.unit,
    unitRate: material.rate * material.wasteFactor,
    cost: totalCost,
  };
};

export const buildRate = (
  smmNumber: string,
  description: string,
  measurementUnit: string,
  outputPerShift: number,
  components: RateComponent[],
  hoursPerShift: number = 8,
  profitMargin: number = 20, // default 20%
  contingency: number = 10 // default 10%
): BuiltRate => {
  const subtotal = components.reduce((sum, c) => sum + c.cost, 0);

  // Cost per unit of output
  const costPerUnit = subtotal / outputPerShift;

  // Apply margins
  const withMargin = costPerUnit * (1 + profitMargin / 100);
  const withContingency = withMargin * (1 + contingency / 100);

  // Add site overheads (typically 5-15% of direct costs)
  const siteOverhead = costPerUnit * 0.1;
  const finalRate = withContingency + (siteOverhead * (1 + profitMargin / 100));

  return {
    id: `rate-${Date.now()}`,
    smmNumber,
    description,
    measurementUnit,
    outputPerShift,
    hoursPerShift,
    components,
    subtotal: costPerUnit,
    profitMargin,
    contingency,
    finalRate: Math.round(finalRate * 100) / 100, // Round to 2 decimals
  };
};

export const formatRateForBoQ = (rate: BuiltRate): {
  itemNumber: string;
  description: string;
  unit: string;
  rate: number;
} => {
  return {
    itemNumber: rate.smmNumber,
    description: rate.description,
    unit: rate.measurementUnit,
    rate: rate.finalRate,
  };
};

export const getRateBreakdown = (
  rate: BuiltRate
): Array<{ category: string; items: RateComponent[]; subtotal: number }> => {
  const labour = rate.components.filter((c) => c.type === 'labour');
  const plant = rate.components.filter((c) => c.type === 'plant');
  const material = rate.components.filter((c) => c.type === 'material');

  return [
    {
      category: 'Labour',
      items: labour,
      subtotal: labour.reduce((sum, c) => sum + c.cost, 0),
    },
    {
      category: 'Plant & Equipment',
      items: plant,
      subtotal: plant.reduce((sum, c) => sum + c.cost, 0),
    },
    {
      category: 'Materials',
      items: material,
      subtotal: material.reduce((sum, c) => sum + c.cost, 0),
    },
  ];
};

export const estimateShiftsRequired = (
  totalQuantity: number,
  outputPerShift: number,
  shiftsPerDay: number = 1
): number => {
  const shiftsNeeded = Math.ceil(totalQuantity / outputPerShift);
  return Math.ceil(shiftsNeeded / shiftsPerDay);
};
