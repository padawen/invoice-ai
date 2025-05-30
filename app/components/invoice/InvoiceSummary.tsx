import type { InvoiceData } from '@/app/types';

interface InvoiceSummaryProps {
  items: InvoiceData[];
  currency: string;
  hasDirtyChanges: boolean;
  totalChanges: number;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  items,
  currency,
  hasDirtyChanges,
  totalChanges
}) => {
  const calculateTotalGross = () => {
    if (!items) return 0;
    return items.reduce((total, item) => {
      const gross = parseFloat(item.gross || '0');
      return total + (isNaN(gross) ? 0 : gross);
    }, 0);
  };

  const totalGross = calculateTotalGross();

  return (
    <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-xl border border-green-600/30 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-green-400 mb-2">Invoice Summary</h3>
          <p className="text-sm text-zinc-400">
            {items?.length || 0} items
            {hasDirtyChanges && (
              <span className="text-orange-400 ml-2">
                • {totalChanges} unsaved changes
              </span>
            )}
          </p>
        </div>
        
        <div className="text-left sm:text-right">
          <div className="text-sm text-zinc-400 mb-1">Total Gross Amount</div>
          <div className="text-2xl sm:text-3xl font-bold text-green-400">
            {totalGross.toFixed(2)}
            <span className="text-base sm:text-lg text-zinc-400 ml-2">
              {currency || 'USD'}
            </span>
          </div>
        </div>
      </div>
      
      {hasDirtyChanges && (
        <div className="mt-4 pt-4 border-t border-green-600/20">
          <div className="flex items-center gap-2 text-orange-400">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-sm">You have unsaved changes</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceSummary; 