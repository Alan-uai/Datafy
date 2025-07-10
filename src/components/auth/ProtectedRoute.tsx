
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const unprotectedRoutes = ['/login', '/signup'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      const isUnprotected = unprotectedRoutes.includes(pathname);
      
      if (!currentUser && !isUnprotected) {
        router.push('/login');
      }
      
      if (currentUser && isUnprotected) {
        router.push('/');
      }
    }
  }, [currentUser, loading, router, pathname]);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Allow access to unprotected routes if user is not logged in
  if (!currentUser && unprotectedRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Allow access to protected routes if user is logged in
  if (currentUser && !unprotectedRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  // Otherwise show loading or nothing while redirecting
  return <LoadingSpinner />;
}
