
"use client";

import { useState, useRef, useCallback } from 'react';
import type { Product } from '@/lib/types';

export function useMultiSelect(longPressDelay: number = 500) {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const movedEnoughRef = useRef(false); // New ref to track significant movement

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
    movedEnoughRef.current = false; // Reset on cancel
  }, []);

  const handleProductPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    // Only start long press detection if not already in multi-select mode
    // This prevents accidental long press leading to multi-select when already in it
    if (isMultiSelectMode) return;

    pointerDownRef.current = { x: event.clientX, y: event.clientY };
    movedEnoughRef.current = false; // Reset at the start of a new press
    const productId = event.currentTarget.dataset.productId; 

    pressTimeoutRef.current = setTimeout(() => {
      // Only activate multi-select if no significant movement occurred
      if (!movedEnoughRef.current) {
        setIsMultiSelectMode(true);
        if (productId) {
            setSelectedProductIds(prev => new Set(prev).add(productId));
        }
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
        movedEnoughRef.current = true; // Mark that significant movement occurred
        cancelPress(); // Cancel the long press timeout
    }
  };

  const handleProductClick = (product: Product, event: React.MouseEvent<HTMLElement>): boolean => {
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
      // If in multi-select mode, the click was used for selection, so indicate it was handled.
      return true; 
    } else {
      // If not in multi-select mode, and it was a drag (movedEnoughRef.current is true),
      // then prevent the default click action (e.g., popover opening) and indicate handled.
      if (movedEnoughRef.current) {
        event.preventDefault(); 
        return true; 
      }
    }
    return false; // Indicate that the click was NOT handled by multi-select logic, let default happen (popover)
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
