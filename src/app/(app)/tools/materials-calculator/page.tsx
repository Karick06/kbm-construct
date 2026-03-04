"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MATERIAL_RATES } from "@/lib/material-rates";
import type { RateComponent } from "@/lib/enquiries-store";

type MaterialCategory = 'concrete' | 'brickwork' | 'timber' | 'paint' | 'aggregates' | 'reinforcement' | 'asphalt' | 'mortar' | 'excavations' | 'drainage' | 'formwork' | 'paving' | 'topsoil' | 'kerbs' | 'geotextiles' | 'gabions' | 'drainage-stone';

interface CalculationResult {
  material: string;
  quantity: number;
  unit: string;
  wastage: number;
  totalQuantity: number;
  unitRate: number;
  totalCost: number;
  formula: string;
}

export default function MaterialsCalculatorPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<MaterialCategory>('concrete');
  const [results, setResults] = useState<CalculationResult[]>([]);

  // Concrete Calculator State
  const [concreteLength, setConcreteLength] = useState(0);
  const [concreteWidth, setConcreteWidth] = useState(0);
  const [concreteDepth, setConcreteDepth] = useState(0);
  const [concreteType, setConcreteType] = useState('C25');
  const [concreteWastage, setConcreteWastage] = useState(10);

  // Brickwork Calculator State
  const [brickLength, setBrickLength] = useState(0);
  const [brickHeight, setBrickHeight] = useState(0);
  const [brickType, setBrickType] = useState('Standard');
  const [wallThickness, setWallThickness] = useState(1); // 1 = single, 2 = double
  const [brickWastage, setBrickWastage] = useState(5);

  // Timber Calculator State
  const [timberLength, setTimberLength] = useState(0);
  const [timberWidth, setTimberWidth] = useState(0);
  const [timberThickness, setTimberThickness] = useState(0);
  const [timberQuantity, setTimberQuantity] = useState(1);
  const [timberType, setTimberType] = useState('Softwood');
  const [timberWastage, setTimberWastage] = useState(10);

  // Paint Calculator State
  const [paintArea, setPaintArea] = useState(0);
  const [paintCoats, setPaintCoats] = useState(2);
  const [paintType, setPaintType] = useState('Emulsion');
  const [paintCoverage, setPaintCoverage] = useState(10); // m² per litre

  // Aggregates Calculator State
  const [aggLength, setAggLength] = useState(0);
  const [aggWidth, setAggWidth] = useState(0);
  const [aggDepth, setAggDepth] = useState(0);
  const [aggType, setAggType] = useState('Type 1');
  const [aggWastage, setAggWastage] = useState(10);

  // Reinforcement Calculator State
  const [rebarLength, setRebarLength] = useState(0);
  const [rebarDiameter, setRebarDiameter] = useState(12); // mm
  const [rebarSpacing, setRebarSpacing] = useState(200); // mm
  const [rebarArea, setRebarArea] = useState(0);
  const [rebarWastage, setRebarWastage] = useState(15);

  // Asphalt Calculator State
  const [asphaltLength, setAsphaltLength] = useState(0);
  const [asphaltWidth, setAsphaltWidth] = useState(0);
  const [asphaltDepth, setAsphaltDepth] = useState(0);
  const [asphaltType, setAsphaltType] = useState('Binder Course');
  const [asphaltWastage, setAsphaltWastage] = useState(5);

  // Mortar Calculator State
  const [mortarLength, setMortarLength] = useState(0);
  const [mortarHeight, setMortarHeight] = useState(0);
  const [mortarWallType, setMortarWallType] = useState(1); // 1 = single, 2 = double
  const [mortarMixType, setMortarMixType] = useState('1:4 (Cement:Sand)');
  const [mortarWastage, setMortarWastage] = useState(10);

  // Excavations Calculator State
  const [excavationLength, setExcavationLength] = useState(0);
  const [excavationWidth, setExcavationWidth] = useState(0);
  const [excavationDepth, setExcavationDepth] = useState(0);
  const [soilType, setSoilType] = useState('Clay');
  const [bulkingFactor, setBulkingFactor] = useState(30); // percentage

  // Drainage/Pipe Bedding Calculator State
  const [pipeDiameter, setPipeDiameter] = useState(0);
  const [pipeLength, setPipeLength] = useState(0);
  const [beddingDepth, setBeddingDepth] = useState(150); // mm
  const [beddingType, setBeddingType] = useState('Pea Gravel');

  // Formwork Calculator State
  const [formworkHeight, setFormworkHeight] = useState(0);
  const [formworkLength, setFormworkLength] = useState(0);
  const [formworkWidth, setFormworkWidth] = useState(0);
  const [formworkType, setFormworkType] = useState('Wall');

  // Paving Calculator State
  const [pavingLength, setPavingLength] = useState(0);
  const [pavingWidth, setPavingWidth] = useState(0);
  const [pavingBlockSize, setPavingBlockSize] = useState('200x100mm');
  const [pavingWastage, setPavingWastage] = useState(10);

  // Topsoil Calculator State
  const [topsoilLength, setTopsoilLength] = useState(0);
  const [topsoilWidth, setTopsoilWidth] = useState(0);
  const [topsoilDepth, setTopsoilDepth] = useState(0);
  const [topsoilWastage, setTopsoilWastage] = useState(15);

  // Kerbs Calculator State
  const [kerbLength, setKerbLength] = useState(0);
  const [kerbType, setKerbType] = useState('Standard');
  const [kerbWastage, setKerbWastage] = useState(5);
  const [includeConcreteBed, setIncludeConcreteBed] = useState(true);
  const [includeHaunching, setIncludeHaunching] = useState(true);
  const [bedDepth, setBedDepth] = useState(100); // mm
  const [bedWidth, setBedWidth] = useState(350); // mm

  // Geotextiles Calculator State
  const [geoLength, setGeoLength] = useState(0);
  const [geoWidth, setGeoWidth] = useState(0);
  const [geoOverlap, setGeoOverlap] = useState(10); // percentage
  const [geoWastage, setGeoWastage] = useState(5);

  // Gabions Calculator State
  const [gabionLength, setGabionLength] = useState(2); // meters
  const [gabionWidth, setGabionWidth] = useState(1);
  const [gabionHeight, setGabionHeight] = useState(1);
  const [gabionQuantity, setGabionQuantity] = useState(1);
  const [gabionStoneType, setGabionStoneType] = useState('75-150mm Stone');

  // Drainage Stone Calculator State
  const [drainageStoneLength, setDrainageStoneLength] = useState(0);
  const [drainageStoneWidth, setDrainageStoneWidth] = useState(0);
  const [drainageStoneDepth, setDrainageStoneDepth] = useState(0);
  const [drainageStoneType, setDrainageStoneType] = useState('Pea Gravel');
  const [drainageStoneWastage, setDrainageStoneWastage] = useState(10);

  const calculateConcrete = () => {
    const volume = (concreteLength * concreteWidth * concreteDepth) / 1000; // Convert to m³
    const wastageMultiplier = 1 + (concreteWastage / 100);
    const totalVolume = volume * wastageMultiplier;
    
    // Get rate from material rates
    const materialRate = MATERIAL_RATES.find(m => m.description.includes(concreteType))?.rate || 120;
    
    const result: CalculationResult = {
      material: `Concrete ${concreteType}`,
      quantity: volume,
      unit: 'm³',
      wastage: concreteWastage,
      totalQuantity: totalVolume,
      unitRate: materialRate,
      totalCost: totalVolume * materialRate,
      formula: `${concreteLength}m × ${concreteWidth}m × ${concreteDepth}mm ÷ 1000 = ${volume.toFixed(2)}m³`
    };
    
    setResults([...results, result]);
  };

  const calculateBrickwork = () => {
    const area = brickLength * brickHeight;
    // Standard bricks: 60 per m² for single skin, 120 per m² for double skin
    const bricksPerSqm = wallThickness === 1 ? 60 : 120;
    const brickQuantity = area * bricksPerSqm;
    const wastageMultiplier = 1 + (brickWastage / 100);
    const totalBricks = brickQuantity * wastageMultiplier;
    
    const brickRate = MATERIAL_RATES.find(m => m.description.includes('brick'))?.rate || 0.65;
    
    const result: CalculationResult = {
      material: `${brickType} Bricks (${wallThickness === 1 ? 'Single' : 'Double'} Skin)`,
      quantity: brickQuantity,
      unit: 'nr',
      wastage: brickWastage,
      totalQuantity: totalBricks,
      unitRate: brickRate,
      totalCost: totalBricks * brickRate,
      formula: `${brickLength}m × ${brickHeight}m × ${bricksPerSqm} bricks/m² = ${brickQuantity.toFixed(0)} bricks`
    };
    
    setResults([...results, result]);
  };

  const calculateTimber = () => {
    const volumePerPiece = (timberLength * timberWidth * timberThickness) / 1000000; // Convert mm³ to m³
    const totalVolume = volumePerPiece * timberQuantity;
    const wastageMultiplier = 1 + (timberWastage / 100);
    const totalWithWastage = totalVolume * wastageMultiplier;
    
    const timberRate = MATERIAL_RATES.find(m => m.description.includes('timber'))?.rate || 450;
    
    const result: CalculationResult = {
      material: `${timberType} Timber ${timberWidth}×${timberThickness}mm`,
      quantity: totalVolume,
      unit: 'm³',
      wastage: timberWastage,
      totalQuantity: totalWithWastage,
      unitRate: timberRate,
      totalCost: totalWithWastage * timberRate,
      formula: `${timberQuantity} pieces × ${(volumePerPiece).toFixed(4)}m³ = ${totalVolume.toFixed(4)}m³`
    };
    
    setResults([...results, result]);
  };

  const calculatePaint = () => {
    const totalArea = paintArea * paintCoats;
    const litresRequired = totalArea / paintCoverage;
    
    const paintRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('paint'))?.rate || 25;
    
    const result: CalculationResult = {
      material: `${paintType} Paint`,
      quantity: litresRequired,
      unit: 'litres',
      wastage: 0,
      totalQuantity: litresRequired,
      unitRate: paintRate,
      totalCost: litresRequired * paintRate,
      formula: `${paintArea}m² × ${paintCoats} coats ÷ ${paintCoverage}m²/L = ${litresRequired.toFixed(2)}L`
    };
    
    setResults([...results, result]);
  };

  const calculateAggregates = () => {
    const volume = (aggLength * aggWidth * aggDepth) / 1000; // Convert to m³
    const wastageMultiplier = 1 + (aggWastage / 100);
    const totalVolume = volume * wastageMultiplier;
    
    // Convert m³ to tonnes (density ~1.8 tonnes/m³ for Type 1)
    const tonnes = totalVolume * 1.8;
    
    const aggRate = MATERIAL_RATES.find(m => m.description.includes('aggregate'))?.rate || 25;
    
    const result: CalculationResult = {
      material: `${aggType} Sub-base`,
      quantity: tonnes,
      unit: 'tonnes',
      wastage: aggWastage,
      totalQuantity: tonnes,
      unitRate: aggRate,
      totalCost: tonnes * aggRate,
      formula: `${aggLength}m × ${aggWidth}m × ${aggDepth}mm ÷ 1000 × 1.8 = ${tonnes.toFixed(2)}t`
    };
    
    setResults([...results, result]);
  };

  const calculateReinforcement = () => {
    // Calculate number of bars needed
    const lengthBars = Math.ceil((rebarArea * 1000) / rebarSpacing);
    const totalLength = lengthBars * rebarLength;
    
    // Calculate weight (kg/m for different diameters)
    const weightPerMeter = (rebarDiameter === 8 ? 0.395 :
                           rebarDiameter === 10 ? 0.617 :
                           rebarDiameter === 12 ? 0.888 :
                           rebarDiameter === 16 ? 1.578 :
                           rebarDiameter === 20 ? 2.466 : 0.888);
    
    const totalWeight = (totalLength * weightPerMeter) / 1000; // Convert to tonnes
    const wastageMultiplier = 1 + (rebarWastage / 100);
    const totalWithWastage = totalWeight * wastageMultiplier;
    
    const rebarRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('reinforcement'))?.rate || 850;
    
    const result: CalculationResult = {
      material: `${rebarDiameter}mm Reinforcement Bar`,
      quantity: totalWeight,
      unit: 'tonnes',
      wastage: rebarWastage,
      totalQuantity: totalWithWastage,
      unitRate: rebarRate,
      totalCost: totalWithWastage * rebarRate,
      formula: `${lengthBars} bars × ${rebarLength}m × ${weightPerMeter}kg/m = ${totalWeight.toFixed(3)}t`
    };
    
    setResults([...results, result]);
  };

  const calculateAsphalt = () => {
    const volume = (asphaltLength * asphaltWidth * asphaltDepth) / 1000; // Convert to m³
    const wastageMultiplier = 1 + (asphaltWastage / 100);
    const totalVolume = volume * wastageMultiplier;
    
    // Asphalt density: approximately 2.3 tonnes/m³
    const density = 2.3;
    const totalTonnes = totalVolume * density;
    
    // Get rate from material rates
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('asphalt'))?.rate || 85;
    
    const result: CalculationResult = {
      material: `Asphalt ${asphaltType}`,
      quantity: totalTonnes,
      unit: 'tonnes',
      wastage: asphaltWastage,
      totalQuantity: totalTonnes,
      unitRate: materialRate,
      totalCost: totalTonnes * materialRate,
      formula: `${asphaltLength}m × ${asphaltWidth}m × ${asphaltDepth}mm ÷ 1000 × ${density} = ${totalTonnes.toFixed(2)} tonnes`
    };
    
    setResults([...results, result]);
  };

  const calculateMortar = () => {
    const wallArea = mortarLength * mortarHeight;
    // Standard mortar coverage: 0.03 m³/m² for single skin, 0.06 m³/m² for double skin
    const coverage = mortarWallType === 1 ? 0.03 : 0.06;
    const volume = wallArea * coverage;
    const wastageMultiplier = 1 + (mortarWastage / 100);
    const totalVolume = volume * wastageMultiplier;
    
    // Get rate from material rates
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('mortar'))?.rate || 85;
    
    const result: CalculationResult = {
      material: `Mortar ${mortarMixType}`,
      quantity: volume,
      unit: 'm³',
      wastage: mortarWastage,
      totalQuantity: totalVolume,
      unitRate: materialRate,
      totalCost: totalVolume * materialRate,
      formula: `${mortarLength}m × ${mortarHeight}m × ${coverage}m³/m² = ${volume.toFixed(3)}m³`
    };
    
    setResults([...results, result]);
  };

  const calculateExcavations = () => {
    const volume = excavationLength * excavationWidth * (excavationDepth / 1000); // Convert depth to meters
    const bulkingMultiplier = 1 + (bulkingFactor / 100);
    const bulkedVolume = volume * bulkingMultiplier;
    
    // Get rate from material rates (disposal cost)
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('disposal') || m.description.toLowerCase().includes('excavation'))?.rate || 25;
    
    const result: CalculationResult = {
      material: `Excavated Spoil (${soilType})`,
      quantity: volume,
      unit: 'm³',
      wastage: bulkingFactor,
      totalQuantity: bulkedVolume,
      unitRate: materialRate,
      totalCost: bulkedVolume * materialRate,
      formula: `${excavationLength}m × ${excavationWidth}m × ${excavationDepth}mm ÷ 1000 × (1 + ${bulkingFactor}%) = ${bulkedVolume.toFixed(2)}m³ spoil`
    };
    
    setResults([...results, result]);
  };

  const calculateDrainage = () => {
    // Trench width = pipe diameter + 300mm (150mm clearance each side)
    const trenchWidth = (pipeDiameter + 300) / 1000; // Convert to meters
    const beddingDepthM = beddingDepth / 1000; // Convert to meters
    const volume = pipeLength * trenchWidth * beddingDepthM;
    
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('gravel') || m.description.toLowerCase().includes('aggregate'))?.rate || 35;
    
    const result: CalculationResult = {
      material: `Pipe Bedding (${beddingType})`,
      quantity: volume,
      unit: 'm³',
      wastage: 0,
      totalQuantity: volume,
      unitRate: materialRate,
      totalCost: volume * materialRate,
      formula: `${pipeLength}m × ${trenchWidth.toFixed(2)}m × ${beddingDepthM.toFixed(2)}m = ${volume.toFixed(2)}m³`
    };
    
    setResults([...results, result]);
  };

  const calculateFormwork = () => {
    let area = 0;
    if (formworkType === 'Wall') {
      area = 2 * formworkHeight * formworkLength; // Both sides
    } else if (formworkType === 'Slab') {
      area = formworkLength * formworkWidth;
    } else if (formworkType === 'Column') {
      const perimeter = 2 * (formworkLength + formworkWidth);
      area = perimeter * formworkHeight;
    }
    
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('plywood') || m.description.toLowerCase().includes('timber'))?.rate || 25;
    
    const result: CalculationResult = {
      material: `Formwork (${formworkType})`,
      quantity: area,
      unit: 'm²',
      wastage: 0,
      totalQuantity: area,
      unitRate: materialRate,
      totalCost: area * materialRate,
      formula: formworkType === 'Wall' ? `2 × ${formworkHeight}m × ${formworkLength}m = ${area.toFixed(2)}m²` : `${formworkLength}m × ${formworkWidth}m = ${area.toFixed(2)}m²`
    };
    
    setResults([...results, result]);
  };

  const calculatePaving = () => {
    const area = pavingLength * pavingWidth;
    let blocksPerM2 = 50; // Standard 200x100mm = 50 blocks/m²
    
    if (pavingBlockSize === '300x300mm') blocksPerM2 = 11.1;
    else if (pavingBlockSize === '450x450mm') blocksPerM2 = 4.9;
    
    const totalBlocks = area * blocksPerM2;
    const wastageMultiplier = 1 + (pavingWastage / 100);
    const totalWithWastage = totalBlocks * wastageMultiplier;
    
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('paving') || m.description.toLowerCase().includes('block'))?.rate || 0.85;
    
    const result: CalculationResult = {
      material: `Paving Blocks (${pavingBlockSize})`,
      quantity: totalBlocks,
      unit: 'blocks',
      wastage: pavingWastage,
      totalQuantity: totalWithWastage,
      unitRate: materialRate,
      totalCost: totalWithWastage * materialRate,
      formula: `${area.toFixed(2)}m² × ${blocksPerM2.toFixed(1)} blocks/m² = ${totalBlocks.toFixed(0)} blocks`
    };
    
    setResults([...results, result]);
  };

  const calculateTopsoil = () => {
    const volume = topsoilLength * topsoilWidth * (topsoilDepth / 1000);
    const wastageMultiplier = 1 + (topsoilWastage / 100);
    const totalVolume = volume * wastageMultiplier;
    
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('topsoil') || m.description.toLowerCase().includes('soil'))?.rate || 30;
    
    const result: CalculationResult = {
      material: 'Topsoil',
      quantity: volume,
      unit: 'm³',
      wastage: topsoilWastage,
      totalQuantity: totalVolume,
      unitRate: materialRate,
      totalCost: totalVolume * materialRate,
      formula: `${topsoilLength}m × ${topsoilWidth}m × ${topsoilDepth}mm ÷ 1000 = ${volume.toFixed(2)}m³`
    };
    
    setResults([...results, result]);
  };

  const calculateKerbs = () => {
    const kerbUnitLength = 0.914; // meters per kerb unit
    const numberOfKerbs = Math.ceil(kerbLength / kerbUnitLength);
    const wastageMultiplier = 1 + (kerbWastage / 100);
    const totalKerbs = Math.ceil(numberOfKerbs * wastageMultiplier);
    
    const kerbRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('kerb'))?.rate || 15;
    
    const kerbResult: CalculationResult = {
      material: `Kerbs (${kerbType})`,
      quantity: numberOfKerbs,
      unit: 'units',
      wastage: kerbWastage,
      totalQuantity: totalKerbs,
      unitRate: kerbRate,
      totalCost: totalKerbs * kerbRate,
      formula: `${kerbLength}m ÷ 0.914m/unit = ${numberOfKerbs} units`
    };
    
    setResults([...results, kerbResult]);
    
    // Calculate concrete bed if enabled
    if (includeConcreteBed) {
      const bedVolume = kerbLength * (bedWidth / 1000) * (bedDepth / 1000); // Convert mm to m
      const concreteRate = MATERIAL_RATES.find(m => m.description.includes('C20') || m.description.includes('C25'))?.rate || 120;
      
      const bedResult: CalculationResult = {
        material: 'Concrete Bed',
        quantity: bedVolume,
        unit: 'm³',
        wastage: 0,
        totalQuantity: bedVolume,
        unitRate: concreteRate,
        totalCost: bedVolume * concreteRate,
        formula: `${kerbLength}m × ${bedWidth}mm × ${bedDepth}mm = ${bedVolume.toFixed(3)}m³`
      };
      
      setResults(prev => [...prev, bedResult]);
    }
    
    // Calculate haunching if enabled
    if (includeHaunching) {
      // Haunching is typically triangular: 0.5 × base × height × length
      // Standard haunching: 150mm wide × 150mm high
      const haunchVolume = kerbLength * 0.5 * 0.15 * 0.15; // m³
      const concreteRate = MATERIAL_RATES.find(m => m.description.includes('C20') || m.description.includes('C25'))?.rate || 120;
      
      const haunchResult: CalculationResult = {
        material: 'Concrete Haunching',
        quantity: haunchVolume,
        unit: 'm³',
        wastage: 0,
        totalQuantity: haunchVolume,
        unitRate: concreteRate,
        totalCost: haunchVolume * concreteRate,
        formula: `${kerbLength}m × 0.5 × 150mm × 150mm = ${haunchVolume.toFixed(3)}m³`
      };
      
      setResults(prev => [...prev, haunchResult]);
    }
  };

  const calculateGeotextiles = () => {
    const baseArea = geoLength * geoWidth;
    const overlapMultiplier = 1 + (geoOverlap / 100);
    const wastageMultiplier = 1 + (geoWastage / 100);
    const totalArea = baseArea * overlapMultiplier * wastageMultiplier;
    
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('membrane') || m.description.toLowerCase().includes('geotextile'))?.rate || 3.5;
    
    const result: CalculationResult = {
      material: 'Geotextile Membrane',
      quantity: baseArea,
      unit: 'm²',
      wastage: geoOverlap + geoWastage,
      totalQuantity: totalArea,
      unitRate: materialRate,
      totalCost: totalArea * materialRate,
      formula: `${geoLength}m × ${geoWidth}m × (1 + ${geoOverlap}% overlap + ${geoWastage}% wastage) = ${totalArea.toFixed(2)}m²`
    };
    
    setResults([...results, result]);
  };

  const calculateGabions = () => {
    const volumePerBasket = gabionLength * gabionWidth * gabionHeight;
    const totalVolume = volumePerBasket * gabionQuantity;
    // Gabions have voids - typically need 1.6-1.8 times volume in stone
    const stoneVolume = totalVolume * 1.7;
    // Convert to tonnes (stone density ~1.6 tonnes/m³)
    const stoneTonnes = stoneVolume * 1.6;
    
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('stone') || m.description.toLowerCase().includes('rock'))?.rate || 25;
    
    const result: CalculationResult = {
      material: `Gabion Stone (${gabionStoneType})`,
      quantity: stoneTonnes,
      unit: 'tonnes',
      wastage: 0,
      totalQuantity: stoneTonnes,
      unitRate: materialRate,
      totalCost: stoneTonnes * materialRate,
      formula: `${gabionQuantity} baskets × ${volumePerBasket.toFixed(2)}m³ × 1.7 × 1.6 t/m³ = ${stoneTonnes.toFixed(2)}t`
    };
    
    setResults([...results, result]);
  };

  const calculateDrainageStone = () => {
    const volume = drainageStoneLength * drainageStoneWidth * (drainageStoneDepth / 1000);
    const wastageMultiplier = 1 + (drainageStoneWastage / 100);
    const totalVolume = volume * wastageMultiplier;
    // Convert to tonnes (gravel density ~1.6 tonnes/m³)
    const totalTonnes = totalVolume * 1.6;
    
    const materialRate = MATERIAL_RATES.find(m => m.description.toLowerCase().includes('gravel') || m.description.toLowerCase().includes('stone'))?.rate || 30;
    
    const result: CalculationResult = {
      material: `Drainage Stone (${drainageStoneType})`,
      quantity: totalTonnes,
      unit: 'tonnes',
      wastage: drainageStoneWastage,
      totalQuantity: totalTonnes,
      unitRate: materialRate,
      totalCost: totalTonnes * materialRate,
      formula: `${drainageStoneLength}m × ${drainageStoneWidth}m × ${drainageStoneDepth}mm ÷ 1000 × 1.6 t/m³ = ${totalTonnes.toFixed(2)}t`
    };
    
    setResults([...results, result]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const exportToBOQ = () => {
    if (results.length === 0) return;
    
    // Convert CalculationResults to RateComponents for rate buildup
    const rateComponents: RateComponent[] = results.map((result, index) => ({
      componentId: `calc-${Date.now()}-${index}`,
      type: 'materials' as const,
      description: result.material,
      outputPerUnit: result.totalQuantity,
      unit: result.unit,
      unitRate: result.unitRate,
      cost: result.totalCost
    }));
    
    // Store in localStorage for Estimating Overview to pick up
    localStorage.setItem('materials-calculator-export', JSON.stringify(rateComponents));
    
    // Navigate to Estimating Overview
    router.push('/estimating-overview?import=materials');
  };

  const categories = [
    { id: 'concrete' as MaterialCategory, name: 'Concrete', icon: '🏗️' },
    { id: 'brickwork' as MaterialCategory, name: 'Brickwork', icon: '🧱' },
    { id: 'mortar' as MaterialCategory, name: 'Mortar', icon: '🪣' },
    { id: 'excavations' as MaterialCategory, name: 'Excavations', icon: '⛏️' },
    { id: 'drainage' as MaterialCategory, name: 'Drainage/Pipe Bedding', icon: '🚿' },
    { id: 'formwork' as MaterialCategory, name: 'Formwork', icon: '📐' },
    { id: 'paving' as MaterialCategory, name: 'Paving', icon: '🟫' },
    { id: 'topsoil' as MaterialCategory, name: 'Topsoil', icon: '🌱' },
    { id: 'kerbs' as MaterialCategory, name: 'Kerbs & Edging', icon: '🪨' },
    { id: 'geotextiles' as MaterialCategory, name: 'Geotextiles', icon: '🧵' },
    { id: 'gabions' as MaterialCategory, name: 'Gabion Baskets', icon: '🗃️' },
    { id: 'drainage-stone' as MaterialCategory, name: 'Drainage Stone', icon: '⚪' },
    { id: 'timber' as MaterialCategory, name: 'Timber', icon: '🪵' },
    { id: 'paint' as MaterialCategory, name: 'Paint & Finishes', icon: '🎨' },
    { id: 'aggregates' as MaterialCategory, name: 'Aggregates', icon: '⛰️' },
    { id: 'reinforcement' as MaterialCategory, name: 'Reinforcement', icon: '⚙️' },
    { id: 'asphalt' as MaterialCategory, name: 'Asphalt', icon: '🛣️' },
  ];

  const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              activeCategory === cat.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span>{cat.icon}</span>
            <span className="truncate">{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Panel */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span>{categories.find(c => c.id === activeCategory)?.icon}</span>
              <span>{categories.find(c => c.id === activeCategory)?.name} Calculator</span>
            </h2>

            {/* Concrete Calculator */}
            {activeCategory === 'concrete' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={concreteLength || ''}
                      onChange={(e) => setConcreteLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={concreteWidth || ''}
                      onChange={(e) => setConcreteWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Depth (mm)</label>
                    <input
                      type="number"
                      value={concreteDepth || ''}
                      onChange={(e) => setConcreteDepth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Concrete Grade</label>
                    <select
                      value={concreteType}
                      onChange={(e) => setConcreteType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>C20</option>
                      <option>C25</option>
                      <option>C30</option>
                      <option>C35</option>
                      <option>C40</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={concreteWastage}
                      onChange={(e) => setConcreteWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={calculateConcrete}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Concrete
                </button>
              </div>
            )}

            {/* Brickwork Calculator */}
            {activeCategory === 'brickwork' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={brickLength || ''}
                      onChange={(e) => setBrickLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Height (m)</label>
                    <input
                      type="number"
                      value={brickHeight || ''}
                      onChange={(e) => setBrickHeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Brick Type</label>
                    <select
                      value={brickType}
                      onChange={(e) => setBrickType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>Standard</option>
                      <option>Engineering</option>
                      <option>Facing</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wall Type</label>
                    <select
                      value={wallThickness}
                      onChange={(e) => setWallThickness(parseInt(e.target.value))}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option value={1}>Single Skin</option>
                      <option value={2}>Double Skin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={brickWastage}
                      onChange={(e) => setBrickWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Note:</strong> Calculation based on 60 bricks/m² for single skin, 120 bricks/m² for double skin
                </div>
                <button
                  onClick={calculateBrickwork}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Brickwork
                </button>
              </div>
            )}

            {/* Timber Calculator */}
            {activeCategory === 'timber' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (mm)</label>
                    <input
                      type="number"
                      value={timberLength || ''}
                      onChange={(e) => setTimberLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (mm)</label>
                    <input
                      type="number"
                      value={timberWidth || ''}
                      onChange={(e) => setTimberWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Thickness (mm)</label>
                    <input
                      type="number"
                      value={timberThickness || ''}
                      onChange={(e) => setTimberThickness(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={timberQuantity}
                      onChange={(e) => setTimberQuantity(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={timberType}
                      onChange={(e) => setTimberType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>Softwood</option>
                      <option>Hardwood</option>
                      <option>Treated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={timberWastage}
                      onChange={(e) => setTimberWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={calculateTimber}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Timber
                </button>
              </div>
            )}

            {/* Paint Calculator */}
            {activeCategory === 'paint' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Area to Paint (m²)</label>
                    <input
                      type="number"
                      value={paintArea || ''}
                      onChange={(e) => setPaintArea(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Number of Coats</label>
                    <input
                      type="number"
                      value={paintCoats}
                      onChange={(e) => setPaintCoats(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      min="1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Paint Type</label>
                    <select
                      value={paintType}
                      onChange={(e) => setPaintType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>Emulsion</option>
                      <option>Gloss</option>
                      <option>Masonry</option>
                      <option>Primer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Coverage (m²/litre)</label>
                    <input
                      type="number"
                      value={paintCoverage}
                      onChange={(e) => setPaintCoverage(parseFloat(e.target.value) || 10)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Typical Coverage:</strong> Emulsion 10-12 m²/L, Gloss 15-17 m²/L, Masonry 5-7 m²/L
                </div>
                <button
                  onClick={calculatePaint}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Paint
                </button>
              </div>
            )}

            {/* Aggregates Calculator */}
            {activeCategory === 'aggregates' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={aggLength || ''}
                      onChange={(e) => setAggLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={aggWidth || ''}
                      onChange={(e) => setAggWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Depth (mm)</label>
                    <input
                      type="number"
                      value={aggDepth || ''}
                      onChange={(e) => setAggDepth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aggregate Type</label>
                    <select
                      value={aggType}
                      onChange={(e) => setAggType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>Type 1</option>
                      <option>Type 2</option>
                      <option>Gravel</option>
                      <option>Sand</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={aggWastage}
                      onChange={(e) => setAggWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Note:</strong> Calculation assumes density of 1.8 tonnes/m³ for Type 1 sub-base
                </div>
                <button
                  onClick={calculateAggregates}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Aggregates
                </button>
              </div>
            )}

            {/* Reinforcement Calculator */}
            {activeCategory === 'reinforcement' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Slab Area (m²)</label>
                    <input
                      type="number"
                      value={rebarArea || ''}
                      onChange={(e) => setRebarArea(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bar Length (m)</label>
                    <input
                      type="number"
                      value={rebarLength || ''}
                      onChange={(e) => setRebarLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bar Diameter (mm)</label>
                    <select
                      value={rebarDiameter}
                      onChange={(e) => setRebarDiameter(parseInt(e.target.value))}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option value={8}>8mm</option>
                      <option value={10}>10mm</option>
                      <option value={12}>12mm</option>
                      <option value={16}>16mm</option>
                      <option value={20}>20mm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Spacing (mm)</label>
                    <select
                      value={rebarSpacing}
                      onChange={(e) => setRebarSpacing(parseInt(e.target.value))}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option value={100}>100mm</option>
                      <option value={150}>150mm</option>
                      <option value={200}>200mm</option>
                      <option value={250}>250mm</option>
                      <option value={300}>300mm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={rebarWastage}
                      onChange={(e) => setRebarWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Bar Weights:</strong> 8mm = 0.395kg/m, 10mm = 0.617kg/m, 12mm = 0.888kg/m, 16mm = 1.578kg/m, 20mm = 2.466kg/m
                </div>
                <button
                  onClick={calculateReinforcement}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Reinforcement
                </button>
              </div>
            )}

            {/* Asphalt Calculator */}
            {activeCategory === 'asphalt' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={asphaltLength || ''}
                      onChange={(e) => setAsphaltLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={asphaltWidth || ''}
                      onChange={(e) => setAsphaltWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Depth (mm)</label>
                    <input
                      type="number"
                      value={asphaltDepth || ''}
                      onChange={(e) => setAsphaltDepth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Asphalt Type</label>
                    <select
                      value={asphaltType}
                      onChange={(e) => setAsphaltType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>Binder Course</option>
                      <option>Wearing Course</option>
                      <option>Base Course</option>
                      <option>SMA (Stone Mastic Asphalt)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={asphaltWastage}
                      onChange={(e) => setAsphaltWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Note:</strong> Calculation assumes density of 2.3 tonnes/m³. Typical depths: Binder 60mm, Wearing 40mm
                </div>
                <button
                  onClick={calculateAsphalt}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Asphalt
                </button>
              </div>
            )}

            {/* Mortar Calculator */}
            {activeCategory === 'mortar' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wall Length (m)</label>
                    <input
                      type="number"
                      value={mortarLength || ''}
                      onChange={(e) => setMortarLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wall Height (m)</label>
                    <input
                      type="number"
                      value={mortarHeight || ''}
                      onChange={(e) => setMortarHeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wall Type</label>
                    <select
                      value={mortarWallType}
                      onChange={(e) => setMortarWallType(parseInt(e.target.value))}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option value={1}>Single Skin</option>
                      <option value={2}>Double Skin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Mortar Mix</label>
                    <select
                      value={mortarMixType}
                      onChange={(e) => setMortarMixType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>1:3 (Cement:Sand)</option>
                      <option>1:4 (Cement:Sand)</option>
                      <option>1:5 (Cement:Sand)</option>
                      <option>1:6 (Cement:Sand)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={mortarWastage}
                      onChange={(e) => setMortarWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Coverage:</strong> Single skin ≈ 0.03 m³/m², Double skin ≈ 0.06 m³/m². Mix ratios: 1:3 (strong), 1:4 (general), 1:5-6 (internal)
                </div>
                <button
                  onClick={calculateMortar}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Mortar
                </button>
              </div>
            )}

            {/* Excavations Calculator */}
            {activeCategory === 'excavations' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={excavationLength || ''}
                      onChange={(e) => setExcavationLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={excavationWidth || ''}
                      onChange={(e) => setExcavationWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Depth (mm)</label>
                    <input
                      type="number"
                      value={excavationDepth || ''}
                      onChange={(e) => setExcavationDepth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Soil Type</label>
                    <select
                      value={soilType}
                      onChange={(e) => {
                        setSoilType(e.target.value);
                        // Auto-set bulking factor based on soil type
                        if (e.target.value === 'Clay') setBulkingFactor(30);
                        else if (e.target.value === 'Sand') setBulkingFactor(12);
                        else if (e.target.value === 'Gravel') setBulkingFactor(12);
                        else if (e.target.value === 'Rock') setBulkingFactor(60);
                        else setBulkingFactor(20);
                      }}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>Clay</option>
                      <option>Sand</option>
                      <option>Gravel</option>
                      <option>Rock</option>
                      <option>Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bulking Factor (%)</label>
                    <input
                      type="number"
                      value={bulkingFactor}
                      onChange={(e) => setBulkingFactor(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Bulking Factors:</strong> Clay 25-35%, Sand/Gravel 10-15%, Rock 50-80%. Excavated material expands when removed.
                </div>
                <button
                  onClick={calculateExcavations}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Excavations
                </button>
              </div>
            )}

            {/* Drainage/Pipe Bedding Calculator */}
            {activeCategory === 'drainage' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Pipe Diameter (mm)</label>
                    <input
                      type="number"
                      value={pipeDiameter || ''}
                      onChange={(e) => setPipeDiameter(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Pipe Length (m)</label>
                    <input
                      type="number"
                      value={pipeLength || ''}
                      onChange={(e) => setPipeLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bedding Depth (mm)</label>
                    <input
                      type="number"
                      value={beddingDepth}
                      onChange={(e) => setBeddingDepth(parseFloat(e.target.value) || 150)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Bedding Material</label>
                  <select
                    value={beddingType}
                    onChange={(e) => setBeddingType(e.target.value)}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                  >
                    <option>Pea Gravel</option>
                    <option>10mm Gravel</option>
                    <option>Sharp Sand</option>
                    <option>Type 1</option>
                  </select>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Note:</strong> Trench width calculated as pipe diameter + 300mm (150mm clearance each side)
                </div>
                <button
                  onClick={calculateDrainage}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Pipe Bedding
                </button>
              </div>
            )}

            {/* Formwork Calculator */}
            {activeCategory === 'formwork' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Formwork Type</label>
                  <select
                    value={formworkType}
                    onChange={(e) => setFormworkType(e.target.value)}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                  >
                    <option>Wall</option>
                    <option>Slab</option>
                    <option>Column</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Height/Depth (m)</label>
                    <input
                      type="number"
                      value={formworkHeight || ''}
                      onChange={(e) => setFormworkHeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={formworkLength || ''}
                      onChange={(e) => setFormworkLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={formworkWidth || ''}
                      onChange={(e) => setFormworkWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                      disabled={formworkType === 'Wall'}
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Calculations:</strong> Wall = 2 sides, Slab = area, Column = perimeter × height
                </div>
                <button
                  onClick={calculateFormwork}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Formwork
                </button>
              </div>
            )}

            {/* Paving Calculator */}
            {activeCategory === 'paving' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={pavingLength || ''}
                      onChange={(e) => setPavingLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={pavingWidth || ''}
                      onChange={(e) => setPavingWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Block Size</label>
                    <select
                      value={pavingBlockSize}
                      onChange={(e) => setPavingBlockSize(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>200x100mm</option>
                      <option>300x300mm</option>
                      <option>450x450mm</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={pavingWastage}
                      onChange={(e) => setPavingWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Coverage:</strong> 200×100mm = 50/m², 300×300mm = 11/m², 450×450mm = 5/m²
                </div>
                <button
                  onClick={calculatePaving}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Paving
                </button>
              </div>
            )}

            {/* Topsoil Calculator */}
            {activeCategory === 'topsoil' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={topsoilLength || ''}
                      onChange={(e) => setTopsoilLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={topsoilWidth || ''}
                      onChange={(e) => setTopsoilWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Depth (mm)</label>
                    <input
                      type="number"
                      value={topsoilDepth || ''}
                      onChange={(e) => setTopsoilDepth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                  <input
                    type="number"
                    value={topsoilWastage}
                    onChange={(e) => setTopsoilWastage(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                  />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Typical depths:</strong> Turf 150mm, Planting beds 300-450mm, Trees 600-900mm
                </div>
                <button
                  onClick={calculateTopsoil}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Topsoil
                </button>
              </div>
            )}

            {/* Kerbs Calculator */}
            {activeCategory === 'kerbs' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Total Length (m)</label>
                    <input
                      type="number"
                      value={kerbLength || ''}
                      onChange={(e) => setKerbLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={kerbWastage}
                      onChange={(e) => setKerbWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kerb Type</label>
                  <select
                    value={kerbType}
                    onChange={(e) => setKerbType(e.target.value)}
                    className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                  >
                    <option>Standard</option>
                    <option>Heavy Duty</option>
                    <option>Dropped</option>
                    <option>Edging</option>
                  </select>
                </div>
                
                {/* Concrete Options */}
                <div className="border-t border-gray-600 pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeConcreteBed}
                      onChange={(e) => setIncludeConcreteBed(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                      id="concrete-bed"
                    />
                    <label htmlFor="concrete-bed" className="text-sm font-medium text-gray-300">Include Concrete Bed</label>
                  </div>
                  
                  {includeConcreteBed && (
                    <div className="grid grid-cols-2 gap-4 ml-6">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Bed Width (mm)</label>
                        <input
                          type="number"
                          value={bedWidth}
                          onChange={(e) => setBedWidth(parseFloat(e.target.value) || 350)}
                          className="w-full rounded bg-gray-700 border border-gray-600 px-2 py-1 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Bed Depth (mm)</label>
                        <input
                          type="number"
                          value={bedDepth}
                          onChange={(e) => setBedDepth(parseFloat(e.target.value) || 100)}
                          className="w-full rounded bg-gray-700 border border-gray-600 px-2 py-1 text-sm text-white"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeHaunching}
                      onChange={(e) => setIncludeHaunching(e.target.checked)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600"
                      id="haunching"
                    />
                    <label htmlFor="haunching" className="text-sm font-medium text-gray-300">Include Haunching (150×150mm)</label>
                  </div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Note:</strong> Kerbs supplied in 914mm lengths. Bed typically 350×100mm, haunching 150×150mm triangular.
                </div>
                <button
                  onClick={calculateKerbs}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Kerbs
                </button>
              </div>
            )}

            {/* Geotextiles Calculator */}
            {activeCategory === 'geotextiles' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={geoLength || ''}
                      onChange={(e) => setGeoLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={geoWidth || ''}
                      onChange={(e) => setGeoWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Overlap (%)</label>
                    <input
                      type="number"
                      value={geoOverlap}
                      onChange={(e) => setGeoOverlap(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={geoWastage}
                      onChange={(e) => setGeoWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Note:</strong> Standard overlap 10-15%. Membranes typically 4.5m wide rolls.
                </div>
                <button
                  onClick={calculateGeotextiles}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Geotextiles
                </button>
              </div>
            )}

            {/* Gabions Calculator */}
            {activeCategory === 'gabions' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Basket Length (m)</label>
                    <input
                      type="number"
                      value={gabionLength}
                      onChange={(e) => setGabionLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Basket Width (m)</label>
                    <input
                      type="number"
                      value={gabionWidth}
                      onChange={(e) => setGabionWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Basket Height (m)</label>
                    <input
                      type="number"
                      value={gabionHeight}
                      onChange={(e) => setGabionHeight(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      step="0.5"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                    <input
                      type="number"
                      value={gabionQuantity}
                      onChange={(e) => setGabionQuantity(parseInt(e.target.value) || 1)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stone Type</label>
                    <select
                      value={gabionStoneType}
                      onChange={(e) => setGabionStoneType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>75-150mm Stone</option>
                      <option>100-200mm Stone</option>
                      <option>150-300mm Stone</option>
                    </select>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Note:</strong> Calculation accounts for void space - stone fill typically 1.7× basket volume
                </div>
                <button
                  onClick={calculateGabions}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Gabion Stone
                </button>
              </div>
            )}

            {/* Drainage Stone Calculator */}
            {activeCategory === 'drainage-stone' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Length (m)</label>
                    <input
                      type="number"
                      value={drainageStoneLength || ''}
                      onChange={(e) => setDrainageStoneLength(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Width (m)</label>
                    <input
                      type="number"
                      value={drainageStoneWidth || ''}
                      onChange={(e) => setDrainageStoneWidth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0.00"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Depth (mm)</label>
                    <input
                      type="number"
                      value={drainageStoneDepth || ''}
                      onChange={(e) => setDrainageStoneDepth(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stone Type</label>
                    <select
                      value={drainageStoneType}
                      onChange={(e) => setDrainageStoneType(e.target.value)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    >
                      <option>Pea Gravel</option>
                      <option>10mm Gravel</option>
                      <option>20mm Gravel</option>
                      <option>40mm Clean Stone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Wastage (%)</label>
                    <input
                      type="number"
                      value={drainageStoneWastage}
                      onChange={(e) => setDrainageStoneWastage(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-white"
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-sm text-blue-300">
                  <strong>Usage:</strong> French drains, soakaways, land drains. Density ~1.6 tonnes/m³
                </div>
                <button
                  onClick={calculateDrainageStone}
                  className="w-full rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  Calculate Drainage Stone
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-gray-700 bg-gray-800 p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Results</h2>
              {results.length > 0 && (
                <button
                  onClick={clearResults}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Clear All
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">📋</p>
                <p className="text-sm text-gray-400">No calculations yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-sm font-semibold text-white">{result.material}</h3>
                      <button
                        onClick={() => setResults(results.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{result.formula}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Base Qty:</span>
                        <span className="text-white ml-1">{result.quantity.toFixed(2)} {result.unit}</span>
                      </div>
                      {result.wastage > 0 && (
                        <div>
                          <span className="text-gray-400">Wastage:</span>
                          <span className="text-orange-400 ml-1">+{result.wastage}%</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Total Qty:</span>
                        <span className="text-green-400 ml-1 font-semibold">{result.totalQuantity.toFixed(2)} {result.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Rate:</span>
                        <span className="text-white ml-1">£{result.unitRate.toFixed(2)}/{result.unit}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">Total Cost:</span>
                        <span className="text-lg font-bold text-green-400">£{result.totalCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="bg-orange-500/20 border border-orange-500/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-white">Grand Total:</span>
                    <span className="text-2xl font-bold text-orange-400">£{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="mt-3 text-xs text-center text-gray-300">
                    {results.length} calculation{results.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* Export to Rate Buildup Button */}
                <button
                  onClick={exportToBOQ}
                  className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <span>🔧</span>
                  <span>Add to Rate Buildup ({results.length} materials)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Quick Reference Guide */}
      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-xl font-bold text-white mb-4">📚 Quick Reference Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Concrete Coverage</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 1m³ = 1000 litres</li>
              <li>• Standard wastage: 10%</li>
              <li>• 1m³ covers 10m² at 100mm depth</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Brickwork</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Single skin: 60 bricks/m²</li>
              <li>• Double skin: 120 bricks/m²</li>
              <li>• Standard wastage: 5%</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Mortar</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Single skin: 0.03 m³/m²</li>
              <li>• Double skin: 0.06 m³/m²</li>
              <li>• Standard wastage: 10%</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Excavations</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Clay bulking: 25-35%</li>
              <li>• Sand bulking: 10-15%</li>
              <li>• Rock bulking: 50-80%</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Drainage/Pipe Bedding</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Trench width = Ø + 300mm</li>
              <li>• Bedding depth: 150mm typical</li>
              <li>• Pea gravel most common</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Formwork</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 18mm ply standard</li>
              <li>• Wall = 2 sides</li>
              <li>• Allow for props/walings</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Paving</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 200×100mm: 50 blocks/m²</li>
              <li>• 300×300mm: 11 blocks/m²</li>
              <li>• Wastage: 10% typical</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Topsoil</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Turf: 150mm depth</li>
              <li>• Planting: 300-450mm</li>
              <li>• Wastage: 15% typical</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Kerbs & Edging</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Supplied in 914mm lengths</li>
              <li>• Bed: 350×100mm typical</li>
              <li>• Haunching: 150×150mm</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Geotextiles</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Overlap: 10-15%</li>
              <li>• Roll width: 4.5m typical</li>
              <li>• Add 5% wastage</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Gabions</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Stone fill: 1.7× volume</li>
              <li>• 75-300mm stone sizes</li>
              <li>• Density: 1.6 tonnes/m³</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Drainage Stone</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Density: 1.6 tonnes/m³</li>
              <li>• French drains/soakaways</li>
              <li>• Wastage: 10% typical</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Paint Coverage</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Emulsion: 10-12 m²/L</li>
              <li>• Gloss: 15-17 m²/L</li>
              <li>• Masonry: 5-7 m²/L</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Aggregates</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Type 1: 1.8 tonnes/m³</li>
              <li>• Standard wastage: 10%</li>
              <li>• 100mm depth typical</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Timber</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Standard wastage: 10%</li>
              <li>• 1m³ = 1,000,000 mm³</li>
              <li>• Calculate by volume</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Reinforcement</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 12mm bar: 0.888 kg/m</li>
              <li>• Standard wastage: 15%</li>
              <li>• Typical spacing: 200mm</li>
            </ul>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Asphalt</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Density: 2.3 tonnes/m³</li>
              <li>• Binder course: 60mm typical</li>
              <li>• Wearing course: 40mm typical</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
