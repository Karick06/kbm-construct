/**
 * BoQ Standards Converter
 * Convert between SMM7, CESMM, and SHW formats
 */

'use client';

import { useState } from 'react';
import type { MeasurementStandard } from '@/lib/boq-models';

export default function BoQConverterPage() {
  const [sourceStandard, setSourceStandard] = useState<MeasurementStandard>('SMM7');
  const [targetStandard, setTargetStandard] = useState<MeasurementStandard>('CESMM');
  const [uploadedFile, setUploadedFile] = useState<string>('');

  const standards: MeasurementStandard[] = ['SMM7', 'CESMM', 'SHW'];

  const conversionInfo: { [key: string]: string } = {
    'SMM7-CESMM': 'Building items cannot directly convert to civil engineering items',
    'SMM7-SHW': 'Building items cannot directly convert to healthcare items',
    'CESMM-SMM7': 'Civil items cannot directly convert to building items',
    'CESMM-SHW': 'Civil items cannot directly convert to healthcare items',
    'SHW-SMM7': 'Healthcare items cannot directly convert to building items',
    'SHW-CESMM': 'Healthcare items cannot directly convert to civil items',
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedFile(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Source Standard</h2>
          <div className="space-y-3">
            {standards.map((std) => (
              <button
                key={std}
                onClick={() => setSourceStandard(std)}
                className={`w-full text-left rounded-lg p-3 transition ${
                  sourceStandard === std
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {std}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Target Standard</h2>
          <div className="space-y-3">
            {standards
              .filter((s) => s !== sourceStandard)
              .map((std) => (
                <button
                  key={std}
                  onClick={() => setTargetStandard(std)}
                  className={`w-full text-left rounded-lg p-3 transition ${
                    targetStandard === std
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {std}
                </button>
              ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Upload BoQ File</h2>
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="file-input"
          />
          <label htmlFor="file-input" className="cursor-pointer">
            <p className="text-5xl mb-4">📁</p>
            <p className="text-gray-300 mb-2">Drag and drop CSV file or click to select</p>
            <p className="text-xs text-gray-400">Supported: CSV, XLSX</p>
          </label>
        </div>
        {uploadedFile && (
          <div className="mt-4 p-3 rounded-lg bg-green-900 text-green-200">
            ✓ File ready to convert
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">
          {sourceStandard} → {targetStandard} Conversion
        </h2>
        <div className="bg-gray-700 p-4 rounded-lg mb-4">
          <p className="text-gray-300 text-sm">
            {conversionInfo[`${sourceStandard}-${targetStandard}`]}
          </p>
          <p className="text-xs text-gray-400 mt-3">
            Note: Direct conversion between standards requires manual mapping of items based on their descriptions and scope.
          </p>
        </div>
        <button
          disabled={!uploadedFile}
          className="rounded-lg bg-orange-500 px-6 py-2 font-semibold text-white hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Convert BoQ
        </button>
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Conversion Guidelines</h2>
        <ul className="space-y-3 text-sm text-gray-300">
          <li>• <strong>Different Scope:</strong> Standards serve different purposes - items don't convert 1:1</li>
          <li>• <strong>Unit Conversion:</strong> Some units may differ (e.g., m² vs per item)</li>
          <li>• <strong>Section Reorganization:</strong> Items will be regrouped into target standard sections</li>
          <li>• <strong>Manual Review:</strong> Always review converted BoQs for accuracy</li>
          <li>• <strong>New Rates:</strong> Market rates may differ between project types</li>
        </ul>
      </div>
    </div>
  );
}
