/**
 * Traditional Bill of Quantities Document Generator
 * Creates professional BoQ documents in traditional format
 */

import type { BillOfQuantities, BoQItem, BoQSection } from './boq-models';

export interface TraditionalBoQDocument {
  headerInfo: {
    clientName: string;
    projectName: string;
    projectNumber?: string;
    preparedBy: string;
    date: string;
    revisedDate?: string;
    standard: string;
  };
  sections: TraditionalBoQSection[];
  summary: {
    subtotal: number;
    contingencyPercent: number;
    contingency: number;
    total: number;
  };
}

export interface TraditionalBoQSection {
  sectionId: string;
  sectionName: string;
  description?: string;
  items: TraditionalBoQItem[];
  subtotal: number;
}

export interface TraditionalBoQItem {
  itemNumber: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
}

/**
 * Convert BillOfQuantities to TraditionalBoQDocument
 */
export function convertToTraditionalFormat(
  boq: BillOfQuantities
): TraditionalBoQDocument {
  // Group items by section
  const sectionMap = new Map<string, BoQItem[]>();

  boq.items.forEach((item) => {
    const section = item.section || 'General';
    if (!sectionMap.has(section)) {
      sectionMap.set(section, []);
    }
    sectionMap.get(section)!.push(item);
  });

  // Create traditional sections
  const sections: TraditionalBoQSection[] = Array.from(sectionMap.entries()).map(
    ([sectionName, items]) => {
      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      return {
        sectionId: sectionName.toLowerCase().replace(/\s+/g, '-'),
        sectionName,
        items: items.map((item) => ({
          itemNumber: item.itemNumber,
          description: item.description,
          unit: item.unit,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          notes: item.notes,
        })),
        subtotal,
      };
    }
  );

  return {
    headerInfo: {
      clientName: boq.projectId || 'N/A', // fallback for client name
      projectName: boq.projectName,
      preparedBy: boq.preparedBy,
      date: boq.date,
      standard: boq.standard,
    },
    sections,
    summary: {
      subtotal: boq.subtotal,
      contingencyPercent: boq.contingencyPercent,
      contingency: boq.contingency,
      total: boq.total,
    },
  };
}

