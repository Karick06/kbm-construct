'use client';

import { useState, useEffect } from 'react';
import type { MaterialRate } from '@/lib/material-rates';
import { parseCSV } from '@/lib/csv-parser';

export default function MaterialRatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [materialRates, setMaterialRates] = useState<MaterialRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parseCSV<MaterialRate>('material-rates.csv').then((data) => {
      setMaterialRates(data);
      setLoading(false);
    });
  }, []);

  const categories = [...new Set(materialRates.map((m) => m.category))];

  const filteredRates = materialRates.filter(
    (rate) =>
      (selectedCategory === null || rate.category === selectedCategory) &&
      (rate.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rate.category.includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getCategoryLabel = (category: string) => {
    return (
      {
        concrete: '🏗️ Concrete',
        masonry: '🧱 Masonry',
        timber: '🪵 Timber',
        steel: '⚙️ Steel',
        finishing: '🎨 Finishing',
        roofing: '🏠 Roofing',
        insulation: '🧊 Insulation',
        asphalt: '🛣️ Asphalt',
        aggregate: '⛰️ Aggregate',
      }[category] || category
    );
  };

  const avgRate = Math.round(
    filteredRates.reduce((sum, m) => sum + m.rate, 0) / (filteredRates.length || 1) * 100
  ) / 100;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Material Rate Library</h1>
        <p className="mt-2 text-gray-300">Construction materials and pricing per unit</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading material rates...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <p className="text-xs font-bold uppercase text-gray-400 mb-2">Total Materials</p>
          <p className="text-2xl font-bold text-white">{materialRates.length}</p>
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
          <p className="text-xs font-bold uppercase text-gray-400 mb-2">Results</p>
          <p className="text-2xl font-bold text-white">{filteredRates.length}</p>
        </div>
      </div>

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
                {getCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredRates.length === 0 ? (
            <p className="py-8 text-center text-gray-400">No materials found</p>
          ) : (
            filteredRates.map((material) => (
              <div
                key={material.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-700 bg-gray-700/50 p-4 hover:bg-gray-700 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{material.description}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {getCategoryLabel(material.category)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded bg-gray-800 p-3">
                    <p className="text-xs text-gray-400">Unit Price</p>
                    <p className="text-sm font-semibold text-orange-400 mt-1">
                      {formatCurrency(material.rate)}
                    </p>
                  </div>
                  <div className="rounded bg-gray-800 p-3">
                    <p className="text-xs text-gray-400">Per Unit</p>
                    <p className="text-sm font-semibold text-white mt-1">{material.unit}</p>
                  </div>
                  <div className="rounded bg-gray-800 p-3">
                    <p className="text-xs text-gray-400">Waste Factor</p>
                    <p className="text-sm font-semibold text-yellow-400 mt-1">
                      {Math.round((material.wasteFactor - 1) * 100)}%
                    </p>
                  </div>
                  <div className="rounded bg-gray-800 p-3">
                    <p className="text-xs text-gray-400">With Waste</p>
                    <p className="text-sm font-semibold text-white mt-1">
                      {formatCurrency(material.rate * material.wasteFactor)}
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
  );
}
