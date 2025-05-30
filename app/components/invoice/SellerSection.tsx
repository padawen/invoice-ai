import FormInput from '@/app/components/ui/FormInput';
import type { EditableInvoice } from '@/app/types';

interface SellerSectionProps {
  seller: EditableInvoice['seller'];
  onUpdate: (key: string, value: string) => void;
  dirtyFields: Set<string>;
}

const SellerSection: React.FC<SellerSectionProps> = ({
  seller,
  onUpdate,
  dirtyFields
}) => {
  return (
    <div className="pt-4">
      <div className="hidden lg:block">
        <div className="grid grid-cols-2 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
          <div>Company Name</div>
          <div>Address</div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <FormInput
            value={seller?.name || ''}
            onChange={(value) => onUpdate('name', value)}
            placeholder="Company Name"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('seller_name')}
          />
          <FormInput
            value={seller?.address || ''}
            onChange={(value) => onUpdate('address', value)}
            placeholder="Address"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('seller_address')}
          />
        </div>
        
        <div className="grid grid-cols-3 gap-3 mb-2 px-3 py-2 bg-zinc-700/30 rounded-lg text-xs font-medium text-zinc-300">
          <div>Tax ID</div>
          <div>Email</div>
          <div>Phone</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <FormInput
            value={seller?.tax_id || ''}
            onChange={(value) => onUpdate('tax_id', value)}
            placeholder="Tax ID"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('seller_tax_id')}
          />
          <FormInput
            value={seller?.email || ''}
            onChange={(value) => onUpdate('email', value)}
            placeholder="Email"
            type="email"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('seller_email')}
          />
          <FormInput
            value={seller?.phone || ''}
            onChange={(value) => onUpdate('phone', value)}
            placeholder="Phone"
            type="tel"
            className="px-3 py-2 text-sm"
            isDirty={dirtyFields.has('seller_phone')}
          />
        </div>
      </div>

      <div className="lg:hidden space-y-4">
        <FormInput
          value={seller?.name || ''}
          onChange={(value) => onUpdate('name', value)}
          placeholder="Company Name"
          className="w-full"
          isDirty={dirtyFields.has('seller_name')}
        />
        <FormInput
          value={seller?.address || ''}
          onChange={(value) => onUpdate('address', value)}
          placeholder="Address"
          className="w-full"
          isDirty={dirtyFields.has('seller_address')}
        />
        <FormInput
          value={seller?.tax_id || ''}
          onChange={(value) => onUpdate('tax_id', value)}
          placeholder="Tax ID"
          className="w-full"
          isDirty={dirtyFields.has('seller_tax_id')}
        />
        <FormInput
          value={seller?.email || ''}
          onChange={(value) => onUpdate('email', value)}
          placeholder="Email"
          type="email"
          className="w-full"
          isDirty={dirtyFields.has('seller_email')}
        />
        <FormInput
          value={seller?.phone || ''}
          onChange={(value) => onUpdate('phone', value)}
          placeholder="Phone"
          type="tel"
          className="w-full"
          isDirty={dirtyFields.has('seller_phone')}
        />
      </div>
    </div>
  );
};

export default SellerSection; 