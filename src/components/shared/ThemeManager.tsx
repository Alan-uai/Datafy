
"use client";

import React, { useEffect } from 'react';
import MatrixBackground from '@/components/themes/MatrixBackground';
import DefaultTheme from '@/components/themes/DefaultTheme';
import SummerTheme from '@/components/themes/SummerTheme';
import SpaceTheme from '@/components/themes/SpaceTheme';
import SakuraTheme from '@/components/themes/SakuraTheme';
import DayNightTheme from '@/components/themes/DayNightTheme';
import DeepOceanTheme from '@/components/themes/DeepOceanTheme';
import SynthwaveSunsetTheme from '@/components/themes/SynthwaveSunsetTheme';
import EnchantedForestTheme from '@/components/themes/EnchantedForestTheme';
import StarfieldWarpTheme from '@/components/themes/StarfieldWarpTheme';
import BlueprintGridTheme from '@/components/themes/BlueprintGridTheme';

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { UserPreferences, ThemeName, ThemeConfig } from '@/lib/types';

interface ThemeComponentProps {
    config: Partial<ThemeConfig>;
}

const themeMap: Record<string, React.FC<any> | null> = {
    'dark': null,
    'light': null,
    'padrão': DefaultTheme,
    'matrix': MatrixBackground,
    'verão': SummerTheme,
    'espaço': SpaceTheme,
    'sakura': SakuraTheme,
    'dia-noite': DayNightTheme,
    'deep-ocean': DeepOceanTheme,
    'synthwave-sunset': SynthwaveSunsetTheme,
    'enchanted-forest': EnchantedForestTheme,
    'starfield-warp': StarfieldWarpTheme,
    'blueprint-grid': BlueprintGridTheme,
};

export const ThemeManager = () => {
  const { userProfile } = useAuth();
  
  useEffect(() => {
    if (userProfile?.preferences) {
      const { activeTheme, themeConfigs } = userProfile.preferences;
      const activeConfig = themeConfigs[activeTheme] || {};
      const themeAnimation = activeConfig.themeAnimation || 'nenhuma';
      
      document.documentElement.className = cn(activeTheme, themeAnimation !== 'nenhuma' && `animate-${themeAnimation}`);
    } else {
      // Fallback to dark theme if profile isn't loaded yet
      document.documentElement.className = 'dark';
    }
  }, [userProfile?.preferences]);

  if (!userProfile?.preferences) {
    return null;
  }

  const { activeTheme, themeConfigs } = userProfile.preferences;
  const ActiveThemeComponent = themeMap[activeTheme];

  if (!ActiveThemeComponent) {
    return null;
  }
  
  const activeConfig = themeConfigs[activeTheme] || {};

  const key = `${activeTheme}-${JSON.stringify(activeConfig)}`;

  return <ActiveThemeComponent key={key} config={activeConfig} />;
};
