
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { ThemeName } from '@/lib/types';
import { Sun, Moon, Bot, Space, Cherry, Waves } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const themeIcons: Record<string, React.FC<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  matrix: Bot,
  verão: Waves,
  espaço: Space,
  sakura: Cherry,
  'dia-noite': Moon,
  padrão: Moon,
};

const themeLabels: Record<string, string> = {
    light: 'Claro',
    dark: 'Escuro',
    matrix: 'Matrix',
    verão: 'Verão',
    espaço: 'Espaço',
    sakura: 'Sakura',
    'dia-noite': 'Dia/Noite',
    padrão: 'Padrão',
};

export const ThemeToggleButton: React.FC = () => {
    const { userProfile, savePreferences } = useUserProfile();

    if (!userProfile) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Moon className="h-5 w-5" />
            </Button>
        );
    }

    const { activeTheme, lastCustomTheme, defaultThemeMode } = userProfile.preferences;
    
    const isStandardMode = (theme: ThemeName) => ['light', 'dark'].includes(theme);
    const lastThemeWasCustom = !isStandardMode(lastCustomTheme) && lastCustomTheme !== 'padrão';

    const handleToggle = () => {
        let newActiveTheme: ThemeName;

        if (lastThemeWasCustom) {
            // Logic to toggle between standard and last custom theme
            if (isStandardMode(activeTheme)) {
                newActiveTheme = lastCustomTheme;
            } else {
                newActiveTheme = defaultThemeMode;
            }
        } else {
            // Original logic: toggle between light and dark
            newActiveTheme = activeTheme === 'light' ? 'dark' : 'light';
        }
        
        savePreferences({ activeTheme: newActiveTheme });
    };
    
    const getIconAndTooltip = () => {
        let IconComponent: React.FC<{ className?: string }>;
        let tooltipText: string;

        if (lastThemeWasCustom) {
            const nextTheme = isStandardMode(activeTheme) ? lastCustomTheme : defaultThemeMode;
            IconComponent = themeIcons[nextTheme] || Moon;
            tooltipText = `Mudar para tema ${themeLabels[nextTheme]}`;
        } else {
            const nextTheme = activeTheme === 'light' ? 'dark' : 'light';
            IconComponent = themeIcons[nextTheme] || Moon;
            tooltipText = `Mudar para tema ${themeLabels[nextTheme]}`;
        }

        return { Icon: <IconComponent className="h-5 w-5" />, tooltip: tooltipText };
    };

    const { Icon, tooltip } = getIconAndTooltip();

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleToggle}>
                    {Icon}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
        </Tooltip>
    );
};
