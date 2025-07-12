
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
import type { UserPreferences, ThemeName } from '@/lib/types';

interface ThemeComponentProps {
    animation: UserPreferences['themeAnimation'];
    speed: UserPreferences['themeSpeed'];
    size: UserPreferences['themeSize'];
    matrixMode?: UserPreferences['matrixMode'];
}

const themeMap: Record<ThemeName, React.FC<any>> = {
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
      const { theme, themeAnimation } = userProfile.preferences;
      document.documentElement.className = cn(theme, themeAnimation !== 'nenhuma' && `animate-${themeAnimation}`);
    } else {
      // Fallback to dark theme if profile isn't loaded yet
      document.documentElement.className = 'dark';
    }
  }, [userProfile?.preferences]);

  if (!userProfile?.preferences || userProfile.preferences.theme === 'dark') {
    return null;
  }

  const { theme, themeAnimation, themeSpeed, themeSize, matrixMode } = userProfile.preferences;
  const ActiveThemeComponent = themeMap[theme];
  
  // Ensure matrixMode is a defined string for the key and prop, defaulting to 'padrão'
  const currentMatrixMode = matrixMode || 'padrão';

  const key = `${theme}-${themeAnimation}-${themeSpeed}-${themeSize}-${currentMatrixMode}`;
  const props = {
    animation: themeAnimation,
    speed: themeSpeed,
    size: themeSize,
    matrixMode: theme === 'matrix' ? currentMatrixMode : undefined, // Only pass matrixMode if theme is matrix
  };

  return <ActiveThemeComponent key={key} {...props} />;
};
