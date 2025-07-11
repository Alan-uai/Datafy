
"use client";

import { useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserPreferences, type UserPreferences } from '@/services/userService';
import { useToast } from './use-toast';

export function useUserProfile() {
  const { userProfile, setUserProfile, loading: isLoading } = useAuth();
  const { toast } = useToast();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    if (!userProfile) return;

    // Optimistically update the central state in AuthContext
    const updatedProfile = {
        ...userProfile,
        preferences: { ...userProfile.preferences, ...newPreferences }
    };
    setUserProfile(updatedProfile);

    // Debounce the Firestore update
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        await updateUserPreferences(userProfile.uid, newPreferences);
      } catch (error) {
        console.error("Failed to save preferences:", error);
        toast({ variant: "destructive", title: "Erro ao salvar preferências" });
        // On failure, we could revert state, but AuthContext will refetch on next load anyway.
        // For now, the optimistic update stays.
      }
    }, 500);
  }, [userProfile, setUserProfile, toast]);
  
  return { userProfile, setUserProfile, isLoading, savePreferences };
}
