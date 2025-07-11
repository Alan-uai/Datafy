
"use client";

import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Minimize2, Maximize2, Settings, Palette, Bot, Sparkles, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Helper to read cookies on the client side
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

export default function SettingsPage() {
  const { userProfile, savePreferences, isLoading } = useUserProfile();

  // Local state for theme settings, initialized from cookies for instant UI feedback.
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'matrix'>(() => (getCookie('theme') as 'dark' | 'matrix') || 'dark');
  const [currentAnimation, setCurrentAnimation] = useState<'cintilar' | 'girar'>(() => (getCookie('matrixAnimation') as 'cintilar' | 'girar') || 'cintilar');

  const handleThemeChange = (theme: 'dark' | 'matrix') => {
    setCurrentTheme(theme);
    // Save to Firestore via the hook
    savePreferences({ theme });
    // Also save to a cookie for instant server-side rendering
    document.cookie = `theme=${theme};path=/;max-age=31536000`; // Expires in 1 year
    
    // Update the class on the html element immediately for visual feedback
    document.documentElement.className = cn(theme, theme === 'matrix' && `animate-${currentAnimation}`);
  };
  
  const handleAnimationChange = (animation: 'cintilar' | 'girar') => {
    if (currentTheme !== 'matrix') return;
    
    setCurrentAnimation(animation);
    // Save to Firestore via the hook
    savePreferences({ matrixAnimation: animation });
    // Also save to a cookie
    document.cookie = `matrixAnimation=${animation};path=/;max-age=31536000`;

    // Update the class on the html element immediately
    document.documentElement.className = cn(currentTheme, `animate-${animation}`);
  };
  
  useEffect(() => {
    // Sync with profile when it loads, but cookie is the source of truth for initial render.
    if (userProfile) {
        setCurrentTheme(userProfile.preferences.theme as 'dark' | 'matrix');
        setCurrentAnimation(userProfile.preferences.matrixAnimation);
    }
  }, [userProfile]);

  if (isLoading || !userProfile) {
    return <LoadingSpinner />;
  }

  const { dashboardScale } = userProfile.preferences;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Configurações</h1>
            </div>
            <p className="text-muted-foreground">
              Personalize a aparência e o comportamento do aplicativo.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Ajuste como o dashboard é exibido.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                    <div>
                        <Label className="text-base font-medium">Tamanho da Interface (Dashboard)</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                           O modo compacto exibe mais informações na tela, ideal para visualização rápida.
                        </p>
                        <RadioGroup
                          value={dashboardScale || 'normal'}
                          onValueChange={(value) => savePreferences({ dashboardScale: value as 'normal' | 'compact' })}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <div className="flex-1">
                            <RadioGroupItem value="normal" id="scale-normal" className="peer sr-only" />
                            <Label 
                              htmlFor="scale-normal" 
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Maximize2 className="mb-3 h-6 w-6" />
                              Normal
                            </Label>
                          </div>
                          <div className="flex-1">
                            <RadioGroupItem value="compact" id="scale-compact" className="peer sr-only" />
                            <Label 
                              htmlFor="scale-compact" 
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Minimize2 className="mb-3 h-6 w-6" />
                                Compacto
                            </Label>
                          </div>
                        </RadioGroup>
                    </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tema Visual</CardTitle>
                <CardDescription>Mude o esquema de cores do aplicativo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <RadioGroup
                    value={currentTheme}
                    onValueChange={(value) => handleThemeChange(value as 'dark' | 'matrix')}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                      <Label
                        htmlFor="theme-dark"
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-24"
                      >
                        <Palette className="mb-2 h-6 w-6" />
                        Padrão
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="matrix" id="theme-matrix" className="peer sr-only" />
                      <Label
                        htmlFor="theme-matrix"
                        className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-24"
                      >
                          <Bot className="mb-2 h-6 w-6" />
                          Matrix
                      </Label>
                    </div>
                  </RadioGroup>

                  {currentTheme === 'matrix' && (
                     <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="pt-4 border-t"
                      >
                        <Label className="text-base font-medium">Animação de Borda (Matrix)</Label>
                         <p className="text-sm text-muted-foreground mb-3">
                           Escolha o efeito visual para as bordas dos componentes no tema Matrix.
                        </p>
                        <RadioGroup
                          value={currentAnimation}
                          onValueChange={(value) => handleAnimationChange(value as 'cintilar' | 'girar')}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <div className="flex-1">
                            <RadioGroupItem value="cintilar" id="anim-cintilar" className="peer sr-only" />
                            <Label 
                              htmlFor="anim-cintilar" 
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Sparkles className="mb-3 h-6 w-6" />
                              Cintilar
                            </Label>
                          </div>
                          <div className="flex-1">
                            <RadioGroupItem value="girar" id="anim-girar" className="peer sr-only" />
                            <Label 
                              htmlFor="anim-girar" 
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                                <Film className="mb-3 h-6 w-6" />
                                Girar
                            </Label>
                          </div>
                        </RadioGroup>
                    </motion.div>
                  )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
