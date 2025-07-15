// src/app/border-tester/page.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gem } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '@/components/shared/Header';
import { BORDER_OPTIONS } from './border-options';

export default function BorderTesterPage() {
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
                        <Gem className="w-8 h-8 text-primary" />
                        <h1 className="text-3xl font-bold">Testador de Bordas</h1>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Selecione uma borda para visualizar e testar animações.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {BORDER_OPTIONS.map((border, index) => (
                        <Link href={`/border-tester/${border.id}`} key={border.id} passHref>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 * index }}
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="h-full"
                            >
                                <Card className="bg-card/80 backdrop-blur-sm hover:border-primary/80 transition-all h-full cursor-pointer flex flex-col justify-center items-center p-6">
                                    <div className="w-24 h-24 mb-4 flex items-center justify-center text-primary">
                                       <border.icon className="w-16 h-16" />
                                    </div>
                                    <CardTitle className="text-lg">{border.label}</CardTitle>
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
