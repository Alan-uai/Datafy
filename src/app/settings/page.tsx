
"use client";

import { useUserProfile } from '@/hooks/useUserProfile';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Settings, Bell, BarChart2, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppearanceSettings } from './components/AppearanceSettings';
import { ThemeSettings } from './components/ThemeSettings';
import { FontSettings } from './components/FontSettings';
import { NotificationSettings } from './components/NotificationSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { ThemeName, FontName } from '@/lib/types';

export default function SettingsPage() {
  const { userProfile, savePreferences, isLoading } = useUserProfile();

  if (isLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  const handleThemeChange = (themeName: ThemeName) => {
    savePreferences({ activeTheme: themeName });
  };
  
  const handleFontChange = (fontName: FontName) => {
    savePreferences({ activeFont: fontName });
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
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

          <Tabs defaultValue="appearance">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="appearance">Aparência</TabsTrigger>
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="stats" disabled>Estatísticas</TabsTrigger>
              <TabsTrigger value="sounds" disabled>Sons</TabsTrigger>
            </TabsList>
            
            <TabsContent value="appearance" className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-6"
              >
                <AppearanceSettings 
                  dashboardScale={userProfile.preferences.dashboardScale} 
                  onScaleChange={(value) => savePreferences({ dashboardScale: value })} 
                />
                <ThemeSettings 
                  preferences={userProfile.preferences}
                  onThemeChange={handleThemeChange}
                  savePreferences={savePreferences}
                />
                <FontSettings
                  preferences={userProfile.preferences}
                  onFontChange={handleFontChange}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
               <NotificationSettings
                  preferences={userProfile.preferences}
                  onPreferencesChange={savePreferences}
                  userId={userProfile.uid}
                />
            </TabsContent>

            <TabsContent value="stats" className="mt-6">
                 <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        <BarChart2 className="w-12 h-12 mx-auto mb-4" />
                        <p>Configurações de estatísticas em breve.</p>
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="sounds" className="mt-6">
                 <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        <Volume2 className="w-12 h-12 mx-auto mb-4" />
                        <p>Configurações de som em breve.</p>
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>
        </div>
      </main>
    </div>
  );
}
