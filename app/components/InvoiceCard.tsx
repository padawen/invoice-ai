'use client';

import { FileText, Trash2, DollarSign } from 'lucide-react';

const normalizeCurrency = (currency: string): string => {
  const currencyMap: Record<string, string> = {
    'ft': 'HUF',
    'Ft': 'HUF',
    'FT': 'HUF',
    'huf': 'HUF',
    'eur': 'EUR',
    'usd': 'USD',
    'gbp': 'GBP',
    '': 'HUF'
  };
  
  return currencyMap[currency] || currency.toUpperCase();
};

interface InvoiceCardProps {
  id: string;
  invoiceNumber: string;
  buyer: string;
  seller: string;
  date: string;
  itemsCount: number;
  totalPrice?: number;
  currency?: string;
  onClick: () => void;
  onDelete: (id: string) => void;
}

const InvoiceCard = ({
  id,
  invoiceNumber,
  buyer,
  seller,
  date,
  itemsCount,
  totalPrice,
  currency = 'HUF',
  onClick,
  onDelete
}: InvoiceCardProps) => {
  const formatPrice = (price: number, curr: string) => {
    const normalizedCurrency = normalizeCurrency(curr);
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalizedCurrency,
        minimumFractionDigits: 2
      }).format(price);
    } catch {
      return `${price.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${normalizedCurrency}`;
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-xl shadow-lg p-6 flex flex-col gap-3 border border-zinc-700 transition-all duration-300 group relative cursor-pointer overflow-hidden hover:border-green-500/50"
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <FileText className="text-green-400" size={20} />
          <span className="text-xl font-semibold truncate text-white">
            Invoice #{invoiceNumber}
          </span>
        </div>
        <button
          className="bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white rounded-full p-2 transition-all duration-300 shadow-md cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          aria-label="Delete invoice"
          title="Delete invoice"
        >
          <Trash2 size={16} />
        </button>
      </div>
      
      <div className="flex flex-col gap-2 text-sm text-zinc-300">
        <div className="flex items-start">
          <span className="font-semibold text-zinc-400 w-16">Buyer:</span>
          <span className="text-white truncate">{buyer}</span>
        </div>
        <div className="flex items-start">
          <span className="font-semibold text-zinc-400 w-16">Seller:</span>
          <span className="text-white truncate">{seller}</span>
        </div>
        <div className="flex items-start">
          <span className="font-semibold text-zinc-400 w-16">Date:</span>
          <span className="text-white">{date}</span>
        </div>
      </div>

      {totalPrice !== undefined && (
        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50 mt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="text-green-400" size={16} />
              <span className="text-sm text-zinc-400 font-medium">Total</span>
            </div>
            <div className="text-lg font-bold text-white">
              {formatPrice(totalPrice, currency)}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="bg-green-400/20 text-green-400 font-medium rounded-full px-3 py-1 text-xs">
            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="text-xs text-zinc-500 italic">Click to edit</div>
      </div>
    </div>
  );
};

export default InvoiceCard; 