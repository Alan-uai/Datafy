
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
    
    const handleToggle = () => {
        const isDefaultActive = activeTheme === 'light' || activeTheme === 'dark';

        if (isDefaultActive) {
            // If default is active, switch to the last used custom theme
            savePreferences({ activeTheme: lastCustomTheme });
        } else {
            // If a custom theme is active, switch to the default mode (light or dark)
            savePreferences({ activeTheme: defaultThemeMode });
        }
    };
    
    const getIconAndTooltip = () => {
        const isDefaultActive = activeTheme === 'light' || activeTheme === 'dark';
        let nextTheme: ThemeName;
        let tooltipText: string;

        if (isDefaultActive) {
            // Currently on a default theme, next will be the last custom theme
            nextTheme = lastCustomTheme;
            tooltipText = `Mudar para tema ${themeLabels[nextTheme]}`;
        } else {
            // Currently on a custom theme, next will be the default mode
            nextTheme = defaultThemeMode;
            tooltipText = `Mudar para tema Padrão (${themeLabels[nextTheme]})`;
        }

        const IconComponent = themeIcons[nextTheme] || Moon;

        return { Icon: <IconComponent className="h-5 w-5" />, tooltip: tooltipText };
    };

    const { Icon, tooltip } = getIconAndTooltip();
    
    // This is a special case for when the user is in "Padrão" mode and just wants to toggle light/dark
    // This happens when the last selected theme in settings *was* "Padrão"
    const isPadrãoModeSelectedInSettings = (lastCustomTheme === 'light' || lastCustomTheme === 'dark' || lastCustomTheme === 'padrão');

    if (isPadrãoModeSelectedInSettings) {
        const nextMode = activeTheme === 'light' ? 'dark' : 'light';
        const NextIcon = nextMode === 'light' ? Sun : Moon;
        
        return (
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => savePreferences({ activeTheme: nextMode })}>
                        <NextIcon className="h-5 w-5" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mudar para tema {themeLabels[nextMode]}</p>
                </TooltipContent>
            </Tooltip>
        );
    }
    
    // Main toggle logic for switching between custom and default
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
