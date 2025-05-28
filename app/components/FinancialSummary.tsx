'use client';

import { useMemo, useState } from 'react';
import { InvoiceData } from '@/app/types';

interface ProcessedItem {
  id: string;
  invoice_number?: string;
  issue_date?: string;
  buyer_name?: string;
  seller_name?: string;
  currency?: string;
  raw_data?: InvoiceData[];
  fields?: {
    buyer?: { name: string };
    seller?: { name: string };
    issue_date?: string;
    invoice_number?: string;
    currency?: string;
    invoice_data?: InvoiceData[];
  };
}

interface SummaryData {
  totalAmountByCurrency: Record<string, number>;
  monthlyTotalsByCurrency: Record<string, Record<string, number>>;
  quarterlyTotalsByCurrency: Record<string, Record<string, number>>;
  topBuyers: Array<{ name: string; amount: number; currency: string }>;
  topSellers: Array<{ name: string; amount: number; currency: string }>;
}

interface FinancialSummaryProps {
  data: ProcessedItem[];
}

// Currency normalization function to map common abbreviations to ISO codes
const normalizeCurrency = (currency: string): string => {
  const currencyMap: Record<string, string> = {
    'ft': 'HUF',
    'Ft': 'HUF',
    'FT': 'HUF',
    'huf': 'HUF',
    'eur': 'EUR',
    'usd': 'USD',
    'gbp': 'GBP',
    '': 'HUF' // Default to HUF for empty currency
  };
  
  return currencyMap[currency] || currency.toUpperCase();
};

