'use client';

import PermissionGuard from "@/components/PermissionGuard";


import { useEffect, useMemo, useState } from 'react';
import { downloadCSV, parseCSVText } from '@/lib/csv-parser';
import {
  clearLabourCache,
  deleteLabourRate,
  getAllLabourRates,
  getCustomLabourRates,
  loadLabourRates,
  saveCustomLabourRate,
  updateLabourRate,
  type LabourRateEntry,
} from '@/lib/labour-database';
import { getAllPlantRates } from '@/lib/plant-database';
import { getAllMaterials } from '@/lib/materials-database';

type LabourFormState = {
  id: string;
  trade: string;
  description: string;
  hourlyRate: string;
  dailyRate: string;
  productivityFactor: string;
  overtimeRate: string;
  costCode: string;
};

const emptyFormState: LabourFormState = {
  id: '',
  trade: '',
  description: '',
  hourlyRate: '',
  dailyRate: '',
  productivityFactor: '1',
  overtimeRate: '1.5',
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

export default function LabourRatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [labourRates, setLabourRates] = useState<LabourRateEntry[]>([]);
  const [customCount, setCustomCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<LabourFormState>(emptyFormState);
  const [importError, setImportError] = useState<string>('');

  const loadData = async () => {
    const data = await getAllLabourRates();
    setLabourRates(data);
    setCustomCount(getCustomLabourRates().length);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRates = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return labourRates.filter(
      (rate) =>
        rate.trade.toLowerCase().includes(term) ||
        rate.description.toLowerCase().includes(term)
    );
  }, [labourRates, searchTerm]);

  const trades = useMemo(() => new Set(labourRates.map((r) => r.trade)).size, [labourRates]);

  const resetForm = () => {
    setFormState(emptyFormState);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (rate: LabourRateEntry) => {
    setEditingId(rate.id);
    setFormState({
      id: rate.id,
      trade: rate.trade,
      description: rate.description,
      hourlyRate: String(rate.hourlyRate),
      dailyRate: String(rate.dailyRate),
      productivityFactor: String(rate.productivityFactor),
      overtimeRate: String(rate.overtimeRate),
      costCode: rate.costCode,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formState.trade.trim() || !formState.description.trim()) return;

    const entry: LabourRateEntry = {
      id: editingId || formState.id || `L-${Date.now()}`,
      trade: formState.trade.trim(),
      description: formState.description.trim(),
      hourlyRate: Number(formState.hourlyRate || 0),
      dailyRate: Number(formState.dailyRate || 0),
      productivityFactor: Number(formState.productivityFactor || 1),
      overtimeRate: Number(formState.overtimeRate || 1.5),
      costCode: formState.costCode.trim(),
    };

    if (editingId) {
      updateLabourRate(entry);
    } else {
      saveCustomLabourRate(entry);
    }

    loadData();
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteLabourRate(id);
    loadData();
  };

  const handleExport = () => {
    downloadCSV(labourRates, 'labour-rates.csv');
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

    const base = await loadLabourRates();
    const baseIds = new Set(base.map((item) => item.id));
    const customIds = new Set(getCustomLabourRates().map((item) => item.id));

    const filteredRows = isCombined
      ? rows.filter((row) => String(row.type || '').toLowerCase() === 'labour')
      : rows;

    filteredRows.forEach((row) => {
      const id = String(row.id || '').trim() || `L-${Date.now()}-${Math.random()}`;
      const entry: LabourRateEntry = {
        id,
        trade: String(row.trade || '').trim(),
        description: String(row.description || '').trim(),
        hourlyRate: Number(row.hourlyRate || 0),
        dailyRate: Number(row.dailyRate || 0),
        productivityFactor: Number(row.productivityFactor || 1),
        overtimeRate: Number(row.overtimeRate || 1.5),
        costCode: String(row.costCode || '').trim(),
      };

      if (!entry.trade || !entry.description) return;

      if (baseIds.has(entry.id) || customIds.has(entry.id)) {
        updateLabourRate(entry);
      } else {
        saveCustomLabourRate(entry);
      }
    });

    clearLabourCache();
    loadData();
  };

  const avgHourly =
    labourRates.reduce((sum, r) => sum + r.hourlyRate, 0) / (labourRates.length || 1);

  const minHourly = labourRates.length ? Math.min(...labourRates.map((r) => r.hourlyRate)) : 0;
  const maxHourly = labourRates.length ? Math.max(...labourRates.map((r) => r.hourlyRate)) : 0;

  return (
    <PermissionGuard permission="estimates">
    <div className="space-y-8">
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading labour rates...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Total Trades</p>
              <p className="text-2xl font-bold text-white">{trades}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Avg Hourly Rate</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(avgHourly)}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
              <p className="text-xs font-bold uppercase text-gray-400 mb-2">Min Rate</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(minHourly)}</p>
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
                Add Labour Rate
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
                <span className="text-gray-400">Import Labour CSV</span>
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
                {editingId ? 'Edit Labour Rate' : 'Add Labour Rate'}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Trade"
                  value={formState.trade}
                  onChange={(e) => setFormState({ ...formState, trade: e.target.value })}
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
                  placeholder="Hourly Rate"
                  value={formState.hourlyRate}
                  onChange={(e) => setFormState({ ...formState, hourlyRate: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Daily Rate"
                  value={formState.dailyRate}
                  onChange={(e) => setFormState({ ...formState, dailyRate: e.target.value })}
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Productivity Factor"
                  value={formState.productivityFactor}
                  onChange={(e) =>
                    setFormState({ ...formState, productivityFactor: e.target.value })
                  }
                  className="rounded bg-gray-700 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  placeholder="Overtime Rate"
                  value={formState.overtimeRate}
                  onChange={(e) => setFormState({ ...formState, overtimeRate: e.target.value })}
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
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search labour rates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg bg-gray-700 px-4 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-3">
              {filteredRates.length === 0 ? (
                <p className="py-8 text-center text-gray-400">No labour rates found</p>
              ) : (
                filteredRates.map((rate) => (
                  <div
                    key={rate.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-700 bg-gray-700/50 p-4 hover:bg-gray-700 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{rate.trade}</h3>
                        <p className="text-sm text-gray-400 mt-1">{rate.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(rate)}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(rate.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Hourly Rate</p>
                        <p className="text-sm font-semibold text-orange-400 mt-1">
                          {formatCurrency(rate.hourlyRate)}
                        </p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Daily (8h)</p>
                        <p className="text-sm font-semibold text-white mt-1">
                          {formatCurrency(rate.dailyRate)}
                        </p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Productivity</p>
                        <p className="text-sm font-semibold text-white mt-1">
                          {Math.round(rate.productivityFactor * 100)}%
                        </p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Overtime</p>
                        <p className="text-sm font-semibold text-white mt-1">
                          {rate.overtimeRate}x
                        </p>
                      </div>
                      <div className="rounded bg-gray-800 p-3">
                        <p className="text-xs text-gray-400">Effective Cost</p>
                        <p className="text-sm font-semibold text-yellow-400 mt-1">
                          {formatCurrency(rate.hourlyRate * rate.productivityFactor)}
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
