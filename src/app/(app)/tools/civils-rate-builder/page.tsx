'use client';

import { useState, useMemo, useEffect } from 'react';
import PageHeader from '@/components/PageHeader';
import { type RateComponent } from '@/lib/enquiries-store';
import { getAllMaterials, type Material } from '@/lib/materials-database';
import { getAllLabourRates, type LabourRateEntry } from '@/lib/labour-database';
import { getAllPlantRates, type PlantRateEntry } from '@/lib/plant-database';

type LabourRate = LabourRateEntry;
type PlantRate = PlantRateEntry;

export default function CivilsRateBuilderPage() {
  const [customOutputPerDay, setCustomOutputPerDay] = useState<number | null>(null);
  
  // Labour items
  const [labourItems, setLabourItems] = useState<Array<{ id: string; rate: LabourRate; quantity: number; overrideRate?: number }>>([]);
  const [selectedLabourToAdd, setSelectedLabourToAdd] = useState<string>('');
  const [labourQuantity, setLabourQuantity] = useState<number>(1);
  
  // Plant items
  const [plantItems, setPlantItems] = useState<Array<{ id: string; rate: PlantRate; quantity: number; overrideRate?: number }>>([]);
  const [selectedPlantToAdd, setSelectedPlantToAdd] = useState<string>('');
  const [plantQuantity, setPlantQuantity] = useState<number>(1);
  
  // Material items
  const [materialItems, setMaterialItems] = useState<Array<{ 
    id: string; 
    name: string; 
    purchaseRate: number; 
    purchaseUnit: string;
    quantityPerUnit: number;
    depth?: number; // Depth in meters for aggregate materials
    density?: number; // Tonnes per m³ for aggregate materials
    overridePurchaseRate?: number;
  }>>([]);
  const [materialName, setMaterialName] = useState<string>('');
  const [materialPurchaseRate, setMaterialPurchaseRate] = useState<number>(0);
  const [materialPurchaseUnit, setMaterialPurchaseUnit] = useState<string>('tonne');
  const [materialQuantity, setMaterialQuantity] = useState<number>(0);
  const [materialDepth, setMaterialDepth] = useState<number>(0);
  const [materialDensity, setMaterialDensity] = useState<number>(1.8);
  const [isAggregateMaterial, setIsAggregateMaterial] = useState<boolean>(false);
  
  const [labourRates, setLabourRates] = useState<LabourRate[]>([]);
  const [plantRates, setPlantRates] = useState<PlantRate[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [rateDescription, setRateDescription] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  
  // Library rates state
  const [libraryRates, setLibraryRates] = useState<any[]>([]);
  const [selectedLibraryRate, setSelectedLibraryRate] = useState<any | null>(null);
  const [libraryCategory, setLibraryCategory] = useState<string>('all');
  const [libraryBoqStandard, setLibraryBoqStandard] = useState<string>('all');
  const [libraryBoqSection, setLibraryBoqSection] = useState<string>('all');
  const [librarySearch, setLibrarySearch] = useState<string>('');

  // Load labour, plant rates, and materials database
  useEffect(() => {
    const loadRates = async () => {
      try {
        const [labourData, plantData, matData, libData] = await Promise.all([
          getAllLabourRates(),
          getAllPlantRates(),
          getAllMaterials(),
          fetch('/data/civils-groundworks-library.json').then(r => r.json()).catch(() => []),
        ]);

        setLabourRates(labourData);
        setPlantRates(plantData);
        setAvailableMaterials(matData);
        setLibraryRates(libData);

        setLoading(false);
      } catch (error) {
        console.error('Error loading rates:', error);
        setLoading(false);
      }
    };

    loadRates();
  }, []);

  // Filter library rates by category
  const filteredLibraryRates = useMemo(() => {
    let results = libraryRates;

    if (libraryBoqStandard !== 'all') {
      results = results.filter(r => r.boq?.standard === libraryBoqStandard);
    }

    if (libraryBoqSection !== 'all') {
      results = results.filter(r => r.boq?.section === libraryBoqSection);
    }

    if (libraryCategory !== 'all') {
      results = results.filter(r => r.category.toLowerCase().includes(libraryCategory.toLowerCase()));
    }

    if (librarySearch.trim()) {
      const search = librarySearch.toLowerCase();
      results = results.filter(r => 
        r.description.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search) ||
        r.category.toLowerCase().includes(search)
      );
    }

    return results;
  }, [libraryRates, libraryBoqStandard, libraryBoqSection, libraryCategory, librarySearch]);

  // Get unique categories from library rates
  const libraryCategoryOptions = useMemo(() => {
    const categories = new Set(libraryRates.map(r => r.category));
    return ['all', ...Array.from(categories).sort()];
  }, [libraryRates]);

  const libraryBoqStandardOptions = useMemo(() => {
    const standards = new Set(libraryRates.map(r => r.boq?.standard).filter(Boolean));
    return ['all', ...Array.from(standards).sort()];
  }, [libraryRates]);

  const libraryBoqSectionOptions = useMemo(() => {
    const sectionMap = new Map<string, string>();
    const filteredRates = libraryRates.filter(
      r => libraryBoqStandard === 'all' || r.boq?.standard === libraryBoqStandard
    );

    filteredRates.forEach((rate) => {
      const section = rate.boq?.section;
      if (!section) return;
      if (!sectionMap.has(section)) {
        const sectionTitle = rate.boq?.sectionTitle || 'Section';
        sectionMap.set(section, `${section} - ${sectionTitle}`);
      }
    });

    const entries = Array.from(sectionMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }));

    return [{ value: 'all', label: 'All sections' }, ...entries];
  }, [libraryRates, libraryBoqStandard]);

  // Load a library rate into the builder
  const loadLibraryRate = (rate: any) => {
    setSelectedLibraryRate(rate);
    
    // Clear existing items
    setLabourItems([]);
    setPlantItems([]);
    setMaterialItems([]);
    setCustomOutputPerDay(null);
    
    // Set the output per day from library
    setCustomOutputPerDay(rate.outputPerDay);
    
    // Load labour gang
    const newLabourItems = (rate.labourGang || []).map((member: any, idx: number) => {
      const rate_entry = labourRates.find(r => r.id === member.labourId) || {
        id: member.labourId,
        trade: member.role,
        description: member.role,
        hourlyRate: member.hourlyRate,
        dailyRate: member.hourlyRate * 8,
      };
      return {
        id: `labour-${idx}`,
        rate: rate_entry as any,
        quantity: member.count,
      };
    });
    setLabourItems(newLabourItems);
    
    // Load plant
    const newPlantItems = (rate.plant || []).map((plant: any, idx: number) => {
      const plant_entry = plantRates.find(r => r.id === plant.plantId) || {
        id: plant.plantId,
        name: plant.description,
        category: 'Equipment',
        description: plant.description,
        rate: plant.dailyRate,
        unit: 'day',
      };
      return {
        id: `plant-${idx}`,
        rate: plant_entry as any,
        quantity: plant.quantity,
      };
    });
    setPlantItems(newPlantItems);
    
    // Load materials
    const newMaterialItems = (rate.materials || []).map((mat: any, idx: number) => {
      return {
        id: `material-${idx}`,
        name: mat.description,
        purchaseRate: mat.rate,
        purchaseUnit: mat.unit,
        quantityPerUnit: mat.quantity,
        density: mat.density,
      };
    });
    setMaterialItems(newMaterialItems);
  };

  // Calculate rate for selected library rate
  const calculateRate = () => {
    if (!selectedLibraryRate) return null;

    const hoursPerDay = 8;
    const outputPerDay = customOutputPerDay || selectedLibraryRate?.outputPerDay;
    const hoursPerUnit = hoursPerDay / (outputPerDay || 1);

    // Labour cost - sum all labour items
    let labourCost = 0;
    labourItems.forEach(item => {
      const hourlyRate = item.overrideRate !== undefined ? item.overrideRate : item.rate.hourlyRate;
      labourCost += hourlyRate * item.quantity * hoursPerUnit;
    });

    // Plant cost - sum all plant items
    let plantCost = 0;
    plantItems.forEach(item => {
      const plantRate = item.overrideRate !== undefined ? item.overrideRate : item.rate.rate;
      if (item.rate.unit === 'day') {
        plantCost += (plantRate / 8) * hoursPerUnit * item.quantity;
      } else if (item.rate.unit === 'hr') {
        plantCost += plantRate * hoursPerUnit * item.quantity;
      } else {
        plantCost += plantRate * item.quantity;
      }
    });

    // Material cost - sum all materials
    const totalMaterialCost = materialItems.reduce((sum, item) => {
      const purchaseRate = item.overridePurchaseRate !== undefined ? item.overridePurchaseRate : item.purchaseRate;
      const cost = purchaseRate * item.quantityPerUnit;
      return sum + cost;
    }, 0);

    // Total
    const totalCost = labourCost + totalMaterialCost + plantCost;

    return {
      outputPerDay,
      hoursPerUnit,
      labourCost,
      totalMaterialCost,
      plantCost,
      finalRate: totalCost,
      unitRate: totalCost,
    };
  };

  const result = calculateRate();

  // Generate rate breakdown components for export
  const generateRateComponents = (): RateComponent[] => {
    if (!result) return [];
    if (!selectedLibraryRate) return [];

    const components: RateComponent[] = [];
    const outputPerDay = result.outputPerDay;

    // Add labour components
    labourItems.forEach((item, idx) => {
      const hourlyRate = item.overrideRate !== undefined ? item.overrideRate : item.rate.hourlyRate;
      components.push({
        componentId: `labour-${idx}`,
        type: 'labour',
        description: item.rate.description,
        outputPerUnit: outputPerDay,
        quantity: item.quantity,
        unit: 'shift',
        unitRate: hourlyRate * 8, // Daily rate
        cost: hourlyRate * item.quantity * result.hoursPerUnit,
      });
    });

    // Add plant components
    plantItems.forEach((item, idx) => {
      const plantRate = item.overrideRate !== undefined ? item.overrideRate : item.rate.rate;
      let cost = 0;
      if (item.rate.unit === 'day') {
        cost = (plantRate / 8) * result.hoursPerUnit * item.quantity;
      } else if (item.rate.unit === 'hr') {
        cost = plantRate * result.hoursPerUnit * item.quantity;
      } else {
        cost = plantRate * item.quantity;
      }
      
      components.push({
        componentId: `plant-${idx}`,
        type: 'plant',
        description: item.rate.name,
        outputPerUnit: outputPerDay,
        quantity: item.quantity,
        unit: item.rate.unit,
        unitRate: plantRate,
        cost: cost,
      });
    });

    // Add material components
    materialItems.forEach((item, idx) => {
      const purchaseRate = (item.overridePurchaseRate !== undefined && !isNaN(item.overridePurchaseRate)) 
        ? item.overridePurchaseRate 
        : item.purchaseRate;
      
      components.push({
        componentId: `material-${idx}`,
        type: 'materials',
        description: item.name,
        outputPerUnit: item.quantityPerUnit,
        quantity: item.quantityPerUnit,
        unit: item.purchaseUnit,
        unitRate: purchaseRate,
        cost: purchaseRate * item.quantityPerUnit,
      });
    });

    return components;
  };

  const saveRateBreakdown = () => {
    const rate = selectedLibraryRate;
    if (!rate || !result || !rateDescription.trim()) {
      alert('Please enter a description for this rate');
      return;
    }

    const components = generateRateComponents();
    const savedRate = {
      id: Date.now().toString(),
      description: rateDescription,
      source: selectedLibraryRate?.id,
      sourceType: 'library',
      unit: selectedLibraryRate?.unit,
      outputPerDay: result.outputPerDay,
      totalRate: result.finalRate,
      components: components,
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage
    const existing = localStorage.getItem('civils-saved-rates');
    const savedRates = existing ? JSON.parse(existing) : [];
    savedRates.unshift(savedRate);
    localStorage.setItem('civils-saved-rates', JSON.stringify(savedRates));

    setSavedMessage(`Rate saved: ${rateDescription}`);
    setShowSaveModal(false);
    setRateDescription('');
    
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const copyComponentsToClipboard = () => {
    const components = generateRateComponents();
    navigator.clipboard.writeText(JSON.stringify(components, null, 2));
    setSavedMessage('Rate components copied to clipboard!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <PageHeader 
          title="Civils & Groundworks Rate Builder" 
          subtitle="Quick access to comprehensive pre-built rates for civils, groundworks, and surfacing"
        />
        <div className="mt-6 flex items-center justify-center h-96">
          <div className="text-gray-400">Loading rate library...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader 
        title="Civils & Groundworks Rate Builder" 
        subtitle="Quick access to comprehensive pre-built rates for civils, groundworks, and surfacing"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Left: Category & Selection */}
        <div className="lg:col-span-1 space-y-6">
          {/* BOQ Filter */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">BOQ Filter</h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Standard</label>
                    <select
                      value={libraryBoqStandard}
                      onChange={(e) => {
                        setLibraryBoqStandard(e.target.value);
                        setLibraryBoqSection('all');
                        setSelectedLibraryRate(null);
                      }}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white text-sm"
                    >
                      {libraryBoqStandardOptions.map((standard) => (
                        <option key={standard} value={standard}>
                          {standard === 'all' ? 'All standards' : standard}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Section</label>
                    <select
                      value={libraryBoqSection}
                      onChange={(e) => {
                        setLibraryBoqSection(e.target.value);
                        setSelectedLibraryRate(null);
                      }}
                      className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white text-sm"
                    >
                      {libraryBoqSectionOptions.map((section) => (
                        <option key={section.value} value={section.value}>
                          {section.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Search Box */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Search</h2>
                <input
                  type="text"
                  value={librarySearch}
                  onChange={(e) => setLibrarySearch(e.target.value)}
                  placeholder="Search rates..."
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white text-sm placeholder:text-gray-500"
                />
                {librarySearch && (
                  <div className="mt-2 text-xs text-gray-400">
                    {filteredLibraryRates.length} rate{filteredLibraryRates.length !== 1 ? 's' : ''} found
                  </div>
                )}
              </div>

              {/* Library Categories with Rates */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Pre-built Rates by Category</h2>
                <div className="space-y-2">
                  {libraryCategoryOptions.map((cat) => {
                    const categoryRates = filteredLibraryRates.filter(r => r.category === cat);
                    const isExpanded = libraryCategory === cat;
                    
                    return (
                      <div key={cat} className="rounded-lg overflow-hidden">
                        <button
                          onClick={() => {
                            setLibraryCategory(isExpanded ? '' : cat);
                            if (!isExpanded) setSelectedLibraryRate(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition capitalize flex items-center justify-between ${
                            isExpanded
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          <span>{cat}</span>
                          <span className="text-xs opacity-70">
                            {categoryRates.length} {categoryRates.length === 1 ? 'rate' : 'rates'}
                          </span>
                        </button>
                        
                        {isExpanded && categoryRates.length > 0 && (
                          <div className="mt-2 ml-3 space-y-1 border-l-2 border-green-600/30 pl-3">
                            {categoryRates.map((rate) => (
                              <button
                                key={rate.id}
                                onClick={() => loadLibraryRate(rate)}
                                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                                  selectedLibraryRate?.id === rate.id
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                }`}
                              >
                                <div className="font-medium text-sm">{rate.description}</div>
                                <div className="text-xs text-gray-400 mt-1">
                                  £{rate.sellRate.toFixed(2)}/{rate.unit}
                                  {rate.boq?.sectionTitle && (
                                    <span className="ml-2 text-gray-500">• {rate.boq.sectionTitle}</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
        </div>

        {/* Right: Parameters & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parameters */}
          {selectedLibraryRate && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Build Rate</h2>
              <div className="space-y-4">
                {/* Rate Info */}
                <div className="pb-4 border-b border-gray-700">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Library Rate:</span>
                    <span className="text-white font-medium">{selectedLibraryRate?.description}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">Unit:</span>
                    <span className="text-white">{selectedLibraryRate?.unit}</span>
                  </div>
                  {selectedLibraryRate && (
                    <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded-lg">
                      <div className="text-xs text-green-300 font-medium mb-1">Pre-built rate includes:</div>
                      <div className="text-xs text-gray-300 space-y-1">
                        <div>• {selectedLibraryRate.labourGang?.length || 0} labour role{(selectedLibraryRate.labourGang?.length || 0) !== 1 ? 's' : ''}</div>
                        <div>• {selectedLibraryRate.plant?.length || 0} plant item{(selectedLibraryRate.plant?.length || 0) !== 1 ? 's' : ''}</div>
                        <div>• {selectedLibraryRate.materials?.length || 0} material{(selectedLibraryRate.materials?.length || 0) !== 1 ? 's' : ''}</div>
                        <div className="mt-2 pt-2 border-t border-green-900 text-green-200">
                          Base rate: £{selectedLibraryRate.sellRate.toFixed(2)}/{selectedLibraryRate.unit}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Output Per Day */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Output Per Day
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customOutputPerDay || selectedLibraryRate?.outputPerDay}
                      onChange={(e) => setCustomOutputPerDay(parseFloat(e.target.value) || null)}
                      className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white"
                    />
                    <span className="text-gray-400 py-2 px-3 bg-gray-800 rounded-lg">{selectedLibraryRate?.unit}/day</span>
                  </div>
                </div>

                {/* Labour Section */}
                <div className="pt-2 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-white mb-3">Labour</h3>
                  <div className="space-y-2">
                    {labourItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-800 p-2 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{item.rate.description}</div>
                            <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                          </div>
                          <button
                            onClick={() => setLabourItems(labourItems.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 text-sm px-2"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Rate (£/hr):</label>
                          <input
                            type="number"
                            value={item.overrideRate !== undefined ? item.overrideRate : item.rate.hourlyRate}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value);
                              const updated = [...labourItems];
                              updated[idx] = { ...updated[idx], overrideRate: newValue };
                              setLabourItems(updated);
                            }}
                            step="0.01"
                            min="0"
                            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white text-xs"
                          />
                          {item.overrideRate !== undefined && item.overrideRate !== item.rate.hourlyRate && (
                            <button
                              onClick={() => {
                                const updated = [...labourItems];
                                updated[idx] = { ...updated[idx], overrideRate: undefined };
                                setLabourItems(updated);
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                              title="Reset to default"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <select
                        value={selectedLabourToAdd}
                        onChange={(e) => setSelectedLabourToAdd(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white text-sm"
                      >
                        <option value="">Add labour...</option>
                        {labourRates.map((rate) => (
                          <option key={rate.id} value={rate.id}>
                            {rate.description} - £{rate.hourlyRate.toFixed(2)}/hr
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={labourQuantity}
                        onChange={(e) => setLabourQuantity(parseFloat(e.target.value) || 1)}
                        min="1"
                        step="0.5"
                        className="w-16 rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-white text-sm"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => {
                          if (selectedLabourToAdd) {
                            const rate = labourRates.find(r => r.id === selectedLabourToAdd);
                            if (rate) {
                              setLabourItems([...labourItems, { id: Date.now().toString(), rate, quantity: labourQuantity }]);
                              setSelectedLabourToAdd('');
                              setLabourQuantity(1);
                            }
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Plant Section */}
                <div className="pt-2 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-white mb-3">Plant & Equipment</h3>
                  <div className="space-y-2">
                    {plantItems.map((item, idx) => (
                      <div key={idx} className="bg-gray-800 p-2 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-white">{item.rate.name}</div>
                            <div className="text-xs text-gray-400">Qty: {item.quantity} | Unit: {item.rate.unit}</div>
                          </div>
                          <button
                            onClick={() => setPlantItems(plantItems.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 text-sm px-2"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Rate (£/{item.rate.unit}):</label>
                          <input
                            type="number"
                            value={item.overrideRate !== undefined ? item.overrideRate : item.rate.rate}
                            onChange={(e) => {
                              const newValue = parseFloat(e.target.value);
                              const updated = [...plantItems];
                              updated[idx] = { ...updated[idx], overrideRate: newValue };
                              setPlantItems(updated);
                            }}
                            step="0.01"
                            min="0"
                            className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white text-xs"
                          />
                          {item.overrideRate !== undefined && item.overrideRate !== item.rate.rate && (
                            <button
                              onClick={() => {
                                const updated = [...plantItems];
                                updated[idx] = { ...updated[idx], overrideRate: undefined };
                                setPlantItems(updated);
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                              title="Reset to default"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <select
                        value={selectedPlantToAdd}
                        onChange={(e) => setSelectedPlantToAdd(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white text-sm"
                      >
                        <option value="">Add plant...</option>
                        {plantRates.map((rate) => (
                          <option key={rate.id} value={rate.id}>
                            {rate.name} - £{rate.rate.toFixed(2)}/{rate.unit}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={plantQuantity}
                        onChange={(e) => setPlantQuantity(parseFloat(e.target.value) || 1)}
                        min="0.1"
                        step="0.1"
                        className="w-16 rounded-lg border border-gray-700 bg-gray-800 px-2 py-2 text-white text-sm"
                        placeholder="Qty"
                      />
                      <button
                        onClick={() => {
                          if (selectedPlantToAdd) {
                            const rate = plantRates.find(r => r.id === selectedPlantToAdd);
                            if (rate) {
                              setPlantItems([...plantItems, { id: Date.now().toString(), rate, quantity: plantQuantity }]);
                              setSelectedPlantToAdd('');
                              setPlantQuantity(1);
                            }
                          }
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Materials Section */}
                <div className="pt-2 border-t border-gray-700">
                  <h3 className="text-sm font-semibold text-white mb-3">Materials</h3>
                  <div className="space-y-2">
                    {materialItems.map((item, idx) => {
                      const purchaseRate = (item.overridePurchaseRate !== undefined && !isNaN(item.overridePurchaseRate)) ? item.overridePurchaseRate : item.purchaseRate;
                      const costPerUnit = purchaseRate * item.quantityPerUnit;
                      const isOverridden = item.overridePurchaseRate !== undefined && !isNaN(item.overridePurchaseRate) && item.overridePurchaseRate !== item.purchaseRate;
                      const isAggregate = item.density !== undefined;
                      
                      return (
                        <div key={idx} className="bg-gray-800 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-white">{item.name}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                {isAggregate && item.depth ? (
                                  <>Depth: {item.depth * 1000}mm × Density: {item.density}t/m³ = {item.quantityPerUnit.toFixed(3)} {item.purchaseUnit}/{selectedLibraryRate?.unit || 'unit'}</>
                                ) : (
                                  <>{item.quantityPerUnit} {item.purchaseUnit}/{selectedLibraryRate?.unit || 'unit'}</>
                                )}
                                {' × £'}{(isNaN(purchaseRate) ? 0 : purchaseRate).toFixed(2)}/{item.purchaseUnit} = £{(isNaN(costPerUnit) ? 0 : costPerUnit).toFixed(2)}/{selectedLibraryRate?.unit || 'unit'}
                              </div>
                            </div>
                            <button
                              onClick={() => setMaterialItems(materialItems.filter((_, i) => i !== idx))}
                              className="text-red-400 hover:text-red-300 text-sm px-2"
                            >
                              ✕
                            </button>
                          </div>
                          
                          {isAggregate ? (
                            // Aggregate material with depth and density
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-gray-400 block mb-1">Depth (mm):</label>
                                  <input
                                    type="number"
                                    value={item.depth ? item.depth * 1000 : ''}
                                    onChange={(e) => {
                                      const depthMm = parseFloat(e.target.value) || 0;
                                      const depthM = depthMm / 1000;
                                      const newQty = depthM * (item.density || 1.8);
                                      const updated = [...materialItems];
                                      updated[idx] = { ...updated[idx], depth: depthM, quantityPerUnit: newQty };
                                      setMaterialItems(updated);
                                    }}
                                    placeholder="150"
                                    step="10"
                                    min="0"
                                    className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 block mb-1">Density (t/m³):</label>
                                  <input
                                    type="number"
                                    value={item.density || 1.8}
                                    onChange={(e) => {
                                      const newDensity = parseFloat(e.target.value) || 1.8;
                                      const newQty = (item.depth || 0) * newDensity;
                                      const updated = [...materialItems];
                                      updated[idx] = { ...updated[idx], density: newDensity, quantityPerUnit: newQty };
                                      setMaterialItems(updated);
                                    }}
                                    step="0.1"
                                    min="0"
                                    className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-400 block mb-1">Rate (£/{item.purchaseUnit}):</label>
                                  <input
                                    type="number"
                                    value={isNaN(purchaseRate) ? '' : purchaseRate}
                                    onChange={(e) => {
                                      const newValue = parseFloat(e.target.value);
                                      const updated = [...materialItems];
                                      updated[idx] = { ...updated[idx], overridePurchaseRate: isNaN(newValue) ? undefined : newValue };
                                      setMaterialItems(updated);
                                    }}
                                    step="0.01"
                                    min="0"
                                    className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white text-xs"
                                  />
                                </div>
                              </div>
                              <div className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded">
                                = {item.quantityPerUnit.toFixed(3)} {item.purchaseUnit} per {selectedLibraryRate?.unit || 'unit'}
                              </div>
                            </div>
                          ) : (
                            // Standard material without depth
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Purchase Rate (£/{item.purchaseUnit}):</label>
                                <input
                                  type="number"
                                  value={isNaN(purchaseRate) ? '' : purchaseRate}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    const updated = [...materialItems];
                                    updated[idx] = { ...updated[idx], overridePurchaseRate: isNaN(newValue) ? undefined : newValue };
                                    setMaterialItems(updated);
                                  }}
                                  step="0.01"
                                  min="0"
                                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-gray-400 block mb-1">Qty per {selectedLibraryRate?.unit || 'unit'}:</label>
                                <input
                                  type="number"
                                  value={item.quantityPerUnit}
                                  onChange={(e) => {
                                    const newValue = parseFloat(e.target.value);
                                    const updated = [...materialItems];
                                    updated[idx] = { ...updated[idx], quantityPerUnit: newValue };
                                    setMaterialItems(updated);
                                  }}
                                  step="0.001"
                                  min="0"
                                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-white text-xs"
                                />
                              </div>
                            </div>
                          )}
                          
                          {isOverridden && (
                            <button
                              onClick={() => {
                                const updated = [...materialItems];
                                updated[idx] = { ...updated[idx], overridePurchaseRate: undefined };
                                setMaterialItems(updated);
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                              title="Reset purchase rate to default"
                            >
                              Reset purchase rate
                            </button>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Add Material Form */}
                    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <div className="text-xs text-gray-400 mb-2">Add Material</div>
                      <div className="space-y-2">
                        {/* Quick Add from Materials Library */}
                        <div className="bg-gray-900/50 p-2 rounded border border-gray-600">
                          <div className="text-xs text-gray-400 mb-2">📚 Quick Add from Library</div>
                          <select
                            defaultValue=""
                            onChange={(e) => {
                              const material = availableMaterials.find(m => m.id === e.target.value);
                              if (material) {
                                // Pre-fill the form with material from library
                                setMaterialName(material.name);
                                setMaterialPurchaseRate(material.defaultRate);
                                setMaterialPurchaseUnit(material.unit);
                                setMaterialQuantity(1); // Default quantity
                                
                                // Set aggregate flag if density is available
                                if (material.density && (material.unit === 'm³' || material.unit === 'tonne')) {
                                  setIsAggregateMaterial(true);
                                  setMaterialDensity(material.density);
                                  setMaterialDepth(0);
                                }
                                
                                // Reset dropdown
                                e.target.value = '';
                              }
                            }}
                            className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                          >
                            <option value="">Select a material...</option>
                            {availableMaterials.length > 0 && (
                              <>
                                {Array.from(new Set(availableMaterials.map(m => m.category))).sort().map(category => (
                                  <optgroup key={category} label={category.toUpperCase()}>
                                    {availableMaterials
                                      .filter(m => m.category === category)
                                      .map(m => (
                                        <option key={m.id} value={m.id}>
                                          {m.name} - £{m.defaultRate.toFixed(2)}/{m.unit}
                                        </option>
                                      ))}
                                  </optgroup>
                                ))}
                              </>
                            )}
                          </select>
                          <p className="text-xs text-gray-500 mt-1">Tip: Select a material to auto-fill the form. You can customize the rate, quantity, and other details.</p>
                        </div>
                        
                        <input
                          type="text"
                          value={materialName}
                          onChange={(e) => {
                            setMaterialName(e.target.value);
                            // Auto-adjust density if aggregate checkbox is already checked
                            if (isAggregateMaterial) {
                              const lowerName = e.target.value.toLowerCase();
                              const isAsphaltType = lowerName.includes('asphalt') || 
                                                   lowerName.includes('bitumen') || 
                                                   lowerName.includes('tarmac');
                              const density = isAsphaltType ? 2.4 : 1.8;
                              setMaterialDensity(density);
                              // Recalculate quantity if depth is set
                              if (materialDepth > 0) {
                                setMaterialQuantity((materialDepth / 1000) * density);
                              }
                            }
                          }}
                          placeholder="Material name (e.g., Sand, MOT Type 1)"
                          className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                        />
                        
                        {/* Aggregate checkbox */}
                        <label className="flex items-center gap-2 text-xs text-gray-300">
                          <input
                            type="checkbox"
                            checked={isAggregateMaterial}
                            onChange={(e) => {
                              setIsAggregateMaterial(e.target.checked);
                              if (e.target.checked) {
                                setMaterialPurchaseUnit('tonne');
                                // Determine density based on material name
                                const lowerName = materialName.toLowerCase();
                                const isAsphaltType = lowerName.includes('asphalt') || 
                                                     lowerName.includes('bitumen') || 
                                                     lowerName.includes('tarmac');
                                const density = isAsphaltType ? 2.4 : 1.8;
                                setMaterialDensity(density);
                                // Calculate quantity from depth if depth is set
                                if (materialDepth > 0) {
                                  setMaterialQuantity((materialDepth / 1000) * density);
                                }
                              } else {
                                setMaterialDepth(0);
                                setMaterialQuantity(0);
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-800 text-blue-600"
                          />
                          Aggregate/Bulk Material (requires depth)
                        </label>
                        
                        {isAggregateMaterial ? (
                          // Aggregate material with depth and density
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <input
                                  type="number"
                                  value={materialDepth || ''}
                                  onChange={(e) => {
                                    const depth = parseFloat(e.target.value) || 0;
                                    setMaterialDepth(depth);
                                    // Auto-calculate quantity: depth (mm) / 1000 * density
                                    setMaterialQuantity((depth / 1000) * materialDensity);
                                  }}
                                  placeholder="Depth (mm)"
                                  min="0"
                                  step="10"
                                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  value={materialDensity}
                                  onChange={(e) => {
                                    const density = parseFloat(e.target.value) || 1.8;
                                    setMaterialDensity(density);
                                    // Recalculate quantity
                                    if (materialDepth > 0) {
                                      setMaterialQuantity((materialDepth / 1000) * density);
                                    }
                                  }}
                                  placeholder="Density (t/m³)"
                                  min="0"
                                  step="0.1"
                                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                                />
                              </div>
                              <div>
                                <input
                                  type="number"
                                  value={materialPurchaseRate}
                                  onChange={(e) => setMaterialPurchaseRate(parseFloat(e.target.value) || 0)}
                                  placeholder="£/tonne"
                                  min="0"
                                  step="0.01"
                                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                                />
                              </div>
                            </div>
                            {materialDepth > 0 && (
                              <div className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded">
                                = {materialQuantity.toFixed(3)} tonnes per {selectedLibraryRate?.unit || 'unit'}
                              </div>
                            )}
                          </>
                        ) : (
                          // Standard material without depth
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <input
                                  type="number"
                                  value={materialPurchaseRate}
                                  onChange={(e) => setMaterialPurchaseRate(parseFloat(e.target.value) || 0)}
                                  placeholder="Purchase rate"
                                  min="0"
                                  step="0.01"
                                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                                />
                              </div>
                              <div>
                                <select
                                  value={materialPurchaseUnit}
                                  onChange={(e) => setMaterialPurchaseUnit(e.target.value)}
                                  className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                                >
                                  <option value="tonne">tonne</option>
                                  <option value="m³">m³</option>
                                  <option value="kg">kg</option>
                                  <option value="m">m</option>
                                  <option value="m²">m²</option>
                                  <option value="nr">nr</option>
                                  <option value="litre">litre</option>
                                </select>
                              </div>
                            </div>
                            <input
                              type="number"
                              value={materialQuantity}
                              onChange={(e) => setMaterialQuantity(parseFloat(e.target.value) || 0)}
                              placeholder={`Qty per ${selectedLibraryRate?.unit || 'unit'}`}
                              min="0"
                              step="0.001"
                              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-white text-xs"
                            />
                          </>
                        )}
                        
                        <button
                          onClick={() => {
                            if (materialName && materialPurchaseRate > 0 && materialQuantity > 0) {
                              const newMaterial: any = {
                                id: Date.now().toString(),
                                name: materialName,
                                purchaseRate: materialPurchaseRate,
                                purchaseUnit: isAggregateMaterial ? 'tonne' : materialPurchaseUnit,
                                quantityPerUnit: materialQuantity,
                              };
                              
                              if (isAggregateMaterial) {
                                newMaterial.depth = materialDepth / 1000; // Convert mm to m
                                newMaterial.density = materialDensity;
                              }
                              
                              setMaterialItems([...materialItems, newMaterial]);
                              setMaterialName('');
                              setMaterialPurchaseRate(0);
                              setMaterialQuantity(0);
                              setMaterialDepth(0);
                              setMaterialDensity(1.8);
                              setIsAggregateMaterial(false);
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-medium"
                        >
                          Add Material
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {selectedLibraryRate && result && (
            <div className="space-y-4">
              {/* Main Rate */}
              <div className="rounded-xl border-2 border-green-500/20 bg-green-900/10 p-6">
                <p className="text-sm text-gray-400 mb-1">Rate Per {selectedLibraryRate?.unit}</p>
                <p className="text-4xl font-bold text-green-400">
                  £{result.unitRate.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {selectedLibraryRate?.description}
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown (per {selectedLibraryRate?.unit})</h3>
                <div className="space-y-3">
                  {/* Labour lines */}
                  {labourItems.length > 0 && (
                    <>
                      {labourItems.map((item) => {
                        const hourlyRate = item.overrideRate !== undefined ? item.overrideRate : item.rate.hourlyRate;
                        const isOverridden = item.overrideRate !== undefined && item.overrideRate !== item.rate.hourlyRate;
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              {item.rate.description} ({(result.hoursPerUnit * item.quantity).toFixed(2)}h @ £{hourlyRate.toFixed(2)}/hr{isOverridden && ' *'})
                            </span>
                            <span className="text-white font-medium">£{(hourlyRate * item.quantity * result.hoursPerUnit).toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-sm border-t border-gray-700 pt-2">
                        <span className="text-gray-400 font-medium">Total Labour</span>
                        <span className="text-white font-medium">£{result.labourCost.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {/* Plant lines */}
                  {plantItems.length > 0 && (
                    <>
                      {plantItems.map((item) => {
                        const plantRate = item.overrideRate !== undefined ? item.overrideRate : item.rate.rate;
                        const isOverridden = item.overrideRate !== undefined && item.overrideRate !== item.rate.rate;
                        const cost = item.rate.unit === 'day' 
                          ? (plantRate / 8) * result.hoursPerUnit * item.quantity
                          : item.rate.unit === 'hr'
                          ? plantRate * result.hoursPerUnit * item.quantity
                          : plantRate * item.quantity;
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              {item.rate.name} (£{plantRate.toFixed(2)}/{item.rate.unit} × {item.quantity}{isOverridden && ' *'})
                            </span>
                            <span className="text-white font-medium">£{cost.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-sm border-t border-gray-700 pt-2">
                        <span className="text-gray-400 font-medium">Total Plant</span>
                        <span className="text-white font-medium">£{result.plantCost.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {/* Material lines */}
                  {materialItems.length > 0 && (
                    <>
                      {materialItems.map((item) => {
                        const purchaseRate = (item.overridePurchaseRate !== undefined && !isNaN(item.overridePurchaseRate)) ? item.overridePurchaseRate : item.purchaseRate;
                        const cost = purchaseRate * item.quantityPerUnit;
                        const isOverridden = item.overridePurchaseRate !== undefined && !isNaN(item.overridePurchaseRate) && item.overridePurchaseRate !== item.purchaseRate;
                        const isAggregate = item.density !== undefined;
                        return (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-400">
                              {item.name}{isAggregate && ` @${((item.depth || 0) * 1000).toFixed(0)}mm`} ({item.quantityPerUnit.toFixed(3)} {item.purchaseUnit} @ £{purchaseRate.toFixed(2)}/{item.purchaseUnit}{isOverridden && ' *'})
                            </span>
                            <span className="text-white font-medium">£{cost.toFixed(2)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-sm border-t border-gray-700 pt-2">
                        <span className="text-gray-400 font-medium">Total Materials</span>
                        <span className="text-white font-medium">£{result.totalMaterialCost.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="border-t border-gray-700 pt-3 flex justify-between font-medium">
                    <span>Rate per {selectedLibraryRate?.unit}</span>
                    <span className="text-green-400">£{result.finalRate.toFixed(2)}</span>
                  </div>
                  
                  {(labourItems.some(i => i.overrideRate !== undefined && i.overrideRate !== i.rate.hourlyRate) ||
                    plantItems.some(i => i.overrideRate !== undefined && i.overrideRate !== i.rate.rate) ||
                    materialItems.some(i => i.overridePurchaseRate !== undefined && i.overridePurchaseRate !== i.purchaseRate)) && (
                    <p className="text-xs text-blue-400 italic mt-2">* = Manual rate override applied</p>
                  )}

                  {/* Info box */}
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3 text-xs text-blue-300">
                      <div className="font-semibold mb-1">💡 Direct BOQ Integration</div>
                      <div className="text-blue-200">
                        In the Estimating Overview, click "Open Civils Rate Builder" within any BOQ item's Rate Breakdown Editor 
                        to build rates directly and add components instantly. You can also save rates here for future reference.
                      </div>
                    </div>
                  </div>

                  {/* Export/Save buttons */}
                  <div className="pt-3 space-y-2">
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <span>💾</span>
                      <span>Save Rate Breakdown</span>
                    </button>
                    <button
                      onClick={copyComponentsToClipboard}
                      className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <span>📋</span>
                      <span>Copy Components (for Rate Breakdown Editor)</span>
                    </button>
                  </div>

                  {savedMessage && (
                    <div className="mt-2 bg-green-900/50 border border-green-700 rounded-lg p-2 text-sm text-green-300">
                      {savedMessage}
                    </div>
                  )}
                </div>
              </div>

              {/* Empty State */}
              {labourItems.length === 0 && plantItems.length === 0 && materialItems.length === 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
                  <p className="text-gray-400 text-sm mb-2">No items yet</p>
                  <p className="text-gray-500 text-xs">Select a pre-built rate or manually add items</p>
                </div>
              )}
            </div>
          )}

          {!selectedLibraryRate && (
            <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
              <p className="text-gray-400">Select a pre-built rate to see the rate calculation</p>
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-gray-700/50 bg-gray-800 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white mb-2">Save Rate Breakdown</h3>
              <p className="text-sm text-gray-400">
                This will save the rate breakdown to your browser's local storage and make it available for use in the Rate Breakdown Editor.
              </p>
            </div>

            <div className="space-y-4">
              {selectedLibraryRate && (
                <div className="bg-gray-700/50 rounded-lg p-3 text-sm">
                  <div className="text-gray-400">Library Rate:</div>
                  <div className="text-white font-medium">{selectedLibraryRate?.description}</div>
                  {result && (
                    <div className="text-green-400 font-semibold mt-2">
                      £{result.finalRate.toFixed(2)} per {selectedLibraryRate?.unit}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (for your reference)
                </label>
                <input
                  type="text"
                  value={rateDescription}
                  onChange={(e) => setRateDescription(e.target.value)}
                  placeholder="e.g., 150mm MOT Type 1 sub-base with compaction"
                  className="w-full rounded-lg border border-gray-600 bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRateBreakdown}
                  disabled={!rateDescription.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
