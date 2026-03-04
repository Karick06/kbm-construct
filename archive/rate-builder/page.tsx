'use client';

import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import {
  calculateDrainageCost,
  type DrainageCostParams,
  type DrainageCostBreakdown,
  type ExcavatorType,
  DRAINAGE_PIPE_DATA,
} from '@/lib/drainage-pipe-data';

export default function RateBuilderPage() {
  const [activeTab, setActiveTab] = useState<'labour' | 'materials' | 'plant' | 'volumes'>('labour');
  const [params, setParams] = useState({
    diameter: 0.1,
    depth: 1,
    length: 10,
    excavatorType: '5t' as ExcavatorType,
    pipeCostPerMetre: 25,
    gravelCostPerTonne: 15,
    disposalCostPerTonne: 20,
  });

  const [costs, setCosts] = useState<DrainageCostBreakdown | null>(null);

  const handleCalculate = () => {
    const result = calculateDrainageCost(params);
    setCosts(result);
  };

  // Extract unique diameters and depths from the data
  const pipeDiameters = Array.from(new Set(DRAINAGE_PIPE_DATA.map(row => row.pipeDia))).sort((a, b) => a - b);
  const depths = Array.from(new Set(DRAINAGE_PIPE_DATA.map(row => row.invertD))).sort((a, b) => a - b);

  return (
    <div className="p-6">
      <PageHeader title="Drainage Pipe Rate Builder" subtitle="Calculate drainage pipe installation costs" />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: Parameters */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Parameters</h2>

            {/* Pipe Diameter */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pipe Diameter
              </label>
              <select
                value={params.diameter}
                onChange={(e) => setParams({ ...params, diameter: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                {pipeDiameters.map((d) => (
                  <option key={d} value={d}>
                    {Math.round(d * 1000)}mm
                  </option>
                ))}
              </select>
            </div>

            {/* Invert Depth */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Invert Depth (m)
              </label>
              <select
                value={params.depth}
                onChange={(e) => setParams({ ...params, depth: parseFloat(e.target.value) })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                {depths.map((d) => (
                  <option key={d} value={d}>
                    {d.toFixed(2)}m
                  </option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Length (m)
              </label>
              <input
                type="number"
                value={params.length}
                onChange={(e) => setParams({ ...params, length: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                min="0.1"
                step="0.1"
              />
            </div>

            {/* Excavator Size */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Excavator Size
              </label>
              <select
                value={params.excavatorType}
                onChange={(e) => setParams({ ...params, excavatorType: e.target.value as ExcavatorType })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
              >
                <option value="5t">5-tonne (£200/day)</option>
                <option value="14t">14-tonne (£250/day)</option>
                <option value="21t">21-tonne (£300/day)</option>
                <option value="30t">30-tonne (£350/day)</option>
                <option value="40t">40-tonne (£380/day)</option>
                <option value="50t">50-tonne (£410/day)</option>
                <option value="60t">60-tonne (£440/day)</option>
              </select>
            </div>

            {/* Pipe Cost */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pipe Cost (£/m)
              </label>
              <input
                type="number"
                value={params.pipeCostPerMetre}
                onChange={(e) => setParams({ ...params, pipeCostPerMetre: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                min="0"
                step="0.5"
              />
            </div>

            {/* Gravel Cost */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Gravel Cost (£/tonne)
              </label>
              <input
                type="number"
                value={params.gravelCostPerTonne}
                onChange={(e) => setParams({ ...params, gravelCostPerTonne: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                min="0"
                step="1"
              />
            </div>

            {/* Disposal Cost */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Disposal Cost (£/tonne)
              </label>
              <input
                type="number"
                value={params.disposalCostPerTonne}
                onChange={(e) => setParams({ ...params, disposalCostPerTonne: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                min="0"
                step="1"
              />
            </div>

            <button
              onClick={handleCalculate}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Calculate Rate
            </button>
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2">
          {costs ? (
            <div className="space-y-4">
              {/* Cost Per Metre Box */}
              <div className="rounded-xl border-2 border-green-500/20 bg-green-900/10 p-6">
                <p className="text-sm text-gray-400 mb-1">Cost Per Metre</p>
                <p className="text-4xl font-bold text-green-400">
                  £{costs.costPerMetre.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {Math.round(params.diameter * 1000)}mm @ {params.depth}m depth
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Labour ({costs.hoursRequired.toFixed(2)}h @ £95/hr)</span>
                    <span className="text-white font-medium">£{costs.labourCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Materials</span>
                    <span className="text-white font-medium">£{costs.materialCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Plant</span>
                    <span className="text-white font-medium">£{costs.plantCost.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 flex justify-between font-medium">
                    <span>Total Cost</span>
                    <span className="text-green-400">£{costs.totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Production Details */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Production Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400">Output Rate</p>
                    <p className="text-lg font-medium text-white">{costs.outputRate.toFixed(2)} m/shift</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Total Hours</p>
                    <p className="text-lg font-medium text-white">{costs.hoursRequired.toFixed(2)}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Length</p>
                    <p className="text-lg font-medium text-white">{params.length}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Excavator</p>
                    <p className="text-lg font-medium text-white">{params.excavatorType}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
              <p className="text-gray-400">Click "Calculate Rate" to see the results</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
