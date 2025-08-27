
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Type, Flame, Sparkles, PenTool } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { UserPreferences, FontName } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface FontSettingsProps {
    preferences: UserPreferences;
    onFontChange: (font: FontName) => void;
}

const FONT_OPTIONS: { value: FontName; label: string; icon: React.FC<any>; className: string }[] = [
    { value: 'default', label: 'Padrão', icon: PenTool, className: 'font-sans' },
    { value: 'datafy', label: 'Datafy', icon: Type, className: 'font-body' },
    { value: 'royal-inferno', label: 'Royal Inferno', icon: Flame, className: 'font-royal-inferno' },
    { value: 'who-is-hot', label: 'Who Is Hot', icon: Sparkles, className: 'font-who-is-hot' },
];

export const FontSettings: React.FC<FontSettingsProps> = ({ preferences, onFontChange }) => {
    const router = useRouter();
    const { toast } = useToast();

    const handleFontSelection = (fontName: FontName) => {
        onFontChange(fontName);
        toast({
            title: "Fonte Aplicada!",
            description: `A fonte "${FONT_OPTIONS.find(f => f.value === fontName)?.label}" foi definida como padrão para o site.`,
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Seleção Rápida de Fonte</CardTitle>
                <CardDescription>Escolha a fonte principal para o aplicativo.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-4 pb-4">
                        {FONT_OPTIONS.map(({ value, label, icon: Icon, className }) => (
                            <div key={value} className="shrink-0">
                                <motion.div whileHover={{ y: -5 }} className="h-full">
                                    <button
                                        onClick={() => handleFontSelection(value)}
                                        className={cn(
                                            "flex flex-col items-center justify-center rounded-md border-2 p-4 h-28 w-28 cursor-pointer transition-colors",
                                            preferences.activeFont === value ? 'border-primary bg-accent' : 'border-muted bg-popover',
                                            "hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        <Icon className="mb-2 h-6 w-6" />
                                        <span className={cn("text-center text-sm font-sans", className)}>{label}</span>
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
};
