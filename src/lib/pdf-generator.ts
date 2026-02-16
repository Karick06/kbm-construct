import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BOQItem, EstimateJob } from './enquiries-store';
import type { BillOfQuantities } from './boq-models';
import { convertToTraditionalFormat, formatBoQAsHTML } from './boq-document';

export interface QuoteData {
  job: EstimateJob;
  items: BOQItem[];
  displayTotal: number;
}

export interface TraditionalQuoteData {
  clientName: string;
  projectName: string;
  estimateNumber: string;
  preparedBy: string;
  date: string;
  items: BOQItem[];
  subtotal: number;
  contingencyPercent: number;
  contingency: number;
  total: number;
  standard: 'SMM7' | 'CESMM' | 'SHW';
}

export const generateQuotePDF = (data: QuoteData): void => {
  const { job, items, displayTotal } = data;
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  const ORANGE = [255, 140, 0];
  const BLACK = [0, 0, 0];
  const WHITE = [255, 255, 255];
  const TEXT_DARK = [40, 40, 40];

  // HEADER - Clean modern design
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  pdf.text('BILL OF QUANTITIES', margin, yPosition);
  
  // Add logo to the right
  const logoBase64 = 'data:image/png;base64,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';
  
  try {
    pdf.addImage(logoBase64, 'PNG', pageWidth - margin - 30, margin - 2, 28, 14);
  } catch (e) {
    // Logo failed, continue anyway
  }
  
  yPosition += 8;

  // Client info
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  pdf.text(job.client, margin, yPosition);
  yPosition += 5;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  if (job.projectAddress) {
    pdf.text(job.projectAddress, margin, yPosition);
    yPosition += 5;
  }

  const quoteDate = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
  pdf.text(`Date: ${quoteDate}`, margin, yPosition);
  yPosition += 4;
  pdf.text(`Ref: ${job.quoteRef || 'QT-PENDING'}`, margin, yPosition);
  yPosition += 8;

  // TABLE HEADER
  const tableLeft = margin;
  const tableWidth = pageWidth - 2 * margin;
  const col1 = 75;   // Description
  const col2 = 18;   // Qty
  const col3 = 16;   // Unit
  const col4 = 25;   // Rate
  const col5 = tableWidth - col1 - col2 - col3 - col4 - 2;   // Total

  pdf.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  pdf.rect(tableLeft, yPosition, tableWidth, 7, 'F');

  pdf.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);

  pdf.text('Description', tableLeft + 2, yPosition + 4.5);
  pdf.text('Qty', tableLeft + col1 + 2, yPosition + 4.5);
  pdf.text('Unit', tableLeft + col1 + col2 + 2, yPosition + 4.5);
  pdf.text('Rate', tableLeft + col1 + col2 + col3 + 2, yPosition + 4.5);
  pdf.text('Total', tableLeft + col1 + col2 + col3 + col4 + 2, yPosition + 4.5, { align: 'right' });

  yPosition += 8;

  // TABLE ROWS - No lines, no alternating colors
  pdf.setTextColor(TEXT_DARK[0], TEXT_DARK[1], TEXT_DARK[2]);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);

  items.forEach((item) => {
    if (yPosition > pageHeight - 35) {
      pdf.addPage();
      yPosition = margin;
    }

    let xPos = tableLeft + 2;
    const descLines = pdf.splitTextToSize(item.description, col1 - 4);
    const lineHeight = descLines.length > 1 ? descLines.length * 4 : 5;
    pdf.text(descLines, xPos, yPosition);

    xPos = tableLeft + col1 + 2;
    pdf.text(item.quantity.toString(), xPos, yPosition);

    xPos = tableLeft + col1 + col2 + 2;
    pdf.text(item.unit, xPos, yPosition);

    xPos = tableLeft + col1 + col2 + col3 + 2;
    pdf.text(`£${item.rate.toFixed(2)}`, xPos, yPosition);

    xPos = tableLeft + tableWidth - 2;
    const totalFormat = item.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    pdf.text(`£${totalFormat}`, xPos, yPosition, { align: 'right' });

    yPosition += lineHeight + 1;
  });

  // TOTAL SECTION
  yPosition += 3;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(BLACK[0], BLACK[1], BLACK[2]);

  let xPos = tableLeft + col1 + col2 + col3 + 2;
  pdf.text('TOTAL', xPos, yPosition);

  xPos = tableLeft + tableWidth - 2;
  const totalFormatted = displayTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  pdf.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
  pdf.setFontSize(14);
  pdf.text(`£${totalFormatted}`, xPos, yPosition, { align: 'right' });

  // FOOTER
  yPosition = pageHeight - 12;
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.setFont('helvetica', 'italic');
  pdf.text('This quotation is valid for 30 days from the date above.', margin, yPosition);

  const fileName = `Quote-${job.id}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
/**
 * Generate Traditional BoQ PDF (new format)
 */
export const generateTraditionalBoQPDF = async (data: TraditionalQuoteData): Promise<void> => {
  try {
    // Convert items to BoQItem format with sections based on description patterns
    const itemsWithSections = data.items.map((item, index) => {
      const section = item.description?.includes('Demolition') ? 'Demolitions' :
                      item.description?.includes('Excavation') ? 'Ground Works' :
                      item.description?.includes('Foundation') ? 'Ground Works' :
                      item.description?.includes('Concrete') ? 'Concrete Works' :
                      item.description?.includes('Structural') ? 'Structural Steelwork' :
                      item.description?.includes('Roof') ? 'Roof Works' :
                      item.description?.includes('Walls') ? 'External Walls' :
                      item.description?.includes('Windows') ? 'Windows and External Doors' :
                      item.description?.includes('Plumbing') ? 'Plumbing' :
                      item.description?.includes('Electrical') ? 'Electrical' :
                      item.description?.includes('Mechanical') ? 'Mechanical' :
                      item.description?.includes('Finishes') ? 'Finishes' :
                      'General';
      
      return {
        id: item.id || `item-${index}`,
        itemNumber: `${index + 1}`,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        rate: item.rate,
        amount: item.total, // BOQItem.total maps to BoQItem.amount
        standard: data.standard,
        section,
        notes: item.components ? `Components: ${item.components.length}` : undefined,
      };
    });

    // Create a mock BillOfQuantities object with proper typing
    const boq: BillOfQuantities = {
      id: `boq-${Date.now()}`,
      projectId: '',
      projectName: data.projectName,
      standard: data.standard,
      title: `Bill of Quantities - ${data.projectName}`,
      date: data.date,
      preparedBy: data.preparedBy,
      items: itemsWithSections as any,
      sections: [],
      subtotal: data.subtotal,
      contingency: data.contingency,
      contingencyPercent: data.contingencyPercent,
      total: data.total,
      status: 'issued',
    };

    // Convert to traditional format and HTML (now returns complete HTML document)
    const doc = convertToTraditionalFormat(boq);
    // Override with estimate number and client name if provided
    if (data.estimateNumber) {
      doc.headerInfo.projectNumber = data.estimateNumber;
    }
    if (data.clientName) {
      doc.headerInfo.clientName = data.clientName;
    }
    const htmlContent = formatBoQAsHTML(doc);

    // Create temporary iframe to render the complete HTML document
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-10000px';
    iframe.style.top = '0';
    iframe.style.width = '210mm';
    iframe.style.border = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    // Wait for iframe to be ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Write complete HTML document to iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) throw new Error('Cannot access iframe document');

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Wait for content to fully render
    await new Promise(resolve => {
      const checkLoad = () => {
        if (iframeDoc.readyState === 'complete') {
          resolve(null);
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
      setTimeout(() => resolve(null), 1500);
    });

    // Get the document body height for proper scaling
    const docHeight = iframeDoc.body?.scrollHeight || 2000;
    
    // Capture with html2canvas at high quality
    const canvas = await html2canvas(iframeDoc.documentElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowHeight: docHeight,
      windowWidth: 794,
      ignoreElements: (element) => {
        return element.classList && element.classList.contains('no-print');
      },
    });

    // Clean up
    document.body.removeChild(iframe);

    // Create PDF with proper dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgData = canvas.toDataURL('image/png', 0.95);
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Add additional pages if content exceeds one page
    let heightLeft = imgHeight - pageHeight;
    let position = pageHeight;
    const minHeightThreshold = 10; // Minimum 10mm of content to create a new page

    while (heightLeft > minHeightThreshold) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position += pageHeight;
    }

    // Save PDF
    const fileName = `BoQ-${data.projectName.replace(/\s+/g, '-')}-${new Date()
      .toISOString()
      .split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating traditional BoQ PDF:', error);
    throw error;
  }
};