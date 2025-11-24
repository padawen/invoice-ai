import FormInput from '@/app/components/ui/FormInput';
import type { EditableInvoice } from '@/app/types';
import { Info } from 'lucide-react';

interface InvoiceDetailsSectionProps {
  fields: Pick<EditableInvoice, 'invoice_number' | 'payment_method' | 'currency' | 'issue_date' | 'due_date' | 'fulfillment_date'>;
  onUpdate: (key: string, value: string) => void;
  dirtyFields: Set<string>;
}

const InvoiceDetailsSection: React.FC<InvoiceDetailsSectionProps> = ({
  fields,
  onUpdate,
  dirtyFields
}) => {
  return (
    <div className="pt-4">
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
          <div className="col-span-2">Invoice Number</div>
          <div className="col-span-3">Payment Method</div>
          <div className="flex items-center justify-center gap-1 relative group">
            <span>Currency</span>
            <Info size={12} className="text-zinc-400 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-zinc-700 whitespace-nowrap">
                applies to all invoice items
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3 mb-3">
          <FormInput
            value={fields.invoice_number || ''}
            onChange={(value) => onUpdate('invoice_number', value)}
            placeholder="Invoice Number"
            className="col-span-2 px-3 py-2 text-sm"
            isDirty={dirtyFields.has('field_invoice_number')}
          />
          <FormInput
            value={fields.payment_method || ''}
            onChange={(value) => onUpdate('payment_method', value)}
            placeholder="Payment Method"
            className="col-span-3 px-3 py-2 text-sm"
            isDirty={dirtyFields.has('field_payment_method')}
          />
          <FormInput
            value={fields.currency || ''}
            onChange={(value) => onUpdate('currency', value.toUpperCase())}
            placeholder="Cur"
            maxLength={3}
            className="px-2 py-2 text-xs text-center"
            isDirty={dirtyFields.has('field_currency')}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
          <div>Issue Date</div>
          <div>Due Date</div>
          <div>Fulfillment Date</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <FormInput
            value={fields.issue_date || ''}
            onChange={(value) => onUpdate('issue_date', value)}
            type="date"
            placeholder="Issue Date"
            className="px-2 py-2 text-sm"
            isDirty={dirtyFields.has('field_issue_date')}
          />
          <FormInput
            value={fields.due_date || ''}
            onChange={(value) => onUpdate('due_date', value)}
            type="date"
            placeholder="Due Date"
            className="px-2 py-2 text-sm"
            isDirty={dirtyFields.has('field_due_date')}
          />
          <FormInput
            value={fields.fulfillment_date || ''}
            onChange={(value) => onUpdate('fulfillment_date', value)}
            type="date"
            placeholder="Fulfillment Date"
            className="px-2 py-2 text-sm"
            isDirty={dirtyFields.has('field_fulfillment_date')}
          />
        </div>
      </div>

      <div className="lg:hidden space-y-3">
        <FormInput
          value={fields.invoice_number || ''}
          onChange={(value) => onUpdate('invoice_number', value)}
          placeholder="Invoice Number"
          label="Invoice Number"
          className="w-full"
          isDirty={dirtyFields.has('field_invoice_number')}
        />
        <div className="grid grid-cols-1 gap-3">
          <FormInput
            value={fields.issue_date || ''}
            onChange={(value) => onUpdate('issue_date', value)}
            type="date"
            placeholder="Issue Date"
            label="Issue Date"
            className="w-full"
            isDirty={dirtyFields.has('field_issue_date')}
          />
          <FormInput
            value={fields.due_date || ''}
            onChange={(value) => onUpdate('due_date', value)}
            type="date"
            placeholder="Due Date"
            label="Due Date"
            className="w-full"
            isDirty={dirtyFields.has('field_due_date')}
          />
        </div>
        <FormInput
          value={fields.fulfillment_date || ''}
          onChange={(value) => onUpdate('fulfillment_date', value)}
          type="date"
          placeholder="Fulfillment Date"
          label="Fulfillment Date"
          className="w-full"
          isDirty={dirtyFields.has('field_fulfillment_date')}
        />
        <div className="grid grid-cols-1 gap-3">
          <FormInput
            value={fields.payment_method || ''}
            onChange={(value) => onUpdate('payment_method', value)}
            placeholder="Payment Method"
            label="Payment Method"
            className="w-full"
            isDirty={dirtyFields.has('field_payment_method')}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-zinc-300">Currency</label>
              <div className="relative group">
                <Info size={12} className="text-zinc-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg border border-zinc-700 whitespace-nowrap">
                    applies to all invoice items
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
                  </div>
                </div>
              </div>
            </div>
            <FormInput
              value={fields.currency || ''}
              onChange={(value) => onUpdate('currency', value.toUpperCase())}
              placeholder="Currency"
              maxLength={3}
              className="w-full"
              isDirty={dirtyFields.has('field_currency')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsSection; 