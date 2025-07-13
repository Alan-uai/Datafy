
"use client";

import React, { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { User } from 'lucide-react';
import { updateUserStatsAndAchievements } from '@/services/userProfileService';

import { ProfileCard } from './components/ProfileCard';
import { ProfileTabs } from './components/ProfileTabs';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { userProfile, setUserProfile, isLoading } = useUserProfile();
  const router = useRouter();
  const { toast } = useToast();

  const loadUserStats = useCallback(async () => {
    if (!userProfile || !currentUser) return;
    try {
      const updatedProfile = await updateUserStatsAndAchievements(userProfile, currentUser, toast);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error loading profile stats:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as estatísticas do perfil."
      });
    }
  }, [currentUser, userProfile, setUserProfile, toast]);

  useEffect(() => {
    if (currentUser?.uid && userProfile) {
      loadUserStats();
    }
  }, [currentUser?.uid, loadUserStats]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
       toast({ variant: "destructive", title: "Erro ao sair."});
    }
  };

  if (isLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      <main className="flex-1 p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8 relative"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <User className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Meu Perfil</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Gerencie suas informações, conquistas e preferências.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="xl:col-span-1 space-y-6"
            >
              <ProfileCard userProfile={userProfile} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="xl:col-span-3"
            >
              <ProfileTabs 
                userProfile={userProfile} 
                setUserProfile={setUserProfile}
                onLogout={handleLogout} 
              />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
