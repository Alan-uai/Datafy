
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
    
    const isDefaultMode = (theme: ThemeName) => ['light', 'dark'].includes(theme);

    const handleToggle = () => {
        let newActiveTheme: ThemeName;

        if (isDefaultMode(activeTheme)) {
            // When in a standard theme (light/dark), the button should toggle to the *other* standard theme.
            newActiveTheme = activeTheme === 'light' ? 'dark' : 'light';
        } else {
            // When in a custom theme, the button should toggle back to the user's preferred standard mode.
            newActiveTheme = defaultThemeMode;
        }
        
        savePreferences({ activeTheme: newActiveTheme });
    };
    
    const getIconAndTooltip = () => {
        let IconComponent: React.FC<{ className?: string }>;
        let tooltipText: string;

        if (isDefaultMode(activeTheme)) {
            // When in a default mode, the icon should represent the *next* theme, which is the other default mode.
            const nextTheme = activeTheme === 'light' ? 'dark' : 'light';
            IconComponent = themeIcons[nextTheme] || Moon;
            tooltipText = `Mudar para tema ${themeLabels[nextTheme]}`;
        } else {
            // When in a custom theme, the icon should represent the default theme we will switch back to.
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
