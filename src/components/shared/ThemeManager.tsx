
"use client";

import React, { useEffect } from 'react';
import MatrixBackground from '@/components/themes/MatrixBackground';
import DefaultTheme from '@/components/themes/DefaultTheme';
import SummerTheme from '@/components/themes/SummerTheme';
import SpaceTheme from '@/components/themes/SpaceTheme';
import SakuraTheme from '@/components/themes/SakuraTheme';
import DayNightTheme from '@/components/themes/DayNightTheme';
import DeepOceanTheme from '@/components/themes/DeepOceanTheme';
import EnchantedForestTheme from '@/components/themes/EnchantedForestTheme';
import StarfieldWarpTheme from '@/components/themes/StarfieldWarpTheme';
import GalacticJourneyTheme from '@/components/themes/GalacticJourneyTheme';
import FloatingLanternsTheme from '@/components/themes/FloatingLanternsTheme';
import CyberpunkCityTheme from '@/components/themes/CyberpunkCityTheme';
import LivingWatercolorTheme from '@/components/themes/LivingWatercolorTheme';
import ParticlePlexusTheme from '@/components/themes/ParticlePlexusTheme';
import ShiftingSandsTheme from '@/components/themes/ShiftingSandsTheme';

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
    'enchanted-forest': EnchantedForestTheme,
    'starfield-warp': StarfieldWarpTheme,
    'galactic-journey': GalacticJourneyTheme,
    'floating-lanterns': FloatingLanternsTheme,
    'cyberpunk-city': CyberpunkCityTheme,
    'living-watercolor': LivingWatercolorTheme,
    'particle-plexus': ParticlePlexusTheme,
    'shifting-sands': ShiftingSandsTheme,
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
