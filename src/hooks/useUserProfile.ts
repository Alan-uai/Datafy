
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

    setUserProfile(currentProfile => {
        if (!currentProfile) return null;

        const updatedProfile = {
            ...currentProfile,
            preferences: {
                ...currentProfile.preferences,
                ...newPreferences,
                themeConfigs: {
                    ...currentProfile.preferences.themeConfigs,
                    ...(newPreferences.themeConfigs || {}),
                }
            }
        };

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                await updateUserPreferences(currentProfile.uid, newPreferences);
            } catch (error) {
                console.error("Failed to save preferences:", error);
                toast({ variant: "destructive", title: "Erro ao salvar preferências" });
                // Revert on failure if necessary, though not strictly required with optimistic updates
                // For simplicity, we'll let the next successful fetch correct any potential desync
            }
        }, 500);

        return updatedProfile;
    });
  }, [userProfile, setUserProfile, toast]);
  
  return { userProfile, setUserProfile, isLoading, savePreferences };
}
