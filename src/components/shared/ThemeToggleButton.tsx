
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { ThemeName } from '@/lib/types';
import { Sun, Moon, Bot, Space, Cherry } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const themeIcons: Record<string, React.FC<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  matrix: Bot,
  verão: Sun,
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
    
    const handleThemeToggle = () => {
        let nextTheme: ThemeName;

        const isCustomThemeActive = activeTheme !== 'light' && activeTheme !== 'dark';

        if (isCustomThemeActive) {
            // If a custom theme is active, switch to the configured default theme
            nextTheme = defaultThemeMode;
        } else {
            // If a default theme (light/dark) is active, switch to the last used custom theme.
            // If there's no last custom theme, just toggle between light and dark.
            const customThemeToSwitchTo = (lastCustomTheme !== 'light' && lastCustomTheme !== 'dark') ? lastCustomTheme : 'matrix'; // fallback to matrix
            
            if (activeTheme === defaultThemeMode) {
                 nextTheme = customThemeToSwitchTo;
            } else {
                // This case handles toggling between light/dark when default is selected
                nextTheme = activeTheme === 'light' ? 'dark' : 'light';
            }
        }
        savePreferences({ activeTheme: nextTheme });
    };
    
    const getIcon = () => {
        // The icon should always represent the *next* state.
        const isCustomThemeActive = activeTheme !== 'light' && activeTheme !== 'dark';
        let nextTheme: ThemeName;
        let IconComponent: React.FC<any>;

        if (isCustomThemeActive) {
            // If custom is active, next is the default (light/dark)
            nextTheme = defaultThemeMode;
            IconComponent = themeIcons[nextTheme];
        } else {
             // If default is active, next is the last custom theme or the other default
             if(activeTheme === 'light') {
                IconComponent = themeIcons['dark'];
             } else if (activeTheme === 'dark') {
                IconComponent = themeIcons['light'];
             } else {
                const customTheme = (lastCustomTheme !== 'light' && lastCustomTheme !== 'dark') ? lastCustomTheme : 'matrix';
                IconComponent = themeIcons[customTheme];
             }
        }
        
        // Fallback for safety
        if (!IconComponent) IconComponent = Moon;

        return <IconComponent className="h-5 w-5" />;
    };
    
    const getTooltipText = () => {
       const isCustomThemeActive = activeTheme !== 'light' && activeTheme !== 'dark';
       let nextTheme: ThemeName;
       
       if (isCustomThemeActive) {
           nextTheme = defaultThemeMode;
           return `Mudar para tema Padrão (${themeLabels[nextTheme]})`;
       } else {
           const customTheme = (lastCustomTheme !== 'light' && lastCustomTheme !== 'dark') ? lastCustomTheme : 'matrix';
           if(activeTheme === 'light') return `Mudar para tema Padrão (Escuro)`;
           if(activeTheme === 'dark') return `Mudar para tema Padrão (Claro)`;
           return `Mudar para tema ${themeLabels[customTheme]}`;
       }
    }

    // Special logic for when "Padrão" is the selected option in settings
    const isPadrãoSelected = (activeTheme === 'light' || activeTheme === 'dark');

    const handlePadrãoToggle = () => {
        const nextTheme = activeTheme === 'light' ? 'dark' : 'light';
        savePreferences({ activeTheme: nextTheme, defaultThemeMode: nextTheme });
    }

    if (activeTheme === lastCustomTheme) { // User is on a custom theme
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => savePreferences({ activeTheme: defaultThemeMode })}>
                        <Moon className="h-5 w-5" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mudar para tema Padrão ({themeLabels[defaultThemeMode]})</p>
                </TooltipContent>
            </Tooltip>
        );
    }

    if (isPadrãoSelected) { // User is on light/dark
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => savePreferences({ activeTheme: lastCustomTheme })}>
                        {React.createElement(themeIcons[lastCustomTheme] || Bot, {className: "h-5 w-5"})}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mudar para tema {themeLabels[lastCustomTheme]}</p>
                </TooltipContent>
            </Tooltip>
        );
    }
    
     // Fallback / Initial state
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => savePreferences({ activeTheme: defaultThemeMode })}>
                     <Moon className="h-5 w-5" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Mudar para tema Padrão ({themeLabels[defaultThemeMode]})</p>
            </TooltipContent>
        </Tooltip>
    );
};