export default function FinancialSummary({ data }: FinancialSummaryProps) {
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  
  const { summaryData, currencies } = useMemo(() => {
    const summary: SummaryData = {
      totalAmountByCurrency: {},
      monthlyTotalsByCurrency: {},
      quarterlyTotalsByCurrency: {},
      topBuyers: [],
      topSellers: [],
    };

    const buyerTotals: Record<string, Record<string, number>> = {};
    const sellerTotals: Record<string, Record<string, number>> = {};
    const availableCurrencies = new Set<string>();
    
    data.forEach(item => {
      const invoiceItems = item.raw_data || item.fields?.invoice_data || [];
      const invoiceCurrency = item.currency || item.fields?.currency || '';
      
      if (invoiceCurrency) {
        availableCurrencies.add(invoiceCurrency);
      }
      
      const dateString = item.issue_date || item.fields?.issue_date || '';
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return;
      
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      const quarterNum = Math.floor(date.getMonth() / 3) + 1;
      const quarterKey = `Q${quarterNum}`;
      
      const buyer = item.buyer_name || item.fields?.buyer?.name || 'Unknown Buyer';
      const seller = item.seller_name || item.fields?.seller?.name || 'Unknown Seller';
      
      invoiceItems.forEach(invItem => {
        const rawCurrency = invItem.currency || item.currency || item.fields?.currency || 'HUF';
        const currency = normalizeCurrency(rawCurrency);
        availableCurrencies.add(currency);
        
        if (!summary.totalAmountByCurrency[currency]) {
          summary.totalAmountByCurrency[currency] = 0;
        }
        
        if (!summary.monthlyTotalsByCurrency[currency]) {
          summary.monthlyTotalsByCurrency[currency] = {};
        }
        
        if (!summary.quarterlyTotalsByCurrency[currency]) {
          summary.quarterlyTotalsByCurrency[currency] = {
            Q1: 0, Q2: 0, Q3: 0, Q4: 0,
          };
        }
        
        if (!summary.monthlyTotalsByCurrency[currency][month]) {
          summary.monthlyTotalsByCurrency[currency][month] = 0;
        }
        
        if (!buyerTotals[buyer]) {
          buyerTotals[buyer] = {};
        }
        
        if (!buyerTotals[buyer][currency]) {
          buyerTotals[buyer][currency] = 0;
        }
        
        if (!sellerTotals[seller]) {
          sellerTotals[seller] = {};
        }
        
        if (!sellerTotals[seller][currency]) {
          sellerTotals[seller][currency] = 0;
        }
        
        const amount = parseFloat(invItem.gross) || 0;
        
        summary.totalAmountByCurrency[currency] += amount;
        summary.monthlyTotalsByCurrency[currency][month] += amount;
        summary.quarterlyTotalsByCurrency[currency][quarterKey] += amount;
        buyerTotals[buyer][currency] += amount;
        sellerTotals[seller][currency] += amount;
      });
    });
    
    const topBuyersByCurrency: Record<string, Array<{ name: string; amount: number; currency: string }>> = {};
    
    Object.entries(buyerTotals).forEach(([buyer, currencyAmounts]) => {
      Object.entries(currencyAmounts).forEach(([currency, amount]) => {
        if (!topBuyersByCurrency[currency]) {
          topBuyersByCurrency[currency] = [];
        }
        
        topBuyersByCurrency[currency].push({
          name: buyer,
          amount,
          currency
        });
      });
    });
    
    const topSellersByCurrency: Record<string, Array<{ name: string; amount: number; currency: string }>> = {};
    
    Object.entries(sellerTotals).forEach(([seller, currencyAmounts]) => {
      Object.entries(currencyAmounts).forEach(([currency, amount]) => {
        if (!topSellersByCurrency[currency]) {
          topSellersByCurrency[currency] = [];
        }
        
        topSellersByCurrency[currency].push({
          name: seller,
          amount,
          currency
        });
      });
    });
    
    Object.keys(topBuyersByCurrency).forEach(currency => {
      topBuyersByCurrency[currency].sort((a, b) => b.amount - a.amount);
    });
    
    Object.keys(topSellersByCurrency).forEach(currency => {
      topSellersByCurrency[currency].sort((a, b) => b.amount - a.amount);
    });
    
    summary.topBuyers = Object.values(topBuyersByCurrency)
      .flatMap(buyers => buyers.slice(0, 5));
    
    summary.topSellers = Object.values(topSellersByCurrency)
      .flatMap(sellers => sellers.slice(0, 5));
    
    return {
      summaryData: summary,
      currencies: Array.from(availableCurrencies).sort()
    };
  }, [data]);
  
  const displayCurrency = selectedCurrency || currencies[0] || 'USD';
  
  const recentMonths = useMemo(() => {
    if (!summaryData.monthlyTotalsByCurrency[displayCurrency]) {
      return [];
    }
    
    return Object.entries(summaryData.monthlyTotalsByCurrency[displayCurrency])
      .sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 6);
  }, [summaryData.monthlyTotalsByCurrency, displayCurrency]);

  const formatCurrency = (amount: number, currency: string) => {
    const normalizedCurrency = normalizeCurrency(currency);
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: normalizedCurrency,
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      // Fallback for invalid currency codes
      console.warn(`Invalid currency code: ${currency}, falling back to number format`);
      return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${normalizedCurrency}`;
    }
  };

  const totalForCurrency = summaryData.totalAmountByCurrency[displayCurrency] || 0;
  const quarterlyTotals = summaryData.quarterlyTotalsByCurrency[displayCurrency] || {};
  
  const topBuyersForCurrency = summaryData.topBuyers
    .filter(buyer => buyer.currency === displayCurrency)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  
  const topSellersForCurrency = summaryData.topSellers
    .filter(seller => seller.currency === displayCurrency)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="w-full bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Financial Summary</h2>
        
        {currencies.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Currency:</span>
            <select 
              value={displayCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="bg-zinc-700 text-white px-3 py-1 rounded-md border border-zinc-600"
            >
              {currencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monthly Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400 mb-3">Monthly Totals</h3>
          {recentMonths.length > 0 ? (
            <div className="space-y-2">
              {recentMonths.map(([month, amount]) => (
                <div key={month} className="flex justify-between items-center">
                  <span className="text-zinc-300">{month}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-green-500/20 rounded-full" style={{ width: `${Math.min(100, (amount / totalForCurrency) * 300)}px` }} />
                    <span className="text-white font-medium">{formatCurrency(amount, displayCurrency)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-400">No monthly data available</p>
          )}
        </div>
        
        {/* Quarterly Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-green-400 mb-3">Quarterly Totals</h3>
          <div className="space-y-2">
            {Object.entries(quarterlyTotals).map(([quarter, amount]) => (
              <div key={quarter} className="flex justify-between items-center">
                <span className="text-zinc-300">{quarter}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-green-500/20 rounded-full" style={{ width: `${Math.min(100, (amount / totalForCurrency) * 300)}px` }} />
                  <span className="text-white font-medium">{formatCurrency(amount, displayCurrency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-zinc-700/30 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total */}
        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50">
          <h4 className="text-zinc-400 text-sm mb-1">Total Invoice Amount</h4>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalForCurrency, displayCurrency)}</p>
        </div>
        
        {/* Top Buyer */}
        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50">
          <h4 className="text-zinc-400 text-sm mb-1">Top Buyer</h4>
          {topBuyersForCurrency.length > 0 ? (
            <>
              <p className="text-xl font-bold text-white">{topBuyersForCurrency[0].name}</p>
              <p className="text-green-400">{formatCurrency(topBuyersForCurrency[0].amount, displayCurrency)}</p>
            </>
          ) : (
            <p className="text-zinc-400">No data available</p>
          )}
        </div>
        
        {/* Top Seller */}
        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50">
          <h4 className="text-zinc-400 text-sm mb-1">Top Seller</h4>
          {topSellersForCurrency.length > 0 ? (
            <>
              <p className="text-xl font-bold text-white">{topSellersForCurrency[0].name}</p>
              <p className="text-green-400">{formatCurrency(topSellersForCurrency[0].amount, displayCurrency)}</p>
            </>
          ) : (
            <p className="text-zinc-400">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
} 