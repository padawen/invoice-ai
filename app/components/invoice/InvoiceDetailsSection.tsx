import FormInput from '@/app/components/ui/FormInput';
import type { EditableInvoice } from '@/app/types';

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
          <div>Currency</div>
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
            onChange={(value) => onUpdate('currency', value)}
            placeholder="CUR"
            maxLength={3}
            className="px-2 py-2 text-xs text-center uppercase"
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
          <FormInput
            value={fields.currency || ''}
            onChange={(value) => onUpdate('currency', value)}
            placeholder="Currency"
            label="Currency"
            maxLength={3}
            className="w-full uppercase"
            isDirty={dirtyFields.has('field_currency')}
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsSection; 