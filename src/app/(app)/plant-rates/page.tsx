'use client';

import { useEffect, useMemo, useState } from 'react';
import { downloadCSV, parseCSVText } from '@/lib/csv-parser';
import {
  clearPlantCache,
  deletePlantRate,
  getAllPlantRates,
  getCustomPlantRates,
  loadPlantRates,
  saveCustomPlantRate,
  updatePlantRate,
  type PlantRateEntry,
} from '@/lib/plant-database';
import { getAllLabourRates } from '@/lib/labour-database';
import { getAllMaterials } from '@/lib/materials-database';

type PlantFormState = {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string;
  rate: string;
  unit: string;
  costCode: string;
};

const emptyFormState: PlantFormState = {
  id: '',
  code: '',
  name: '',
  category: '',
  description: '',
  rate: '',
  unit: 'day',
  costCode: '',
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

export default function PlantRatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [plantRates, setPlantRates] = useState<PlantRateEntry[]>([]);
  const [customCount, setCustomCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<PlantFormState>(emptyFormState);
  const [importError, setImportError] = useState<string>('');

  const loadData = async () => {
    const data = await getAllPlantRates();
    setPlantRates(data);
    setCustomCount(getCustomPlantRates().length);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = useMemo(
    () => [...new Set(plantRates.map((p) => p.category))].filter(Boolean),
    [plantRates]
  );

  const filteredRates = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return plantRates.filter(
      (rate) =>
        (selectedCategory === null || rate.category === selectedCategory) &&
        (rate.name.toLowerCase().includes(term) ||
          rate.description.toLowerCase().includes(term))
    );
  }, [plantRates, searchTerm, selectedCategory]);

  const resetForm = () => {
    setFormState(emptyFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (rate: PlantRateEntry) => {
    setEditingId(rate.id);
    setFormState({
      id: rate.id,
      code: rate.code,
      name: rate.name,
      category: rate.category,
      description: rate.description,
      rate: String(rate.rate),
      unit: rate.unit,
      costCode: rate.costCode,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formState.name.trim() || !formState.category.trim()) return;

    const entry: PlantRateEntry = {
      id: editingId || formState.id || `P-${Date.now()}`,
      code: formState.code.trim(),
      name: formState.name.trim(),
      category: formState.category.trim(),
      description: formState.description.trim(),
      rate: Number(formState.rate || 0),
      unit: formState.unit.trim(),
      costCode: formState.costCode.trim(),
    };

    if (editingId) {
      updatePlantRate(entry);
    } else {
      saveCustomPlantRate(entry);
    }

    loadData();
    resetForm();
  };

  const handleDelete = (id: string) => {
    deletePlantRate(id);
    loadData();
  };

  const handleExport = () => {
    downloadCSV(plantRates, 'plant-rates.csv');
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

    const base = await loadPlantRates();
    const baseIds = new Set(base.map((item) => item.id));
    const customIds = new Set(getCustomPlantRates().map((item) => item.id));

    const filteredRows = isCombined
      ? rows.filter((row) => String(row.type || '').toLowerCase() === 'plant')
      : rows;

    filteredRows.forEach((row) => {
      const id = String(row.id || '').trim() || `P-${Date.now()}-${Math.random()}`;
      const entry: PlantRateEntry = {
        id,
        code: String(row.code || '').trim(),
        name: String(row.name || '').trim(),
        category: String(row.category || '').trim(),
        description: String(row.description || '').trim(),
        rate: Number(row.rate || 0),
        unit: String(row.unit || '').trim(),
        costCode: String(row.costCode || '').trim(),
      };

      if (!entry.name || !entry.category) return;

      if (baseIds.has(entry.id) || customIds.has(entry.id)) {
        updatePlantRate(entry);
      } else {
        saveCustomPlantRate(entry);
      }
    });

    clearPlantCache();
    loadData();
  };

  const avgRate =
    filteredRates.reduce((sum, p) => sum + p.rate, 0) / (filteredRates.length || 1);

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading plant rates...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Total Plant</p>
              <p className="text-2xl font-bold text-white">{plantRates.length}</p>
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
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Custom Rates</p>
              <p className="text-2xl font-bold text-white">{customCount}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Add Plant Rate
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
                <span className="text-gray-400">Import Plant CSV</span>
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
                {editingId ? 'Edit Plant Rate' : 'Add Plant Rate'}
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
                  placeholder="Description"
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Rate"
                  value={formState.rate}
                  onChange={(e) => setFormState({ ...formState, rate: e.target.value })}
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
                  type="text"
                  placeholder="Code"
                  value={formState.code}
                  onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="text"
                  placeholder="Cost Code"
                  value={formState.costCode}
                  onChange={(e) => setFormState({ ...formState, costCode: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="rounded bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  {editingId ? 'Save Changes' : 'Add Rate'}
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
                placeholder="Search plant & equipment..."
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
              {filteredRates.length === 0 ? (
                <p className="py-8 text-center text-gray-400">No plant found</p>
              ) : (
                filteredRates.map((plant) => (
                  <div
                    key={plant.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-700 bg-gray-700/50 p-4 hover:bg-gray-700 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{plant.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{plant.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(plant)}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(plant.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Rate</p>
                        <p className="text-sm font-semibold text-orange-400 mt-1">
                          {formatCurrency(plant.rate)}
                        </p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Unit</p>
                        <p className="text-sm font-semibold text-white mt-1">{plant.unit}</p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Code</p>
                        <p className="text-sm font-semibold text-gray-300 mt-1">{plant.code}</p>
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
  );
}
