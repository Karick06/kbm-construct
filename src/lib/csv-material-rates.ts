/**
 * Material Rates from CSV
 * Load material rates from material-rates.csv
 */

import { parseCSV } from './csv-parser';

export interface CSVMaterialRate {
  id: string;
  code: string;
  description: string;
  category: string;
  unit: string;
  rate: number;
  wasteFactor: number;
  costCode: string;
}

let materialCache: CSVMaterialRate[] | null = null;

export async function loadMaterialRatesFromCSV(): Promise<CSVMaterialRate[]> {
  if (materialCache) {
    return materialCache;
  }

  try {
    const data = await parseCSV<CSVMaterialRate>('material-rates.csv', (row) => {
      return {
        id: String(row.id || ''),
        code: String(row.code || ''),
        description: String(row.description || ''),
        category: String(row.category || ''),
        unit: String(row.unit || ''),
        rate: parseFloat(String(row.rate || '0')),
        wasteFactor: parseFloat(String(row.wasteFactor || '1')),
        costCode: String(row.costCode || '')
      };
    });

    materialCache = data.filter(item => item.id && item.description);
    return materialCache;
  } catch (error) {
    console.error('Error loading material rates from CSV:', error);
    return [];
  }
}

export function clearMaterialCache() {
  materialCache = null;
}
