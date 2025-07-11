
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Palette, Bot, Sparkles, Film, SlidersHorizontal, Sun, Moon, Space, Cherry } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import type { UserPreferences } from '@/lib/types';

const THEME_OPTIONS = [
    { value: 'dark', label: 'Padrão', icon: Palette },
    { value: 'matrix', label: 'Matrix', icon: Bot },
    { value: 'verão', label: 'Verão', icon: Sun },
    { value: 'espaço', label: 'Espaço', icon: Space },
    { value: 'sakura', label: 'Sakura', icon: Cherry },
    { value: 'dia-noite', label: 'Dia/Noite', icon: Moon },
] as const;

type ThemeValue = typeof THEME_OPTIONS[number]['value'];

interface ThemeSettingsProps {
    preferences: UserPreferences;
    onPreferencesChange: (newPreferences: Partial<UserPreferences>) => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ preferences, onPreferencesChange }) => {
    const [currentTheme, setCurrentTheme] = useState<ThemeValue>(preferences.theme as ThemeValue);
    const [currentAnimation, setCurrentAnimation] = useState(preferences.matrixAnimation);
    const [currentMatrixMode, setCurrentMatrixMode] = useState(preferences.matrixMode);
    const [currentMatrixSpeed, setCurrentMatrixSpeed] = useState(preferences.matrixSpeed);

    useEffect(() => {
        setCurrentTheme(preferences.theme as ThemeValue);
        setCurrentAnimation(preferences.matrixAnimation);
        setCurrentMatrixMode(preferences.matrixMode);
        setCurrentMatrixSpeed(preferences.matrixSpeed);
    }, [preferences]);

    const handleThemeChange = (theme: ThemeValue) => {
        setCurrentTheme(theme);
        onPreferencesChange({ theme });
        document.documentElement.className = cn(theme, theme === 'matrix' && `animate-${currentAnimation}`);
    };

    const handleAnimationChange = (animation: 'cintilar' | 'girar') => {
        if (currentTheme !== 'matrix') return;
        setCurrentAnimation(animation);
        onPreferencesChange({ matrixAnimation: animation });
        document.documentElement.className = cn(currentTheme, `animate-${animation}`);
    };

    const handleMatrixModeChange = (mode: 'padrão' | 'merge') => {
        setCurrentMatrixMode(mode);
        onPreferencesChange({ matrixMode: mode });
    };
  
    const handleSpeedChange = (value: number[]) => {
        const newSpeed = value[0];
        setCurrentMatrixSpeed(newSpeed);
        onPreferencesChange({ matrixSpeed: newSpeed });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tema Visual</CardTitle>
                <CardDescription>Mude o esquema de cores e os efeitos do aplicativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <RadioGroup
                    value={currentTheme}
                    onValueChange={(value) => handleThemeChange(value as ThemeValue)}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                    {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                        <div key={value}>
                            <RadioGroupItem value={value} id={`theme-${value}`} className="peer sr-only" />
                            <Label
                            htmlFor={`theme-${value}`}
                            className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-24"
                            >
                            <Icon className="mb-2 h-6 w-6" />
                            {label}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>

                {currentTheme === 'matrix' && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-6 border-t space-y-8"
                    >
                        <div>
                            <Label className="text-base font-medium">Modo do Tema Matrix</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                                Padrão usa 2 camadas para melhor performance, Merge usa 1 camada para um efeito mesclado.
                            </p>
                            <RadioGroup
                            value={currentMatrixMode}
                            onValueChange={(value) => handleMatrixModeChange(value as 'padrão' | 'merge')}
                            className="flex flex-col sm:flex-row gap-4"
                            >
                                <div className="flex-1">
                                    <RadioGroupItem value="padrão" id="mode-padrão" className="peer sr-only" />
                                    <Label htmlFor="mode-padrão" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <Sparkles className="mb-3 h-6 w-6" /> Padrão (2 Canvas)
                                    </Label>
                                </div>
                                <div className="flex-1">
                                    <RadioGroupItem value="merge" id="mode-merge" className="peer sr-only" />
                                    <Label htmlFor="mode-merge" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                        <Bot className="mb-3 h-6 w-6" /> Merge (1 Canvas)
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        
                        <div>
                            <Label className="text-base font-medium">Animação de Borda (Matrix)</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                            Escolha o efeito visual para as bordas dos componentes no tema Matrix.
                            </p>
                            <RadioGroup
                            value={currentAnimation}
                            onValueChange={(value) => handleAnimationChange(value as 'cintilar' | 'girar')}
                            className="flex flex-col sm:flex-row gap-4"
                            >
                            <div className="flex-1">
                                <RadioGroupItem value="cintilar" id="anim-cintilar" className="peer sr-only" />
                                <Label 
                                htmlFor="anim-cintilar" 
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                <Sparkles className="mb-3 h-6 w-6" />
                                Cintilar
                                </Label>
                            </div>
                            <div className="flex-1">
                                <RadioGroupItem value="girar" id="anim-girar" className="peer sr-only" />
                                <Label 
                                htmlFor="anim-girar" 
                                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                >
                                    <Film className="mb-3 h-6 w-6" />
                                    Girar
                                </Label>
                            </div>
                            </RadioGroup>
                        </div>

                        <div>
                            <Label htmlFor="speed-slider" className="text-base font-medium">Velocidade da Animação de Fundo</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                                Ajuste a velocidade da "chuva digital".
                            </p>
                            <div className="flex items-center gap-4">
                               <SlidersHorizontal className="h-5 w-5 text-muted-foreground"/>
                               <Slider
                                 id="speed-slider"
                                 min={1}
                                 max={100}
                                 step={1}
                                 value={[currentMatrixSpeed]}
                                 onValueChange={handleSpeedChange}
                               />
                               <span className="text-sm font-mono w-12 text-center">{currentMatrixSpeed}%</span>
                            </div>
                        </div>
                    </motion.div>
                  )}
            </CardContent>
        </Card>
    );
};
