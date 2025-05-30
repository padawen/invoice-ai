import FormInput from '@/app/components/ui/FormInput';
import type { EditableInvoice } from '@/app/types';

interface BuyerSectionProps {
  buyer: EditableInvoice['buyer'];
  onUpdate: (key: string, value: string) => void;
  dirtyFields: Set<string>;
}

const BuyerSection: React.FC<BuyerSectionProps> = ({
  buyer,
  onUpdate,
  dirtyFields
}) => {
  return (
    <div className="pt-4">
      <div className="hidden lg:block">
        <div className="grid grid-cols-2 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
          <div>Buyer Name</div>
          <div>Tax ID</div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FormInput
            value={buyer?.name || ''}
            onChange={(value) => onUpdate('name', value)}
            placeholder="Buyer Name"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('buyer_name')}
          />
          <FormInput
            value={buyer?.tax_id || ''}
            onChange={(value) => onUpdate('tax_id', value)}
            placeholder="Buyer Tax ID"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('buyer_tax_id')}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
          <div>Address</div>
        </div>
        <div className="grid grid-cols-1 gap-3 mb-4">
          <FormInput
            value={buyer?.address || ''}
            onChange={(value) => onUpdate('address', value)}
            placeholder="Buyer Address"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('buyer_address')}
          />
        </div>
      </div>
      
      <div className="lg:hidden space-y-4">
        <FormInput
          value={buyer?.name || ''}
          onChange={(value) => onUpdate('name', value)}
          placeholder="Buyer Name"
          className="w-full"
          isDirty={dirtyFields.has('buyer_name')}
        />
        <FormInput
          value={buyer?.tax_id || ''}
          onChange={(value) => onUpdate('tax_id', value)}
          placeholder="Buyer Tax ID"
          className="w-full"
          isDirty={dirtyFields.has('buyer_tax_id')}
        />
        <FormInput
          value={buyer?.address || ''}
          onChange={(value) => onUpdate('address', value)}
          placeholder="Buyer Address"
          className="w-full"
          isDirty={dirtyFields.has('buyer_address')}
        />
      </div>
    </div>
  );
};

export default BuyerSection; 