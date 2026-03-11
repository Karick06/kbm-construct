const fs = require('fs');
const path = require('path');
const appDir = '/Users/mick/Desktop/kbm-construct/src/app/(app)';

function walkDir(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkDir(full));
    else if (entry.name === 'page.tsx') files.push(full);
  }
  return files;
}

let fixed = 0;
for (const f of walkDir(appDir)) {
  const src = fs.readFileSync(f, 'utf8');
  if (!src.includes('PermissionGuard')) continue;

  const lines = src.split('\n');

  const ucIdx = lines.findIndex(
    (l) => l.trim() === "'use client';" || l.trim() === '"use client";'
  );
  const importIdx = lines.findIndex((l) => l.includes('import PermissionGuard'));

  // If 'use client' is found but NOT at line 0 or 1, and PermissionGuard import is before it
  if (ucIdx > 1 && importIdx < ucIdx) {
    // Remove 'use client' from its current position
    const ucLine = lines.splice(ucIdx, 1)[0];
    // Remove any blank line that was above it (if the line above is now blank)
    // Re-find importIdx after splice
    const newImportIdx = lines.findIndex((l) => l.includes('import PermissionGuard'));
    // Insert 'use client' right before the import
    lines.splice(newImportIdx, 0, ucLine);
    const result = lines.join('\n');
    fs.writeFileSync(f, result, 'utf8');
    console.log('Fixed: ' + path.relative(appDir, f));
    fixed++;
  }
}
console.log('\nTotal fixed: ' + fixed);
