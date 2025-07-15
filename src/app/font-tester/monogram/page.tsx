
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/shared/Header';
import { MonogramCharacter } from '@/components/shared/MonogramCharacter';
import { Card, CardContent } from '@/components/ui/card';

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('');

export default function MonogramFontPage() {
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold">Fonte Monograma</h1>
          <p className="text-muted-foreground mt-2">
            Visualização dos caracteres personalizados em SVG.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-4 max-w-7xl mx-auto">
          {CHARACTERS.map((char, index) => (
            <motion.div
              key={char}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.02 }}
            >
              <Card className="bg-card/50 backdrop-blur-sm aspect-square flex items-center justify-center">
                <CardContent className="p-2">
                  <MonogramCharacter char={char} className="w-16 h-16" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
