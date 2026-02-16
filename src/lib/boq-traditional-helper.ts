/**
 * Traditional BoQ Item Helper
 * Utilities for managing BoQ items in traditional format with proper numbering
 */

import type { BoQItem, MeasurementStandard } from './boq-models';

/**
 * Generate proper item number for traditional BoQ
 * SMM7: A.1, B.1, C.1.1, etc.
 * CESMM: A, D.1.1, H.1, etc.
 * SHW: A, C.1, E.1.1, etc.
 */
export function generateTraditionalItemNumber(
  standard: MeasurementStandard,
  section: string,
  itemIndexInSection: number,
  subItemIndex?: number
): string {
  const sectionLetter = section.toUpperCase().charAt(0);

  switch (standard) {
    case 'SMM7':
      // SMM7: A.1, A.1.1, B.1, etc.
      return `${sectionLetter}.${itemIndexInSection + 1}${subItemIndex !== undefined ? `.${subItemIndex + 1}` : ''}`;

    case 'CESMM':
      // CESMM: A.1, D.1.1, H.1, etc.
      return `${sectionLetter}.${itemIndexInSection + 1}${subItemIndex !== undefined ? `.${subItemIndex + 1}` : ''}`;

    case 'SHW':
      // SHW: A, C.1, E.1.1, etc.
      return `${sectionLetter}${itemIndexInSection > 0 ? `.${itemIndexInSection}` : ''}${subItemIndex !== undefined ? `.${subItemIndex + 1}` : ''}`;

    default:
      return `${sectionLetter}.${itemIndexInSection + 1}`;
  }
}

/**
 * Validate traditional BoQ item
 */
export function validateTraditionalBoQItem(item: Partial<BoQItem>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!item.itemNumber?.trim()) errors.push('Item number is required');
  if (!item.description?.trim()) errors.push('Description is required');
  if (!item.unit?.trim()) errors.push('Unit is required');
  if (!item.quantity || item.quantity <= 0) errors.push('Quantity must be greater than 0');
  if (item.rate === undefined || item.rate < 0) errors.push('Rate cannot be negative');
  if (!item.section?.trim()) errors.push('Section is required');

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate item amount
 */
export function calculateItemAmount(quantity: number, rate: number): number {
  return quantity * rate;
}

/**
 * Sort items by item number for traditional BoQ display
 */
export function sortByTraditionalItemNumber(items: BoQItem[]): BoQItem[] {
  return [...items].sort((a, b) => {
    const aNum = a.itemNumber || '';
    const bNum = b.itemNumber || '';

    // Split by dots and compare
    const aParts = aNum.split('.').map((p) => {
      const num = parseInt(p, 10);
      return Number.isNaN(num) ? p : num;
    });
    const bParts = bNum.split('.').map((p) => {
      const num = parseInt(p, 10);
      return Number.isNaN(num) ? p : num;
    });

    // Compare each part
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const aPart = aParts[i] ?? '';
      const bPart = bParts[i] ?? '';

      if (typeof aPart === 'string' || typeof bPart === 'string') {
        const aStr = String(aPart);
        const bStr = String(bPart);
        if (aStr !== bStr) return aStr.localeCompare(bStr);
      } else if (aPart !== bPart) {
        return (aPart as number) - (bPart as number);
      }
    }

    return 0;
  });
}

/**
 * Group items by section for traditional BoQ display
 */
export function groupBySection(items: BoQItem[]): Map<string, BoQItem[]> {
  const grouped = new Map<string, BoQItem[]>();

  items.forEach((item) => {
    const section = item.section || 'General';
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)!.push(item);
  });

  // Sort items within each section by item number
  grouped.forEach((sectionItems) => {
    sectionItems.sort((a, b) => {
      const aNum = a.itemNumber || '';
      const bNum = b.itemNumber || '';
      return aNum.localeCompare(bNum, undefined, { numeric: true });
    });
  });

  return grouped;
}

/**
 * Format item description for traditional BoQ (truncate if needed)
 */
export function formatItemDescription(
  description: string,
  maxLength: number = 80
): string {
  if (description.length <= maxLength) return description;
  return description.substring(0, maxLength - 3) + '...';
}

/**
 * Create a traditional BoQ summary
 */
export interface TraditionalBoQSummary {
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  contingencyAmount: number;
  totalWithContingency: number;
  valuePerItem: number;
}

export function createTraditionalBoQSummary(
  items: BoQItem[],
  contingencyPercent: number = 10
): TraditionalBoQSummary {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const contingency = (subtotal * contingencyPercent) / 100;

  return {
    totalItems: items.length,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    contingencyAmount: contingency,
    totalWithContingency: subtotal + contingency,
    valuePerItem: items.length > 0 ? subtotal / items.length : 0,
  };
}

/**
 * Export traditional BoQ to JSON
 */
export function exportTraditionalBoQToJSON(
  items: BoQItem[],
  projectName: string,
  standard: MeasurementStandard,
  preparedBy: string
): string {
  const data = {
    project: projectName,
    standard,
    preparedBy,
    date: new Date().toISOString(),
    items: items.map((item) => ({
      itemNumber: item.itemNumber,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      rate: item.rate,
      amount: item.amount,
      section: item.section,
    })),
    summary: createTraditionalBoQSummary(items),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Export traditional BoQ to CSV
 */
export function exportTraditionalBoQToCSV(
  items: BoQItem[],
  projectName: string,
  preparedBy: string
): string {
  const headers = [
    'Item Number',
    'Description',
    'Unit',
    'Quantity',
    'Rate (£)',
    'Amount (£)',
    'Section',
  ];

  const rows = items.map((item) => [
    item.itemNumber,
    `"${item.description}"`, // Quote description for CSV safety
    item.unit,
    item.quantity.toString(),
    item.rate.toFixed(2),
    item.amount.toFixed(2),
    item.section || 'General',
  ]);

  const csv = [
    `Project: ${projectName}`,
    `Prepared by: ${preparedBy}`,
    `Date: ${new Date().toISOString().split('T')[0]}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csv;
}
