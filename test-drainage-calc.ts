/**
 * Test the drainage pipe calculation against user's example
 * Expected: 100mm PVC, 1m depth, pea gravel, clay backfill, muck away=yes → £55.39/m
 */

import {
  calculateDrainageCost,
  type DrainageParams,
  DEFAULT_MATERIAL_COSTS,
  DEFAULT_LABOUR_RATES,
  DEFAULT_PLANT_RATES,
} from './src/lib/drainage-pipe-data';

const testParams: DrainageParams = {
  pipeDiameter: 0.1, // 100mm
  pipeType: 'pvc',
  invertDepth: 1, // 1m
  surround: 'gravel',
  backfill: 'cleanstone', // Clay backfill (clean stone assumption)
  muckAway: true,
  selectedExcavator: '5t',
};

const result = calculateDrainageCost(
  testParams,
  DEFAULT_MATERIAL_COSTS,
  DEFAULT_LABOUR_RATES,
  DEFAULT_PLANT_RATES
);

if (result) {
  console.log('Test: 100mm PVC, 1m depth, pea gravel, clay backfill, muck away=yes');
  console.log('');
  console.log('Volumes per metre:');
  console.log(`  Trench: ${result.trenchVolumePerM.toFixed(3)}m³`);
  console.log(`  Surround: ${result.surroundVolumePerM.toFixed(3)}m³`);
  console.log(`  Backfill: ${result.backfillVolumePerM.toFixed(3)}m³`);
  console.log(`  Spoil: ${result.spoilVolumePerM.toFixed(3)}m³`);
  console.log('');
  console.log('Cost breakdown:');
  console.log(`  Labour: £${result.labourCost.toFixed(2)}`);
  console.log(`    - Ganger: £${result.labourBreakdown.gangerCost.toFixed(2)}`);
  console.log(`    - Labourer: £${result.labourBreakdown.labourerCost.toFixed(2)}`);
  console.log(`  Materials: £${result.materialsCost.toFixed(2)}`);
  console.log(`    - Pipe: £${result.pipeCost.toFixed(2)}`);
  console.log(`    - Surround: £${result.surroundCost.toFixed(2)}`);
  console.log(`    - Backfill: £${result.backfillCost.toFixed(2)}`);
  console.log(`  Plant: £${(result.plantCost + result.dumperCost).toFixed(2)}`);
  console.log(`    - Excavation: £${result.plantCost.toFixed(2)}`);
  console.log(`    - Dumping: £${result.dumperCost.toFixed(2)}`);
  console.log('');
  console.log(`TOTAL COST PER METRE: £${result.costPerMetre.toFixed(2)}`);
  console.log(`Expected: £55.39`);
  console.log(`Difference: £${(result.costPerMetre - 55.39).toFixed(2)}`);
} else {
  console.log('ERROR: Lookup returned null');
}
