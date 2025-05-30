'use client';

/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { AlertCircle, Plus, Trash2, User, Building, FileText, Package, ChevronDown, ChevronUp } from 'lucide-react';
import type { InvoiceData, EditableInvoice } from '@/app/types';

interface Props {
  fields: EditableInvoice;
  onChange: (updated: EditableInvoice) => void;
}

const EditableFields = ({ fields, onChange }: Props) => {
  const [sellerCollapsed, setSellerCollapsed] = useState(false);
  const [buyerCollapsed, setBuyerCollapsed] = useState(false);
  const [invoiceDetailsCollapsed, setInvoiceDetailsCollapsed] = useState(false);
  const [invoiceItemsCollapsed, setInvoiceItemsCollapsed] = useState(false);
  const [showCurrencyTooltip, setShowCurrencyTooltip] = useState<number | null>(null);
  
  // Track original values for comparison
  const [originalValues, setOriginalValues] = useState<EditableInvoice | null>(null);
  
  // Track dirty/unsaved changes
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set());
  const [globalDirtyOperations, setGlobalDirtyOperations] = useState<Set<string>>(new Set());

  // Initialize original values on first render
  React.useEffect(() => {
    if (!originalValues && fields) {
      setOriginalValues(JSON.parse(JSON.stringify(fields)));
    }
  }, [fields, originalValues]);

  const isFieldDirty = (fieldPath: string, currentValue: any) => {
    if (!originalValues) return false;
    
    const pathParts = fieldPath.split('_');
    let originalValue: any = originalValues;
    
    // Navigate to the original value
    for (const part of pathParts) {
      if (!originalValue) return false; // Add safety check
      
      if (part === 'seller' || part === 'buyer') {
        originalValue = originalValue[part];
      } else if (part === 'field') {
        // Skip 'field' prefix for main invoice fields
        continue;
      } else if (part === 'item') {
        // Skip 'item' prefix, next will be the index
        continue;
      } else if (!isNaN(parseInt(part))) {
        // This is an array index
        if (!originalValue.invoice_data || !Array.isArray(originalValue.invoice_data)) {
          return false;
        }
        originalValue = originalValue.invoice_data[parseInt(part)];
      } else {
        originalValue = originalValue?.[part];
      }
    }
    
    return String(currentValue || '') !== String(originalValue || '');
  };

  const markFieldDirty = (fieldPath: string, currentValue: any) => {
    setDirtyFields(prev => {
      const newSet = new Set(prev);
      if (isFieldDirty(fieldPath, currentValue)) {
        newSet.add(fieldPath);
      } else {
        newSet.delete(fieldPath);
      }
      return newSet;
    });
  };

  const clearDirtyField = (fieldPath: string) => {
    setDirtyFields(prev => {
      const newSet = new Set(prev);
      newSet.delete(fieldPath);
      return newSet;
    });
  };

  const clearAllDirty = () => {
    setDirtyFields(new Set());
  };

  const updateField = (key: string, value: string) => {
    markFieldDirty(`field_${key}`, value);
    onChange({ ...fields, [key]: value });
  };

  const updateSellerField = (key: string, value: string) => {
    markFieldDirty(`seller_${key}`, value);
    onChange({ 
      ...fields, 
      seller: { ...fields.seller, [key]: value } 
    });
  };

  const updateBuyerField = (key: string, value: string) => {
    markFieldDirty(`buyer_${key}`, value);
    onChange({ 
      ...fields, 
      buyer: { ...fields.buyer, [key]: value } 
    });
  };

  const updateItemField = (index: number, key: keyof InvoiceData, value: string) => {
    markFieldDirty(`item_${index}_${key}`, value);
    const updated = [...fields.invoice_data];
    updated[index][key] = value;
    onChange({ ...fields, invoice_data: updated });
  };

  const addItem = () => {
    const newItem = { 
      name: '', 
      quantity: '', 
      unit_price: '', 
      net: '', 
      gross: '', 
      currency: '' 
    };
    // Mark adding new item as global dirty operation
    setGlobalDirtyOperations(prev => new Set([...prev, `item_added_${Date.now()}`]));
    onChange({ 
      ...fields, 
      invoice_data: [...fields.invoice_data, newItem] 
    });
  };

  const deleteItem = (index: number) => {
    // Mark deletion as global dirty operation
    setGlobalDirtyOperations(prev => new Set([...prev, `item_deleted_${index}_${Date.now()}`]));
    const updated = [...fields.invoice_data];
    updated.splice(index, 1);
    onChange({ ...fields, invoice_data: updated });
  };

  // Calculate total gross amount
  const calculateTotalGross = () => {
    if (!fields.invoice_data) return 0;
    return fields.invoice_data.reduce((total, item) => {
      const gross = parseFloat(item.gross || '0');
      return total + (isNaN(gross) ? 0 : gross);
    }, 0);
  };

  const totalGross = calculateTotalGross();

  if (!fields || !fields.invoice_data) {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
        <AlertCircle size={20} />
        <span>Invalid invoice data format.</span>
      </div>
    );
  }

  const Section = ({ 
    title, 
    icon: Icon, 
    children
  }: { 
    title: string; 
    icon: React.ComponentType<{ size?: number; className?: string }>; 
    children: React.ReactNode;
  }) => (
    <div className="bg-zinc-800/60 rounded-xl shadow-lg border border-zinc-700/60 overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full">
            <Icon size={16} className="text-green-400 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg sm:text-xl font-bold text-green-400">{title}</h3>
          </div>
        </div>
      </div>
      
      <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-zinc-700/30">
        {children}
      </div>
    </div>
  );

  const InputField = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    required = false,
    type = "text"
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    required?: boolean;
    type?: string;
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900/70 border border-zinc-700/60 px-3 py-3 sm:px-4 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
        placeholder={placeholder}
        required={required}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Seller */}
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/60">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-700/30 transition-colors"
          onClick={() => setSellerCollapsed(!sellerCollapsed)}
        >
          <h3 className="text-xl font-bold text-green-400">Seller Information</h3>
          <button className="text-green-400 hover:text-green-300 transition-colors">
            {sellerCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>
        </div>
        {!sellerCollapsed && (
          <div className="px-6 pb-6 border-t border-zinc-700/30">
            {/* Desktop: Table Layout */}
            <div className="hidden lg:block pt-4">
              {/* First Row: Company Name + Address */}
              <div className="grid grid-cols-2 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
                <div>Company Name</div>
                <div>Address</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={fields.seller?.name || ''}
                  onChange={(e) => updateSellerField('name', e.target.value)}
                  placeholder="Company Name"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('seller_name')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="text"
                  value={fields.seller?.address || ''}
                  onChange={(e) => updateSellerField('address', e.target.value)}
                  placeholder="Address"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('seller_address')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>

              {/* Second Row: Tax ID + Email + Phone */}
              <div className="grid grid-cols-3 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
                <div>Tax ID</div>
                <div>Email</div>
                <div>Phone</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <input
                  type="text"
                  value={fields.seller?.tax_id || ''}
                  onChange={(e) => updateSellerField('tax_id', e.target.value)}
                  placeholder="Tax ID"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('seller_tax_id')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="email"
                  value={fields.seller?.email || ''}
                  onChange={(e) => updateSellerField('email', e.target.value)}
                  placeholder="Email"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('seller_email')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="tel"
                  value={fields.seller?.phone || ''}
                  onChange={(e) => updateSellerField('phone', e.target.value)}
                  placeholder="Phone"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('seller_phone')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>
            </div>

            {/* Mobile: Stacked Layout */}
            <div className="lg:hidden space-y-4 pt-4">
              <input
                type="text"
                value={fields.seller?.name || ''}
                onChange={(e) => updateSellerField('name', e.target.value)}
                placeholder="Company Name"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('seller_name')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <input
                type="text"
                value={fields.seller?.address || ''}
                onChange={(e) => updateSellerField('address', e.target.value)}
                placeholder="Address"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('seller_address')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <input
                type="text"
                value={fields.seller?.tax_id || ''}
                onChange={(e) => updateSellerField('tax_id', e.target.value)}
                placeholder="Tax ID"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('seller_tax_id')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <input
                type="email"
                value={fields.seller?.email || ''}
                onChange={(e) => updateSellerField('email', e.target.value)}
                placeholder="Email"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('seller_email')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <input
                type="tel"
                value={fields.seller?.phone || ''}
                onChange={(e) => updateSellerField('phone', e.target.value)}
                placeholder="Phone"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('seller_phone')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Buyer */}
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/60">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-700/30 transition-colors"
          onClick={() => setBuyerCollapsed(!buyerCollapsed)}
        >
          <h3 className="text-xl font-bold text-green-400">Buyer Information</h3>
          <button className="text-green-400 hover:text-green-300 transition-colors">
            {buyerCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>
        </div>
        {!buyerCollapsed && (
          <div className="px-6 pb-6 border-t border-zinc-700/30">
            {/* Desktop: Table Layout */}
            <div className="hidden lg:block pt-4">
              {/* First Row: Buyer Name + Tax ID */}
              <div className="grid grid-cols-2 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
                <div>Buyer Name</div>
                <div>Tax ID</div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  value={fields.buyer?.name || ''}
                  onChange={(e) => updateBuyerField('name', e.target.value)}
                  placeholder="Buyer Name"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('buyer_name')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="text"
                  value={fields.buyer?.tax_id || ''}
                  onChange={(e) => updateBuyerField('tax_id', e.target.value)}
                  placeholder="Buyer Tax ID"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('buyer_tax_id')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>

              {/* Second Row: Address */}
              <div className="grid grid-cols-1 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
                <div>Address</div>
              </div>
              <div className="grid grid-cols-1 gap-3 mb-4">
                <input
                  type="text"
                  value={fields.buyer?.address || ''}
                  onChange={(e) => updateBuyerField('address', e.target.value)}
                  placeholder="Buyer Address"
                  className={`border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('buyer_address')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>
            </div>

            {/* Mobile: Stacked Layout */}
            <div className="lg:hidden space-y-4 pt-4">
              <input
                type="text"
                value={fields.buyer?.name || ''}
                onChange={(e) => updateBuyerField('name', e.target.value)}
                placeholder="Buyer Name"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('buyer_name')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <input
                type="text"
                value={fields.buyer?.tax_id || ''}
                onChange={(e) => updateBuyerField('tax_id', e.target.value)}
                placeholder="Buyer Tax ID"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('buyer_tax_id')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <input
                type="text"
                value={fields.buyer?.address || ''}
                onChange={(e) => updateBuyerField('address', e.target.value)}
                placeholder="Buyer Address"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('buyer_address')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Invoice Details */}
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/60">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-700/30 transition-colors"
          onClick={() => setInvoiceDetailsCollapsed(!invoiceDetailsCollapsed)}
        >
          <h3 className="text-xl font-bold text-green-400">Invoice Details</h3>
          <button className="text-green-400 hover:text-green-300 transition-colors">
            {invoiceDetailsCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
          </button>
        </div>
        {!invoiceDetailsCollapsed && (
          <div className="px-6 pb-6 border-t border-zinc-700/30">
            {/* Desktop: Single Row Layout with Headers */}
            <div className="hidden lg:block">
              {/* First Row: Invoice Number + Payment Method + Currency */}
              <div className="grid grid-cols-6 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
                <div className="col-span-2">Invoice Number</div>
                <div className="col-span-3">Payment Method</div>
                <div>Currency</div>
              </div>
              <div className="grid grid-cols-6 gap-3 mb-3">
                <input
                  type="text"
                  value={fields.invoice_number || ''}
                  onChange={(e) => updateField('invoice_number', e.target.value)}
                  placeholder="Invoice Number"
                  className={`col-span-2 border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_invoice_number')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="text"
                  value={fields.payment_method || ''}
                  onChange={(e) => updateField('payment_method', e.target.value)}
                  placeholder="Payment Method"
                  className={`col-span-3 border px-3 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_payment_method')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="text"
                  value={fields.currency || ''}
                  onChange={(e) => updateField('currency', e.target.value)}
                  placeholder="CUR"
                  maxLength={3}
                  className={`border px-2 py-2 rounded-lg text-white text-xs text-center uppercase focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_currency')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>

              {/* Second Row: Dates */}
              <div className="grid grid-cols-3 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
                <div>Issue Date</div>
                <div>Due Date</div>
                <div>Fulfillment Date</div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <input
                  type="date"
                  value={fields.issue_date || ''}
                  onChange={(e) => updateField('issue_date', e.target.value)}
                  className={`border px-2 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_issue_date')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="date"
                  value={fields.due_date || ''}
                  onChange={(e) => updateField('due_date', e.target.value)}
                  className={`border px-2 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_due_date')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="date"
                  value={fields.fulfillment_date || ''}
                  onChange={(e) => updateField('fulfillment_date', e.target.value)}
                  className={`border px-2 py-2 rounded-lg text-white text-sm focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_fulfillment_date')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>
            </div>

            {/* Mobile: Grid Layout */}
            <div className="lg:hidden space-y-4">
              <input
                type="text"
                value={fields.invoice_number || ''}
                onChange={(e) => updateField('invoice_number', e.target.value)}
                placeholder="Invoice Number"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('field_invoice_number')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={fields.issue_date || ''}
                  onChange={(e) => updateField('issue_date', e.target.value)}
                  placeholder="Issue Date"
                  className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_issue_date')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="date"
                  value={fields.due_date || ''}
                  onChange={(e) => updateField('due_date', e.target.value)}
                  placeholder="Due Date"
                  className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_due_date')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>
              <input
                type="date"
                value={fields.fulfillment_date || ''}
                onChange={(e) => updateField('fulfillment_date', e.target.value)}
                placeholder="Fulfillment Date"
                className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                  dirtyFields.has('field_fulfillment_date')
                    ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                    : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                }`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={fields.payment_method || ''}
                  onChange={(e) => updateField('payment_method', e.target.value)}
                  placeholder="Payment Method"
                  className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_payment_method')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
                <input
                  type="text"
                  value={fields.currency || ''}
                  onChange={(e) => updateField('currency', e.target.value)}
                  placeholder="Currency"
                  maxLength={3}
                  className={`w-full border px-4 py-3 rounded-lg text-white uppercase focus:outline-none focus:ring-2 transition-colors ${
                    dirtyFields.has('field_currency')
                      ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                      : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Items */}
      <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/60">
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-zinc-700/30 transition-colors"
          onClick={() => setInvoiceItemsCollapsed(!invoiceItemsCollapsed)}
        >
          <h3 className={`text-xl font-bold transition-colors ${
            globalDirtyOperations.size > 0 ? 'text-orange-400' : 'text-green-400'
          }`}>
            Invoice Items
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-400">
              {fields.invoice_data?.length || 0} items
            </span>
            {globalDirtyOperations.size > 0 && (
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            )}
            <button className="text-green-400 hover:text-green-300 transition-colors">
              {invoiceItemsCollapsed ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            </button>
          </div>
        </div>
        
        {!invoiceItemsCollapsed && (
          <div className="px-6 pb-6 border-t border-zinc-700/30">
            {/* Table Header */}
            <div className="hidden lg:grid lg:grid-cols-10 gap-2 px-3 py-2 bg-zinc-700/30 rounded-lg mb-4 mt-4 text-xs font-medium text-zinc-300">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Product/Service</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-1 text-center">Price</div>
              <div className="col-span-1 text-center">Net</div>
              <div className="col-span-1 text-center">Gross</div>
              <div className="col-span-1 text-center">Cur</div>
              <div className="col-span-1 text-center">Del</div>
            </div>

            <div className="space-y-3">
              {fields.invoice_data && fields.invoice_data.map((item, index) => {
                return (
                  <div 
                    key={index} 
                    className="bg-zinc-900/80 rounded-lg border border-zinc-700/60 hover:border-green-500/30 transition-colors"
                  >
                    {/* Desktop Row Layout */}
                    <div className="hidden lg:grid lg:grid-cols-10 gap-2 p-3 items-center">
                      {/* Item Number */}
                      <div className="col-span-1 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500/20 rounded-full text-green-400 font-medium text-xs">
                          {index + 1}
                        </span>
                      </div>
                      
                      {/* Product Name */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => updateItemField(index, 'name', e.target.value)}
                          placeholder="Item description"
                          className={`w-full border px-2 py-1.5 rounded text-white text-xs focus:outline-none focus:ring-1 transition-colors ${
                            dirtyFields.has(`item_${index}_name`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-800 border-zinc-700/60 focus:ring-green-400/50 focus:border-green-400/50'
                          }`}
                        />
                      </div>
                      
                      {/* Quantity */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={item.quantity || ''}
                          onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          maxLength={2}
                          className={`w-full border px-1 py-1.5 rounded text-white text-xs text-center focus:outline-none focus:ring-1 transition-colors ${
                            dirtyFields.has(`item_${index}_quantity`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-800 border-zinc-700/60 focus:ring-green-400/50 focus:border-green-400/50'
                          }`}
                        />
                      </div>
                      
                      {/* Unit Price */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={item.unit_price || ''}
                          onChange={(e) => updateItemField(index, 'unit_price', e.target.value)}
                          placeholder="Price"
                          className={`w-full border px-1 py-1.5 rounded text-white text-xs text-center focus:outline-none focus:ring-1 transition-colors ${
                            dirtyFields.has(`item_${index}_unit_price`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-800 border-zinc-700/60 focus:ring-green-400/50 focus:border-green-400/50'
                          }`}
                        />
                      </div>
                      
                      {/* Net Amount */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={item.net || ''}
                          onChange={(e) => updateItemField(index, 'net', e.target.value)}
                          placeholder="Net"
                          className={`w-full border px-1 py-1.5 rounded text-white text-xs text-center focus:outline-none focus:ring-1 transition-colors ${
                            dirtyFields.has(`item_${index}_net`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-800 border-zinc-700/60 focus:ring-green-400/50 focus:border-green-400/50'
                          }`}
                        />
                      </div>
                      
                      {/* Gross Amount */}
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={item.gross || ''}
                          onChange={(e) => updateItemField(index, 'gross', e.target.value)}
                          placeholder="Gross"
                          className={`w-full border px-1 py-1.5 rounded text-white text-xs text-center focus:outline-none focus:ring-1 transition-colors ${
                            dirtyFields.has(`item_${index}_gross`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-800 border-zinc-700/60 focus:ring-green-400/50 focus:border-green-400/50'
                          }`}
                        />
                      </div>
                      
                      {/* Currency */}
                      <div className="col-span-1 relative">
                        <input
                          type="text"
                          value={item.currency || ''}
                          onChange={(e) => updateItemField(index, 'currency', e.target.value)}
                          onFocus={() => setShowCurrencyTooltip(index)}
                          onBlur={() => setTimeout(() => setShowCurrencyTooltip(null), 200)}
                          placeholder="CUR"
                          maxLength={3}
                          className={`w-full border px-1 py-1.5 rounded text-white text-xs text-center uppercase focus:outline-none focus:ring-1 transition-colors ${
                            dirtyFields.has(`item_${index}_currency`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-800 border-zinc-700/60 focus:ring-green-400/50 focus:border-green-400/50'
                          }`}
                        />
                        {showCurrencyTooltip === index && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
                            <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-zinc-700 whitespace-nowrap">
                              overrides project if filled
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Delete Button */}
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => deleteItem(index)}
                          className="inline-flex items-center justify-center w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Mobile Card Layout */}
                    <div className="lg:hidden p-4">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full text-green-400 font-medium text-sm">
                            {index + 1}
                          </span>
                          <h4 className="text-base font-medium text-green-400">
                            {item.name || `Item #${index + 1}`}
                          </h4>
                        </div>
                        <button
                          onClick={() => deleteItem(index)}
                          className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => updateItemField(index, 'name', e.target.value)}
                          placeholder="Product/Service Name"
                          className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                            dirtyFields.has(`item_${index}_name`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                          }`}
                        />
                        
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={item.quantity || ''}
                            onChange={(e) => updateItemField(index, 'quantity', e.target.value)}
                            placeholder="Quantity"
                            maxLength={2}
                            className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                              dirtyFields.has(`item_${index}_quantity`)
                                ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                                : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                            }`}
                          />
                          <input
                            type="text"
                            value={item.unit_price || ''}
                            onChange={(e) => updateItemField(index, 'unit_price', e.target.value)}
                            placeholder="Unit Price"
                            className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                              dirtyFields.has(`item_${index}_unit_price`)
                                ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                                : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                            }`}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={item.net || ''}
                            onChange={(e) => updateItemField(index, 'net', e.target.value)}
                            placeholder="Net Amount"
                            className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                              dirtyFields.has(`item_${index}_net`)
                                ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                                : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                            }`}
                          />
                          <input
                            type="text"
                            value={item.gross || ''}
                            onChange={(e) => updateItemField(index, 'gross', e.target.value)}
                            placeholder="Gross Total"
                            className={`w-full border px-4 py-3 rounded-lg text-white focus:outline-none focus:ring-2 transition-colors ${
                              dirtyFields.has(`item_${index}_gross`)
                                ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                                : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                            }`}
                          />
                        </div>
                        
                        <input
                          type="text"
                          value={item.currency || ''}
                          onChange={(e) => updateItemField(index, 'currency', e.target.value)}
                          placeholder="Currency (e.g. EUR)"
                          maxLength={3}
                          className={`w-full border px-4 py-3 rounded-lg text-white uppercase focus:outline-none focus:ring-2 transition-colors ${
                            dirtyFields.has(`item_${index}_currency`)
                              ? 'bg-orange-900/70 border-orange-500/60 focus:ring-orange-400/50'
                              : 'bg-zinc-900/70 border-zinc-700/60 focus:ring-green-400/50'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {fields.invoice_data && fields.invoice_data.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                <span className="text-4xl">📋</span>
                <p className="text-base mt-2">No items added yet</p>
                <p className="text-sm text-zinc-600">Click "Add Item" to start</p>
              </div>
            )}
            
            <div className="mt-6 pt-4 border-t border-zinc-700/30">
              <button
                onClick={addItem}
                className="w-full lg:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Plus size={20} /> Add New Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-xl border border-green-600/30 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-green-400 mb-2">Invoice Summary</h3>
            <p className="text-sm text-zinc-400">
              {fields.invoice_data?.length || 0} items
              {(dirtyFields.size > 0 || globalDirtyOperations.size > 0) && (
                <span className="text-orange-400 ml-2">
                  • {dirtyFields.size + globalDirtyOperations.size} unsaved changes
                </span>
              )}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-zinc-400 mb-1">Total Gross Amount</div>
            <div className="text-3xl font-bold text-green-400">
              {totalGross.toFixed(2)}
              <span className="text-lg text-zinc-400 ml-2">
                {fields.currency || 'USD'}
              </span>
            </div>
          </div>
        </div>

        {(dirtyFields.size > 0 || globalDirtyOperations.size > 0) && (
          <div className="mt-4 pt-4 border-t border-green-600/20">
            <div className="flex items-center gap-2 text-orange-400">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="text-sm">You have unsaved changes</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableFields;