// src/app/border-tester/[borderId]/page.tsx
"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BORDER_OPTIONS } from '../border-options';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Header } from '@/components/shared/Header';
import Image from 'next/image';

type AnimationType = 'none' | 'pulsar' | 'vibrar';

export default function BorderVisualizerPage() {
  const params = useParams();
  const borderId = params.borderId as string;
  const [animation, setAnimation] = useState<AnimationType>('none');

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
            className={cn(
                'relative w-64 h-64 flex items-center justify-center',
                animation === 'pulsar' && 'animate-pulsar',
                animation === 'vibrar' && 'animate-vibrar',
            )}
            style={{ '--border-animation-color': selectedBorder.animationColor } as React.CSSProperties}
          >
            <BorderComponent />
            <Avatar className="w-48 h-48 border-4 border-background">
                <Image src="https://placehold.co/200x200.png" alt="Avatar de Perfil" data-ai-hint="profile avatar" width={200} height={200}/>
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>

          {/* Controles */}
          <Card className="bg-card/50 w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl capitalize">{selectedBorder.label}</CardTitle>
              <CardDescription>Ative as animações para ver o efeito na borda.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label htmlFor="anim-none" className="text-base">Sem Animação</Label>
                <Switch
                  id="anim-none"
                  checked={animation === 'none'}
                  onCheckedChange={() => setAnimation('none')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label htmlFor="anim-pulsar" className="text-base">Animação Pulsar</Label>
                <Switch
                  id="anim-pulsar"
                  checked={animation === 'pulsar'}
                  onCheckedChange={(checked) => setAnimation(checked ? 'pulsar' : 'none')}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <Label htmlFor="anim-vibrar" className="text-base">Animação Vibrar</Label>
                <Switch
                  id="anim-vibrar"
                  checked={animation === 'vibrar'}
                  onCheckedChange={(checked) => setAnimation(checked ? 'vibrar' : 'none')}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
