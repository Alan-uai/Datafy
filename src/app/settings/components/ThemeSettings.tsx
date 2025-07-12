
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Palette, Bot, Sparkles, Film, SlidersHorizontal, Sun, Moon, Space, Cherry, Text, Ruler, Clock, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { UserPreferences, ThemeName, ThemeConfig } from '@/lib/types';
import { useUserProfile } from '@/hooks/useUserProfile';

const THEME_OPTIONS = [
    { value: 'padrão', label: 'Padrão', icon: Palette },
    { value: 'matrix', label: 'Matrix', icon: Bot, isPremium: true },
    { value: 'verão', label: 'Verão', icon: Sun },
    { value: 'espaço', label: 'Espaço', icon: Space },
    { value: 'sakura', label: 'Sakura', icon: Cherry },
    { value: 'dia-noite', label: 'Dia/Noite', icon: Moon },
] as const;


interface ThemeSettingsProps {
    preferences: UserPreferences;
    activeThemeConfig: Partial<ThemeConfig>;
    onThemeChange: (theme: ThemeName) => void;
    onThemeConfigChange: (newConfig: Partial<ThemeConfig>) => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ preferences, activeThemeConfig, onThemeChange, onThemeConfigChange }) => {
    const { savePreferences, userProfile } = useUserProfile();
    const hasPremium = !!userProfile?.premium;

    const handleThemeSelection = (value: string) => {
        const selectedOption = THEME_OPTIONS.find(opt => opt.value === value);
        if (selectedOption?.isPremium && !hasPremium) {
            // Maybe show a toast? For now, just prevent selection.
            return;
        }

        if (value === 'padrão') {
            // When "Padrão" is selected, activate the configured light/dark mode
            onThemeChange(preferences.defaultThemeMode);
        } else {
            // When a custom theme is selected, activate it and set it as the last custom theme
            onThemeChange(value as ThemeName);
            savePreferences({ lastCustomTheme: value as ThemeName });
        }
    };

    const handleDefaultModeToggle = (isLight: boolean) => {
        const newMode = isLight ? 'light' : 'dark';
        savePreferences({ defaultThemeMode: newMode });
        // If the current active theme is one of the default modes, update it
        if (preferences.activeTheme === 'light' || preferences.activeTheme === 'dark') {
            onThemeChange(newMode);
        }
    }
    
    // Determine which radio button should be checked
    const selectedRadioValue = (preferences.activeTheme === 'light' || preferences.activeTheme === 'dark')
        ? 'padrão' 
        : preferences.activeTheme;
        
    const currentTheme = preferences.activeTheme;
    const { 
        themeAnimation = 'nenhuma', 
        themeSpeed = 100, 
        themeSize = 100, 
        matrixMode = 'padrão', 
        diurnoMode = false, 
        astrologicalEvents = true 
    } = activeThemeConfig;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tema Visual</CardTitle>
                <CardDescription>Mude o esquema de cores e os efeitos do aplicativo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <RadioGroup
                    value={selectedRadioValue}
                    onValueChange={handleThemeSelection}
                    className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                >
                    {THEME_OPTIONS.map(({ value, label, icon: Icon, isPremium }) => (
                        <div key={value}>
                            <RadioGroupItem value={value} id={`theme-${value}`} className="peer sr-only" disabled={isPremium && !hasPremium} />
                            <Label
                            htmlFor={`theme-${value}`}
                            className={cn(
                                "flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-24",
                                isPremium && !hasPremium && "cursor-not-allowed opacity-50"
                            )}
                            >
                            <Icon className="mb-2 h-6 w-6" />
                            {label}
                             {isPremium && <span className="text-xs font-bold text-yellow-500">Premium</span>}
                            </Label>
                        </div>
                    ))}
                </RadioGroup>

                 <AnimatePresence>
                {selectedRadioValue === 'padrão' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="pt-6 border-t space-y-4"
                    >
                        <Label className="text-base font-medium">Modo Padrão</Label>
                         <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="default-mode" className="text-sm font-medium flex items-center gap-2">
                                    <Sun className="w-4 h-4"/> Modo Claro
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Ative para usar o tema claro como padrão.
                                </p>
                            </div>
                            <Switch
                                id="default-mode"
                                checked={preferences.defaultThemeMode === 'light'}
                                onCheckedChange={handleDefaultModeToggle}
                            />
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence>
                {currentTheme === 'matrix' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="pt-6 border-t space-y-8"
                    >
                        <div>
                            <Label className="text-base font-medium">Modo Matrix</Label>
                            <p className="text-sm text-muted-foreground mb-3">
                                Escolha o modo de renderização para o tema Matrix.
                            </p>
                            <RadioGroup
                                value={matrixMode}
                                onValueChange={(value) => onThemeConfigChange({ matrixMode: value as 'padrão' | 'combinado' })}
                                className="flex flex-col sm:flex-row gap-4"
                            >
                                <div className="flex-1">
                                    <RadioGroupItem value="padrão" id="matrix-mode-padrao" className="peer sr-only" />
                                    <Label 
                                        htmlFor="matrix-mode-padrao" 
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                    >
                                        Padrão (Dois Canvas)
                                    </Label>
                                </div>
                                <div className="flex-1">
                                    <RadioGroupItem value="combinado" id="matrix-mode-combinado" className="peer sr-only" />
                                    <Label 
                                        htmlFor="matrix-mode-combinado" 
                                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                                    >
                                        Combinado (Um Canvas)
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                <AnimatePresence>
                {currentTheme === 'dia-noite' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="pt-6 border-t space-y-4"
                    >
                        <Label className="text-base font-medium">Configurações Dia/Noite</Label>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="diurno-mode" className="text-sm font-medium flex items-center gap-2">
                                    <Clock className="w-4 h-4"/> Modo Diurno (Tempo Real)
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Sincroniza o ciclo dia/noite com o seu relógio.
                                </p>
                            </div>
                            <Switch
                                id="diurno-mode"
                                checked={diurnoMode}
                                onCheckedChange={(checked) => onThemeConfigChange({ diurnoMode: checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="astro-events" className="text-sm font-medium flex items-center gap-2">
                                    <Waves className="w-4 h-4"/> Eventos Cósmicos
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                    Exibe chuvas de meteoros e outros eventos.
                                </p>
                            </div>
                            <Switch
                                id="astro-events"
                                checked={astrologicalEvents}
                                onCheckedChange={(checked) => onThemeConfigChange({ astrologicalEvents: checked })}
                            />
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

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
                            value={themeAnimation}
                            onValueChange={(value) => onThemeConfigChange({ themeAnimation: value as any })}
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

                    <div className={cn(diurnoMode && currentTheme === 'dia-noite' ? 'opacity-50 pointer-events-none' : '')}>
                        <Label htmlFor="speed-slider" className="text-base font-medium">Velocidade da Animação</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                            Ajuste a velocidade da animação do tema de fundo. {diurnoMode && currentTheme === 'dia-noite' && '(Desativado no Modo Diurno)'}
                        </p>
                        <div className="flex items-center gap-4">
                           <SlidersHorizontal className="h-5 w-5 text-muted-foreground"/>
                           <Slider
                             id="speed-slider"
                             min={1}
                             max={200}
                             step={1}
                             value={[themeSpeed]}
                             onValueChange={(v) => onThemeConfigChange({ themeSpeed: v[0] })}
                             disabled={diurnoMode && currentTheme === 'dia-noite'}
                           />
                           <span className="text-sm font-mono w-12 text-center">{themeSpeed}%</span>
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
                             value={[themeSize]}
                             onValueChange={(v) => onThemeConfigChange({ themeSize: v[0] })}
                           />
                           <span className="text-sm font-mono w-12 text-center">{themeSize}%</span>
                        </div>
                    </div>
                </motion.div>
            </CardContent>
        </Card>
    );
};
