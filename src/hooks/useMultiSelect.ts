
"use client";

import { useState, useRef, useCallback } from 'react';
import type { Product } from '@/lib/types';

export function useMultiSelect(longPressDelay: number = 500) {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const resetSelection = useCallback(() => {
    setIsMultiSelectMode(false);
    setSelectedProductIds(new Set());
  }, []);

  const cancelPress = useCallback(() => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    pointerDownRef.current = null;
  }, []);

  const handleProductPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    pointerDownRef.current = { x: event.clientX, y: event.clientY };
    const productId = event.currentTarget.dataset.productId; 

    pressTimeoutRef.current = setTimeout(() => {
      setIsMultiSelectMode(true);
      if (productId) {
          setSelectedProductIds(prev => new Set(prev).add(productId));
      }
      pressTimeoutRef.current = null; // Clear after firing
    }, longPressDelay);
  };

  const handleProductPointerUp = () => {
    cancelPress();
  };
  
  const handleProductPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!pointerDownRef.current) return;
    
    const threshold = 10; // 10px movement threshold to cancel
    const dx = Math.abs(event.clientX - pointerDownRef.current.x);
    const dy = Math.abs(event.clientY - pointerDownRef.current.y);
    
    if (dx > threshold || dy > threshold) {
        cancelPress();
    }
  };

  const handleProductClick = (product: Product, event: React.MouseEvent<HTMLElement>) => {
    if (isMultiSelectMode) {
      // Prevent click from propagating when in multi-select mode
      event.preventDefault(); 
      event.stopPropagation();

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
    handleProductPointerMove,
    handleProductClick,
    resetSelection,
  };
}
