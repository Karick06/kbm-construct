/**
 * BoQ Standard Implementations
 * Utilities for working with SMM7, CESMM, and SHW standards
 */

import type {
  BoQItem,
  BillOfQuantities,
  MeasurementStandard,
  BoQSection,
} from './boq-models';
import {
  SMM7_SECTIONS,
  CESMM_SECTIONS,
  SHW_SECTIONS,
} from './boq-models';

/**
 * Get available sections for a measurement standard
 */
export function getSectionsForStandard(standard: MeasurementStandard) {
  switch (standard) {
    case 'SMM7':
      return SMM7_SECTIONS;
    case 'CESMM':
      return CESMM_SECTIONS;
    case 'SHW':
      return SHW_SECTIONS;
    default:
      return [];
  }
}

/**
 * Calculate BoQ totals
 */
export function calculateBoQTotals(items: BoQItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  return {
    subtotal,
    itemCount: items.length,
  };
}

/**
 * Calculate section totals
 */
export function calculateSectionTotals(section: BoQSection) {
  return section.items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

/**
 * Validate BoQ
 */
export function validateBoQ(boq: BillOfQuantities): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!boq.projectName) errors.push('Project name is required');
  if (!boq.title) errors.push('BoQ title is required');
  if (!boq.preparedBy) errors.push('Prepared by field is required');
  if (boq.items.length === 0) errors.push('BoQ must contain at least one item');

  boq.items.forEach((item, index) => {
    if (!item.description) errors.push(`Item ${index + 1}: Description required`);
    if (!item.unit) errors.push(`Item ${index + 1}: Unit required`);
    if (item.quantity <= 0)
      errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
    if (item.rate < 0) errors.push(`Item ${index + 1}: Rate cannot be negative`);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generate item numbers based on standard
 */
export function generateItemNumber(
  standard: MeasurementStandard,
  sectionId: string,
  itemIndex: number
): string {
  // Format: A.1.1.1 (Section.Subsection.Item)
  return `${sectionId.toUpperCase()}.${itemIndex + 1}`;
}

/**
 * Calculate contingency
 */
export function calculateWithContingency(
  subtotal: number,
  contingencyPercent: number
): number {
  const contingency = (subtotal * contingencyPercent) / 100;
  return subtotal + contingency;
}

/**
 * Convert between units (basic implementation)
 * For production, use a library like 'convert-units'
 */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string
): number {
  const conversions: {
    [key: string]: { [key: string]: number };
  } = {
    m: { mm: 1000, cm: 100, m: 1 },
    mm: { m: 0.001, mm: 1 },
    cm: { m: 0.01, cm: 1 },
    m2: { m2: 1, mm2: 1000000 },
    m3: { m3: 1, L: 1000 },
    t: { kg: 1000, t: 1 },
    kg: { t: 0.001, kg: 1 },
  };

  const key = `${fromUnit.toLowerCase()}${toUnit.toLowerCase()}`;
  const conversion = conversions?.[fromUnit.toLowerCase()]?.[toUnit.toLowerCase()];

  if (!conversion) {
    console.warn(`No conversion found from ${fromUnit} to ${toUnit}`);
    return value;
  }

  return value * conversion;
}

/**
 * Export BoQ to CSV format
 */
export function exportBoQToCSV(boq: BillOfQuantities): string {
  const headers = ['Item No', 'Description', 'Unit', 'Quantity', 'Rate', 'Amount'];
  const rows = boq.items.map((item) => [
    item.itemNumber,
    item.description,
    item.unit,
    item.quantity.toString(),
    formatCurrency(item.rate),
    formatCurrency(item.amount),
  ]);

  rows.push([
    '',
    'SUBTOTAL',
    '',
    '',
    '',
    formatCurrency(boq.subtotal),
  ]);
  rows.push([
    '',
    `Contingency (${boq.contingencyPercent}%)`,
    '',
    '',
    '',
    formatCurrency(boq.contingency),
  ]);
  rows.push(['', 'TOTAL', '', '', '', formatCurrency(boq.total)]);

  const csv = [
    `Bill of Quantities - ${boq.standard}`,
    `Project: ${boq.projectName}`,
    `Title: ${boq.title}`,
    `Prepared: ${boq.date}`,
    `By: ${boq.preparedBy}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csv;
}

/**
 * Import BoQ from CSV
 */
export function importBoQFromCSV(csv: string): BoQItem[] {
  const lines = csv.split('\n').filter((line) => line.trim());
  const items: BoQItem[] = [];

  // Skip header and metadata
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Item No') || lines[i].includes('Description')) {
      startIndex = i + 1;
      break;
    }
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('SUBTOTAL') || line.includes('TOTAL')) break;

    const [itemNumber, description, unit, quantity, rate] = line.split(',');

    if (description && unit && quantity && rate) {
      items.push({
        id: `item-${Date.now()}-${i}`,
        itemNumber: itemNumber?.trim() || '',
        description: description.trim(),
        unit: unit.trim(),
        quantity: parseFloat(quantity),
        rate: parseFloat(rate),
        amount: parseFloat(quantity) * parseFloat(rate),
        standard: 'SMM7',
      });
    }
  }

  return items;
}
