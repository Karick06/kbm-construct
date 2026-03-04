import { parseCSV } from './csv-parser';

export interface LabourRateEntry {
  id: string;
  trade: string;
  description: string;
  hourlyRate: number;
  dailyRate: number;
  productivityFactor: number;
  overtimeRate: number;
  costCode: string;
}

const LABOUR_CUSTOM_KEY = 'kbm_labour_custom';
const LABOUR_OVERRIDES_KEY = 'kbm_labour_overrides';
const LABOUR_DELETED_KEY = 'kbm_labour_deleted';

let labourCache: LabourRateEntry[] | null = null;

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

export async function loadLabourRates(): Promise<LabourRateEntry[]> {
  if (labourCache) return labourCache;

  const data = await parseCSV<LabourRateEntry>('labour-rates.csv', (row) => ({
    id: String(row.id || '').trim(),
    trade: String(row.trade || '').trim(),
    description: String(row.description || '').trim(),
    hourlyRate: Number(row.hourlyRate || 0),
    dailyRate: Number(row.dailyRate || 0),
    productivityFactor: Number(row.productivityFactor || 1),
    overtimeRate: Number(row.overtimeRate || 1.5),
    costCode: String(row.costCode || '').trim(),
  }));

  labourCache = data.filter((item) => item.id && item.trade);
  return labourCache;
}

export function getCustomLabourRates(): LabourRateEntry[] {
  return readJson<LabourRateEntry[]>(LABOUR_CUSTOM_KEY, []);
}

export function getLabourOverrides(): Record<string, LabourRateEntry> {
  return readJson<Record<string, LabourRateEntry>>(LABOUR_OVERRIDES_KEY, {});
}

export function getDeletedLabourIds(): string[] {
  return readJson<string[]>(LABOUR_DELETED_KEY, []);
}

export async function getAllLabourRates(): Promise<LabourRateEntry[]> {
  const base = await loadLabourRates();
  const overrides = getLabourOverrides();
  const deleted = new Set(getDeletedLabourIds());
  const custom = getCustomLabourRates();

  const mergedBase = base
    .filter((item) => !deleted.has(item.id))
    .map((item) => overrides[item.id] || item);

  const mergedCustom = custom.filter((item) => !deleted.has(item.id));

  return [...mergedBase, ...mergedCustom];
}

export function saveCustomLabourRate(rate: LabourRateEntry): void {
  const custom = getCustomLabourRates();
  writeJson(LABOUR_CUSTOM_KEY, [...custom, rate]);
}

export function updateLabourRate(rate: LabourRateEntry): void {
  const custom = getCustomLabourRates();
  const customIndex = custom.findIndex((item) => item.id === rate.id);

  if (customIndex >= 0) {
    const updated = [...custom];
    updated[customIndex] = rate;
    writeJson(LABOUR_CUSTOM_KEY, updated);
    return;
  }

  const overrides = getLabourOverrides();
  overrides[rate.id] = rate;
  writeJson(LABOUR_OVERRIDES_KEY, overrides);
}

export function deleteLabourRate(id: string): void {
  const custom = getCustomLabourRates();
  const customIndex = custom.findIndex((item) => item.id === id);

  if (customIndex >= 0) {
    const updated = custom.filter((item) => item.id !== id);
    writeJson(LABOUR_CUSTOM_KEY, updated);
    return;
  }

  const deleted = new Set(getDeletedLabourIds());
  deleted.add(id);
  writeJson(LABOUR_DELETED_KEY, Array.from(deleted));

  const overrides = getLabourOverrides();
  if (overrides[id]) {
    delete overrides[id];
    writeJson(LABOUR_OVERRIDES_KEY, overrides);
  }
}

export function clearLabourCache(): void {
  labourCache = null;
}
