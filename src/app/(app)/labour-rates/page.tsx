'use client';

import { useState, useEffect } from 'react';
import type { LabourRate } from '@/lib/labour-rates';
import { parseCSV } from '@/lib/csv-parser';

export default function LabourRatesPage() {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [labourRates, setLabourRates] = useState<LabourRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parseCSV<LabourRate>('labour-rates.csv').then((data) => {
      setLabourRates(data);
      setLoading(false);
    });
  }, []);

  const filteredRates = labourRates.filter(
    (rate) =>
      rate.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rate.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const trades = [...new Set(labourRates.map((r) => r.trade))];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Labour Rate Library</h1>
        <p className="mt-2 text-gray-300">Skilled and semi-skilled labour rates by trade</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-400">Loading labour rates...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <p className="text-xs font-bold uppercase text-gray-400 mb-2">Total Trades</p>
          <p className="text-2xl font-bold text-white">{trades.length}</p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <p className="text-xs font-bold uppercase text-gray-400 mb-2">Avg Hourly Rate</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(
              labourRates.reduce((sum, r) => sum + r.hourlyRate, 0) / (labourRates.length || 1)
            )}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <p className="text-xs font-bold uppercase text-gray-400 mb-2">Min Rate</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(Math.min(...labourRates.map((r) => r.hourlyRate)))}
          </p>
        </div>
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <p className="text-xs font-bold uppercase text-gray-400 mb-2">Max Rate</p>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(Math.max(...labourRates.map((r) => r.hourlyRate)))}
          </p>
        </div>
      </div>

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
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{rate.trade}</h3>
                    <p className="text-sm text-gray-400 mt-1">{rate.description}</p>
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
  );
}
