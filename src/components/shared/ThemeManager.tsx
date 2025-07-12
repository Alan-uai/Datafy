
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
    diurnoMode?: UserPreferences['diurnoMode'];
    astrologicalEvents?: UserPreferences['astrologicalEvents'];
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

  const { theme, themeAnimation, themeSpeed, themeSize, matrixMode, diurnoMode, astrologicalEvents } = userProfile.preferences;
  const ActiveThemeComponent = themeMap[theme];
  
  const currentMatrixMode = matrixMode || 'padrão';
  const currentDiurnoMode = diurnoMode || false;
  const currentAstrologicalEvents = astrologicalEvents === undefined ? true : astrologicalEvents;


  const key = `${theme}-${themeAnimation}-${themeSpeed}-${themeSize}-${currentMatrixMode}-${currentDiurnoMode}-${currentAstrologicalEvents}`;
  
  const props = {
    animation: themeAnimation,
    speed: themeSpeed,
    size: themeSize,
    matrixMode: theme === 'matrix' ? currentMatrixMode : undefined,
    diurnoMode: theme === 'dia-noite' ? currentDiurnoMode : undefined,
    astrologicalEvents: theme === 'dia-noite' ? currentAstrologicalEvents : undefined,
  };

  return <ActiveThemeComponent key={key} {...props} />;
};
