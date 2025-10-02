import React, { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import FormInput from '@/app/components/ui/FormInput';
import type { InvoiceData } from '@/app/types';

interface InvoiceItemsSectionProps {
  items: InvoiceData[];
  onUpdateItem: (index: number, key: keyof InvoiceData, value: string) => void;
  onAddItem: () => void;
  onDeleteItem: (index: number) => void;
  dirtyFields: Set<string>;
  globalDirtyOperations: Set<string>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const InvoiceItem = React.memo<{ 
  item: InvoiceData; 
  index: number; 
  onUpdateItem: (index: number, key: keyof InvoiceData, value: string) => void;
  onDeleteItem: (index: number) => void;
  dirtyFields: Set<string>;
  showCurrencyTooltip: number | null;
  setShowCurrencyTooltip: (index: number | null) => void;
}>(({ item, index, onUpdateItem, onDeleteItem, dirtyFields, showCurrencyTooltip, setShowCurrencyTooltip }) => (
  <div className="bg-zinc-900/80 rounded-lg border border-zinc-700/60 hover:border-green-500/30 transition-colors">
    <div className="hidden lg:grid lg:grid-cols-10 gap-2 p-3 items-center">
      <div className="col-span-1 text-center">
        <span className="inline-flex items-center justify-center w-6 h-6 bg-green-500/20 rounded-full text-green-400 font-medium text-xs">
          {index + 1}
        </span>
      </div>
      
      <div className="col-span-3">
        <FormInput
          value={item.name || ''}
          onChange={(value) => onUpdateItem(index, 'name', value)}
          placeholder="Item description"
          className="w-full px-2 py-1.5 text-xs"
          isDirty={dirtyFields.has(`item_${index}_name`)}
        />
      </div>
      
      <div className="col-span-1">
        <FormInput
          value={item.quantity || ''}
          onChange={(value) => onUpdateItem(index, 'quantity', value)}
          placeholder="Qty"
          maxLength={2}
          className="w-full px-1 py-1.5 text-xs text-center"
          isDirty={dirtyFields.has(`item_${index}_quantity`)}
          isNumeric={true}
        />
      </div>
      
      <div className="col-span-1">
        <FormInput
          value={item.unit_price || ''}
          onChange={(value) => onUpdateItem(index, 'unit_price', value)}
          placeholder="Price"
          className="w-full px-1 py-1.5 text-xs text-center"
          isDirty={dirtyFields.has(`item_${index}_unit_price`)}
          isNumeric={true}
        />
      </div>
      
      <div className="col-span-1">
        <FormInput
          value={item.net || ''}
          onChange={(value) => onUpdateItem(index, 'net', value)}
          placeholder="Net"
          className="w-full px-1 py-1.5 text-xs text-center"
          isDirty={dirtyFields.has(`item_${index}_net`)}
          isNumeric={true}
        />
      </div>
      
      <div className="col-span-1">
        <FormInput
          value={item.gross || ''}
          onChange={(value) => onUpdateItem(index, 'gross', value)}
          placeholder="Gross"
          className="w-full px-1 py-1.5 text-xs text-center"
          isDirty={dirtyFields.has(`item_${index}_gross`)}
          isNumeric={true}
        />
      </div>
      
      <div className="col-span-1 relative">
        <FormInput
          value={item.currency || ''}
          onChange={(value) => onUpdateItem(index, 'currency', value)}
          placeholder="CUR"
          maxLength={3}
          className="w-full px-1 py-1.5 text-xs text-center uppercase"
          isDirty={dirtyFields.has(`item_${index}_currency`)}
          onFocus={() => setShowCurrencyTooltip(index)}
          onBlur={() => setTimeout(() => setShowCurrencyTooltip(null), 200)}
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
      
      <div className="col-span-1 text-center">
        <button
          onClick={() => onDeleteItem(index)}
          className="inline-flex items-center justify-center w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded transition-colors cursor-pointer"
          title="Delete item"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>

    <div className="lg:hidden p-3">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 bg-green-500/20 rounded-full text-green-400 font-medium text-sm">
            {index + 1}
          </span>
          <h4 className="text-sm font-medium text-green-400">
            {item.name || `Item #${index + 1}`}
          </h4>
        </div>
        <button
          onClick={() => onDeleteItem(index)}
          className="flex items-center justify-center w-7 h-7 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors cursor-pointer"
          title="Delete item"
        >
          <Trash2 size={14} />
        </button>
      </div>
      
      <div className="space-y-3">
        <FormInput
          value={item.name || ''}
          onChange={(value) => onUpdateItem(index, 'name', value)}
          placeholder="Product/Service Name"
          label="Product/Service Name"
          className="w-full"
          isDirty={dirtyFields.has(`item_${index}_name`)}
        />
        
        <div className="grid grid-cols-1 gap-3">
          <FormInput
            value={item.quantity || ''}
            onChange={(value) => onUpdateItem(index, 'quantity', value)}
            placeholder="Quantity"
            label="Quantity"
            maxLength={2}
            className="w-full"
            isDirty={dirtyFields.has(`item_${index}_quantity`)}
            isNumeric={true}
          />
          <FormInput
            value={item.unit_price || ''}
            onChange={(value) => onUpdateItem(index, 'unit_price', value)}
            placeholder="Unit Price"
            label="Unit Price"
            className="w-full"
            isDirty={dirtyFields.has(`item_${index}_unit_price`)}
            isNumeric={true}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          <FormInput
            value={item.net || ''}
            onChange={(value) => onUpdateItem(index, 'net', value)}
            placeholder="Net Amount"
            label="Net Amount"
            className="w-full"
            isDirty={dirtyFields.has(`item_${index}_net`)}
            isNumeric={true}
          />
          <FormInput
            value={item.gross || ''}
            onChange={(value) => onUpdateItem(index, 'gross', value)}
            placeholder="Gross Total"
            label="Gross Total"
            className="w-full"
            isDirty={dirtyFields.has(`item_${index}_gross`)}
            isNumeric={true}
          />
        </div>
        
        <FormInput
          value={item.currency || ''}
          onChange={(value) => onUpdateItem(index, 'currency', value)}
          placeholder="Currency (e.g. EUR)"
          label="Currency"
          maxLength={3}
          className="w-full uppercase"
          isDirty={dirtyFields.has(`item_${index}_currency`)}
        />
      </div>
    </div>
  </div>
));

InvoiceItem.displayName = 'InvoiceItem';

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  items,
  onUpdateItem,
  onAddItem,
  onDeleteItem,
  dirtyFields,
  globalDirtyOperations,
  isCollapsed,
  onToggleCollapse
}) => {
  const [showCurrencyTooltip, setShowCurrencyTooltip] = useState<number | null>(null);

  return (
    <div className="bg-zinc-800/60 rounded-xl border border-zinc-700/60">
      <div 
        className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-zinc-700/30 transition-colors"
        onClick={onToggleCollapse}
      >
        <h3 className={`text-lg sm:text-xl font-bold transition-colors ${
          globalDirtyOperations.size > 0 ? 'text-orange-400' : 'text-green-400'
        }`}>
          Invoice Items
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">
            {items?.length || 0} items
          </span>
          {globalDirtyOperations.size > 0 && (
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          )}
          <button className="text-green-400 hover:text-green-300 transition-colors cursor-pointer">
            {isCollapsed ? <ChevronDown size={20} className="sm:w-6 sm:h-6" /> : <ChevronUp size={20} className="sm:w-6 sm:h-6" />}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="px-4 pb-4 sm:px-6 sm:pb-6 border-t border-zinc-700/30">
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
            {items && items.map((item, index) => (
              <InvoiceItem key={index} item={item} index={index} onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem} dirtyFields={dirtyFields} showCurrencyTooltip={showCurrencyTooltip} setShowCurrencyTooltip={setShowCurrencyTooltip} />
            ))}
          </div>

          {items && items.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <span className="text-4xl">📋</span>
              <p className="text-base mt-2">No items added yet</p>
              <p className="text-sm text-zinc-600">Click &quot;Add Item&quot; to start</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-zinc-700/30">
            <button
              onClick={onAddItem}
              className="w-full lg:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium shadow-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus size={20} /> Add New Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceItemsSection; 