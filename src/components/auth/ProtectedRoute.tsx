
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const unprotectedRoutes = ['/login', '/signup', '/teste', '/matrix'];
const protectedRoutes = ['/dashboard', '/profile', '/settings', '/analytics'];


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) {
      return; 
    }

    const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
    const isAuthRoute = unprotectedRoutes.includes(pathname);
    
    // If not authenticated and trying to access a protected route
    if (!currentUser && isProtectedRoute) {
      router.push('/login');
    }

    // If authenticated and trying to access an auth route (like /login)
    if (currentUser && isAuthRoute) {
      router.push('/');
    }
    
  }, [currentUser, userProfile, authLoading, router, pathname]);

  // Show a loading spinner while authentication status is being determined
  if (authLoading) {
     return <LoadingSpinner fullPage />;
  }
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) || pathname === '/';
  
  // If the user is authenticated, their profile is loaded, and it's a protected route, show the page
  if (currentUser && userProfile && isProtectedRoute) {
    return <>{children}</>;
  }
  
  const isUnprotectedRoute = unprotectedRoutes.includes(pathname);

  // If it's an unprotected route, show the page (the logic inside the useEffect handles redirecting if logged in)
  if (isUnprotectedRoute) {
    return <>{children}</>;
  }

  // Fallback loading spinner for other cases (e.g., waiting for redirect)
  return <LoadingSpinner fullPage />;
}
