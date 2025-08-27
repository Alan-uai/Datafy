
"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeManager } from '@/components/shared/ThemeManager';
import type { ThemeName, ThemeConfig } from '@/lib/types';
import { useUserProfile } from '@/hooks/useUserProfile';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text, Sparkles, Film, SlidersHorizontal, Ruler, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from '@/components/shared/Header';
import { useToast } from '@/hooks/use-toast';


export default function ThemeVisualizerPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile, savePreferences, isLoading } = useUserProfile();
  const { toast } = useToast();
  const [showCard, setShowCard] = useState(true);

  const theme = (params.theme as ThemeName) || 'padrão';

  useEffect(() => {
    if (userProfile && userProfile.preferences.activeTheme !== theme) {
      savePreferences({ activeTheme: theme });
    }
  }, [userProfile, theme, savePreferences]);
  
  const handleThemeConfigChange = (newConfig: Partial<ThemeConfig>) => {
      if (!userProfile) return;
      const { activeTheme } = userProfile.preferences;
      const updatedConfigs = {
          ...userProfile.preferences.themeConfigs,
          [activeTheme]: {
              ...userProfile.preferences.themeConfigs[activeTheme],
              ...newConfig,
          }
      };
      savePreferences({ themeConfigs: updatedConfigs });
  };

   const handleDefaultModeToggle = (isLight: boolean) => {
        const newMode = isLight ? 'light' : 'dark';
        savePreferences({ defaultThemeMode: newMode });
        
        if (userProfile?.preferences.activeTheme === 'light' || userProfile?.preferences.activeTheme === 'dark' || userProfile?.preferences.activeTheme === 'padrão') {
            savePreferences({ activeTheme: newMode });
        }
    };

    const handleApplyTheme = () => {
        if (!userProfile) return;
        const { activeTheme } = userProfile.preferences;
        
        const isStandard = activeTheme === 'light' || activeTheme === 'dark';
        
        if (isStandard || activeTheme === 'padrão') {
             savePreferences({ lastCustomTheme: 'padrão' });
        } else {
             savePreferences({ lastCustomTheme: activeTheme });
        }
        
        toast({
            title: "Tema Aplicado!",
            description: `O tema "${theme.replace(/-/g, ' ')}" foi salvo como seu padrão.`,
        });
        router.push('/settings');
    };


  if (isLoading || !userProfile) {
    return <LoadingSpinner text="CARREGANDO TEMA..." />;
  }
  
  const preferences = userProfile.preferences;
  const activeThemeConfig = preferences.themeConfigs[preferences.activeTheme] || {};
  const { 
      themeAnimation = 'nenhuma', 
      themeSpeed = 100, 
      themeSize = 100, 
      matrixMode = 'padrão', 
      diurnoMode = false, 
      astrologicalEvents = true,
      glitchType = 'classic',
      snowType = 'soft',
      chocolateType = 'black',
      zodiacSign = 'all',
      eyeType = 'human',
      userMediaUrl = ''
  } = activeThemeConfig;
  const isLightMode = preferences.defaultThemeMode === 'light';


  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4">
      <Header />
      <ThemeManager />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed top-20 right-4 z-20 w-full max-w-sm"
      >
        <Card className="bg-card/60 backdrop-blur-lg border-border/50">
          <CardHeader>
            <CardTitle className="capitalize text-xl">{theme.replace(/-/g, ' ')}</CardTitle>
            <CardDescription>Ajuste as configurações do tema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 max-h-[calc(100vh-15rem)] overflow-y-auto pr-3">
             <div className="flex items-center space-x-2">
                <Switch id="show-card-toggle" checked={showCard} onCheckedChange={setShowCard} />
                <Label htmlFor="show-card-toggle">Mostrar Card de Exemplo</Label>
            </div>
            
            <AnimatePresence>
                {preferences.activeTheme === 'padrão' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="space-y-4 pt-4 border-t border-border/20"
                    >
                        <Label className="text-base font-medium">Modo Padrão</Label>
                         <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <Label htmlFor="default-mode" className="text-sm font-medium flex items-center gap-2">
                                     {isLightMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-blue-300" />}
                                     Modo {isLightMode ? 'Claro' : 'Escuro'}
                                </Label>
                            </div>
                            <Switch
                                id="default-mode"
                                checked={isLightMode}
                                onCheckedChange={handleDefaultModeToggle}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
                
            <AnimatePresence>
                {preferences.activeTheme === 'user-media' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-4 border-t border-border/20">
                        <Label className="text-base font-medium">Tema Personalizado</Label>
                        <div className="flex items-center gap-2">
                            <Input 
                                placeholder="URL da imagem ou GIF"
                                value={userMediaUrl}
                                onChange={(e) => handleThemeConfigChange({ userMediaUrl: e.target.value })}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Cole a URL de uma imagem (JPG, PNG) ou GIF para usar como fundo.</p>
                    </motion.div>
                )}
                {preferences.activeTheme === 'glitch' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-4 border-t border-border/20">
                        <Label className="text-base font-medium">Tipo de Glitch</Label>
                        <RadioGroup value={glitchType} onValueChange={(v) => handleThemeConfigChange({ glitchType: v as any })} className="text-sm">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="classic" id="glitch-classic" /><Label htmlFor="glitch-classic">Clássico</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="rgb-shift" id="glitch-rgb" /><Label htmlFor="glitch-rgb">Deslocamento RGB</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="blocky" id="glitch-blocky" /><Label htmlFor="glitch-blocky">Blocos</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="invert" id="glitch-invert" /><Label htmlFor="glitch-invert">Inversão</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="scanlines" id="glitch-scanlines" /><Label htmlFor="glitch-scanlines">Linhas de Varredura</Label></div>
                        </RadioGroup>
                    </motion.div>
                )}
                {preferences.activeTheme === 'snowfall' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 border-t border-border/20 space-y-4">
                        <Label className="text-base font-medium">Tipo de Floco</Label>
                        <RadioGroup value={snowType} onValueChange={(v) => handleThemeConfigChange({ snowType: v as any })}>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="soft" id="snow-soft" /><Label htmlFor="snow-soft">Suave</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="crystal" id="snow-crystal" /><Label htmlFor="snow-crystal">Cristal</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="heavy" id="snow-heavy" /><Label htmlFor="snow-heavy">Pesado</Label></div>
                        </RadioGroup>
                    </motion.div>
                )}
                {preferences.activeTheme === 'chocolate-fountain' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-4 border-t border-border/20 space-y-4">
                        <Label className="text-base font-medium">Tipo de Chocolate</Label>
                        <RadioGroup value={chocolateType} onValueChange={(v) => handleThemeConfigChange({ chocolateType: v as any })}>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="black" id="choco-black" /><Label htmlFor="choco-black">Amargo</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="white" id="choco-white" /><Label htmlFor="choco-white">Branco</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="colorful" id="choco-colorful" /><Label htmlFor="choco-colorful">Colorido</Label></div>
                        </RadioGroup>
                    </motion.div>
                )}
                {preferences.activeTheme === 'zodiac-wheel' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-4 border-t border-border/20">
                        <Label className="text-base font-medium">Signo</Label>
                        <RadioGroup value={zodiacSign} onValueChange={(v) => handleThemeConfigChange({ zodiacSign: v as any })} className="grid grid-cols-3 gap-2 text-sm">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="zodiac-all" /><Label htmlFor="zodiac-all">Todos</Label></div>
                            {['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'].map(s => (
                                <div key={s} className="flex items-center space-x-2"><RadioGroupItem value={s} id={`zodiac-${s}`} /><Label htmlFor={`zodiac-${s}`} className="capitalize">{s}</Label></div>
                            ))}
                        </RadioGroup>
                    </motion.div>
                )}
                {preferences.activeTheme === 'mystic-eye' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 pt-4 border-t border-border/20">
                        <Label className="text-base font-medium">Tipo de Olho</Label>
                        <RadioGroup value={eyeType} onValueChange={(v) => handleThemeConfigChange({ eyeType: v as any })} className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="human" id="eye-human" /><Label htmlFor="eye-human">Humano</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="demon" id="eye-demon" /><Label htmlFor="eye-demon">Demoníaco</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="angelic" id="eye-angelic" /><Label htmlFor="eye-angelic">Angelical</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="reptile" id="eye-reptile" /><Label htmlFor="eye-reptile">Reptiliano</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="cybernetic" id="eye-cybernetic" /><Label htmlFor="eye-cybernetic">Cibernético</Label></div>
                        </RadioGroup>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-4 pt-4 border-t border-border/20">
                <Label className="text-base font-medium">Animação de Borda</Label>
                <RadioGroup
                    value={themeAnimation}
                    onValueChange={(value) => handleThemeConfigChange({ themeAnimation: value as any })}
                    className="grid grid-cols-3 gap-2"
                >
                    <RadioGroupItem value="nenhuma" id="anim-nenhuma" className="peer sr-only" />
                    <Label htmlFor="anim-nenhuma" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 text-center text-xs hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-20">
                      <Text className="mb-1 h-5 w-5" />Nenhuma
                    </Label>
                    <RadioGroupItem value="cintilar" id="anim-cintilar" className="peer sr-only" />
                    <Label htmlFor="anim-cintilar" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 text-center text-xs hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-20">
                      <Sparkles className="mb-1 h-5 w-5" />Pulsante
                    </Label>
                    <RadioGroupItem value="girar" id="anim-girar" className="peer sr-only" />
                    <Label htmlFor="anim-girar" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 text-center text-xs hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-20">
                      <Film className="mb-1 h-5 w-5" />Giratória
                    </Label>
                </RadioGroup>
            </div>
             <div className="space-y-6 pt-4 border-t border-border/20">
                <div className={cn("space-y-2", diurnoMode && preferences.activeTheme === 'dia-noite' ? 'opacity-50 pointer-events-none' : '')}>
                    <Label htmlFor="speed-slider" className="text-base font-medium">Velocidade da Animação</Label>
                    <div className="flex items-center gap-3">
                       <SlidersHorizontal className="h-5 w-5 text-muted-foreground"/>
                       <Slider id="speed-slider" min={1} max={200} step={1} value={[themeSpeed]} onValueChange={(v) => handleThemeConfigChange({ themeSpeed: v[0] })} disabled={diurnoMode && preferences.activeTheme === 'dia-noite'} />
                       <span className="text-sm font-mono w-12 text-center border rounded-md py-1">{themeSpeed}%</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="size-slider" className="text-base font-medium">Tamanho dos Elementos</Label>
                    <div className="flex items-center gap-3">
                       <Ruler className="h-5 w-5 text-muted-foreground"/>
                       <Slider id="size-slider" min={50} max={150} step={1} value={[themeSize]} onValueChange={(v) => handleThemeConfigChange({ themeSize: v[0] })} />
                       <span className="text-sm font-mono w-12 text-center border rounded-md py-1">{themeSize}%</span>
                    </div>
                </div>
             </div>
          </CardContent>
           <CardFooter>
                <Button onClick={handleApplyTheme} className="w-full">
                    Aplicar Tema
                </Button>
            </CardFooter>
        </Card>
      </motion.div>

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
