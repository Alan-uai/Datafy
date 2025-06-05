"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';
import { loginUser, signupUser, logoutUser, getCurrentUser } from '@/lib/authService';
import type { LoginCredentials, SignupCredentials } from '@/lib/authService';
import { useToast } from '@/hooks/use-toast';


interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const loggedInUser = await loginUser(credentials);
      setUser(loggedInUser);
      toast({ title: "Login Successful", description: `Welcome back, ${loggedInUser.name || loggedInUser.email}!` });
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
      toast({ title: "Login Failed", description: errorMessage, variant: "destructive" });
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      setLoading(true);
      const signedUpUser = await signupUser(credentials);
      setUser(signedUpUser);
      toast({ title: "Signup Successful", description: `Welcome, ${signedUpUser.name || signedUpUser.email}!` });
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Signup failed. Please try again.";
      toast({ title: "Signup Failed", description: errorMessage, variant: "destructive" });
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await logoutUser();
      setUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/login');
    } catch (error) {
      toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [router, toast]);
  
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};
