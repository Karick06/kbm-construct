import { parseCSV } from './csv-parser';

export interface PlantRateEntry {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  rate: number;
  unit: string;
  costCode: string;
}

const PLANT_CUSTOM_KEY = 'kbm_plant_custom';
const PLANT_OVERRIDES_KEY = 'kbm_plant_overrides';
const PLANT_DELETED_KEY = 'kbm_plant_deleted';

let plantCache: PlantRateEntry[] | null = null;

const isBrowser = () => typeof window !== 'undefined';

const readJson = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

export async function loadPlantRates(): Promise<PlantRateEntry[]> {
  if (plantCache) return plantCache;

  const data = await parseCSV<PlantRateEntry>('plant-rates.csv', (row) => ({
    id: String(row.id || '').trim(),
    code: String(row.code || '').trim(),
    name: String(row.name || '').trim(),
    category: String(row.category || '').trim(),
    description: String(row.description || '').trim(),
    rate: Number(row.rate || 0),
    unit: String(row.unit || '').trim(),
    costCode: String(row.costCode || '').trim(),
  }));

  plantCache = data.filter((item) => item.id && item.name);
  return plantCache;
}

export function getCustomPlantRates(): PlantRateEntry[] {
  return readJson<PlantRateEntry[]>(PLANT_CUSTOM_KEY, []);
}

export function getPlantOverrides(): Record<string, PlantRateEntry> {
  return readJson<Record<string, PlantRateEntry>>(PLANT_OVERRIDES_KEY, {});
}

export function getDeletedPlantIds(): string[] {
  return readJson<string[]>(PLANT_DELETED_KEY, []);
}

export async function getAllPlantRates(): Promise<PlantRateEntry[]> {
  const base = await loadPlantRates();
  const overrides = getPlantOverrides();
  const deleted = new Set(getDeletedPlantIds());
  const custom = getCustomPlantRates();

  const mergedBase = base
    .filter((item) => !deleted.has(item.id))
    .map((item) => overrides[item.id] || item);

  const mergedCustom = custom.filter((item) => !deleted.has(item.id));

  return [...mergedBase, ...mergedCustom];
}

export function saveCustomPlantRate(rate: PlantRateEntry): void {
  const custom = getCustomPlantRates();
  writeJson(PLANT_CUSTOM_KEY, [...custom, rate]);
}

export function updatePlantRate(rate: PlantRateEntry): void {
  const custom = getCustomPlantRates();
  const customIndex = custom.findIndex((item) => item.id === rate.id);

  if (customIndex >= 0) {
    const updated = [...custom];
    updated[customIndex] = rate;
    writeJson(PLANT_CUSTOM_KEY, updated);
    return;
  }

  const overrides = getPlantOverrides();
  overrides[rate.id] = rate;
  writeJson(PLANT_OVERRIDES_KEY, overrides);
}

export function deletePlantRate(id: string): void {
  const custom = getCustomPlantRates();
  const customIndex = custom.findIndex((item) => item.id === id);

  if (customIndex >= 0) {
    const updated = custom.filter((item) => item.id !== id);
    writeJson(PLANT_CUSTOM_KEY, updated);
    return;
  }

  const deleted = new Set(getDeletedPlantIds());
  deleted.add(id);
  writeJson(PLANT_DELETED_KEY, Array.from(deleted));

  const overrides = getPlantOverrides();
  if (overrides[id]) {
    delete overrides[id];
    writeJson(PLANT_OVERRIDES_KEY, overrides);
  }
}

export function clearPlantCache(): void {
  plantCache = null;
}
