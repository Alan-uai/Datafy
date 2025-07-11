
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
      return; 
    }

    const isAuthRoute = unprotectedRoutes.includes(pathname);

    if (!currentUser && !isAuthRoute) {
      router.push('/login');
    }

    if (currentUser && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [currentUser, authLoading, router, pathname]);

  if (authLoading) {
     return <LoadingSpinner fullPage />;
  }
  
  const isAuthRoute = unprotectedRoutes.includes(pathname);

  // If the user is authenticated and on a protected route,
  // or if they are not authenticated and on a public route, show the children.
  if ((currentUser && !isAuthRoute) || (!currentUser && isAuthRoute)) {
    return <>{children}</>;
  }

  // Otherwise, the useEffect hook is handling redirection. Show a loading spinner.
  // This covers the case where an authenticated user is on an auth route (e.g., /login)
  // and is being redirected to the dashboard.
  return <LoadingSpinner fullPage />;
}
