const fs = require('fs');

const csv = fs.readFileSync('./public/data/drainage-pipe-lookup.csv', 'utf-8');
const lines = csv.split('\n').slice(2); // Skip header rows

const rows = [];

for (const line of lines) {
  const cols = line.split(',').map(c => c.trim());
  if (!cols[0] || cols[0] === '' || isNaN(parseFloat(cols[0]))) continue; // Skip empty lines and non-numeric rows
  
  const pipeDia = parseFloat(cols[0]);
  const pipeOD = parseFloat(cols[1]);
  const invertD = parseFloat(cols[2]);
  const bedThck = parseFloat(cols[3]);
  const trenchD = parseFloat(cols[4]);
  const trenchW = parseFloat(cols[5]);
  const surround = parseFloat(cols[6]);
  const surroundVol = parseFloat(cols[7]);
  const trenchVol = parseFloat(cols[8]);
  const surroundVolCalced = parseFloat(cols[9]);
  const backfillVol = parseFloat(cols[10]);
  const spoilVol = parseFloat(cols[11]);
  
  // Machine capacities: 15, 30, 50, 70 for 5t, 14t, 21t, 30t
  const output5t = parseFloat(cols[12]);    // 15 m3 capacity
  const output14t = parseFloat(cols[14]);   // 30 m3 capacity
  const output21t = parseFloat(cols[16]);   // 50 m3 capacity
  const output30t = parseFloat(cols[18]);   // 70 m3 capacity
  
  rows.push({
    pipeDia, pipeOD, invertD, bedThck, trenchD, trenchW, surround, surroundVol,
    trenchVol, surroundVolCalced, backfillVol, spoilVol,
    output5t, output14t, output21t, output30t
  });
}

console.log(`Parsed ${rows.length} rows`);
console.log('Sample row (100mm @ 1m):');
console.log(rows[2]);
console.log('\nSample row (100mm @ 1.5m):');
console.log(rows[4]);

// Generate TypeScript array literal
const tsLines = rows.map(r => 
  `  { pipeDia: ${r.pipeDia}, pipeOD: ${r.pipeOD}, invertD: ${r.invertD}, bedThck: ${r.bedThck}, trenchD: ${r.trenchD}, trenchW: ${r.trenchW}, surround: ${r.surround}, surroundVol: ${r.surroundVol}, trenchVol: ${r.trenchVol}, surroundVolCalced: ${r.surroundVolCalced}, backfillVol: ${r.backfillVol}, spoilVol: ${r.spoilVol}, output5t: ${r.output5t}, output14t: ${r.output14t}, output21t: ${r.output21t}, output30t: ${r.output30t}, output40: 0, output50: 0, output60: 0 }`
);

const tsCode = `export const DRAINAGE_PIPE_DATA: DrainagePipeLookupRow[] = [\n${tsLines.join(',\n')}\n];`;

fs.writeFileSync('./drainage-pipe-data-generated.ts', tsCode);
console.log('\nGenerated TypeScript file: drainage-pipe-data-generated.ts');
