'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Calendar, DollarSign, Users } from 'lucide-react';

export interface FilterOptions {
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: string;
    max: string;
  };
  buyer: string;
  seller: string;
  searchTerm: string;
}

interface InvoiceFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function InvoiceFilters({ onFilterChange }: InvoiceFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { start: '', end: '' },
    amountRange: { min: '', max: '' },
    buyer: '',
    seller: '',
    searchTerm: '',
  });

  const memoizedOnFilterChange = useCallback(onFilterChange, [onFilterChange]);

  useEffect(() => {
    memoizedOnFilterChange(filters);
  }, [filters, memoizedOnFilterChange]);

  const handleFilterChange = (
    key: keyof FilterOptions, 
    value: string | { start?: string; end?: string } | { min?: string; max?: string }
  ) => {
    if (key === 'buyer' || key === 'seller' || key === 'searchTerm') {
      if (typeof value === 'string') {
        setFilters(prev => ({ ...prev, [key]: value }));
      }
    } else if (key === 'dateRange' && typeof value === 'object') {
      setFilters(prev => ({ 
        ...prev, 
        dateRange: { ...prev.dateRange, ...value as { start?: string; end?: string } }
      }));
    } else if (key === 'amountRange' && typeof value === 'object') {
      setFilters(prev => ({
        ...prev,
        amountRange: { ...prev.amountRange, ...value as { min?: string; max?: string } }
      }));
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      dateRange: { start: '', end: '' },
      amountRange: { min: '', max: '' },
      buyer: '',
      seller: '',
      searchTerm: '',
    };
    setFilters(emptyFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.dateRange.start || 
      filters.dateRange.end || 
      filters.amountRange.min || 
      filters.amountRange.max || 
      filters.buyer || 
      filters.seller
    );
  };

  return (
    <div className="w-full bg-zinc-800/50 backdrop-blur-sm rounded-xl p-4 border border-zinc-700/50 mb-6">
      <div className="flex items-center gap-2 relative">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search invoices..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/70 border border-zinc-700/50 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50"
          />
        </div>
        
        <button
          className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors cursor-pointer ${
            showFilters ? 'bg-green-500/20 text-green-400 border border-green-600/30' : 'bg-zinc-900/70 text-zinc-400 hover:text-white border border-zinc-700/50 hover:border-zinc-600'
          }`}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        
        {hasActiveFilters() && (
          <button
            className="px-3 py-2.5 rounded-lg bg-red-500/20 text-red-400 border border-red-600/30 hover:bg-red-500/30 transition-colors cursor-pointer"
            onClick={clearFilters}
            title="Clear all filters"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-zinc-700/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Calendar size={16} />
              <span>Date Range</span>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => handleFilterChange('dateRange', { start: e.target.value })}
                className="w-full bg-zinc-900/70 border border-zinc-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50"
                placeholder="Start date"
              />
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => handleFilterChange('dateRange', { end: e.target.value })}
                className="w-full bg-zinc-900/70 border border-zinc-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50"
                placeholder="End date"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <DollarSign size={16} />
              <span>Amount Range</span>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="number"
                value={filters.amountRange.min}
                onChange={(e) => handleFilterChange('amountRange', { min: e.target.value })}
                className="w-full bg-zinc-900/70 border border-zinc-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50"
                placeholder="Min amount"
              />
              <input
                type="number"
                value={filters.amountRange.max}
                onChange={(e) => handleFilterChange('amountRange', { max: e.target.value })}
                className="w-full bg-zinc-900/70 border border-zinc-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50"
                placeholder="Max amount"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-medium">
              <Users size={16} />
              <span>Buyer/Seller</span>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={filters.buyer}
                onChange={(e) => handleFilterChange('buyer', e.target.value)}
                className="w-full bg-zinc-900/70 border border-zinc-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50"
                placeholder="Buyer name"
              />
              <input
                type="text"
                value={filters.seller}
                onChange={(e) => handleFilterChange('seller', e.target.value)}
                className="w-full bg-zinc-900/70 border border-zinc-700/50 rounded-lg text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-green-500/50 focus:border-green-500/50"
                placeholder="Seller name"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 