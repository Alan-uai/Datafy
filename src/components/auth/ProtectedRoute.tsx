
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
  const isAuthenticated = !!currentUser && !!userProfile;

  useEffect(() => {
    // Wait until the initial authentication check is complete.
    if (authLoading) {
      return; 
    }

    // If user is not authenticated and tries to access a protected route, redirect to login.
    if (!isAuthenticated && isProtectedRoute) {
      router.push('/login');
      return;
    }

    // If user is authenticated and tries to access login/signup, redirect to dashboard.
    if (isAuthenticated && isAuthRoute) {
      router.push('/');
      return;
    }

  }, [isAuthenticated, authLoading, isProtectedRoute, isAuthRoute, router, pathname]);

  // While auth is loading, we can show a spinner on protected routes, but not on auth routes.
  if (authLoading && isProtectedRoute) {
    return <LoadingSpinner fullPage />;
  }
  
  // Prevent flash of unstyled content during redirects
  if (!authLoading) {
    if (!isAuthenticated && isProtectedRoute) {
      return <LoadingSpinner fullPage />;
    }
    if (isAuthenticated && isAuthRoute) {
      return <LoadingSpinner fullPage />;
    }
  }
  
  // If all checks pass, render the requested page content.
  return <>{children}</>;
}
