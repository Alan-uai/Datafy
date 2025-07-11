
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserPreferences, type UserProfile, type UserPreferences } from '@/services/userService';
import { useToast } from './use-toast';

export function useUserProfile() {
  const { userProfile: authUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(authUserProfile);
  const [isLoading, setIsLoading] = useState(authLoading);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setUserProfile(authUserProfile);
    setIsLoading(authLoading);
  }, [authUserProfile, authLoading]);

  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    if (!userProfile) return;

    // Optimistically update local state
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
        // Revert to the auth context's state on failure
        setUserProfile(authUserProfile);
      }
    }, 500); // 0.5-second debounce
  }, [userProfile, authUserProfile, toast]);
  
  return { userProfile, setUserProfile, isLoading, savePreferences };
}
