
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
    if (authLoading) {
      return; // Do nothing while we are actively checking the auth state.
    }

    // If we're done loading and the user is NOT authenticated,
    // redirect them from protected routes to the login page.
    if (!isAuthenticated && isProtectedRoute) {
      router.push('/login');
      return;
    }

    // If the user IS authenticated and tries to access an auth page (login/signup),
    // redirect them to the main dashboard.
    if (isAuthenticated && isAuthRoute) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, authLoading, isProtectedRoute, isAuthRoute, router, pathname]);

  // Show a loading spinner ONLY if auth is in progress OR a redirect is imminent.
  if (authLoading) {
    // If we're loading but already on an auth page, don't show the full-page spinner.
    // This allows the login/signup page UI to be visible underneath if needed, preventing a blank screen.
    // However, if we're on a protected route while loading, a spinner is appropriate.
    if (isProtectedRoute) {
        return <LoadingSpinner fullPage />;
    }
  }

  // Prevent flash of content during redirects.
  if (!authLoading && !isAuthenticated && isProtectedRoute) {
    return <LoadingSpinner fullPage />;
  }
  if (!authLoading && isAuthenticated && isAuthRoute) {
    return <LoadingSpinner fullPage />;
  }
  
  // If all checks pass, render the requested page content.
  return <>{children}</>;
}
