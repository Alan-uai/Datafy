
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const PROTECTED_PATHS = ['/', '/dashboard', '/profile', '/settings', '/analytics'];
const AUTH_PATHS = ['/login', '/signup'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isProtectedRoute = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthRoute = AUTH_PATHS.includes(pathname);

  useEffect(() => {
    if (authLoading) return; // Wait until authentication status is resolved

    // If user is not logged in and tries to access a protected route, redirect to login
    if (!currentUser && isProtectedRoute) {
      router.push('/login');
    }

    // If user is logged in and tries to access an auth route (login/signup), redirect to dashboard
    if (currentUser && isAuthRoute) {
      router.push('/');
    }
  }, [currentUser, authLoading, isProtectedRoute, isAuthRoute, router]);

  // While auth is loading, or if we are about to redirect, show a spinner.
  if (authLoading || (!currentUser && isProtectedRoute) || (currentUser && isAuthRoute)) {
    return <LoadingSpinner fullPage />;
  }
  
  // Otherwise, render the requested page content.
  return <>{children}</>;
}
