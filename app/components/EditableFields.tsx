'use client';

/* eslint-disable react/no-unescaped-entities */
import React, { useRef, useState, useEffect } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import type { InvoiceData, EditableInvoice } from '@/app/types';
import DeleteModal from './modals/DeleteModal';
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    if (!fields.id) {
      const updated = [...fields.invoice_data];
      updated.splice(index, 1);
      onChange({ ...fields, invoice_data: updated });
      setShowDeleteModal(null);
      return;
    }

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error('You must be logged in to delete items');
      }

      const updatedItems = [...fields.invoice_data];
      updatedItems.splice(index, 1);
      
      const { error: updateError } = await supabase
        .from('processed_data')
        .update({ raw_data: updatedItems })
        .eq('id', fields.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      onChange({ ...fields, invoice_data: updatedItems });
      setDeleteError(null);
    } catch (error) {
      console.error('Failed to delete item');
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete item');
    } finally {
      setShowDeleteModal(null);
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
      <div className="grid grid-cols-1 gap-8">
        {(['seller', 'buyer'] as const).map((section) => (
          <div
            key={section}
            className="bg-zinc-800/60 rounded-2xl shadow-lg p-6 border border-zinc-700/60"
          >
            <h3 className="text-xl font-bold text-green-400 mb-4 border-b border-green-900 pb-2">
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(fields[section])
                .filter(([key]) => key === 'name')
                .map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-base font-medium text-zinc-300 capitalize">
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleNestedChange(section, key, e.target.value)}
                      className="w-full bg-zinc-900/70 border border-zinc-700/60 px-4 py-3 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                      placeholder={`Enter ${key.replace('_', ' ')}`}
                    />
                  </div>
                ))
              }
              
              {Object.entries(fields[section])
                .filter(([key]) => key === 'address')
                .map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-base font-medium text-zinc-300 capitalize">
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleNestedChange(section, key, e.target.value)}
                      className="w-full bg-zinc-900/70 border border-zinc-700/60 px-4 py-3 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                      placeholder={`Enter ${key.replace('_', ' ')}`}
                    />
                  </div>
                ))
              }
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(fields[section])
                .filter(([key]) => key !== 'name' && key !== 'address')
                .map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-base font-medium text-zinc-300 capitalize">
                      {key.replace('_', ' ')}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleNestedChange(section, key, e.target.value)}
                      className="w-full bg-zinc-900/70 border border-zinc-700/60 px-4 py-3 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                      placeholder={`Enter ${key.replace('_', ' ')}`}
                    />
                  </div>
                ))
              }
            </div>
          </div>
        ))}
      </div>

      <div className="bg-zinc-800/60 rounded-2xl shadow-lg p-6 border border-zinc-700/60">
        <h3 className="text-xl font-bold text-green-400 mb-4 border-b border-green-900 pb-2">
          Invoice Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {(['invoice_number', 'issue_date', 'fulfillment_date', 'due_date', 'payment_method'] as const).map((field) => (
            <div key={field} className="flex flex-col gap-2">
              <label className="text-base font-medium text-zinc-300 capitalize">
                {field.replace('_', ' ')}
              </label>
              <input
                type="text"
                value={fields[field]}
                onChange={(e) => handleTopLevelChange(field, e.target.value)}
                className="w-full bg-zinc-900/70 border border-zinc-700/60 px-4 py-3 rounded-lg text-white text-lg focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                placeholder={`Enter ${field.replace('_', ' ')}`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-800/60 rounded-2xl shadow-lg p-6 border border-zinc-700/60">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-green-400">Items</h3>
          <button
            type="button"
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg text-base font-medium shadow border border-green-700 flex items-center gap-2"
            onClick={handleAddItem}
          >
            <Plus size={20} /> Add Item
          </button>
        </div>

        {deleteError && (
          <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-lg mb-4">
            <AlertCircle size={18} />
            <span>{deleteError}</span>
          </div>
        )}

        {/* Items table - Add ref to the container */}
        <div className="space-y-4" ref={itemsEndRef}>
          {fields.invoice_data.map((item, index) => (
            <div 
              key={index} 
              className="bg-zinc-900/80 rounded-lg border border-zinc-700/60 p-4 hover:border-green-500/30 transition-colors"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-medium text-green-400">Item #{index + 1}</h4>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(index)}
                  className="inline-flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                  title="Delete item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-zinc-400">Item Name</label>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700/60 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                    placeholder="Item description"
                  />
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-zinc-400">Quantity</label>
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                      placeholder="Qty"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-zinc-400">Unit Price</label>
                    <input
                      type="text"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                      placeholder="Unit price"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-zinc-400">Net</label>
                    <input
                      type="text"
                      value={item.net}
                      onChange={(e) => handleItemChange(index, 'net', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                      placeholder="Net amount"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-zinc-400">Gross</label>
                    <input
                      type="text"
                      value={item.gross}
                      onChange={(e) => handleItemChange(index, 'gross', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50"
                      placeholder="Gross amount"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {fields.invoice_data.length === 0 && (
          <div className="text-center py-8 text-zinc-500">
            No items added yet. Click "Add Item" to start.
          </div>
        )}

        <div ref={itemsEndRef} />

        {showDeleteModal !== null && (
          <DeleteModal
            open={true}
            onClose={() => setShowDeleteModal(null)}
            onConfirm={() => handleDeleteItem(showDeleteModal)}
            title="Delete Item"
            description={'Are you sure you want to delete this item? This action cannot be undone.'}
          />
        )}
      </div>
    </div>
  );
};

export default EditableFields;
