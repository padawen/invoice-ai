'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
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
      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
        <AlertCircle size={20} />
        <span>Invalid OpenAI response format. Expected an array of invoice items.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {fields.map((item, index) => (
        <div
          key={index}
          className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700/50 p-6 space-y-4 hover:border-green-500/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-green-400">
            <span className="px-2 py-1 bg-green-400/10 rounded-lg">Item {index + 1}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(item).map(([key, value]) => (
              <div key={key} className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300 capitalize">
                  {key.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => handleChange(index, key as keyof InvoiceField, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all"
                  placeholder={`Enter ${key.replace('_', ' ')}`}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EditableFields;
