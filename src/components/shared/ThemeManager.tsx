
"use client";

import React, { useEffect } from 'react';
import MatrixBackground from '@/components/themes/MatrixBackground';
import DefaultTheme from '@/components/themes/DefaultTheme';
import SummerTheme from '@/components/themes/SummerTheme';
import SpaceTheme from '@/components/themes/SpaceTheme';
import SakuraTheme from '@/components/themes/SakuraTheme';
import DayNightTheme from '@/components/themes/DayNightTheme';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { UserPreferences } from '@/lib/types';

const themeMap: Record<UserPreferences['theme'], React.FC<any>> = {
    'dark': () => null, // No custom component for dark, it uses CSS vars
    'padrão': DefaultTheme,
    'matrix': MatrixBackground,
    'verão': SummerTheme,
    'espaço': SpaceTheme,
    'sakura': SakuraTheme,
    'dia-noite': DayNightTheme,
};

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

  if (!userProfile?.preferences) {
    return null;
  }

  const { theme, matrixMode, matrixSpeed } = userProfile.preferences;
  const ActiveThemeComponent = themeMap[theme] || themeMap['dark'];
  
  const props = theme === 'matrix' ? { key: `${matrixMode}-${matrixSpeed}`, mode: matrixMode, speed: matrixSpeed } : {};

  return <ActiveThemeComponent {...props} />;
};
