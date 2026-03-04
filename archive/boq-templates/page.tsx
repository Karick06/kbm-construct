/**
 * BoQ Template Selection Page
 * Choose measurement standard and select template
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BoQTemplate } from '@/lib/boq-templates';

export default function BoQTemplatesPage() {
  const [templates, setTemplates] = useState<BoQTemplate[]>([]);
  const [selectedStandard, setSelectedStandard] = useState<'SMM7' | 'CESMM' | 'SHW'>('SMM7');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [selectedStandard]);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/boq/templates?standard=${selectedStandard}`);
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const standardDescriptions: {
    [key: string]: string;
  } = {
    SMM7: 'Standard Method of Measurement (7th Edition) - For building works',
    CESMM: 'Civil Engineering Standard Method of Measurement - For civil engineering',
    SHW: 'Specification for Highways Works - For highway and road projects',
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-3 grid-cols-3">
        {(['SMM7', 'CESMM', 'SHW'] as const).map((standard) => (
          <button
            key={standard}
            onClick={() => setSelectedStandard(standard)}
            className={`rounded-lg p-4 text-left transition border ${
              selectedStandard === standard
                ? 'bg-orange-500 border-orange-600'
                : 'bg-gray-800 border-gray-700 hover:border-orange-500'
            }`}
          >
            <h3 className="font-bold text-white">{standard}</h3>
            <p className="text-xs text-gray-300 mt-2">
              {standardDescriptions[standard]}
            </p>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-6">
          Available {selectedStandard} Templates
        </h2>

        {loading ? (
          <p className="text-gray-400">Loading templates...</p>
        ) : templates.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No templates available for this standard</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map((template) => {
              const templateTotal = template.items.reduce((sum, item) => sum + item.amount, 0);
              return (
                <div
                  key={template.id}
                  className="rounded-lg border border-gray-700 bg-gray-700 p-4 hover:border-orange-500 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-white">{template.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{template.category}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-4">{template.description}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                    <div>
                      <p className="text-xs text-gray-400">Base Value</p>
                      <p className="text-lg font-bold text-white">
                        {formatCurrency(templateTotal)}
                      </p>
                    </div>
                    <button className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                      Use Template
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Or Create from Scratch</h2>
        <button className="rounded-lg border border-orange-500 px-6 py-3 font-semibold text-orange-500 hover:bg-orange-500 hover:text-white transition">
          + Custom BoQ
        </button>
      </div>
    </div>
  );
}
