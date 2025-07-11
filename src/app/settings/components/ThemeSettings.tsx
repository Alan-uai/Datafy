
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Palette, Bot, Sparkles, Film, SlidersHorizontal, Sun, Moon, Space, Cherry, Text, Ruler } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import type { UserPreferences, ThemeName } from '@/lib/types';

const THEME_OPTIONS = [
    { value: 'dark', label: 'Padrão', icon: Palette },
    { value: 'matrix', label: 'Matrix', icon: Bot },
    { value: 'verão', label: 'Verão', icon: Sun },
    { value: 'espaço', label: 'Espaço', icon: Space },
    { value: 'sakura', label: 'Sakura', icon: Cherry },
    { value: 'dia-noite', label: 'Dia/Noite', icon: Moon },
] as const;


interface ThemeSettingsProps {
    preferences: UserPreferences;
    onPreferencesChange: (newPreferences: Partial<UserPreferences>) => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ preferences, onPreferencesChange }) => {
    const [currentTheme, setCurrentTheme] = useState<ThemeName>(preferences.theme);
    const [currentAnimation, setCurrentAnimation] = useState(preferences.themeAnimation);
    const [currentThemeSpeed, setCurrentThemeSpeed] = useState(preferences.themeSpeed);
    const [currentThemeSize, setCurrentThemeSize] = useState(preferences.themeSize);

    useEffect(() => {
        setCurrentTheme(preferences.theme);
        setCurrentAnimation(preferences.themeAnimation);
        setCurrentThemeSpeed(preferences.themeSpeed);
        setCurrentThemeSize(preferences.themeSize);
    }, [preferences]);

    const handleThemeChange = (theme: ThemeName) => {
        setCurrentTheme(theme);
        onPreferencesChange({ theme });
        document.documentElement.className = cn(theme, `animate-${currentAnimation}`);
    };

    const handleAnimationChange = (animation: 'cintilar' | 'girar' | 'nenhuma') => {
        setCurrentAnimation(animation);
        onPreferencesChange({ themeAnimation: animation });
        document.documentElement.className = cn(currentTheme, `animate-${animation}`);
    };
  
    const handleSpeedChange = (value: number[]) => {
        const newSpeed = value[0];
        setCurrentThemeSpeed(newSpeed);
        onPreferencesChange({ themeSpeed: newSpeed });
    };

    const handleSizeChange = (value: number[]) => {
        const newSize = value[0];
        setCurrentThemeSize(newSize);
        onPreferencesChange({ themeSize: newSize });
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
                    onValueChange={(value) => handleThemeChange(value as ThemeName)}
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

                <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-6 border-t space-y-8"
                >
                    <div>
                        <Label className="text-base font-medium">Animação de Borda</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                        Escolha o efeito visual para as bordas dos componentes.
                        </p>
                        <RadioGroup
                        value={currentAnimation}
                        onValueChange={(value) => handleAnimationChange(value as 'cintilar' | 'girar' | 'nenhuma')}
                        className="flex flex-col sm:flex-row gap-4"
                        >
                        <div className="flex-1">
                            <RadioGroupItem value="nenhuma" id="anim-nenhuma" className="peer sr-only" />
                            <Label 
                            htmlFor="anim-nenhuma" 
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                            <Text className="mb-3 h-6 w-6" />
                            Nenhuma
                            </Label>
                        </div>
                        <div className="flex-1">
                            <RadioGroupItem value="cintilar" id="anim-cintilar" className="peer sr-only" />
                            <Label 
                            htmlFor="anim-cintilar" 
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                            <Sparkles className="mb-3 h-6 w-6" />
                            Pulsante
                            </Label>
                        </div>
                        <div className="flex-1">
                            <RadioGroupItem value="girar" id="anim-girar" className="peer sr-only" />
                            <Label 
                            htmlFor="anim-girar" 
                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Film className="mb-3 h-6 w-6" />
                                Giratória
                            </Label>
                        </div>
                        </RadioGroup>
                    </div>

                    <div>
                        <Label htmlFor="speed-slider" className="text-base font-medium">Velocidade da Animação</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Ajuste a velocidade da animação do tema de fundo.
                        </p>
                        <div className="flex items-center gap-4">
                           <SlidersHorizontal className="h-5 w-5 text-muted-foreground"/>
                           <Slider
                             id="speed-slider"
                             min={1}
                             max={200}
                             step={1}
                             value={[currentThemeSpeed]}
                             onValueChange={handleSpeedChange}
                           />
                           <span className="text-sm font-mono w-12 text-center">{currentThemeSpeed}%</span>
                        </div>
                    </div>
                    
                    <div>
                        <Label htmlFor="size-slider" className="text-base font-medium">Tamanho dos Elementos</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Ajuste o tamanho dos elementos animados (ex: fontes, pétalas).
                        </p>
                        <div className="flex items-center gap-4">
                           <Ruler className="h-5 w-5 text-muted-foreground"/>
                           <Slider
                             id="size-slider"
                             min={50}
                             max={150}
                             step={1}
                             value={[currentThemeSize]}
                             onValueChange={handleSizeChange}
                           />
                           <span className="text-sm font-mono w-12 text-center">{currentThemeSize}%</span>
                        </div>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    );
};
