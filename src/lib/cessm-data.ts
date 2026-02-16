/**
 * CESSM Data Library
 * Load and parse Civil Engineering Standard Method of Measurement data
 */

import { parseCSV } from './csv-parser';

export interface CESSMItem {
  id: string;
  parentId: string;
  description: string;
  costPrice: number;
  sellPrice: number;
  unit: string;
  libcode: string;
  type: string;
  rowIndex: number;
}

let cessmCache: CESSMItem[] | null = null;

export async function loadCESSMData(): Promise<CESSMItem[]> {
  if (cessmCache) {
    console.log('Returning cached CESSM data:', cessmCache.length);
    return cessmCache;
  }

  try {
    console.log('Loading CESSM data from CSV...');
    let rowIdx = 0;
    const data = await parseCSV<CESSMItem>('cessm-data.csv', (row) => {
      const item: CESSMItem = {
        id: String(row['/library/items/item/@id'] || ''),
        parentId: String(row['/library/items/item/@pLevel'] || '0'),
        description: String(row['/library/items/item/@desc'] || ''),
        costPrice: parseFloat(String(row['/library/items/item/@costPrice1'] || '0')),
        sellPrice: parseFloat(String(row['/library/items/item/@sellPrice1'] || '0')),
        unit: String(row['/library/items/item/@uom'] || ''),
        libcode: String(row['/library/items/item/@libcode'] || ''),
        type: String(row['/library/items/item/@type'] || ''),
        rowIndex: rowIdx
      };
      rowIdx += 1;
      return item;
    });

    console.log('Raw CESSM data received:', data.length);
    if (data.length > 0) {
      console.log('First 3 raw items:', data.slice(0, 3));
    }

    // Filter: must have description (keep sections and items for tree structure)
    cessmCache = data.filter(item => 
      item.description && 
      item.description.trim() !== '' &&
      item.id &&
      item.id.trim() !== ''
    );

    console.log('Filtered CESSM data:', cessmCache.length, 'items');
    if (cessmCache.length > 0) {
      console.log('First 3 filtered items:', cessmCache.slice(0, 3));
    }
    return cessmCache;
  } catch (error) {
    console.error('Error loading CESSM data:', error);
    return [];
  }
}

export function clearCESSMCache() {
  cessmCache = null;
}
