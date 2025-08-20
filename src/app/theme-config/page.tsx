
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paintbrush } from 'lucide-react';
import { motion } from 'framer-motion';
import { THEME_OPTIONS } from '@/lib/themes';
import { Header } from '@/components/shared/Header';

export default function ThemeConfigPage() {
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
                        <h1 className="text-3xl font-bold">Configurações de Tema</h1>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Selecione um tema para visualizar e ajustar suas configurações.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {THEME_OPTIONS.map((theme, index) => (
                        <Link href={`/theme-config/${theme.value}`} key={theme.value} passHref>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="h-full"
                            >
                                <Card className="bg-card/80 backdrop-blur-sm hover:border-primary/80 transition-all h-full cursor-pointer flex flex-col justify-center items-center p-6 text-center">
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
