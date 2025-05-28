'use client';

/* eslint-disable react/no-unescaped-entities */
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AlertCircle, Plus, Trash2, Calculator, ChevronDown, ChevronUp, User, Building, FileText, Package } from 'lucide-react';
import type { InvoiceData, EditableInvoice } from '@/app/types';
import DeleteModal from './modals/DeleteModal';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

let clientSideSupabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

interface Props {
  fields: EditableInvoice;
  onChange: (updated: EditableInvoice) => void;
}

const EditableFields = React.memo(({ fields, onChange }: Props) => {
  const [supabase, setSupabase] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCurrencyTooltip, setShowCurrencyTooltip] = useState<number | null>(null);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    seller: true,
    buyer: true,
    details: true,
    items: true
  });

  // Calculate total price from all gross amounts
  const totalPrice = useMemo(() => {
    return fields.invoice_data.reduce((sum, item) => {
      const grossValue = parseFloat(item.gross.replace(/[^\d.-]/g, '')) || 0;
      return sum + grossValue;
    }, 0);
  }, [fields.invoice_data]);

  // Format total price with currency
  const formattedTotal = useMemo(() => {
    const currency = fields.currency || 'USD';
    return `${currency} ${totalPrice.toFixed(2)}`;
  }, [totalPrice, fields.currency]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!clientSideSupabase) {
        clientSideSupabase = createSupabaseBrowserClient();
      }
      setSupabase(clientSideSupabase);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCurrencyTooltip !== null) {
        const target = event.target as HTMLElement;
        if (!target.closest('.currency-input-container')) {
          setShowCurrencyTooltip(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showCurrencyTooltip]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTopLevelChange = (
    key: keyof Omit<EditableInvoice, 'invoice_data' | 'seller' | 'buyer' | 'id'>,
    value: string
  ) => {
    console.log('handleTopLevelChange:', key, value);
    onChange({ ...fields, [key]: value });
  };

  const handleNestedChange = (
    parent: 'seller' | 'buyer',
    key: string,
    value: string
  ) => {
    console.log('handleNestedChange:', parent, key, value);
    onChange({ ...fields, [parent]: { ...fields[parent], [key]: value } });
  };

  const handleItemChange = (
    index: number,
    key: keyof InvoiceData,
    value: string
  ) => {
    console.log('handleItemChange:', index, key, value);
    const updated = [...fields.invoice_data];
    updated[index][key] = value;
    onChange({ ...fields, invoice_data: updated });
  };

  const handleDeleteItem = (index: number) => {
    // Validate index before proceeding
    if (index < 0 || index >= fields.invoice_data.length) {
      setDeleteError('Invalid item index');
      setShowDeleteModal(null);
      return;
    }

    // Always delete locally - user needs to save to persist changes
    const updated = [...fields.invoice_data];
    updated.splice(index, 1);
    onChange({ ...fields, invoice_data: updated });
    setShowDeleteModal(null);
    setDeleteError(null);
  };

  const handleAddItem = () => {
    onChange({
      ...fields,
      invoice_data: [
        ...fields.invoice_data,
        { name: '', quantity: '', unit_price: '', net: '', gross: '', currency: fields.currency || '' },
      ],
    });
  };

  if (!fields || !fields.invoice_data) {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
        <AlertCircle size={20} />
        <span>Invalid OpenAI response format. Expected an invoice object.</span>
      </div>
    );
  }

  const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    sectionKey, 
    children, 
    badge 
  }: { 
    title: string; 
    icon: React.ComponentType<{ size?: number; className?: string }>; 
    sectionKey: keyof typeof expandedSections; 
    children: React.ReactNode;
    badge?: string;
  }) => (
    <div className="bg-zinc-800/60 rounded-xl shadow-lg border border-zinc-700/60 overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between p-4 sm:p-6 hover:bg-zinc-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-full">
            <Icon size={16} className="text-green-400 sm:w-5 sm:h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-lg sm:text-xl font-bold text-green-400">{title}</h3>
            {badge && (
              <span className="text-xs sm:text-sm text-zinc-400">{badge}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="hidden sm:inline-block px-2 py-1 bg-zinc-700 rounded-full text-xs text-zinc-300">
              {badge}
            </span>
          )}
          {expandedSections[sectionKey] ? (
            <ChevronUp size={20} className="text-zinc-400" />
          ) : (
            <ChevronDown size={20} className="text-zinc-400" />
          )}
        </div>
      </button>
      
      {expandedSections[sectionKey] && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-zinc-700/30">
          {children}
        </div>
      )}
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
    <div className="space-y-4 sm:space-y-6">
      {/* Seller Section */}
      <CollapsibleSection
        title="Seller Information"
        icon={Building}
        sectionKey="seller"
        badge={fields.seller?.name || "No name"}
      >
        <div className="space-y-4 mt-4">
          {/* Row 1: Name and Address */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputField
              label="Company Name"
              value={fields.seller?.name || ''}
              onChange={(value) => handleNestedChange('seller', 'name', value)}
              placeholder="Enter company name"
              required
            />
            
            <InputField
              label="Address"
              value={fields.seller?.address || ''}
              onChange={(value) => handleNestedChange('seller', 'address', value)}
              placeholder="Enter full address"
            />
          </div>
          
          {/* Row 2: Tax ID, Email, Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Tax ID"
              value={fields.seller?.tax_id || ''}
              onChange={(value) => handleNestedChange('seller', 'tax_id', value)}
              placeholder="Tax identification"
            />
            
            <InputField
              label="Email"
              value={fields.seller?.email || ''}
              onChange={(value) => handleNestedChange('seller', 'email', value)}
              placeholder="Contact email"
              type="email"
            />
            
            <InputField
              label="Phone"
              value={fields.seller?.phone || ''}
              onChange={(value) => handleNestedChange('seller', 'phone', value)}
              placeholder="Contact phone"
              type="tel"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Buyer Section */}
      <CollapsibleSection
        title="Buyer Information"
        icon={User}
        sectionKey="buyer"
        badge={fields.buyer?.name || "No name"}
      >
        <div className="space-y-4 mt-4">
          {/* Row 1: Name and Address */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputField
              label="Name"
              value={fields.buyer?.name || ''}
              onChange={(value) => handleNestedChange('buyer', 'name', value)}
              placeholder="Enter buyer name"
            />
            
            <InputField
              label="Address"
              value={fields.buyer?.address || ''}
              onChange={(value) => handleNestedChange('buyer', 'address', value)}
              placeholder="Enter buyer address"
            />
          </div>
          
          {/* Row 2: Tax ID (centered) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div></div> {/* Empty space for centering */}
            <InputField
              label="Tax ID"
              value={fields.buyer?.tax_id || ''}
              onChange={(value) => handleNestedChange('buyer', 'tax_id', value)}
              placeholder="Buyer tax ID"
            />
            <div></div> {/* Empty space for centering */}
          </div>
        </div>
      </CollapsibleSection>

      {/* Invoice Details Section */}
      <CollapsibleSection
        title="Invoice Details"
        icon={FileText}
        sectionKey="details"
        badge={fields.invoice_number || "No number"}
      >
        <div className="space-y-4 mt-4">
          {/* Row 1: Invoice Number and Currency */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InputField
              label="Invoice Number"
              value={fields.invoice_number || ''}
              onChange={(value) => handleTopLevelChange('invoice_number', value)}
              placeholder="Invoice #"
            />
            
            <InputField
              label="Currency"
              value={fields.currency || ''}
              onChange={(value) => handleTopLevelChange('currency', value)}
              placeholder="USD, EUR, HUF..."
            />
          </div>
          
          {/* Row 2: Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InputField
              label="Issue Date"
              value={fields.issue_date || ''}
              onChange={(value) => handleTopLevelChange('issue_date', value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
            
            <InputField
              label="Fulfillment Date"
              value={fields.fulfillment_date || ''}
              onChange={(value) => handleTopLevelChange('fulfillment_date', value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
            
            <InputField
              label="Due Date"
              value={fields.due_date || ''}
              onChange={(value) => handleTopLevelChange('due_date', value)}
              placeholder="YYYY-MM-DD"
              type="date"
            />
          </div>
          
          {/* Row 3: Payment Method (centered) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div></div> {/* Empty space for centering */}
            <InputField
              label="Payment Method"
              value={fields.payment_method || ''}
              onChange={(value) => handleTopLevelChange('payment_method', value)}
              placeholder="Cash, Card, Transfer..."
            />
            <div></div> {/* Empty space for centering */}
          </div>
        </div>
      </CollapsibleSection>

      {/* Items Section */}
      <CollapsibleSection
        title="Invoice Items"
        icon={Package}
        sectionKey="items"
        badge={`${fields.invoice_data.length} item${fields.invoice_data.length !== 1 ? 's' : ''}`}
      >
        <div className="mt-4">
          {deleteError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg mb-4">
              <AlertCircle size={18} />
              <span className="text-sm">{deleteError}</span>
            </div>
          )}

          {/* Table Header */}
          {fields.invoice_data.length > 0 && (
            <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-3 bg-zinc-700/30 rounded-lg mb-4 text-sm font-medium text-zinc-300">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Item Name</div>
              <div className="col-span-1 text-center">Qty</div>
              <div className="col-span-1 text-center">Unit Price</div>
              <div className="col-span-1 text-center">Net</div>
              <div className="col-span-1 text-center">Gross</div>
              <div className="col-span-2 text-center">Currency</div>
              <div className="col-span-1 text-center">Actions</div>
            </div>
          )}

          <div className="space-y-3">
            {fields.invoice_data.map((item, index) => (
              <div 
                key={index} 
                className="bg-zinc-900/80 rounded-lg border border-zinc-700/60 hover:border-green-500/30 transition-colors"
              >
                {/* Desktop Row Layout */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-3 p-4 items-center">
                  {/* Item Number */}
                  <div className="col-span-1 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-full text-green-400 font-medium text-sm">
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Item Name */}
                  <div className="col-span-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-3 py-2 rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
                      placeholder="Item description"
                    />
                  </div>
                  
                  {/* Quantity */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-3 py-2 rounded-md text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
                      placeholder="Qty"
                    />
                  </div>
                  
                  {/* Unit Price */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-3 py-2 rounded-md text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
                      placeholder="Price"
                    />
                  </div>
                  
                  {/* Net Amount */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={item.net}
                      onChange={(e) => handleItemChange(index, 'net', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-3 py-2 rounded-md text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
                      placeholder="Net"
                    />
                  </div>
                  
                  {/* Gross Amount */}
                  <div className="col-span-1">
                    <input
                      type="text"
                      value={item.gross}
                      onChange={(e) => handleItemChange(index, 'gross', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-3 py-2 rounded-md text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
                      placeholder="Gross"
                    />
                  </div>
                  
                  {/* Currency */}
                  <div className="col-span-2 relative currency-input-container">
                    <input
                      type="text"
                      value={item.currency || ''}
                      onChange={(e) => handleItemChange(index, 'currency', e.target.value)}
                      onClick={() => setShowCurrencyTooltip(showCurrencyTooltip === index ? null : index)}
                      className="w-full bg-zinc-800 border border-zinc-700/60 px-3 py-2 rounded-md text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
                      placeholder="Currency"
                    />
                    {showCurrencyTooltip === index && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-zinc-200 text-xs rounded-lg shadow-lg border border-zinc-600 whitespace-nowrap z-10">
                        Overrides invoice currency if set
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Delete Button */}
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(index)}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-md transition-colors"
                      title="Delete item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Mobile/Tablet Card Layout */}
                <div className="lg:hidden p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-base font-medium text-green-400">
                      Item #{index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(index)}
                      className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                      title="Delete item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <InputField
                      label="Item Name"
                      value={item.name}
                      onChange={(value) => handleItemChange(index, 'name', value)}
                      placeholder="Description of item or service"
                    />
                    
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Quantity"
                        value={item.quantity}
                        onChange={(value) => handleItemChange(index, 'quantity', value)}
                        placeholder="Qty"
                      />
                      
                      <InputField
                        label="Unit Price"
                        value={item.unit_price}
                        onChange={(value) => handleItemChange(index, 'unit_price', value)}
                        placeholder="Price per unit"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <InputField
                        label="Net Amount"
                        value={item.net}
                        onChange={(value) => handleItemChange(index, 'net', value)}
                        placeholder="Net total"
                      />
                      
                      <InputField
                        label="Gross Amount"
                        value={item.gross}
                        onChange={(value) => handleItemChange(index, 'gross', value)}
                        placeholder="Gross total"
                      />
                    </div>
                    
                    <div className="relative currency-input-container">
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Item Currency (optional)
                      </label>
                      <input
                        type="text"
                        value={item.currency || ''}
                        onChange={(e) => handleItemChange(index, 'currency', e.target.value)}
                        onClick={() => setShowCurrencyTooltip(showCurrencyTooltip === index ? null : index)}
                        className="w-full bg-zinc-900/70 border border-zinc-700/60 px-3 py-3 sm:px-4 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-colors"
                        placeholder="Override invoice currency"
                      />
                      {showCurrencyTooltip === index && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-800 text-zinc-200 text-xs rounded-lg shadow-lg border border-zinc-600 whitespace-nowrap z-10">
                          Overrides invoice currency if set
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {fields.invoice_data.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Package size={48} className="mx-auto mb-3 text-zinc-600" />
              <p className="text-base">No items added yet</p>
              <p className="text-sm text-zinc-600">Click "Add Item" to start</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-700/30">
            <button
              type="button"
              className="w-full lg:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg flex items-center justify-center gap-2 transition-colors"
              onClick={handleAddItem}
            >
              <Plus size={20} /> Add New Item
            </button>
          </div>

          <div ref={itemsEndRef} />
        </div>
      </CollapsibleSection>

      {/* Total Price Section */}
      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl shadow-lg p-4 sm:p-6 border border-green-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-500/20 rounded-full">
              <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-green-400">Total Amount</h3>
              <p className="text-xs sm:text-sm text-zinc-400">Auto-calculated from gross amounts</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-2xl sm:text-3xl font-bold text-white">{formattedTotal}</div>
            <div className="text-xs sm:text-sm text-zinc-400">
              {fields.invoice_data.length} item{fields.invoice_data.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {fields.invoice_data.length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-500/20">
            <div className="text-xs text-zinc-500 text-center sm:text-left">
              💡 This total updates automatically when you modify gross amounts
            </div>
          </div>
        )}
      </div>

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
  );
});

export default EditableFields;
