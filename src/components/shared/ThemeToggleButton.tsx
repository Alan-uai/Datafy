
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

const themeIcons: Record<ThemeName, React.FC<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  matrix: Bot,
  padrão: Moon,
  verão: Sun,
  espaço: Space,
  sakura: Cherry,
  'dia-noite': Moon,
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

    const { activeTheme, lastCustomTheme } = userProfile.preferences;
    
    const handleThemeToggle = () => {
        let nextTheme: ThemeName;

        if (activeTheme === 'dark') {
            // If the last custom theme is set and it's not dark or light, go to it. Otherwise, go to light.
            const customTheme = (lastCustomTheme && lastCustomTheme !== 'dark' && lastCustomTheme !== 'light') ? lastCustomTheme : 'matrix';
            nextTheme = customTheme;
        } else if (activeTheme === 'light') {
             // This case should ideally not be hit if a custom theme is selected, but as a fallback.
            nextTheme = 'dark';
        } else { // Is a custom theme
            // When on a custom theme, always toggle back to dark
            nextTheme = 'dark';
        }
        
        savePreferences({ activeTheme: nextTheme });
    };

    const getIcon = () => {
        let themeForIcon: ThemeName = activeTheme;

        // If the current theme is dark, the icon should represent the *next* theme it will toggle to.
        if (activeTheme === 'dark') {
           const customTheme = (lastCustomTheme && lastCustomTheme !== 'dark' && lastCustomTheme !== 'light') ? lastCustomTheme : 'light';
           themeForIcon = customTheme;
        } else {
            // If on a custom or light theme, the icon should represent toggling back to dark mode.
            return <Moon className="h-5 w-5" />;
        }
        
        const Icon = themeIcons[themeForIcon] || Moon;
        return <Icon className="h-5 w-5" />;
    };
    
    const getTooltipText = () => {
        if (activeTheme === 'dark') {
            const nextThemeName = (lastCustomTheme && lastCustomTheme !== 'dark' && lastCustomTheme !== 'light') ? lastCustomTheme : 'light';
            return `Mudar para tema ${nextThemeName.charAt(0).toUpperCase() + nextThemeName.slice(1)}`;
        }
        return `Mudar para tema Padrão (Escuro)`;
    }

    // Special logic for when the user is in settings and has selected the 'light' theme
    if (activeTheme === 'light') {
        return (
             <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => savePreferences({ activeTheme: 'dark' })}>
                        <Sun className="h-5 w-5" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mudar para tema Padrão (Escuro)</p>
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleThemeToggle}>
                    {getIcon()}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getTooltipText()}</p>
            </TooltipContent>
        </Tooltip>
    );
};
