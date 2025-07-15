// src/app/theme-tester/[theme]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeManager } from '@/components/shared/ThemeManager';
import type { ThemeName } from '@/lib/types';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ThemeVisualizerPage() {
  const params = useParams();
  const { userProfile, savePreferences, isLoading } = useUserProfile();
  const [showCard, setShowCard] = useState(true);

  const theme = (params.theme as ThemeName) || 'padrão';

  useEffect(() => {
    // This effect ensures that as soon as the user profile is loaded,
    // we set the active theme for visualization purposes.
    // It will revert when the user navigates away because the actual
    // userProfile preference isn't saved permanently.
    if (userProfile && userProfile.preferences.activeTheme !== theme) {
      savePreferences({ activeTheme: theme });
    }
  }, [userProfile, theme, savePreferences]);

  if (isLoading || !userProfile) {
    return <LoadingSpinner text="CARREGANDO TEMA..." />;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4">
      {/* The ThemeManager will render the selected theme's background */}
      <ThemeManager />

      {/* Control Panel */}
      <div className="absolute top-4 right-4 bg-card/80 backdrop-blur-md p-3 rounded-lg z-10 border border-border">
        <div className="flex items-center space-x-2">
          <Switch id="show-card-toggle" checked={showCard} onCheckedChange={setShowCard} />
          <Label htmlFor="show-card-toggle">Mostrar Card</Label>
        </div>
      </div>

      {/* Title */}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold capitalize text-shadow-lg" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>{theme.replace(/-/g, ' ')}</h1>
        <p className="text-muted-foreground text-lg">Visualizador de Tema</p>
      </div>

      {/* Sample Card */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 15, stiffness: 100 }}
            className="w-full max-w-md z-10"
          >
            <Card className="shadow-2xl bg-card/50 backdrop-blur-lg border-2 border-primary/30">
                <CardHeader>
                    <CardTitle>Exemplo de Card</CardTitle>
                    <CardDescription>Este é um card de exemplo para testar o tema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>
                    O conteúdo do card permanece legível e funcional, enquanto o fundo e a borda refletem o tema ativo.
                    </p>
                </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
