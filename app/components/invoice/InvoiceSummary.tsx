import type { InvoiceData } from '@/app/types';
import { Calculator } from 'lucide-react';

interface InvoiceSummaryProps {
  items: InvoiceData[];
  currency: string;
  hasDirtyChanges: boolean;
  totalChanges: number;
  paymentMethod?: string;
  onAddRoundingItem?: (diff: number) => void;
  isUnsaved?: boolean;
}

const InvoiceSummary: React.FC<InvoiceSummaryProps> = ({
  items,
  currency,
  hasDirtyChanges,
  totalChanges,
  paymentMethod,
  onAddRoundingItem,
  isUnsaved
}) => {
  const calculateTotalGross = () => {
    if (!items) return 0;
    return items.reduce((total, item) => {
      const gross = parseFloat(item.gross || '0');
      return total + (isNaN(gross) ? 0 : gross);
    }, 0);
  };

  const totalGross = calculateTotalGross();

  let roundingTarget = 0;
  let roundingLabel = '';

  const hasDecimal = Math.abs(totalGross % 1) > 0.01;

  if (hasDecimal) {
    roundingTarget = Math.ceil(totalGross);
    roundingLabel = 'round up';
  } else {
    roundingTarget = Math.round(totalGross / 5) * 5;
    roundingLabel = '0/5';
  }

  const roundingDiff = parseFloat((roundingTarget - totalGross).toFixed(2));
  const showRoundingButton = Math.abs(roundingDiff) >= 0.01 && onAddRoundingItem;

  return (
    <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-xl border border-green-600/30 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-green-400 mb-2">Invoice Summary</h3>
          <p className="text-sm text-zinc-400">
            {items?.length || 0} items
            {hasDirtyChanges && !isUnsaved && (
              <span className="text-orange-400 ml-2">
                • {totalChanges} unsaved changes
              </span>
            )}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className="text-sm text-zinc-400 mb-1">Total Gross Amount</div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {totalGross.toFixed(2)}
              <span className="text-base sm:text-lg text-zinc-400 ml-2">
                {currency || 'USD'}
              </span>
            </div>

            {showRoundingButton && (
              <button
                onClick={() => onAddRoundingItem && onAddRoundingItem(roundingDiff)}
                className="flex items-center gap-2 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1.5 rounded-full transition-colors cursor-pointer border border-green-500/30"
                title={`Adds a rounding item of ${roundingDiff > 0 ? '+' : ''}${roundingDiff} to reach ${roundingTarget} (${roundingLabel} rounding)`}
              >
                <Calculator size={12} />
                <span>
                  Round to {roundingTarget} ({roundingDiff > 0 ? '+' : ''}{roundingDiff})
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {(hasDirtyChanges || isUnsaved) && (
        <div className="mt-4 pt-4 border-t border-green-600/20">
          <div className="flex items-center gap-2 text-orange-400">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <span className="text-sm">
              {isUnsaved ? "Unsaved Invoice - Open Draft" : "You have unsaved changes"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceSummary;