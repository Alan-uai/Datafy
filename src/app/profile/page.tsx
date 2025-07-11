
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { User, LogOut } from 'lucide-react';
import type { UserProfile as UserProfileType } from '@/services/userService';
import { getUserProfile, createUserProfile } from '@/services/userService';
import { updateUserStatsAndAchievements } from '@/services/userProfileService';

import { ProfileCard } from '@/components/profile/ProfileCard';
import { ProfileTabs } from '@/components/profile/ProfileTabs';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    if (!currentUser?.uid) return;
    setIsLoading(true);
    try {
      let profile = await getUserProfile(currentUser.uid);
      if (!profile) {
        const newProfileData: Partial<UserProfileType> = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Novo Usuário',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || undefined,
        };
        await createUserProfile(currentUser.uid, newProfileData);
        profile = await getUserProfile(currentUser.uid);
      }
      
      if (profile) {
        const updatedProfile = await updateUserStatsAndAchievements(profile, currentUser, toast);
        setUserProfile(updatedProfile);
      } else {
         throw new Error("Não foi possível carregar ou criar o perfil.");
      }

    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o perfil."
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [currentUser, loadUserProfile]);

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
    <div className="min-h-screen bg-transparent p-4 sm:p-6">
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
    </div>
  );
}
