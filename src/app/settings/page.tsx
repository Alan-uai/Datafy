
"use client";

import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Minimize2, Maximize2, Settings, Palette, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { userProfile, savePreferences, isLoading } = useUserProfile();

  const handleThemeChange = (theme: 'dark' | 'matrix') => {
    savePreferences({ theme });
    // This is a client-side only way to update the theme without a page reload
    // We also set a cookie for the server-side rendering in RootLayout
    document.cookie = `theme=${theme};path=/;max-age=31536000`;
    document.documentElement.className = theme;
  };

  if (isLoading || !userProfile) {
    return <LoadingSpinner />;
  }

  const { theme, dashboardScale } = userProfile.preferences;

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
              <CardContent>
                  <RadioGroup
                    value={theme || 'dark'}
                    onValueChange={(value) => handleThemeChange(value as 'dark' | 'matrix')}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex-1">
                      <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                      <Label
                        htmlFor="theme-dark"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Palette className="mb-3 h-6 w-6" />
                        Padrão
                      </Label>
                    </div>
                    <div className="flex-1">
                      <RadioGroupItem value="matrix" id="theme-matrix" className="peer sr-only" />
                      <Label
                        htmlFor="theme-matrix"
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                          <Bot className="mb-3 h-6 w-6" />
                          Matrix
                      </Label>
                    </div>
                  </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}