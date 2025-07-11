
"use client";

import { useState, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { addDays, isSameDay, startOfDay, isPast, isWithinInterval, startOfMonth, endOfMonth, addMonths, isToday } from 'date-fns';

const filterOptions = ['all', 'today', 'expired', 'next7', 'next14', 'thisMonth', 'nextMonth'] as const;
export type FilterType = typeof filterOptions[number];

export function useProductTableControls(products: Product[]) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<keyof Product | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredProducts = useMemo(() => {
    let tempProducts = [...products];

    // Search filter
    if (searchQuery) {
      tempProducts = tempProducts.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Date filter
    const today = startOfDay(new Date());
    switch (activeFilter) {
      case 'today':
        tempProducts = tempProducts.filter(p => isSameDay(startOfDay(p.expiryDate), today));
        break;
      case 'expired':
        tempProducts = tempProducts.filter(p => isPast(p.expiryDate) && !isToday(startOfDay(p.expiryDate)));
        break;
      case 'next7':
        tempProducts = tempProducts.filter(p => isWithinInterval(p.expiryDate, { start: today, end: addDays(today, 7) }));
        break;
      case 'next14':
        tempProducts = tempProducts.filter(p => isWithinInterval(p.expiryDate, { start: today, end: addDays(today, 14) }));
        break;
      case 'thisMonth':
        tempProducts = tempProducts.filter(p => isWithinInterval(p.expiryDate, { start: startOfMonth(today), end: endOfMonth(today) }));
        break;
      case 'nextMonth':
        tempProducts = tempProducts.filter(p => isWithinInterval(p.expiryDate, { start: startOfMonth(addMonths(today, 1)), end: endOfMonth(addMonths(today, 1)) }));
        break;
      case 'all':
      default:
        // No date filter needed for 'all'
        break;
    }

    // Sorting
    if (sortKey) {
      tempProducts.sort((a, b) => {
        const valA = a[sortKey as keyof Product];
        const valB = b[sortKey as keyof Product];
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return tempProducts;
  }, [products, searchQuery, activeFilter, sortKey, sortDirection]);

  const handleSort = (key: keyof Product) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortKey,
    sortDirection,
    handleSort,
    filteredProducts
  };
}
