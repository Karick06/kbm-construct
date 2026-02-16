/**
 * CSV Parser Utility
 * Parse CSV files from public/data directory
 */

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

const coerceValue = (value: string) => {
  if (value === '') return '';
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }
  return value;
};

export async function parseCSVWithHeaders<T>(
  filename: string
): Promise<{ headers: string[]; rows: T[] }> {
  try {
    console.log(`Fetching CSV file: /data/${filename}`);
    const response = await fetch(`/data/${filename}`);
    if (!response.ok) {
      console.error(`Failed to load ${filename}: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to load ${filename}`);
    }

    const text = await response.text();
    console.log(`Loaded ${filename}, size: ${text.length} bytes`);
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    console.log(`${filename} has ${lines.length} lines`);

    if (lines.length < 2) {
      console.warn(`${filename} has insufficient data`);
      return { headers: [], rows: [] };
    }

    // Find the header row - first line with actual text content (not just commas/empty)
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseCSVLine(lines[i]);
      const hasContent = parsed.some(cell => cell.trim().length > 0);
      if (hasContent) {
        headerIndex = i;
        break;
      }
    }
    
    if (headerIndex === -1) {
      console.warn(`${filename} has no valid header row`);
      return { headers: [], rows: [] };
    }

    const headers = parseCSVLine(lines[headerIndex]);
    console.log(`${filename} headers (first 5):`, headers.slice(0, 5));
    const rows: T[] = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string | number> = {};

      headers.forEach((header, index) => {
        const value = values[index] ?? '';
        row[header] = coerceValue(value);
      });

      rows.push(row as T);
    }

    console.log(`${filename} parsed: ${rows.length} rows`);
    return { headers, rows };
  } catch (error) {
    console.error(`Error parsing CSV ${filename}:`, error);
    return { headers: [], rows: [] };
  }
}

export async function parseCSV<T>(
  filename: string,
  mapper?: (row: Record<string, string | number>) => T
): Promise<T[]> {
  const result = await parseCSVWithHeaders<T>(filename);
  
  if (mapper) {
    return result.rows.map((row: any) => mapper(row));
  }
  
  return result.rows;
}

export function downloadCSV(data: any[], filename: string) {
  if (data.length === 0) return;
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]?.toString() || '';
        // Escape commas and quotes
        return value.includes(',') || value.includes('"') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
