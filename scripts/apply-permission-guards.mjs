/**
 * apply-permission-guards.mjs
 *
 * Adds PermissionGuard wrapping to each page file based on the
 * permission map below. Run once with:
 *   node scripts/apply-permission-guards.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, "../src/app/(app)");

// Map of <route-path-segment> → permission
const permissionMap = {
  "crm": "clients",
  "campaigns": "clients",
  "clients": "clients",
  "tender-portal": "clients",

  "estimating-overview": "estimates",
  "labour-rates": "estimates",
  "plant-rates": "estimates",
  "material-rates": "estimates",
  "archive": "estimates",

  "operations-overview": "projects",
  "projects": "projects",
  "tasks": "projects",
  "schedule": "projects",

  "site-diary": "projects",
  "quality-inspections": "projects",
  "permits-to-work": "projects",
  "toolbox-talks": "projects",
  "variation-orders": "projects",
  "rfis": "projects",
  "defects": "projects",
  "photos": "projects",
  "as-built-drawings": "projects",
  "handover-documentation": "projects",
  "lessons-learned": "projects",
  "plant-booking": "projects",
  "material-reconciliation": "projects",
  "weather-logging": "projects",

  "commercial-overview": "invoices",
  "invoices": "invoices",
  "payments": "payments",
  "contracts": "contracts",
  "qs-overview": "invoices",
  "payment-documents": "payments",

  "procurement-overview": "procurement",
  "suppliers": "procurement",
  "purchase-orders": "procurement",

  "resources-overview": "resources",
  "staff": "staff",
  "skills": "staff",
  "allocation": "resources",
  "timesheets-overview": "timesheets",
  "geofences": "timesheets",

  "hs-overview": "compliance",
  "incidents": "compliance",
  "compliance": "compliance",
  "training": "training",

  "fleet-overview": "fleet",
  "fleet": "fleet",
  "maintenance": "fleet",
  "bookings": "fleet",

  "documents": "documents",
  "library-templates": "documents",
  "library-resources": "documents",

  "hr-overview": "leave",
  "team": "staff",
  "leave": "leave",
  "payroll": "payroll",
};

const IMPORT_LINE = `import PermissionGuard from "@/components/PermissionGuard";`;

let modified = 0;
let skipped = 0;

for (const [routeSegment, permission] of Object.entries(permissionMap)) {
  const filePath = `${appDir}/${routeSegment}/page.tsx`;

  let source;
  try {
    source = readFileSync(filePath, "utf8");
  } catch {
    console.warn(`  SKIP (not found): ${routeSegment}/page.tsx`);
    skipped++;
    continue;
  }

  // Already done
  if (source.includes("PermissionGuard")) {
    console.log(`  SKIP (already has guard): ${routeSegment}/page.tsx`);
    skipped++;
    continue;
  }

  // 1. Insert import after "use client" line or at top
  let withImport;
  if (source.startsWith('"use client"')) {
    const newlineIdx = source.indexOf("\n");
    withImport =
      source.slice(0, newlineIdx + 1) +
      "\n" +
      IMPORT_LINE +
      "\n" +
      source.slice(newlineIdx + 1);
  } else {
    withImport = IMPORT_LINE + "\n\n" + source;
  }

  // 2. Wrap the JSX returned from the default export.
  //    We look for the last `return (` in the file (the component's main return)
  //    and wrap it.  We find the matching closing paren by tracking depth.
  const returnToken = "return (";
  // Find the last occurrence (the component's main return, not inner ones)
  // We'll wrap by finding the outermost return inside the default export.
  // Simple heuristic: find the last `return (` at 2-space indentation (top level).
  const lines = withImport.split("\n");
  let returnLineIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trimStart();
    if (trimmed.startsWith("return (") && lines[i].match(/^\s{2}return \(/)) {
      returnLineIdx = i;
      break;
    }
  }

  if (returnLineIdx === -1) {
    // Fallback: find ANY `return (` that isn't deeply nested
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes("return (")) {
        returnLineIdx = i;
        break;
      }
    }
  }

  if (returnLineIdx === -1) {
    console.warn(`  SKIP (could not find return): ${routeSegment}/page.tsx`);
    skipped++;
    continue;
  }

  // Find the matching closing `)` by tracking paren depth
  let depth = 0;
  let closingLineIdx = -1;
  for (let i = returnLineIdx; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          closingLineIdx = i;
          break;
        }
      }
    }
    if (closingLineIdx !== -1) break;
  }

  if (closingLineIdx === -1) {
    console.warn(`  SKIP (could not find closing paren): ${routeSegment}/page.tsx`);
    skipped++;
    continue;
  }

  // Indent of the return line
  const indent = lines[returnLineIdx].match(/^(\s*)/)[1];

  // Insert open guard after `return (`
  lines[returnLineIdx] = lines[returnLineIdx].replace(
    "return (",
    `return (\n${indent}  <PermissionGuard permission="${permission}">`
  );

  // Insert close guard before the closing `)`
  const closingLine = lines[closingLineIdx];
  // The closing paren is usually just `)` on its own line
  lines[closingLineIdx] = closingLine.replace(
    /^(\s*)\)(\s*;?\s*)$/,
    `$1  </PermissionGuard>\n$1)$2`
  );

  const result = lines.join("\n");
  writeFileSync(filePath, result, "utf8");
  console.log(`  DONE: ${routeSegment}/page.tsx  [${permission}]`);
  modified++;
}

console.log(`\nComplete. Modified: ${modified}, Skipped: ${skipped}`);
