'use client';

import React from 'react';
import type { InvoiceField } from '../types';

interface Props {
  fields: InvoiceField[];
  onChange: (updated: InvoiceField[]) => void;
}

const EditableFields = ({ fields, onChange }: Props) => {
  const handleChange = (index: number, key: keyof InvoiceField, value: string) => {
    const updated = [...fields];
    updated[index][key] = value;
    onChange(updated);
  };

  if (!Array.isArray(fields)) {
    return (
      <div className="text-red-500 font-medium p-4 bg-red-100 rounded">
        Invalid OpenAI response format. Expected an array of invoice items.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fields.map((item, index) => (
        <div
          key={index}
          className="border border-zinc-700 bg-zinc-900 rounded-xl p-4 space-y-4 shadow-lg"
        >
          <div className="text-sm text-zinc-400 font-semibold mb-2">
            Product {index + 1}
          </div>

          {Object.entries(item).map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-sm font-medium capitalize text-zinc-300">
                {key.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(index, key as keyof InvoiceField, e.target.value)}
                className="w-full p-2 rounded bg-zinc-800 border border-zinc-600 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default EditableFields;
