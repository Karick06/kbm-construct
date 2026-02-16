/**
 * Valescape Library Data Loader
 * Loads custom project-specific library items from valescape-library.json
 */

export interface ValescapeItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  section: string;
}

let valescapeCache: ValescapeItem[] | null = null;

export async function loadValescapeData(): Promise<ValescapeItem[]> {
  if (valescapeCache) {
    return valescapeCache;
  }

  try {
    const response = await fetch('/data/valescape-library.json', { cache: 'no-store' });
    
    if (!response.ok) {
      console.warn('Valescape library file not found or not accessible');
      return [];
    }

    const fileItems = await response.json();
    
    // Try to get from localStorage as fallback/merge
    const stored = typeof window !== 'undefined'
      ? window.localStorage.getItem('valescape-library')
      : null;
    
    const storedItems = stored ? JSON.parse(stored) : null;
    
    // Prefer stored items if available, otherwise use file items
    const items = Array.isArray(storedItems) && storedItems.length > 0
      ? storedItems
      : Array.isArray(fileItems)
        ? fileItems
        : [];

    // Filter out invalid items
    const validItems = items.filter((item: any) => 
      item.id && item.description
    );

    valescapeCache = validItems;
    return validItems;
  } catch (error) {
    console.error('Error loading Valescape data:', error);
    return [];
  }
}

// Clear cache (useful for testing)
export function clearValescapeCache() {
  valescapeCache = null;
}
