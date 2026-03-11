'use client';

import PermissionGuard from "@/components/PermissionGuard";


import { useEffect, useMemo, useState } from 'react';
import { downloadCSV, parseCSVText } from '@/lib/csv-parser';
import {
  clearMaterialCache,
  deleteMaterialLocally,
  getAllMaterials,
  getCustomMaterials,
  getMaterialCategories,
  loadMaterials,
  saveMaterialLocally,
  updateMaterialLocally,
  type Material,
} from '@/lib/materials-database';
import { getAllLabourRates } from '@/lib/labour-database';
import { getAllPlantRates } from '@/lib/plant-database';

type MaterialFormState = {
  id: string;
  name: string;
  category: string;
  unit: string;
  defaultRate: string;
  density: string;
  description: string;
};

const emptyFormState: MaterialFormState = {
  id: '',
  name: '',
  category: '',
  unit: 'm3',
  defaultRate: '',
  density: '',
  description: '',
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount);

const buildCombinedRows = async () => {
  const [materials, labour, plant] = await Promise.all([
    getAllMaterials(),
    getAllLabourRates(),
    getAllPlantRates(),
  ]);

  const rows: Record<string, string | number>[] = [];
  const baseRow = {
    type: '',
    id: '',
    name: '',
    trade: '',
    description: '',
    category: '',
    unit: '',
    defaultRate: '',
    density: '',
    hourlyRate: '',
    dailyRate: '',
    productivityFactor: '',
    overtimeRate: '',
    rate: '',
    costCode: '',
    code: '',
  };

  materials.forEach((material) => {
    rows.push({
      ...baseRow,
      type: 'material',
      id: material.id,
      name: material.name,
      description: material.description,
      category: material.category,
      unit: material.unit,
      defaultRate: material.defaultRate,
      density: material.density ?? '',
    });
  });

  labour.forEach((rate) => {
    rows.push({
      ...baseRow,
      type: 'labour',
      id: rate.id,
      trade: rate.trade,
      description: rate.description,
      hourlyRate: rate.hourlyRate,
      dailyRate: rate.dailyRate,
      productivityFactor: rate.productivityFactor,
      overtimeRate: rate.overtimeRate,
      costCode: rate.costCode,
    });
  });

  plant.forEach((rate) => {
    rows.push({
      ...baseRow,
      type: 'plant',
      id: rate.id,
      name: rate.name,
      description: rate.description,
      category: rate.category,
      unit: rate.unit,
      rate: rate.rate,
      costCode: rate.costCode,
      code: rate.code,
    });
  });

  return rows;
};

