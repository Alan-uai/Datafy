
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { THEME_OPTIONS } from '@/lib/themes'; // Import from a centralized place
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { UserPreferences, ThemeName } from '@/lib/types';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useThemeAnimation } from '@/contexts/ThemeAnimationContext';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useRouter }from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface ThemeSettingsProps {
    preferences: UserPreferences;
    onThemeChange: (theme: ThemeName) => void;
    savePreferences: (newPreferences: Partial<UserPreferences>) => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ preferences, onThemeChange, savePreferences }) => {
    const { userProfile } = useUserProfile();
    const { triggerMatrixAnimation } = useThemeAnimation();
    const { toast } = useToast();
    const hasPremium = !!userProfile?.premium;
    const router = useRouter();

    const handleThemeSelection = (value: string) => {
        const selectedOption = THEME_OPTIONS.find(opt => opt.value === value);
        if (selectedOption?.isPremium && !hasPremium) {
            router.push('/profile'); // Redirect to profile/premium tab
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
        
        toast({
            title: "Tema Aplicado!",
            description: `O tema "${selectedOption?.label}" foi definido como seu padrão.`,
        });
    };
        
    const selectedRadioValue = ['light', 'dark'].includes(preferences.activeTheme)
        ? 'padrão' 
        : preferences.activeTheme;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seleção Rápida de Tema</CardTitle>
                <CardDescription>Escolha seu tema visual. <a href="/theme-config" className="underline text-primary">Clique aqui</a> para configurar em detalhes.</CardDescription>
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
