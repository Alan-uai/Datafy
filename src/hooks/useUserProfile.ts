
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserProfile, updateUserPreferences, type UserProfile, type UserPreferences } from '@/services/userService';
import { useToast } from './use-toast';

export function useUserProfile() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadUserProfile = useCallback(async () => {
    if (!currentUser?.uid) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const profile = await getUserProfile(currentUser.uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
      toast({ variant: "destructive", title: "Erro ao carregar perfil" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Optimistically update local state
    if (userProfile) {
        setUserProfile(prev => prev ? ({
            ...prev,
            preferences: { ...prev.preferences, ...newPreferences }
        }) : null);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      if (!currentUser?.uid) return;
      try {
        await updateUserPreferences(currentUser.uid, newPreferences);
      } catch (error) {
        console.error("Failed to save preferences:", error);
        toast({ variant: "destructive", title: "Erro ao salvar preferências" });
        // Optionally revert state here
        loadUserProfile();
      }
    }, 500); // 0.5-second debounce
  }, [currentUser?.uid, toast, loadUserProfile, userProfile]);

  return { userProfile, setUserProfile, isLoading, loadUserProfile, savePreferences };
}
