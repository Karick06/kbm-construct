/**
 * Materials Database Utility
 * Central management for all materials used in KBM Construct
 */

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  density?: number; // tonnes/m³ for aggregate materials
  defaultRate: number;
  description: string;
}

export interface MaterialsDatabase {
  materials: Material[];
}

let cachedMaterials: Material[] | null = null;

const MATERIAL_CUSTOM_KEY = 'kbm_material_custom';
const MATERIAL_OVERRIDES_KEY = 'kbm_material_overrides';
const MATERIAL_DELETED_KEY = 'kbm_material_deleted';

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

/**
 * Load all materials from the database
 */
export async function loadMaterials(): Promise<Material[]> {
  if (cachedMaterials) {
    return cachedMaterials;
  }

  try {
    const response = await fetch('/data/materials.json');
    if (!response.ok) {
      throw new Error(`Failed to load materials: ${response.statusText}`);
    }
    const data: MaterialsDatabase = await response.json();
    cachedMaterials = data.materials;
    return data.materials;
  } catch (error) {
    console.error('Error loading materials database:', error);
    return [];
  }
}

/**
 * Get material by ID
 */
export async function getMaterialById(id: string): Promise<Material | undefined> {
  const materials = await getAllMaterials();
  return materials.find(m => m.id === id);
}

/**
 * Get materials by category
 */
export async function getMaterialsByCategory(category: string): Promise<Material[]> {
  const materials = await getAllMaterials();
  return materials.filter(m => m.category === category);
}

/**
 * Get all unique categories
 */
export async function getMaterialCategories(): Promise<string[]> {
  const materials = await getAllMaterials();
  const categories = new Set(materials.map(m => m.category));
  return Array.from(categories).sort();
}

/**
 * Search materials by name or description
 */
export async function searchMaterials(query: string): Promise<Material[]> {
  const materials = await getAllMaterials();
  const lowerQuery = query.toLowerCase();
  return materials.filter(m => 
    m.name.toLowerCase().includes(lowerQuery) || 
    m.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get materials for a specific type
 */
export async function getMaterialsByType(type: 'aggregate' | 'concrete' | 'drainage' | 'brickwork' | 'asphalt' | 'paving' | 'reinforcement' | 'formwork' | 'waterproofing' | 'insulation' | 'kerbs'): Promise<Material[]> {
  return getMaterialsByCategory(type);
}

export function getCustomMaterials(): Material[] {
  return readJson<Material[]>(MATERIAL_CUSTOM_KEY, []);
}

export function getMaterialOverrides(): Record<string, Material> {
  return readJson<Record<string, Material>>(MATERIAL_OVERRIDES_KEY, {});
}

export function getDeletedMaterialIds(): string[] {
  return readJson<string[]>(MATERIAL_DELETED_KEY, []);
}

export async function getAllMaterials(): Promise<Material[]> {
  const dbMaterials = await loadMaterials();
  const overrides = getMaterialOverrides();
  const deleted = new Set(getDeletedMaterialIds());
  const customMaterials = getCustomMaterials();

  const mergedBase = dbMaterials
    .filter((item) => !deleted.has(item.id))
    .map((item) => overrides[item.id] || item);

  const mergedCustom = customMaterials.filter((item) => !deleted.has(item.id));

  return [...mergedBase, ...mergedCustom];
}

export function saveMaterialLocally(material: Material): void {
  const customMaterials = getCustomMaterials();
  writeJson(MATERIAL_CUSTOM_KEY, [...customMaterials, material]);
}

export function updateMaterialLocally(material: Material): void {
  const customMaterials = getCustomMaterials();
  const customIndex = customMaterials.findIndex((item) => item.id === material.id);

  if (customIndex >= 0) {
    const updated = [...customMaterials];
    updated[customIndex] = material;
    writeJson(MATERIAL_CUSTOM_KEY, updated);
    return;
  }

  const overrides = getMaterialOverrides();
  overrides[material.id] = material;
  writeJson(MATERIAL_OVERRIDES_KEY, overrides);
}

export function deleteMaterialLocally(id: string): void {
  const customMaterials = getCustomMaterials();
  const customIndex = customMaterials.findIndex((item) => item.id === id);

  if (customIndex >= 0) {
    const updated = customMaterials.filter((item) => item.id !== id);
    writeJson(MATERIAL_CUSTOM_KEY, updated);
    return;
  }

  const deleted = new Set(getDeletedMaterialIds());
  deleted.add(id);
  writeJson(MATERIAL_DELETED_KEY, Array.from(deleted));

  const overrides = getMaterialOverrides();
  if (overrides[id]) {
    delete overrides[id];
    writeJson(MATERIAL_OVERRIDES_KEY, overrides);
  }
}

/**
 * Clear material cache (useful after updates)
 */
export function clearMaterialCache(): void {
  cachedMaterials = null;
}
