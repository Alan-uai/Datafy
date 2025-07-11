
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, signOut as firebaseSignOut } from '@/lib/firebase';
import { getUserProfile, createUserProfile, type UserProfile } from '@/services/userService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  setUserProfile: Dispatch<SetStateAction<UserProfile | null>>; // Expose setter
  loading: boolean;
  logout: () => Promise<void>;
  hasPremium: () => boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userProfile: null,
  setUserProfile: () => {}, // Default empty setter
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
      setLoading(true);
      if (user) {
        setCurrentUser(user);
        try {
          let profile = await getUserProfile(user.uid);
          if (!profile) {
            console.log(`Profile not found for user ${user.uid}. Creating a new one.`);
            const newProfileData = {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL || undefined,
            };
            await createUserProfile(user.uid, newProfileData);
            profile = await getUserProfile(user.uid);
          }
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to fetch or create user profile in AuthContext:", error);
          setUserProfile(null);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  
  const logout = async () => {
    await firebaseSignOut(auth);
  };
  
  const hasPremium = useCallback(() => {
    if (!userProfile?.premium) return false;
    return true;
  }, [userProfile]);

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    logout,
    hasPremium,
  };

  // Render children directly, ProtectedRoute will handle loading state
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
