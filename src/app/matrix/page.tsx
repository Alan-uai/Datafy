
"use client";

import React, { useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useThemeAnimation } from '@/contexts/ThemeAnimationContext';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Header } from '@/components/shared/Header';

export default function MatrixPage() {
  const { userProfile, savePreferences } = useUserProfile();
  const { triggerMatrixAnimation } = useThemeAnimation();

  useEffect(() => {
    if (userProfile) {
      // Trigger the curtain animation and set the theme to matrix
      triggerMatrixAnimation();
      savePreferences({ activeTheme: 'matrix' });
    }
  }, [userProfile, savePreferences, triggerMatrixAnimation]);

  if (!userProfile) {
    return <LoadingSpinner text="PREPARANDO EFEITO MATRIX..." />;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8 bg-black/50 rounded-lg backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-primary">Visualizador de Tema</h1>
          <p className="text-muted-foreground mt-2">Tema atual: Matrix</p>
        </div>
      </div>
    </div>
  );
}
