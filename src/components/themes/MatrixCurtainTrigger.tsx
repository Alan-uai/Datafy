"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeAnimation } from '@/contexts/ThemeAnimationContext';

export function MatrixCurtainTrigger() {
  const { currentUser, loading } = useAuth(); // Get loading state
  const { triggerMatrixAnimation } = useThemeAnimation();

  useEffect(() => {
    // Trigger matrix animation when user logs in AND loading is false
    if (currentUser && !loading) {
      triggerMatrixAnimation();
    }
  }, [currentUser, loading, triggerMatrixAnimation]); // Add loading to dependency array

  return null; // This component doesn't render anything, it's just for logic
}
