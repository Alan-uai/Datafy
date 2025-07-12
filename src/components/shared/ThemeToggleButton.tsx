
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

        // If a custom theme is active, toggle between it and 'dark'
        if (activeTheme !== 'dark' && activeTheme !== 'light') {
            savePreferences({ activeTheme: 'dark' });
        } 
        // If 'dark' is active, toggle to the last custom theme or to 'light'
        else if (activeTheme === 'dark') {
            nextTheme = lastCustomTheme !== 'dark' ? lastCustomTheme : 'light';
            savePreferences({ activeTheme: nextTheme });
        }
        // If 'light' is active, toggle to 'dark'
        else if (activeTheme === 'light') {
             savePreferences({ activeTheme: 'dark' });
        }
    };

    const getIcon = () => {
        if (activeTheme === 'dark') {
            const nextTheme = lastCustomTheme !== 'dark' ? lastCustomTheme : 'light';
            const Icon = themeIcons[nextTheme] || Moon;
            return <Icon className="h-5 w-5" />;
        }
        if (activeTheme === 'light') {
            return <Moon className="h-5 w-5" />;
        }
        // For custom themes, show the Moon to indicate it will toggle back to dark
        const Icon = themeIcons[activeTheme] || Moon;
        return <Moon className="h-5 w-5" />;
    };
    
    const getTooltipText = () => {
       if (activeTheme === 'dark') {
           const nextThemeName = lastCustomTheme !== 'dark' ? lastCustomTheme : 'light';
           const capitalizedThemeName = nextThemeName.charAt(0).toUpperCase() + nextThemeName.slice(1);
           return `Mudar para tema ${capitalizedThemeName}`;
       }
        return `Mudar para tema Padrão (Escuro)`;
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
