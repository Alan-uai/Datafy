
"use client";

import React, { useEffect } from 'react';
import MatrixBackground from '@/components/shared/MatrixBackground';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const ThemeManager = () => {
  const { userProfile } = useAuth();
  
  useEffect(() => {
    if (userProfile?.preferences) {
      const { theme, matrixAnimation } = userProfile.preferences;
      document.documentElement.className = cn(theme, theme === 'matrix' && `animate-${matrixAnimation}`);
    } else {
      // Fallback to dark theme if profile isn't loaded yet
      document.documentElement.className = 'dark';
    }
  }, [userProfile?.preferences]);

  if (!userProfile?.preferences || userProfile.preferences.theme !== 'matrix') {
    return null;
  }

  const { matrixMode, matrixSpeed } = userProfile.preferences;

  return <MatrixBackground key={`${matrixMode}-${matrixSpeed}`} mode={matrixMode} speed={matrixSpeed} />;
};
