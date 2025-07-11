
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signOut as firebaseSignOut } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { getUserProfile, createUserProfile, type UserProfile } from '@/services/userService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  hasPremium: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  loading: true,
  logout: async () => {},
  hasPremium: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          let profile = await getUserProfile(user.uid);
          // If profile doesn't exist, create it. This is the crucial fix.
          if (!profile) {
            console.log(`Profile not found for user ${user.uid}. Creating a new one.`);
            await createUserProfile(user.uid, {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL || undefined,
            });
            // Fetch the newly created profile to ensure the state is up-to-date
            profile = await getUserProfile(user.uid);
          }
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to fetch or create user profile in AuthContext:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  
  const logout = async () => {
    await firebaseSignOut(auth);
    // Setting states to null is handled by the onAuthStateChanged listener
  };
  
  const hasPremium = useCallback(() => {
    if (!userProfile?.premium) return false;
    // Optional: Check for expiration if premium.expiresAt is implemented
    // if (userProfile.premium.expiresAt && new Date(userProfile.premium.expiresAt) < new Date()) {
    //   return false;
    // }
    return true;
  }, [userProfile]);

  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
    hasPremium,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingSpinner fullPage /> : children}
    </AuthContext.Provider>
  );
}
