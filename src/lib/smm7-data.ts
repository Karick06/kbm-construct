/**
 * SMM7 Data Library
 * Load and parse SMM7 standard method of measurement data
 */

import { parseCSV } from './csv-parser';

export interface SMM7Item {
  description: string;
  positionLevel: number;
  quantity: number;
  unit: string;
}

let smm7Cache: SMM7Item[] | null = null;

export async function loadSMM7Data(): Promise<SMM7Item[]> {
  if (smm7Cache) {
    console.log('Returning cached SMM7 data:', smm7Cache.length);
    return smm7Cache;
  }

  try {
    console.log('Loading SMM7 data from CSV...');
    const data = await parseCSV<SMM7Item>('smm7-data.csv', (row) => {
      const item: SMM7Item = {
        description: String(row.Description || row.description || ''),
        positionLevel: parseInt(String(row['Position/ Level'] || row.positionLevel || '0')),
        quantity: parseFloat(String(row.Quantity || row.quantity || '1')),
        unit: String(row.Unit || row.unit || '')
      };
      return item;
    });

    console.log('Raw SMM7 data received:', data.length);
    if (data.length > 0) {
      console.log('First 3 raw items:', data.slice(0, 3));
    }

    // Filter out items without valid descriptions (keep items with or without units - sections don't have units)
    smm7Cache = data.filter(item => 
      item.description && 
      item.description.trim() !== ''
    );

    console.log('Filtered SMM7 data:', smm7Cache.length, 'items');
    if (smm7Cache.length > 0) {
      console.log('First 3 filtered items:', smm7Cache.slice(0, 3));
    }
    return smm7Cache;
  } catch (error) {
    console.error('Error loading SMM7 data:', error);
    return [];
  }
}

export function clearSMM7Cache() {
  smm7Cache = null;
}
