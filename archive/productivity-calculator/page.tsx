"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  PRODUCTIVITY_TEMPLATES,
  CATEGORIES, 
  calculateProductivityCost,
  resolveProductivityRates,
  type ProductivityRate,
} from "@/lib/productivity-outputs";
import { loadLabourRatesFromCSV, type CSVLabourRate } from "@/lib/csv-labour-rates";
import { loadMaterialRatesFromCSV, type CSVMaterialRate } from "@/lib/csv-material-rates";
import { loadPlantRatesFromCSV, type CSVPlantRate } from "@/lib/csv-plant-rates";
import type { RateComponent } from "@/lib/enquiries-store";

export default function ProductivityCalculatorPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('excavation');
  const [selectedProductivity, setSelectedProductivity] = useState<ProductivityRate | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [productivityOutputs, setProductivityOutputs] = useState<ProductivityRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<{
    days: number;
    gangDailyCost: number;
    totalLabourCost: number;
    totalMaterialsCost: number;
    totalPlantCost: number;
    grandTotal: number;
    labourBreakdown: { role: string; count: number; rate: number; dailyCost: number; totalCost: number }[];
    materialsBreakdown: { description: string; quantity: number; unit: string; rate: number; totalCost: number }[];
    plantBreakdown: { description: string; quantity: number; unit: string; rate: number; totalCost: number }[];
  } | null>(null);

  // Load rates from CSV and resolve productivity templates
  useEffect(() => {
    async function loadRates() {
      try {
        const [labourRates, materialRates, plantRates] = await Promise.all([
          loadLabourRatesFromCSV(),
          loadMaterialRatesFromCSV(),
          loadPlantRatesFromCSV(),
        ]);

        // Resolve templates with actual library rates
        const resolved = resolveProductivityRates(
          PRODUCTIVITY_TEMPLATES,
          labourRates,
          materialRates,
          plantRates
        );

        setProductivityOutputs(resolved);
      } catch (error) {
        console.error('Error loading rates:', error);
        // Fall back to using templates with fallback rates
        setProductivityOutputs(resolveProductivityRates(PRODUCTIVITY_TEMPLATES, [], [], []));
      } finally {
        setLoading(false);
      }
    }

    loadRates();
  }, []);

  const categoryOutputs = productivityOutputs.filter(p => p.category === selectedCategory);

  const handleCalculate = () => {
    if (!selectedProductivity || quantity <= 0) return;

    const calculation = calculateProductivityCost(selectedProductivity, quantity);
    setResults(calculation);
  };

  const handleClear = () => {
    setQuantity(0);
    setResults(null);
    setSelectedProductivity(null);
  };

  const exportToRateBuildup = () => {
    if (!results || !selectedProductivity) return;

    const components: RateComponent[] = [];
    
    // Add labour components
    results.labourBreakdown.forEach((item, index) => {
      components.push({
        componentId: `prod-labour-${Date.now()}-${index}`,
        type: 'labour' as const,
        description: `${item.role} (${item.count} × ${results.days.toFixed(2)} days)`,
        outputPerUnit: results.days,
        quantity: item.count,
        unit: 'days',
        unitRate: item.rate * 8,
        cost: item.totalCost,
      });
    });
    
    // Add materials components
    results.materialsBreakdown.forEach((item, index) => {
      components.push({
        componentId: `prod-material-${Date.now()}-${index}`,
        type: 'materials' as const,
        description: item.description,
        outputPerUnit: item.quantity,
        unit: item.unit,
        unitRate: item.rate,
        cost: item.totalCost,
      });
    });
    
    // Add plant components
    results.plantBreakdown.forEach((item, index) => {
      components.push({
        componentId: `prod-plant-${Date.now()}-${index}`,
        type: 'plant' as const,
        description: item.description,
        outputPerUnit: item.quantity,
        unit: item.unit,
        unitRate: item.rate,
        cost: item.totalCost,
      });
    });

    localStorage.setItem('productivity-calculator-export', JSON.stringify(components));
    router.push('/estimating-overview?import=productivity');
  };

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="mx-auto max-w-7xl">
        {loading && (
          <p className="mb-8 text-sm text-blue-400">Loading rates from your libraries...</p>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="mb-4 text-6xl">⏳</div>
              <p className="text-lg text-gray-400">Loading productivity data...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left Column: Input */}
          <div className="space-y-6">
            {/* Category Selection */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">1. Select Work Type</h2>
              <div className="grid grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setSelectedProductivity(null);
                      setResults(null);
                    }}
                    className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Selection */}
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="mb-4 text-xl font-semibold text-white">2. Select Activity</h2>
              <div className="space-y-2">
                {categoryOutputs.map((output) => (
                  <button
                    key={output.id}
                    onClick={() => {
                      setSelectedProductivity(output);
                      setResults(null);
                    }}
                    className={`w-full rounded-lg p-4 text-left transition-colors ${
                      selectedProductivity?.id === output.id
                        ? 'border-2 border-blue-500 bg-gray-800'
                        : 'border border-gray-700 bg-gray-850 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">{output.description}</p>
                        <p className="mt-1 text-sm text-gray-400">
                          Output: {output.outputPerDay} {output.unit}/day
                        </p>
                        <div className="mt-2 flex gap-2">
                          <span className="inline-flex items-center rounded-full bg-blue-900/30 px-2 py-0.5 text-xs text-blue-300">
                            👷 {output.gang.length}
                          </span>
                          {output.materials && output.materials.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-green-900/30 px-2 py-0.5 text-xs text-green-300">
                              📦 {output.materials.length}
                            </span>
                          )}
                          {output.plant && output.plant.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-orange-900/30 px-2 py-0.5 text-xs text-orange-300">
                              🚜 {output.plant.length}
                            </span>
                          )}
                        </div>
                        {output.notes && (
                          <p className="mt-1 text-xs text-gray-500">{output.notes}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Gang Composition */}
            {selectedProductivity && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Gang Composition</h3>
                <div className="space-y-2">
                  {selectedProductivity.gang.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-gray-850 p-3"
                    >
                      <div>
                        <p className="font-medium text-white">{member.role}</p>
                        <p className="text-sm text-gray-400">£{member.rate.toFixed(2)}/hour</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">× {member.count}</p>
                        <p className="text-sm text-gray-400">
                          £{(member.count * member.rate * 8).toFixed(2)}/day
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 border-t border-gray-700 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">Gang Daily Cost</p>
                      <p className="text-lg font-bold text-blue-400">
                        £{selectedProductivity.gang.reduce((sum, m) => sum + (m.count * m.rate * 8), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Materials Preview */}
            {selectedProductivity && selectedProductivity.materials && selectedProductivity.materials.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Materials (per {selectedProductivity.unit})</h3>
                <div className="space-y-2">
                  {selectedProductivity.materials.map((material, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-850 p-3">
                      <div>
                        <p className="font-medium text-white">{material.description}</p>
                        <p className="text-sm text-gray-400">
                          {material.quantityPerUnit} {material.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">£{material.rate.toFixed(2)}/{material.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Plant Preview */}
            {selectedProductivity && selectedProductivity.plant && selectedProductivity.plant.length > 0 && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="mb-4 text-lg font-semibold text-white">Plant/Equipment (per {selectedProductivity.unit})</h3>
                <div className="space-y-2">
                  {selectedProductivity.plant.map((plant, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-gray-850 p-3">
                      <div>
                        <p className="font-medium text-white">{plant.description}</p>
                        <p className="text-sm text-gray-400">
                          {plant.quantityPerUnit} {plant.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">£{plant.rate.toFixed(2)}/{plant.unit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Input */}
            {selectedProductivity && (
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h2 className="mb-4 text-xl font-semibold text-white">3. Enter Quantity</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Quantity ({selectedProductivity.unit})
                    </label>
                    <input
                      type="number"
                      value={quantity || ''}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg border border-gray-700 bg-gray-850 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                      placeholder="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCalculate}
                      disabled={!selectedProductivity || quantity <= 0}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500"
                    >
                      Calculate
                    </button>
                    <button
                      onClick={handleClear}
                      className="rounded-lg border border-gray-700 px-4 py-3 font-semibold text-gray-300 hover:bg-gray-800"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="space-y-6">
            {results && selectedProductivity && (
              <>
                {/* Summary */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <h2 className="mb-4 text-xl font-semibold text-white">Results</h2>
                  
                  <div className="mb-6 rounded-lg bg-blue-950/30 p-4">
                    <p className="text-sm text-gray-400">For</p>
                    <p className="text-lg font-semibold text-white">{selectedProductivity.description}</p>
                    <p className="mt-1 text-sm text-gray-400">
                      Quantity: {quantity.toLocaleString()} {selectedProductivity.unit}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-gray-850 p-4">
                      <p className="text-sm text-gray-400">Duration</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {results.days.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">days</p>
                    </div>

                    <div className="rounded-lg bg-gray-850 p-4">
                      <p className="text-sm text-gray-400">Gang Daily Cost</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        £{results.gangDailyCost.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-400">per day</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-blue-900/30 p-3">
                      <p className="text-xs text-gray-400">Labour</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        £{results.totalLabourCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-green-900/30 p-3">
                      <p className="text-xs text-gray-400">Materials</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        £{results.totalMaterialsCost.toFixed(2)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-orange-900/30 p-3">
                      <p className="text-xs text-gray-400">Plant</p>
                      <p className="mt-1 text-lg font-bold text-white">
                        £{results.totalPlantCost.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-gradient-to-r from-blue-900/50 to-blue-800/50 p-4">
                    <p className="text-sm text-gray-300">Grand Total</p>
                    <p className="mt-1 text-3xl font-bold text-white">
                      £{results.grandTotal.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Unit rate: £{(results.grandTotal / quantity).toFixed(2)}/{selectedProductivity.unit}
                    </p>
                  </div>
                </div>

                {/* Labour Breakdown */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Labour Breakdown</h3>
                  <div className="space-y-3">
                    {results.labourBreakdown.map((item, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-700 bg-gray-850 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-white">{item.role}</p>
                            <div className="mt-2 space-y-1 text-sm text-gray-400">
                              <p>Count: {item.count}</p>
                              <p>Rate: £{item.rate.toFixed(2)}/hour</p>
                              <p>Daily: £{item.dailyCost.toFixed(2)}</p>
                              <p>Duration: {results.days.toFixed(2)} days</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Total</p>
                            <p className="text-xl font-bold text-white">
                              £{item.totalCost.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Materials Breakdown */}
                {results.materialsBreakdown.length > 0 && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Materials Breakdown</h3>
                    <div className="space-y-3">
                      {results.materialsBreakdown.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-700 bg-gray-850 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-white">{item.description}</p>
                              <div className="mt-2 space-y-1 text-sm text-gray-400">
                                <p>Quantity: {item.quantity.toFixed(2)} {item.unit}</p>
                                <p>Rate: £{item.rate.toFixed(2)}/{item.unit}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400">Total</p>
                              <p className="text-xl font-bold text-white">
                                £{item.totalCost.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Plant Breakdown */}
                {results.plantBreakdown.length > 0 && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <h3 className="mb-4 text-lg font-semibold text-white">Plant Breakdown</h3>
                    <div className="space-y-3">
                      {results.plantBreakdown.map((item, idx) => (
                        <div key={idx} className="rounded-lg border border-gray-700 bg-gray-850 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-white">{item.description}</p>
                              <div className="mt-2 space-y-1 text-sm text-gray-400">
                                <p>Quantity: {item.quantity.toFixed(2)} {item.unit}</p>
                                <p>Rate: £{item.rate.toFixed(2)}/{item.unit}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400">Total</p>
                              <p className="text-xl font-bold text-white">
                                £{item.totalCost.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Export</h3>
                  <button
                    onClick={exportToRateBuildup}
                    className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <span>🔧</span>
                    <span>Add to Rate Buildup ({results.labourBreakdown.length + results.materialsBreakdown.length + results.plantBreakdown.length} components)</span>
                  </button>
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Exports all components to Estimating Overview
                  </p>
                </div>

                {/* Productivity Info */}
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Productivity Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Standard Output:</span>
                      <span className="font-medium text-white">
                        {selectedProductivity.outputPerDay} {selectedProductivity.unit}/day
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Unit Rate:</span>
                      <span className="font-medium text-white">
                        £{(results.totalLabourCost / quantity).toFixed(2)}/{selectedProductivity.unit}
                      </span>
                    </div>
                    {selectedProductivity.notes && (
                      <div className="mt-3 rounded bg-gray-850 p-3">
                        <p className="text-xs text-gray-400">Note:</p>
                        <p className="mt-1 text-sm text-gray-300">{selectedProductivity.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {!results && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-900/50">
                <div className="text-center">
                  <div className="mb-4 text-6xl">📊</div>
                  <p className="text-lg font-medium text-gray-400">Select an activity and enter quantity</p>
                  <p className="mt-2 text-sm text-gray-500">Results will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
