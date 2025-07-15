// src/app/font-tester/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CaseSensitive, Pilcrow, Type, Code } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/shared/Header';
import { cn } from '@/lib/utils';

const FONT_OPTIONS: { value: string; label: string; icon: React.FC<any>; className: string }[] = [
    { value: 'inter', label: 'Inter', icon: Type, className: 'font-body' },
    { value: 'lora', label: 'Lora', icon: Pilcrow, className: 'font-serif' },
    { value: 'lobster', label: 'Lobster', icon: CaseSensitive, className: 'font-script' },
    { value: 'roboto-mono', label: 'Roboto Mono', icon: Code, className: 'font-code' },
];

export default function FontTesterPage() {
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
                        <Type className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Testador de Fontes</h1>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Selecione uma fonte para visualizar em mais detalhes.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FONT_OPTIONS.map((font, index) => (
                        <Link href={`/font-tester/${font.value}`} key={font.value} passHref>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="h-full"
                            >
                                <Card className="bg-card/80 backdrop-blur-sm hover:border-primary/80 transition-all h-full cursor-pointer flex flex-col justify-center items-center p-6">
                                    <font.icon className="w-12 h-12 text-primary mb-4" />
                                    <CardTitle className={cn("text-2xl", font.className)}>{font.label}</CardTitle>
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
