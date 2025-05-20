'use client';

import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { InvoiceData, EditableInvoice } from '@/app/types';
import DeleteModal from './DeleteModal';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

let clientSideSupabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

interface Props {
  fields: EditableInvoice;
  onChange: (updated: EditableInvoice) => void;
}

const EditableFields = ({ fields, onChange }: Props) => {
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!clientSideSupabase) {
        clientSideSupabase = createSupabaseBrowserClient();
      }
      setSupabase(clientSideSupabase);
    }
  }, []);

  const handleTopLevelChange = (
    key: keyof Omit<EditableInvoice, 'invoice_data' | 'seller' | 'buyer' | 'id'>,
    value: string
  ) => {
    onChange({ ...fields, [key]: value });
  };

  const handleNestedChange = (
    parent: 'seller' | 'buyer',
    key: string,
    value: string
  ) => {
    onChange({ ...fields, [parent]: { ...fields[parent], [key]: value } });
  };

  const handleItemChange = (
    index: number,
    key: keyof InvoiceData,
    value: string
  ) => {
    const updated = [...fields.invoice_data];
    updated[index][key] = value;
    onChange({ ...fields, invoice_data: updated });
  };

  const handleDeleteItem = async (index: number) => {
    const updated = [...fields.invoice_data];
    updated.splice(index, 1);

    if (!fields.id) {
      onChange({ ...fields, invoice_data: updated });
      return;
    }

    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        alert('You must be logged in to delete items.');
        return;
      }

      const res = await fetch('/api/processed/item', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ invoiceId: fields.id, itemIndex: index }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert('Failed to delete item: ' + (err.error || res.statusText));
        return;
      }

      onChange({ ...fields, invoice_data: updated });
    } catch (error: unknown) {
      console.error('Error deleting item:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete item');
    }
  };

  const handleAddItem = () => {
    onChange({
      ...fields,
      invoice_data: [
        ...fields.invoice_data,
        { name: '', quantity: '', unit_price: '', net: '', gross: '' },
      ],
    });

    setTimeout(() => {
      requestAnimationFrame(() => {
        itemsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
    }, 50);
  };

  if (!fields || !fields.invoice_data) {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
        <AlertCircle size={20} />
        <span>Invalid OpenAI response format. Expected an invoice object.</span>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Seller & Buyer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(['seller', 'buyer'] as const).map((section) => (
          <div
            key={section}
            className="bg-zinc-800/60 rounded-2xl shadow-lg p-6 border border-zinc-700/60"
          >
            <h3 className="text-xl font-bold text-green-400 mb-4 border-b border-green-900 pb-2">
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </h3>
            <div className="space-y-4">
              {Object.entries(fields[section]).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-zinc-300 capitalize">
                    {key.replace('_', ' ')}
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleNestedChange(section, key, e.target.value)}
                    className={`w-full max-w-2xl px-6 py-3 rounded-lg bg-zinc-900/70 border border-zinc-700/60 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/70 focus:border-green-500/70 transition-all ${
                      key === 'name' || key === 'address' ? 'font-semibold' : ''
                    }`}
                    placeholder={`${section.charAt(0).toUpperCase() + section.slice(1)} ${key}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Invoice Details */}
      <div className="bg-zinc-800/60 rounded-2xl shadow-lg p-6 border border-zinc-700/60">
        <h3 className="text-xl font-bold text-green-400 mb-4 border-b border-green-900 pb-2">
          Invoice Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['invoice_number', 'issue_date', 'fulfillment_date', 'due_date', 'payment_method'] as const).map((field) => (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-zinc-300 capitalize">
                {field.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={fields[field]}
                onChange={(e) => handleTopLevelChange(field, e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-zinc-900/70 border border-zinc-700/60 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/70 focus:border-green-500/70 transition-all"
                placeholder={field.replace('_', ' ')}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-zinc-800/60 rounded-2xl shadow-lg p-6 border border-zinc-700/60">
        <div className="sticky top-0 z-10 bg-zinc-800/80 rounded-t-2xl pb-2 mb-4 border-b border-green-900 flex items-center justify-between">
          <h3 className="text-xl font-bold text-green-400">Items</h3>
          <button
            type="button"
            className="ml-4 px-7 py-3 bg-green-600 hover:bg-green-500 text-white rounded-full text-base font-bold shadow-lg border-2 border-green-700 flex items-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-400/60"
            onClick={handleAddItem}
          >
            <Plus size={20} /> Add Item
          </button>
        </div>

        <div className="space-y-6">
          {fields.invoice_data.map((item, index) => (
            <div
              key={index}
              className="bg-zinc-900/80 rounded-xl border border-zinc-700/70 p-6 space-y-4 shadow-md hover:border-green-500/70 transition-colors group"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-green-400 mb-2">
                <span className="px-2 py-1 bg-green-400/10 rounded-lg">Item {index + 1}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['name', 'quantity', 'unit_price', 'net', 'gross'] as const).map((key) => (
                  <div
                    key={key}
                    className={`flex flex-col gap-2 ${key === 'name' ? 'col-span-2' : ''}`}
                  >
                    <label className="text-sm font-medium text-zinc-300 capitalize">
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={item[key]}
                      onChange={(e) => handleItemChange(index, key, e.target.value)}
                      className={`w-full max-w-2xl px-6 py-3 rounded-lg bg-zinc-900/70 border border-zinc-700/60 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/70 focus:border-green-500/70 transition-all ${
                        key === 'name' ? 'font-semibold' : ''
                      }`}
                      placeholder={`Enter ${key.replace('_', ' ')}`}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white rounded-lg px-4 py-2 shadow border-2 border-red-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-400/60"
                  onClick={() => setShowDeleteModal(index)}
                  title="Delete item"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                {showDeleteModal === index && (
                  <DeleteModal
                    open={true}
                    onClose={() => setShowDeleteModal(null)}
                    onConfirm={() => handleDeleteItem(index)}
                    title="Delete Item"
                    description={
                      fields.id
                        ? 'Are you sure you want to delete this item? This action cannot be undone.'
                        : 'Remove this item from the invoice draft?'
                    }
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={itemsEndRef} />
        </div>
      </div>
    </div>
  );
};

export default EditableFields;
