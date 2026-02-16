/**
 * Plant Rates from CSV
 * Load plant rates from plant-rates.csv
 */

import { parseCSV } from './csv-parser';

export interface CSVPlantRate {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  rate: number;
  unit: string;
  costCode: string;
}

let plantCache: CSVPlantRate[] | null = null;

export async function loadPlantRatesFromCSV(): Promise<CSVPlantRate[]> {
  if (plantCache) {
    return plantCache;
  }

  try {
    const data = await parseCSV<CSVPlantRate>('plant-rates.csv', (row) => {
      return {
        id: String(row.id || ''),
        code: String(row.code || ''),
        name: String(row.name || ''),
        category: String(row.category || ''),
        description: String(row.description || ''),
        rate: parseFloat(String(row.rate || '0')),
        unit: String(row.unit || ''),
        costCode: String(row.costCode || '')
      };
    });

    plantCache = data.filter(item => item.id && item.name);
    return plantCache;
  } catch (error) {
    console.error('Error loading plant rates from CSV:', error);
    return [];
  }
}

export function clearPlantCache() {
  plantCache = null;
}
