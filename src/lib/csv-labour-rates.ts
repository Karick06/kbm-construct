/**
 * Labour Rates from CSV
 * Load labour rates from labour-rates.csv
 */

import { parseCSV } from './csv-parser';

export interface CSVLabourRate {
  id: string;
  trade: string;
  description: string;
  hourlyRate: number;
  dailyRate: number;
  productivityFactor: number;
  overtimeRate: number;
  costCode: string;
}

let labourCache: CSVLabourRate[] | null = null;

export async function loadLabourRatesFromCSV(): Promise<CSVLabourRate[]> {
  if (labourCache) {
    return labourCache;
  }

  try {
    const data = await parseCSV<CSVLabourRate>('labour-rates.csv', (row) => {
      return {
        id: String(row.id || ''),
        trade: String(row.trade || ''),
        description: String(row.description || ''),
        hourlyRate: parseFloat(String(row.hourlyRate || '0')),
        dailyRate: parseFloat(String(row.dailyRate || '0')),
        productivityFactor: parseFloat(String(row.productivityFactor || '1')),
        overtimeRate: parseFloat(String(row.overtimeRate || '1.5')),
        costCode: String(row.costCode || '')
      };
    });

    labourCache = data.filter(item => item.id && item.trade);
    return labourCache;
  } catch (error) {
    console.error('Error loading labour rates from CSV:', error);
    return [];
  }
}

export function clearLabourCache() {
  labourCache = null;
}
