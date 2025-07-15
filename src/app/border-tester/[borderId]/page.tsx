
// src/app/border-tester/[borderId]/page.tsx
"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { BORDER_OPTIONS } from '../border-options';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Header } from '@/components/shared/Header';
import Image from 'next/image';

export default function BorderVisualizerPage() {
  const params = useParams();
  const borderId = params.borderId as string;

  const selectedBorder = BORDER_OPTIONS.find(b => b.id === borderId);

  if (!selectedBorder) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Borda não encontrada.</p>
        </main>
      </div>
    );
  }

  const BorderComponent = selectedBorder.component;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16"
        >
          {/* Avatar com a borda */}
          <div 
            className={cn('relative w-64 h-64 flex items-center justify-center')}
          >
            <BorderComponent />
            <Avatar className="w-48 h-48 border-4 border-background">
                <Image src="https://placehold.co/200x200.png" alt="Avatar de Perfil" data-ai-hint="profile avatar" width={200} height={200}/>
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>

          {/* Info Card */}
          <Card className="bg-card/50 w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl capitalize">{selectedBorder.label}</CardTitle>
              <CardDescription>Esta é uma pré-visualização da borda personalizada. As animações de borda globais (Pulsante, Giratória) não se aplicam aqui.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Você pode aplicar animações globais a cards e outros elementos na página de Configurações.</p>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
