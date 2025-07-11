
"use client";

import { useState, useRef, useCallback } from 'react';
import type { Product } from '@/lib/types';

export function useMultiSelect() {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetSelection = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedProductIds(new Set());
  }, []);

  const handleProductPointerDown = (productId: string) => {
    pressTimeoutRef.current = setTimeout(() => {
      setIsMultiSelectMode(true);
      setSelectedProductIds(prev => new Set(prev).add(productId));
    }, 500); // 500ms for long press
  };

  const handleProductPointerUp = () => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
  };

  const handleProductClick = (product: Product) => {
    if (isMultiSelectMode) {
      setSelectedProductIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(product.id)) {
          newSet.delete(product.id);
        } else {
          newSet.add(product.id);
        }
        
        if (newSet.size === 0) {
          setIsMultiSelectMode(false);
        }
        return newSet;
      });
    }
  };

  return {
    selectedProductIds,
    isMultiSelectMode,
    handleProductPointerDown,
    handleProductPointerUp,
    handleProductClick,
    resetSelection,
  };
}
