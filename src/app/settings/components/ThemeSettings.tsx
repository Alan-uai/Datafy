
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Bot, Sparkles, Film, SlidersHorizontal, Sun, Moon, Space, Cherry, Text, Ruler, Clock, Waves, Aperture, Signal, Upload, Heart, Rocket, Snowflake, VenetianMask, Star, Cloud, Eye, Droplets } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { UserPreferences, ThemeName } from '@/lib/types';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useThemeAnimation } from '@/contexts/ThemeAnimationContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter }from 'next/navigation';

const THEME_OPTIONS = [
    { value: 'padrão', label: 'Padrão', icon: Palette },
    { value: 'matrix', label: 'Matrix', icon: Bot, isPremium: true },
    { value: 'verão', label: 'Verão', icon: Waves },
    { value: 'espaço', label: 'Espaço', icon: Space },
    { value: 'sakura', label: 'Sakura', icon: Cherry },
    { value: 'dia-noite', label: 'Dia/Noite', icon: Moon },
    { value: 'interstellar-black-hole', label: 'Buraco Negro', icon: Aperture, isPremium: true },
    { value: 'glitch', label: 'Glitch', icon: Signal, isPremium: true },
    { value: 'facebook-likes', label: 'Reações', icon: Heart, isPremium: true },
    { value: 'galaxy-impact', label: 'Impacto Galáctico', icon: Rocket, isPremium: true },
    { value: 'snowfall', label: 'Neve', icon: Snowflake },
    { value: 'vampire-aesthetic', label: 'Vampiro', icon: VenetianMask, isPremium: true },
    { value: 'chocolate-fountain', label: 'Cascata de Chocolate', icon: Droplets, isPremium: true },
    { value: 'zodiac-wheel', label: 'Zodíaco', icon: Star, isPremium: true },
    { value: 'cloud-surfing', label: 'Nuvens', icon: Cloud },
    { value: 'mystic-eye', label: 'Olho Místico', icon: Eye, isPremium: true },
    { value: 'user-media', label: 'Personalizado', icon: Upload, isPremium: true },
] as const;


interface ThemeSettingsProps {
    preferences: UserPreferences;
    onThemeChange: (theme: ThemeName) => void;
    savePreferences: (newPreferences: Partial<UserPreferences>) => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ preferences, onThemeChange, savePreferences }) => {
    const { userProfile } = useUserProfile();
    const { triggerMatrixAnimation } = useThemeAnimation();
    const hasPremium = !!userProfile?.premium;
    const router = useRouter();

    const handleThemeSelection = (value: string) => {
        const selectedOption = THEME_OPTIONS.find(opt => opt.value === value);
        if (selectedOption?.isPremium && !hasPremium) {
            return;
        }
        
        const themeName = value as ThemeName;
        
        if (themeName === 'matrix') {
            triggerMatrixAnimation();
        }

        if (value === 'padrão') {
            onThemeChange(preferences.defaultThemeMode);
            savePreferences({ lastCustomTheme: 'padrão' });
        } else {
            onThemeChange(themeName);
            savePreferences({ lastCustomTheme: themeName });
        }
    };
        
    const selectedRadioValue = ['light', 'dark'].includes(preferences.activeTheme)
        ? 'padrão' 
        : preferences.activeTheme;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seleção Rápida de Tema</CardTitle>
                <CardDescription>Escolha seu tema visual. Para configurações avançadas, vá para o <a href="/theme-tester" className="underline text-primary">Testador de Temas</a>.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-4 pb-4">
                        {THEME_OPTIONS.map(({ value, label, icon: Icon, isPremium }) => (
                             <div key={value} className="shrink-0">
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    className="h-full"
                                >
                                    <button
                                        onClick={() => handleThemeSelection(value)}
                                        disabled={isPremium && !hasPremium}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-md border-2 p-4 h-28 w-28 cursor-pointer transition-colors",
                                            selectedRadioValue === value ? 'border-primary bg-accent' : 'border-muted bg-popover',
                                            "hover:bg-accent hover:text-accent-foreground",
                                            isPremium && !hasPremium && "cursor-not-allowed opacity-50"
                                        )}
                                    >
                                        <Icon className="mb-2 h-6 w-6" />
                                        <span className="text-center text-sm">{label}</span>
                                        {isPremium && <span className="text-xs font-bold text-yellow-500 mt-1">Premium</span>}
                                    </button>
                                </motion.div>
                            </div>
                        ))}
                    </div>
                     <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
