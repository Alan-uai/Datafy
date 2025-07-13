
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
    // If auth state is still being determined, do nothing.
    if (authLoading) return;

    // If we're done loading and the user is not authenticated, they should
    // be redirected from protected routes to the login page.
    if (!isAuthenticated && isProtectedRoute) {
      router.push('/login');
      return; // Stop further execution
    }

    // If the user is authenticated and tries to access an auth page (login/signup),
    // redirect them to the main dashboard.
    if (isAuthenticated && isAuthRoute) {
      router.push('/');
      return; // Stop further execution
    }
  }, [isAuthenticated, authLoading, isProtectedRoute, isAuthRoute, router, pathname]);

  // Show a loading spinner while auth is in progress OR if a redirect is imminent.
  // This prevents a flash of unstyled/incorrect content.
  if (authLoading || (!isAuthenticated && isProtectedRoute) || (isAuthenticated && isAuthRoute)) {
    return <LoadingSpinner fullPage />;
  }
  
  // If all checks pass, render the requested page.
  return <>{children}</>;
}
