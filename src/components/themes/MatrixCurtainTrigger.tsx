"use client";

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeAnimation } from '@/contexts/ThemeAnimationContext';

export function MatrixCurtainTrigger() {
  const { currentUser } = useAuth();
  const { triggerMatrixAnimation } = useThemeAnimation();

  useEffect(() => {
    if (currentUser) {
      // Trigger matrix animation when user logs in
      triggerMatrixAnimation();
    }
  }, [currentUser, triggerMatrixAnimation]);

  return null; // This component doesn't render anything, it's just for logic
}