export default function MaterialRatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [customCount, setCustomCount] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<MaterialFormState>(emptyFormState);
  const [importError, setImportError] = useState<string>('');

  const loadData = async () => {
    const [allMaterials, allCategories] = await Promise.all([
      getAllMaterials(),
      getMaterialCategories(),
    ]);
    setMaterials(allMaterials);
    setCategories(allCategories);
    setCustomCount(getCustomMaterials().length);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMaterials = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return materials.filter(
      (material) =>
        (selectedCategory === null || material.category === selectedCategory) &&
        (material.name.toLowerCase().includes(term) ||
          material.description.toLowerCase().includes(term))
    );
  }, [materials, searchTerm, selectedCategory]);

  const resetForm = () => {
    setFormState(emptyFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (material: Material) => {
    setEditingId(material.id);
    setFormState({
      id: material.id,
      name: material.name,
      category: material.category,
      unit: material.unit,
      defaultRate: String(material.defaultRate),
      density: material.density !== undefined ? String(material.density) : '',
      description: material.description,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formState.name.trim() || !formState.category.trim()) return;

    const entry: Material = {
      id: editingId || formState.id || `M-${Date.now()}`,
      name: formState.name.trim(),
      category: formState.category.trim(),
      unit: formState.unit.trim(),
      defaultRate: Number(formState.defaultRate || 0),
      density: formState.density ? Number(formState.density) : undefined,
      description: formState.description.trim(),
    };

    if (editingId) {
      updateMaterialLocally(entry);
    } else {
      saveMaterialLocally(entry);
    }

    loadData();
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteMaterialLocally(id);
    loadData();
  };

  const handleExport = () => {
    downloadCSV(materials, 'materials.csv');
  };

  const handleExportCombined = async () => {
    const rows = await buildCombinedRows();
    downloadCSV(rows, 'rate-libraries.csv');
  };

  const handleImport = async (file: File, isCombined: boolean) => {
    setImportError('');
    const text = await file.text();
    const rows = parseCSVText<Record<string, string | number>>(text);

    if (rows.length === 0) {
      setImportError('No rows found in CSV.');
      return;
    }

    const base = await loadMaterials();
    const baseIds = new Set(base.map((item) => item.id));
    const customIds = new Set(getCustomMaterials().map((item) => item.id));

    const filteredRows = isCombined
      ? rows.filter((row) => String(row.type || '').toLowerCase() === 'material')
      : rows;

    filteredRows.forEach((row) => {
      const id = String(row.id || '').trim() || `M-${Date.now()}-${Math.random()}`;
      const entry: Material = {
        id,
        name: String(row.name || '').trim(),
        category: String(row.category || '').trim(),
        unit: String(row.unit || '').trim(),
        defaultRate: Number(row.defaultRate || row.rate || 0),
        density: row.density !== undefined && String(row.density).trim() !== ''
          ? Number(row.density)
          : undefined,
        description: String(row.description || '').trim(),
      };

      if (!entry.name || !entry.category) return;

      if (baseIds.has(entry.id) || customIds.has(entry.id)) {
        updateMaterialLocally(entry);
      } else {
        saveMaterialLocally(entry);
      }
    });

    clearMaterialCache();
    loadData();
  };

  const avgRate =
    filteredMaterials.reduce((sum, m) => sum + m.defaultRate, 0) /
    (filteredMaterials.length || 1);

  return (
    <PermissionGuard permission="estimates">
    <div className="space-y-8">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading material rates...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Total Materials</p>
              <p className="text-2xl font-bold text-white">{materials.length}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Categories</p>
              <p className="text-2xl font-bold text-white">{categories.length}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Avg Rate</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(avgRate)}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Custom Materials</p>
              <p className="text-2xl font-bold text-white">{customCount}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Add Material
              </button>
              <button
                onClick={handleExport}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200"
              >
                Export CSV
              </button>
              <button
                onClick={handleExportCombined}
                className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200"
              >
                Export All Libraries
              </button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <label className="flex items-center gap-2">
                <span className="text-gray-400">Import Materials CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file, false);
                    e.currentTarget.value = '';
                  }}
                  className="text-xs text-gray-300"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-gray-400">Import Combined CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImport(file, true);
                    e.currentTarget.value = '';
                  }}
                  className="text-xs text-gray-300"
                />
              </label>
              {importError && <span className="text-red-400">{importError}</span>}
            </div>
          </div>

          {showForm && (
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">
                {editingId ? 'Edit Material' : 'Add Material'}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={formState.category}
                  onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={formState.unit}
                  onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Default Rate"
                  value={formState.defaultRate}
                  onChange={(e) => setFormState({ ...formState, defaultRate: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Density (optional)"
                  value={formState.density}
                  onChange={(e) => setFormState({ ...formState, density: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  {editingId ? 'Save Changes' : 'Add Material'}
                </button>
                <button
                  onClick={resetForm}
                  className="rounded border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <div className="mb-6 space-y-4">
              <input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    selectedCategory === null
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedCategory === cat
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredMaterials.length === 0 ? (
                <p className="py-8 text-center text-gray-400">No materials found</p>
              ) : (
                filteredMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-700 bg-gray-700/50 p-4 hover:bg-gray-700 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{material.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{material.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(material)}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(material.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Unit Price</p>
                        <p className="text-sm font-semibold text-orange-400 mt-1">
                          {formatCurrency(material.defaultRate)}
                        </p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Unit</p>
                        <p className="text-sm font-semibold text-white mt-1">{material.unit}</p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Category</p>
                        <p className="text-sm font-semibold text-white mt-1">{material.category}</p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Density</p>
                        <p className="text-sm font-semibold text-white mt-1">
                          {material.density ?? '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
    </PermissionGuard>
  );
}
