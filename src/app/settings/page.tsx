
"use client";

import { useUserProfile } from '@/hooks/useUserProfile';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppearanceSettings } from './components/AppearanceSettings';
import { ThemeSettings } from './components/ThemeSettings';
import type { ThemeConfig } from '@/lib/types';

export default function SettingsPage() {
  const { userProfile, savePreferences, isLoading } = useUserProfile();

  if (isLoading || !userProfile) {
    return <LoadingSpinner />;
  }

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

  const activeThemeConfig = userProfile.preferences.themeConfigs[userProfile.preferences.activeTheme] || {};

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
              activeThemeConfig={activeThemeConfig}
              onThemeChange={(theme) => savePreferences({ activeTheme: theme })}
              onThemeConfigChange={handleThemeConfigChange}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
