'use client';

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import type { InvoiceData, EditableInvoice } from '@/app/types';
import { useDirtyFields } from '@/app/hooks/useDirtyFields';
import CollapsibleSection from '@/app/components/ui/CollapsibleSection';
import SellerSection from '@/app/components/invoice/SellerSection';
import BuyerSection from '@/app/components/invoice/BuyerSection';
import InvoiceDetailsSection from '@/app/components/invoice/InvoiceDetailsSection';
import InvoiceItemsSection from '@/app/components/invoice/InvoiceItemsSection';
import InvoiceSummary from '@/app/components/invoice/InvoiceSummary';

interface Props {
  fields: EditableInvoice;
  onChange: (updated: EditableInvoice) => void;
  onChangesCountUpdate?: (count: number) => void;
}

const EditableFields = ({ fields, onChange, onChangesCountUpdate }: Props) => {
  const [sellerCollapsed, setSellerCollapsed] = useState(false);
  const [buyerCollapsed, setBuyerCollapsed] = useState(false);
  const [invoiceDetailsCollapsed, setInvoiceDetailsCollapsed] = useState(false);
  const [invoiceItemsCollapsed, setInvoiceItemsCollapsed] = useState(false);
  
  const {
    dirtyFields,
    globalDirtyOperations,
    markFieldDirty,
    markItemAdded,
    markItemDeleted,
    clearItemDirtyFields,
    hasDirtyChanges,
    totalChanges
  } = useDirtyFields(fields);

  // Notify parent component when total changes count updates
  useEffect(() => {
    if (onChangesCountUpdate) {
      onChangesCountUpdate(totalChanges);
    }
  }, [totalChanges, onChangesCountUpdate]);

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
    const newIndex = fields.invoice_data.length;
    markItemAdded(newIndex);
    onChange({ 
      ...fields, 
      invoice_data: [...fields.invoice_data, newItem] 
    });
  };

  const deleteItem = (index: number) => {
    markItemDeleted(index);
    clearItemDirtyFields(index);
    const updated = [...fields.invoice_data];
    updated.splice(index, 1);
    onChange({ ...fields, invoice_data: updated });
  };

  if (!fields || !fields.invoice_data) {
    return (
      <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-lg">
        <AlertCircle size={20} />
        <span>Invalid invoice data format.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <CollapsibleSection
        title="Seller Information"
        isCollapsed={sellerCollapsed}
        onToggle={() => setSellerCollapsed(!sellerCollapsed)}
      >
        <SellerSection
          seller={fields.seller}
          onUpdate={updateSellerField}
          dirtyFields={dirtyFields}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Buyer Information"
        isCollapsed={buyerCollapsed}
        onToggle={() => setBuyerCollapsed(!buyerCollapsed)}
      >
        <BuyerSection
          buyer={fields.buyer}
          onUpdate={updateBuyerField}
          dirtyFields={dirtyFields}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Invoice Details"
        isCollapsed={invoiceDetailsCollapsed}
        onToggle={() => setInvoiceDetailsCollapsed(!invoiceDetailsCollapsed)}
      >
        <InvoiceDetailsSection
          fields={{
            invoice_number: fields.invoice_number,
            payment_method: fields.payment_method,
            currency: fields.currency,
            issue_date: fields.issue_date,
            due_date: fields.due_date,
            fulfillment_date: fields.fulfillment_date
          }}
          onUpdate={updateField}
          dirtyFields={dirtyFields}
        />
      </CollapsibleSection>

      <InvoiceItemsSection
        items={fields.invoice_data}
        onUpdateItem={updateItemField}
        onAddItem={addItem}
        onDeleteItem={deleteItem}
        dirtyFields={dirtyFields}
        globalDirtyOperations={globalDirtyOperations}
        isCollapsed={invoiceItemsCollapsed}
        onToggleCollapse={() => setInvoiceItemsCollapsed(!invoiceItemsCollapsed)}
      />

      <InvoiceSummary
        items={fields.invoice_data}
        currency={fields.currency || 'USD'}
        hasDirtyChanges={hasDirtyChanges}
        totalChanges={totalChanges}
      />
    </div>
  );
};

export default EditableFields; 