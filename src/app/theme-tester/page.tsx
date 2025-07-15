// src/app/theme-tester/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Paintbrush, Waves, Sunset, Trees, Rocket, DraftingCompass, Flame, Wind, Droplets, Mountain, SunMoon, Atom, BrainCircuit, VenetianMask, Map, Globe, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ThemeName } from '@/lib/types';
import { Header } from '@/components/shared/Header';

const THEME_OPTIONS: { value: ThemeName; label: string; icon: React.FC<any> }[] = [
    { value: 'matrix', label: 'Matrix', icon: Bot },
    { value: 'deep-ocean', label: 'Deep Ocean', icon: Waves },
    { value: 'enchanted-forest', label: 'Enchanted Forest', icon: Trees },
    { value: 'starfield-warp', label: 'Starfield Warp', icon: Rocket },
    { value: 'galactic-journey', label: 'Galactic Journey', icon: Globe },
    { value: 'floating-lanterns', label: 'Floating Lanterns', icon: Flame },
    { value: 'chinese-lanterns', label: 'Chinese Lanterns', icon: VenetianMask },
    { value: 'cyberpunk-city', label: 'Cyberpunk City', icon: Wind },
    { value: 'cyberpunk-traffic', label: 'Cyberpunk Traffic', icon: Wind },
    { value: 'celestial-sphere', label: 'Celestial Sphere', icon: SunMoon },
    { value: 'living-organism', label: 'Living Organism', icon: Atom },
    { value: 'generative-topography', label: 'Generative Topography', icon: Map },
    { value: 'dynamic-weather', label: 'Dynamic Weather', icon: Droplets },
    { value: 'fractal-explorer', label: 'Fractal Explorer', icon: BrainCircuit },
] as const;

export default function ThemeTesterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
        <Header />
        <main className="flex-1 p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex items-center justify-center gap-3">
                        <Paintbrush className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Testador de Temas</h1>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Selecione um tema para visualizar em tela cheia.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {THEME_OPTIONS.map((theme, index) => (
                        <Link href={`/theme-tester/${theme.value}`} key={theme.value} passHref>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="h-full"
                            >
                                <Card className="bg-card/80 backdrop-blur-sm hover:border-primary/80 transition-all h-full cursor-pointer flex flex-col justify-center items-center p-6">
                                    <theme.icon className="w-12 h-12 text-primary mb-4" />
                                    <CardTitle className="text-lg">{theme.label}</CardTitle>
                                </Card>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
}
