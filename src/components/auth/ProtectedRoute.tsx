
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
    if (authLoading) {
      return; // Wait until authentication state is loaded
    }

    const isAuthRoute = unprotectedRoutes.includes(pathname);

    // If user is logged in...
    if (currentUser) {
      // and they are on a login/signup page, redirect to dashboard
      if (isAuthRoute) {
        router.push('/dashboard');
      }
    } 
    // If user is NOT logged in...
    else {
      // and they are on a protected page, redirect to login
      if (!isAuthRoute) {
        router.push('/login');
      }
    }
  }, [currentUser, authLoading, router, pathname]);

  // While auth is loading, show a spinner unless we are already on an auth page
  if (authLoading) {
     return <LoadingSpinner fullPage />;
  }
  
  // If user is logged in, show the protected content
  if (currentUser && !unprotectedRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // If user is not logged in, show the public login/signup pages
  if (!currentUser && unprotectedRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Fallback loading spinner during redirects
  return <LoadingSpinner fullPage />;
}
