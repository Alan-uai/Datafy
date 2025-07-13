
"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ThemeAnimationContextType {
  isMatrixCurtainPending: boolean;
  triggerMatrixAnimation: () => void;
  completeMatrixCurtain: () => void;
}

const ThemeAnimationContext = createContext<ThemeAnimationContextType | undefined>(undefined);

export function useThemeAnimation() {
  const context = useContext(ThemeAnimationContext);
  if (context === undefined) {
    throw new Error('useThemeAnimation must be used within a ThemeAnimationProvider');
  }
  return context;
}

export const ThemeAnimationProvider = ({ children }: { children: ReactNode }) => {
  const [isMatrixCurtainPending, setIsMatrixCurtainPending] = useState(false);

  const triggerMatrixAnimation = useCallback(() => {
    setIsMatrixCurtainPending(true);
  }, []);
  
  const completeMatrixCurtain = useCallback(() => {
    setIsMatrixCurtainPending(false);
  }, []);

  const value = {
    isMatrixCurtainPending,
    triggerMatrixAnimation,
    completeMatrixCurtain,
  };

  return (
    <ThemeAnimationContext.Provider value={value}>
      {children}
    </ThemeAnimationContext.Provider>
  );
};
