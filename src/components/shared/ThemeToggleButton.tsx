
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
    
    // Helper to check if a theme is considered a "default mode" (light or dark)
    const isDefaultMode = (theme: ThemeName) => ['light', 'dark'].includes(theme);

    const handleToggle = () => {
        let newActiveTheme: ThemeName;

        if (isDefaultMode(activeTheme)) {
            // Currently in a default theme state. Toggle to the last custom theme if it exists and is not a default theme.
            if (lastCustomTheme && !isDefaultMode(lastCustomTheme)) {
                newActiveTheme = lastCustomTheme;
            } else {
                // Otherwise, just toggle between light and dark
                newActiveTheme = activeTheme === 'light' ? 'dark' : 'light';
            }
        } else {
            // Currently on a custom theme. Toggle back to the user's preferred default mode.
            newActiveTheme = defaultThemeMode;
        }
        
        // If switching away from a custom theme, we don't clear lastCustomTheme.
        // If switching to a custom theme, it's already set from the settings page.
        savePreferences({ activeTheme: newActiveTheme });
    };
    
    const getIconAndTooltip = () => {
        let IconComponent: React.FC<{ className?: string }>;
        let tooltipText: string;

        if (isDefaultMode(activeTheme)) {
            // Currently in default mode. The next action is to switch to a custom theme or the other default theme.
            const nextTheme = (lastCustomTheme && !isDefaultMode(lastCustomTheme)) ? lastCustomTheme : (activeTheme === 'light' ? 'dark' : 'light');
            IconComponent = themeIcons[nextTheme] || Moon;
            tooltipText = `Mudar para tema ${themeLabels[nextTheme]}`;
        } else {
            // Currently in a custom theme. The next action is to switch to the default theme.
            IconComponent = themeIcons[defaultThemeMode] || Moon;
            tooltipText = `Mudar para tema Padrão (${themeLabels[defaultThemeMode]})`;
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
