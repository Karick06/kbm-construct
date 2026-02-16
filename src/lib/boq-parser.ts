/**
 * BOQ Parser - Parse client-supplied BOQs from CSV/Excel
 */

export interface parsedBOQRow {
  itemNo?: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  total?: number;
}

/**
 * Parse CSV content and auto-detect column indices
 */
export function parseCSVContent(content: string): parsedBOQRow[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const delimiter = detectDelimiter(headerLine);

  // Parse header
  const headers = parseRow(headerLine, delimiter).map(h => h.toLowerCase().trim());
  
  // Find column indices
  const colIndices = findColumnIndices(headers);
  if (!colIndices.description || !colIndices.unit) {
    throw new Error('BOQ must contain at least Description and Unit columns');
  }

  // Parse data rows
  const rows: parsedBOQRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseRow(lines[i], delimiter);
    
    const description = getString(cells, colIndices.description);
    const unit = getString(cells, colIndices.unit);
    const quantity = getNumber(cells, colIndices.quantity) || 1;
    const rate = getNumber(cells, colIndices.rate) || 0;
    const total = getNumber(cells, colIndices.total) || quantity * rate;

    if (description && unit) {
      rows.push({
        itemNo: colIndices.itemNo ? getString(cells, colIndices.itemNo) : undefined,
        description,
        unit,
        quantity,
        rate,
        total
      });
    }
  }

  return rows;
}

/**
 * Detect CSV/TSV delimiter
 */
function detectDelimiter(line: string): ',' | '\t' {
  const commaCount = (line.match(/,/g) || []).length;
  const tabCount = (line.match(/\t/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

/**
 * Parse a single CSV line respecting quotes
 */
function parseRow(line: string, delimiter: ',' | '\t'): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      cells.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim().replace(/^"|"$/g, ''));
  return cells;
}

/**
 * Auto-detect column indices by common header patterns
 */
function findColumnIndices(headers: string[]): {
  itemNo?: number;
  description?: number;
  unit?: number;
  quantity?: number;
  rate?: number;
  total?: number;
} {
  const indices: Record<string, number | undefined> = {};

  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];

    // Item number
    if (!indices.itemNo && /^(item|item\s*no|itemno|no\.|number)$/.test(h)) {
      indices.itemNo = i;
    }

    // Description
    if (!indices.description && /^(description|desc|item description|work)$/.test(h)) {
      indices.description = i;
    }

    // Unit
    if (!indices.unit && /^(unit|uom|u\/m|units)$/.test(h)) {
      indices.unit = i;
    }

    // Quantity
    if (!indices.quantity && /^(quantity|qty|q|quantity\s*required|required\s*qty)$/.test(h)) {
      indices.quantity = i;
    }

    // Rate
    if (!indices.rate && /^(rate|unit\s*rate|unit\s*price|price|rate\s*£|£\/unit)$/.test(h)) {
      indices.rate = i;
    }

    // Total
    if (!indices.total && /^(total|total\s*price|total\s*£|amount|value)$/.test(h)) {
      indices.total = i;
    }
  }

  // If description not found, try first non-empty column
  if (indices.description === undefined) {
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].length > 0) {
        indices.description = i;
        break;
      }
    }
  }

  // If unit not found, try second column
  if (indices.unit === undefined && headers.length > 1) {
    indices.unit = 1;
  }

  // Quantity defaults to 1 if not provided
  // Rate defaults to 0 if not provided
  // Total calculated if not provided

  return indices;
}

/**
 * Get string value from cell array
 */
function getString(cells: string[], index: number | undefined): string {
  if (index === undefined || index >= cells.length) return '';
  const val = cells[index].trim();
  return val && val !== '-' && val !== 'N/A' ? val : '';
}

/**
 * Get number value from cell array
 */
function getNumber(cells: string[], index: number | undefined): number | null {
  if (index === undefined || index >= cells.length) return null;
  const val = cells[index].trim();
  if (!val || val === '-' || val === 'N/A') return null;
  
  // Remove currency symbols and parse
  const cleaned = val.replace(/[£$€,]/g, '').trim();
  const parsed = parseFloat(cleaned);
  
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Load and parse CSV file from Blob
 */
export async function parseCSVFile(file: Blob): Promise<parsedBOQRow[]> {
  const text = await file.text();
  return parseCSVContent(text);
}

/**
 * Load and parse Excel file from Blob (requires xlsx library)
 * For now, returns empty array - to be implemented with xlsx
 */
export async function parseExcelFile(file: Blob): Promise<parsedBOQRow[]> {
  // This will be implemented when xlsx is available
  // For now, we'll just parse as CSV if it fails
  try {
    return await parseCSVFile(file);
  } catch {
    throw new Error('Could not parse Excel file. Please ensure it contains valid data.');
  }
}

/**
 * Parse BOQ from file (auto-detects format)
 */
export async function parseBOQFile(file: Blob): Promise<parsedBOQRow[]> {
  const fileName = (file as any).name || '';
  const isCsv = /\.(csv|tsv|txt)$/i.test(fileName);
  const isExcel = /\.(xlsx|xls)$/i.test(fileName);

  if (isCsv) {
    return parseCSVFile(file);
  } else if (isExcel) {
    return parseExcelFile(file);
  } else {
    // Try CSV first, fall back to Excel
    try {
      return await parseCSVFile(file);
    } catch {
      return parseExcelFile(file);
    }
  }
}
