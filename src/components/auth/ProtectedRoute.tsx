
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const unprotectedRoutes = ['/login', '/signup', '/teste', '/matrix'];
const protectedRoutes = ['/dashboard', '/profile', '/settings', '/analytics'];


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) {
      return; 
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
    const isAuthRoute = unprotectedRoutes.includes(pathname);

    if (currentUser && !userProfile && isProtectedRoute) {
        logout().then(() => router.push('/login'));
        return;
    }

    if (!currentUser && isProtectedRoute) {
      router.push('/login');
    }

    if (currentUser && isAuthRoute) {
      router.push('/');
    }
    
  }, [currentUser, userProfile, authLoading, router, pathname, logout]);

  if (authLoading) {
     return <LoadingSpinner fullPage />;
  }
  
  const isAuthRoute = unprotectedRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname === '/';

  if (currentUser && !userProfile && isProtectedRoute) {
      return <LoadingSpinner fullPage text="Redirecionando..." />;
  }
  
  if ((currentUser && userProfile && isProtectedRoute) || (!currentUser && isAuthRoute)) {
    return <>{children}</>;
  }
  
  if (!isProtectedRoute && !isAuthRoute) {
      return <>{children}</>;
  }

  return <LoadingSpinner fullPage />;
}
