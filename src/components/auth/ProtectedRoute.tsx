
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const unprotectedRoutes = ['/login', '/signup'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait until authentication state is fully loaded before making decisions.
    if (authLoading) {
      return; 
    }

    const isAuthRoute = unprotectedRoutes.includes(pathname);

    // If there is no logged-in user and they are on a protected page,
    // redirect them to the login page.
    if (!currentUser && !isAuthRoute) {
      router.push('/login');
    }

    // If a user is logged in and they are on a login/signup page,
    // redirect them to the dashboard.
    if (currentUser && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [currentUser, authLoading, router, pathname]);

  // While auth is loading, show a full-page spinner.
  if (authLoading) {
     return <LoadingSpinner fullPage />;
  }
  
  // If the user is authenticated, or if they are on a public route,
  // show the page content. The useEffect above handles the redirection logic.
  // This prevents content flashing.
  if ((currentUser && !unprotectedRoutes.includes(pathname)) || (!currentUser && unprotectedRoutes.includes(pathname))) {
    return <>{children}</>;
  }

  // This fallback spinner covers the brief moment during redirection.
  return <LoadingSpinner fullPage />;
}
