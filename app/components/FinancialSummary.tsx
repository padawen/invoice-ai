'use client';

import { useMemo } from 'react';
import { InvoiceData } from '@/app/types';

interface ProcessedItem {
  id: string;
  invoice_number?: string;
  issue_date?: string;
  buyer_name?: string;
  seller_name?: string;
  raw_data?: InvoiceData[];
  fields?: {
    buyer?: { name: string };
    seller?: { name: string };
    issue_date?: string;
    invoice_number?: string;
    invoice_data?: InvoiceData[];
  };
}

interface SummaryData {
  totalAmount: number;
  monthlyTotals: Record<string, number>;
  quarterlyTotals: Record<string, number>;
  topBuyers: Array<{ name: string; amount: number }>;
  topSellers: Array<{ name: string; amount: number }>;
}

interface FinancialSummaryProps {
  data: ProcessedItem[];
}

export default function FinancialSummary({ data }: FinancialSummaryProps) {
  const summaryData = useMemo(() => {
    const summary: SummaryData = {
      totalAmount: 0,
      monthlyTotals: {},
      quarterlyTotals: {
        Q1: 0, // Jan-Mar
        Q2: 0, // Apr-Jun
        Q3: 0, // Jul-Sep
        Q4: 0, // Oct-Dec
      },
      topBuyers: [],
      topSellers: [],
    };

    // Maps to track totals by entity
    const buyerTotals: Record<string, number> = {};
    const sellerTotals: Record<string, number> = {};
    
    data.forEach(item => {
      // Get invoice items
      const invoiceItems = item.raw_data || item.fields?.invoice_data || [];
      
      // Get invoice date
      const dateString = item.issue_date || item.fields?.issue_date || '';
      const date = new Date(dateString);
      
      // Skip invalid dates
      if (isNaN(date.getTime())) return;
      
      // Format for month key
      const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      
      // Determine quarter
      const quarterNum = Math.floor(date.getMonth() / 3) + 1;
      const quarterKey = `Q${quarterNum}`;
      
      // Get buyer/seller
      const buyer = item.buyer_name || item.fields?.buyer?.name || 'Unknown';
      const seller = item.seller_name || item.fields?.seller?.name || 'Unknown';
      
      // Initialize if needed
      if (!summary.monthlyTotals[month]) {
        summary.monthlyTotals[month] = 0;
      }
      
      if (!buyerTotals[buyer]) {
        buyerTotals[buyer] = 0;
      }
      
      if (!sellerTotals[seller]) {
        sellerTotals[seller] = 0;
      }
      
      // Calculate invoice total
      let invoiceTotal = 0;
      invoiceItems.forEach(invItem => {
        const amount = parseFloat(invItem.gross) || 0;
        invoiceTotal += amount;
      });
      
      // Update totals
      summary.totalAmount += invoiceTotal;
      summary.monthlyTotals[month] += invoiceTotal;
      summary.quarterlyTotals[quarterKey] += invoiceTotal;
      buyerTotals[buyer] += invoiceTotal;
      sellerTotals[seller] += invoiceTotal;
    });
    
    // Convert buyer and seller maps to sorted arrays
    summary.topBuyers = Object.entries(buyerTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    summary.topSellers = Object.entries(sellerTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    
    return summary;
  }, [data]);

  // Get last 6 months only for display
  const recentMonths = useMemo(() => {
    return Object.entries(summaryData.monthlyTotals)
      .sort((a, b) => {
        // Convert month strings back to dates for sorting
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 6);
  }, [summaryData.monthlyTotals]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="w-full bg-zinc-800/50 backdrop-blur-sm rounded-xl p-6 border border-zinc-700/50 mb-8">
      <h2 className="text-xl font-bold text-white mb-6">Financial Summary</h2>
      
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
                    <div className="h-2 bg-green-500/20 rounded-full" style={{ width: `${Math.min(100, (amount / summaryData.totalAmount) * 300)}px` }} />
                    <span className="text-white font-medium">{formatCurrency(amount)}</span>
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
            {Object.entries(summaryData.quarterlyTotals).map(([quarter, amount]) => (
              <div key={quarter} className="flex justify-between items-center">
                <span className="text-zinc-300">{quarter}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-green-500/20 rounded-full" style={{ width: `${Math.min(100, (amount / summaryData.totalAmount) * 300)}px` }} />
                  <span className="text-white font-medium">{formatCurrency(amount)}</span>
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
          <p className="text-2xl font-bold text-white">{formatCurrency(summaryData.totalAmount)}</p>
        </div>
        
        {/* Top Buyer */}
        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50">
          <h4 className="text-zinc-400 text-sm mb-1">Top Buyer</h4>
          {summaryData.topBuyers.length > 0 ? (
            <>
              <p className="text-xl font-bold text-white">{summaryData.topBuyers[0].name}</p>
              <p className="text-green-400">{formatCurrency(summaryData.topBuyers[0].amount)}</p>
            </>
          ) : (
            <p className="text-zinc-400">No data available</p>
          )}
        </div>
        
        {/* Top Seller */}
        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-700/50">
          <h4 className="text-zinc-400 text-sm mb-1">Top Seller</h4>
          {summaryData.topSellers.length > 0 ? (
            <>
              <p className="text-xl font-bold text-white">{summaryData.topSellers[0].name}</p>
              <p className="text-green-400">{formatCurrency(summaryData.topSellers[0].amount)}</p>
            </>
          ) : (
            <p className="text-zinc-400">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
} 