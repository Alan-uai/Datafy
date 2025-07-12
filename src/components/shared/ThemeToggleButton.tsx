
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
            const customTheme = lastCustomTheme !== 'dark' && lastCustomTheme !== 'light' ? lastCustomTheme : 'matrix';
            nextTheme = customTheme;
        } else if (activeTheme === 'light') {
            nextTheme = 'dark';
        } else { // Is a custom theme
            nextTheme = 'dark';
        }
        
        savePreferences({ activeTheme: nextTheme });
    };

    const getIcon = () => {
        let themeForIcon = activeTheme;

        // Special logic for the toggle behavior
        if (activeTheme === 'dark') {
            const customTheme = lastCustomTheme !== 'dark' && lastCustomTheme !== 'light' ? lastCustomTheme : 'matrix';
            // When dark, the *next* icon is the custom one
            themeForIcon = customTheme;
        } else {
            // When light or custom, the *next* icon is the moon
            return <Moon className="h-5 w-5" />;
        }
        
        const Icon = themeIcons[themeForIcon] || Moon;
        return <Icon className="h-5 w-5" />;
    };
    
    const getTooltipText = () => {
        if (activeTheme === 'dark') {
            const customThemeName = lastCustomTheme.charAt(0).toUpperCase() + lastCustomTheme.slice(1);
            return `Mudar para tema ${customThemeName}`;
        }
        return `Mudar para tema Padrão`;
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
