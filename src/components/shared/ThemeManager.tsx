
"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
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
import CyberpunkTrafficTheme from '@/components/themes/CyberpunkTrafficTheme';
import ChineseLanternsTheme from '@/components/themes/ChineseLanternsTheme';
import LivingOrganismTheme from '@/components/themes/LivingOrganismTheme';
import GenerativeTopographyTheme from '@/components/themes/GenerativeTopographyTheme';
import DynamicWeatherTheme from '@/components/themes/DynamicWeatherTheme';
import FractalExplorerTheme from '@/components/themes/FractalExplorerTheme';
import GlitchscapeTheme from '@/components/themes/GlitchscapeTheme';
import BioluminescentCaveTheme from '@/components/themes/BioluminescentCaveTheme';

// Newly added themes
const InterstellarBlackHoleTheme = dynamic(() => import('@/components/themes/InterstellarBlackHoleTheme'));
const GlitchTheme = dynamic(() => import('@/components/themes/GlitchTheme'));
const UserMediaTheme = dynamic(() => import('@/components/themes/UserMediaTheme'));
const FacebookLikesTheme = dynamic(() => import('@/components/themes/FacebookLikesTheme'));
const GalaxyImpactTheme = dynamic(() => import('@/components/themes/GalaxyImpactTheme'));
const SnowfallTheme = dynamic(() => import('@/components/themes/SnowfallTheme'));
const VampireAestheticTheme = dynamic(() => import('@/components/themes/VampireAestheticTheme'));
const ChocolateFountainTheme = dynamic(() => import('@/components/themes/ChocolateFountainTheme'));
const ZodiacWheelTheme = dynamic(() => import('@/components/themes/ZodiacWheelTheme'));
const CloudSurfingTheme = dynamic(() => import('@/components/themes/CloudSurfingTheme'));
const MysticEyeTheme = dynamic(() => import('@/components/themes/MysticEyeTheme'));


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
    'cyberpunk-traffic': CyberpunkTrafficTheme,
    'chinese-lanterns': ChineseLanternsTheme,
    'living-organism': LivingOrganismTheme,
    'generative-topography': GenerativeTopographyTheme,
    'dynamic-weather': DynamicWeatherTheme,
    'fractal-explorer': FractalExplorerTheme,
    'glitchscape': GlitchscapeTheme,
    'bioluminescent-cave': BioluminescentCaveTheme,
    'interstellar-black-hole': InterstellarBlackHoleTheme,
    'glitch': GlitchTheme,
    'user-media': UserMediaTheme,
    'facebook-likes': FacebookLikesTheme,
    'galaxy-impact': GalaxyImpactTheme,
    'snowfall': SnowfallTheme,
    'vampire-aesthetic': VampireAestheticTheme,
    'chocolate-fountain': ChocolateFountainTheme,
    'zodiac-wheel': ZodiacWheelTheme,
    'cloud-surfing': CloudSurfingTheme,
    'mystic-eye': MysticEyeTheme,
};

export const ThemeManager = () => {
  const { userProfile } = useAuth();
  
  useEffect(() => {
    if (userProfile?.preferences) {
      const { activeTheme, themeConfigs } = userProfile.preferences;
      const activeConfig = themeConfigs[activeTheme] || {};
      const themeAnimation = activeConfig.themeAnimation || 'nenhuma';
      
      const themeClasses = [
        activeTheme,
        themeAnimation !== 'nenhuma' ? `animate-${themeAnimation}` : ''
      ].filter(Boolean).join(' ');

      document.documentElement.className = themeClasses;

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
