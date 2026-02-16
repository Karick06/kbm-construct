'use client';

import { useRef } from 'react';
import type { BillOfQuantities } from '@/lib/boq-models';
import {
  convertToTraditionalFormat,
  formatBoQAsHTML,
} from '@/lib/boq-document';

interface TraditionalBoQViewerProps {
  boq: BillOfQuantities;
  onPrint?: () => void;
  onExportHTML?: (html: string) => void;
}

export function TraditionalBoQViewer({
  boq,
  onPrint,
  onExportHTML,
}: TraditionalBoQViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const traditionaldoc = convertToTraditionalFormat(boq);
  const htmlContent = formatBoQAsHTML(traditionaldoc);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    }
    window.print();
  };

  const handleExport = () => {
    if (onExportHTML) {
      onExportHTML(htmlContent);
    }
  };

  return (
    <div className="w-full">
      {/* Toolbar */}
      <div className="mb-4 flex gap-2 p-4 bg-gray-800 rounded-lg border border-gray-700 no-print">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
        >
          <span>🖨️</span> Print
        </button>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
        >
          <span>📄</span> Export HTML
        </button>
      </div>

      {/* Document Container */}
      <div
        ref={printRef}
        className="bg-white text-black print:p-0"
        style={{ printColorAdjust: 'exact' }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: htmlContent }}
          className="prose prose-sm max-w-none print:prose-sm"
        />
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white;
            color: black;
          }
          div {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
