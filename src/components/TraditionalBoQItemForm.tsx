'use client';

import { useState } from 'react';
import type { BoQItem, MeasurementStandard } from '@/lib/boq-models';
import {
  generateTraditionalItemNumber,
  validateTraditionalBoQItem,
  calculateItemAmount,
} from '@/lib/boq-traditional-helper';

interface TraditionalBoQItemFormProps {
  standard: MeasurementStandard;
  sections: string[];
  onAddItem: (item: BoQItem) => void;
  onCancel?: () => void;
}

export function TraditionalBoQItemForm({
  standard,
  sections,
  onAddItem,
  onCancel,
}: TraditionalBoQItemFormProps) {
  const [formData, setFormData] = useState({
    itemNumber: '',
    description: '',
    unit: 'm²',
    quantity: '',
    rate: '',
    section: sections[0] || 'General',
    notes: '',
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear item number if section changes (will auto-generate)
    if (name === 'section') {
      setFormData((prev) => ({
        ...prev,
        itemNumber: '',
      }));
    }
  };

  const handleAutoGenerateItemNumber = () => {
    const sectionIndex = sections.indexOf(formData.section);
    const itemsInSection = 1; // In real app, count existing items in section
    const newNumber = generateTraditionalItemNumber(
      standard,
      formData.section,
      itemsInSection - 1
    );
    setFormData((prev) => ({
      ...prev,
      itemNumber: newNumber,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const quantity = parseFloat(formData.quantity);
    const rate = parseFloat(formData.rate);

    // Validate
    const newItem: Partial<BoQItem> = {
      itemNumber: formData.itemNumber,
      description: formData.description,
      unit: formData.unit,
      quantity,
      rate,
      section: formData.section,
      notes: formData.notes,
      standard,
    };

    const validation = validateTraditionalBoQItem(newItem);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Create item
    const item: BoQItem = {
      ...newItem,
      id: `item-${Date.now()}`,
      amount: calculateItemAmount(quantity, rate),
    } as BoQItem;

    onAddItem(item);
    setSubmitted(true);

    // Reset form
    setTimeout(() => {
      setFormData({
        itemNumber: '',
        description: '',
        unit: 'm²',
        quantity: '',
        rate: '',
        section: sections[0] || 'General',
        notes: '',
      });
      setSubmitted(false);
    }, 1000);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
    >
      <h3 className="text-lg font-semibold text-white mb-4">
        Add Traditional BoQ Item
      </h3>

      {errors.length > 0 && (
        <div className="bg-red-900/30 border border-red-700 rounded p-3">
          <p className="text-red-200 text-sm font-semibold mb-2">
            Please fix the following errors:
          </p>
          <ul className="space-y-1">
            {errors.map((error, idx) => (
              <li key={idx} className="text-red-300 text-sm">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {submitted && (
        <div className="bg-green-900/30 border border-green-700 rounded p-3">
          <p className="text-green-200 text-sm">✓ Item added successfully</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Item Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Item Number
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="itemNumber"
              value={formData.itemNumber}
              onChange={handleChange}
              placeholder={`e.g., A.1 or D.1.1`}
              className="flex-1 rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAutoGenerateItemNumber}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition"
              title="Auto-generate based on section"
            >
              Auto
            </button>
          </div>
        </div>

        {/* Section */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Section
          </label>
          <select
            name="section"
            value={formData.section}
            onChange={handleChange}
            className="w-full rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Detailed description of the work item"
          rows={3}
          className="w-full rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Unit
          </label>
          <select
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full rounded bg-gray-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="m²">m² (square meter)</option>
            <option value="m³">m³ (cubic meter)</option>
            <option value="m">m (linear meter)</option>
            <option value="no">no (number)</option>
            <option value="sum">sum</option>
            <option value="t">t (tonne)</option>
            <option value="hours">hours</option>
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantity
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0"
            className="w-full rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Rate */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Rate (£ per unit)
        </label>
        <input
          type="number"
          name="rate"
          value={formData.rate}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          className="w-full rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Additional notes for this item"
          rows={2}
          className="w-full rounded bg-gray-700 px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded transition"
        >
          Add Item
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 rounded transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