export function formatBoQAsHTML(doc: TraditionalBoQDocument): string {
  let html = `<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
  }
  .document {
    width: 210mm;
    padding: 20mm;
    background: white;
    color: #1a1a1a;
  }
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 24px;
    padding-bottom: 0;
    border-bottom: none;
  }
  .header-title {
    flex: 1;
    text-align: right;
  }
  .header-logo {
    flex-shrink: 0;
    background-color: #000000;
    padding: 12px 16px;
    border-radius: 4px;
    margin-top: -8px;
  }
  .header-logo img {
    height: 40px;
    width: auto;
    display: block;
  }
  .header h1 {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
    color: #1a1a1a;
    text-align: right;
    padding-bottom: 0;
    margin-top: 8px;
  }
  .header h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 8px 0;
    color: #1a1a1a;
  }
  .header p {
    font-size: 12px;
    margin: 4px 0;
    color: #555;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-top: 12px;
    padding-top: 12px;
    padding-left: 0;
    padding-right: 0;
  }
  .info-grid > div:first-child {
    text-align: left;
  }
  .info-grid > div:last-child {
    text-align: right;
  }
  .info-grid p {
    font-size: 11px;
    margin: 4px 0;
  }
  .section-header {
    margin-top: 20px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 2px solid #1a1a1a;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  .section-header h3 {
    font-size: 13px;
    font-weight: 700;
    margin: 0;
    color: #1a1a1a;
    text-transform: uppercase;
  }
  .section-header p {
    font-size: 11px;
    color: #666;
    margin: 4px 0 0 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 10.5px;
    page-break-inside: avoid;
    orphans: 3;
    widows: 3;
  }
  thead {
    background-color: #f0f0f0;
  }
  th {
    background-color: #e8e8e8;
    border: 1px solid #999;
    padding: 7px 6px;
    text-align: left;
    font-weight: 700;
    color: #1a1a1a;
    font-size: 10px;
  }
  th.center { text-align: center; }
  th.right { text-align: right; }
  td {
    border: 1px solid #ddd;
    padding: 5px 6px;
    color: #1a1a1a;
  }
  tbody tr:nth-child(odd) {
    background-color: #fafafa;
  }
  tbody tr:nth-child(even) {
    background-color: #fff;
  }
  td.center { text-align: center; }
  td.right { text-align: right; font-weight: 500; }
  td.amount { font-weight: 700; }
  .subtotal {
    text-align: right;
    margin: 8px 0 16px 0;
    font-weight: 600;
    font-size: 11px;
    padding-right: 6px;
  }
  .summary {
    margin-top: 100px;
    page-break-before: always;
    page-break-inside: avoid;
    text-align: center;
    padding-top: 150px;
    clear: both;
  }
  .summary h2 {
    display: none;
  }
  .summary-page-title {
    font-size: 18px;
    font-weight: 700;
    margin-bottom: 24px;
    text-align: center;
    color: #1a1a1a;
  }
  .summary-section-table {
    width: auto;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
    border-collapse: collapse;
    font-size: 11px;
  }
  .summary-section-table td {
    padding: 8px 12px;
    border: none;
  }
  .summary-section-table td:first-child {
    text-align: left;
    width: 70%;
  }
  .summary-section-table td:last-child {
    text-align: right;
    width: 30%;
    font-weight: 700;
  }
  .summary-section-table tr.section-total {
    border-top: 1px solid #1a1a1a;
    border-bottom: 1px solid #1a1a1a;
  }
  .summary-section-table tr.grand-total {
    border-top: 2px solid #1a1a1a;
    border-bottom: 2px solid #1a1a1a;
    font-size: 14px;
    font-weight: 700;
  }
  .summary-table {
    display: none;
  }
</style>`;

  // Content - no page wrapper, let content flow naturally
  let html_content = '';

  // Header on first page
  html_content += `
    <div class="header">
      <div class="header-logo">
        <img src="/valescape-logo.png" alt="Valescape" />
      </div>
      <div class="header-title">
        <h1>BILL OF QUANTITIES</h1>
      </div>
    </div>
    <div class="info-grid">
        <div>
          <p><strong>Client:</strong> ${doc.headerInfo.clientName}</p>
          <p><strong>Project:</strong> ${doc.headerInfo.projectName}</p>
          <p><strong>Estimate No:</strong> ${doc.headerInfo.projectNumber || 'N/A'}</p>
        </div>
        <div>
          <p><strong>Estimator:</strong> ${doc.headerInfo.preparedBy}</p>
          <p><strong>Date:</strong> ${formatDate(doc.headerInfo.date)}</p>
          ${doc.headerInfo.revisedDate ? `<p><strong>Revised:</strong> ${formatDate(doc.headerInfo.revisedDate)}</p>` : ''}
        </div>
      </div>
  `;

  // All sections flow naturally without page breaks
  doc.sections.forEach((section) => {
    html_content += `
      <div class="section-header">
        <h3>${section.sectionName}</h3>
        ${section.description ? `<p>${section.description}</p>` : ''}
      </div>
    `;

    html_content += `
      <table>
        <thead>
          <tr>
            <th style="width: 8%;">Item</th>
            <th style="width: 42%;">Description</th>
            <th class="center" style="width: 8%;">Unit</th>
            <th class="right" style="width: 12%;">Quantity</th>
            <th class="right" style="width: 15%;">Rate (£)</th>
            <th class="right" style="width: 15%;">Amount (£)</th>
          </tr>
        </thead>
        <tbody>
    `;

    section.items.forEach((item) => {
      html_content += `
        <tr>
          <td>${item.itemNumber}</td>
          <td>${item.description}</td>
          <td class="center">${item.unit}</td>
          <td class="right">${formatNumber(item.quantity)}</td>
          <td class="right">£${formatCurrency(item.rate)}</td>
          <td class="right amount">£${formatCurrency(item.amount)}</td>
        </tr>
      `;
    });

    html_content += `
        </tbody>
      </table>
      <div class="subtotal">Subtotal: £${formatCurrency(section.subtotal)}</div>
    `;
  });

  // Summary section on its own page
  html_content += `
    <div class="summary">
      <div class="summary-page-title">SUMMARY OF TOTALS</div>
      <table class="summary-section-table">
        <tbody>
          ${doc.sections.map(section => `
            <tr>
              <td>${section.sectionName}</td>
              <td>£${formatCurrency(section.subtotal)}</td>
            </tr>
          `).join('')}
          <tr class="grand-total">
            <td>TOTAL:</td>
            <td>£${formatCurrency(doc.summary.subtotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${doc.headerInfo.projectName}</title>
        ${html}
      </head>
      <body>
        <div class="document">
          ${html_content}
        </div>
      </body>
    </html>
  `;

  return content;
}

/**
 * Format number with proper decimal places
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format currency value
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Generate PDF from BoQ (requires jsPDF library)
 */
export async function generateBoQPDF(boq: BillOfQuantities, filename: string) {
  try {
    // Dynamically import jsPDF and html2canvas
    const { jsPDF } = await import('jspdf');
    const html2canvas = await import('html2canvas');

    // Create temporary canvas from HTML
    const doc = convertToTraditionalFormat(boq);
    const htmlContent = formatBoQAsHTML(doc);

    // Create temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.width = '794px'; // A4 width
    document.body.appendChild(tempDiv);

    // Convert to canvas and then PDF
    const canvas = await html2canvas.default(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    document.body.removeChild(tempDiv);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
