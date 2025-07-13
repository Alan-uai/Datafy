"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

const PROTECTED_APP_PATHS = ['/', '/dashboard', '/profile', '/settings', '/analytics'];
const AUTH_PATHS = ['/login', '/signup'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // A path is considered protected if it's in PROTECTED_APP_PATHS and NOT an auth path.
  const isProtectedRoute = PROTECTED_APP_PATHS.some(p => pathname.startsWith(p)) && !AUTH_PATHS.includes(pathname);
  const isAuthRoute = AUTH_PATHS.includes(pathname);
  const isAuthenticated = !!currentUser && !!userProfile;

  console.log("ProtectedRoute: pathname =", pathname);
  console.log("ProtectedRoute: authLoading =", authLoading);
  console.log("ProtectedRoute: isAuthenticated =", isAuthenticated);
  console.log("ProtectedRoute: isProtectedRoute =", isProtectedRoute);
  console.log("ProtectedRoute: isAuthRoute =", isAuthRoute);

  useEffect(() => {
    console.log("ProtectedRoute useEffect: Running...");
    console.log("ProtectedRoute useEffect: Current Values - authLoading:", authLoading, "isAuthenticated:", isAuthenticated, "isProtectedRoute:", isProtectedRoute, "isAuthRoute:", isAuthRoute);
    
    // If auth state is still loading, do nothing yet.
    if (authLoading) {
      console.log("ProtectedRoute useEffect: Auth is still loading, returning.");
      return; 
    }

    // Case 1: User is not authenticated
    if (!isAuthenticated) {
      // If they are on a protected app path, redirect to login.
      if (isProtectedRoute) {
        console.log("ProtectedRoute useEffect: Not authenticated and on protected app route. Redirecting to /login.");
        router.push('/login');
        return;
      }
      // If they are on an auth route, let them stay (no redirect needed).
      if (isAuthRoute) {
        console.log("ProtectedRoute useEffect: Not authenticated and on auth route. Staying.");
        return;
      }
    }

    // Case 2: User is authenticated
    if (isAuthenticated) {
      // If they are on an auth route, redirect to the dashboard.
      if (isAuthRoute) {
        console.log("ProtectedRoute useEffect: Authenticated and on auth route. Redirecting to /.");
        router.push('/');
        return;
      }
      // If they are on a protected app path, let them stay (no redirect needed).
      if (isProtectedRoute) {
        console.log("ProtectedRoute useEffect: Authenticated and on protected app route. Staying.");
        return;
      }
    }

    console.log("ProtectedRoute useEffect: No redirection needed.");

  }, [isAuthenticated, authLoading, isProtectedRoute, isAuthRoute, router, pathname]);

  // While auth is loading, show a spinner if on a protected app path.
  // This prevents content flash while waiting for auth status.
  if (authLoading && isProtectedRoute) {
    console.log("ProtectedRoute Render: Displaying spinner - authLoading && isProtectedRoute");
    return <LoadingSpinner fullPage />;
  }

  // If not loading, but a redirect is imminently expected, also show a spinner.
  // This handles the brief moment before the actual `router.push` takes effect.
  if (!authLoading) {
    if (!isAuthenticated && isProtectedRoute) {
      console.log("ProtectedRoute Render: Displaying spinner - !isAuthenticated && isProtectedRoute (pre-redirect)");
      return <LoadingSpinner fullPage />;
    }
    if (isAuthenticated && isAuthRoute) {
      console.log("ProtectedRoute Render: Displaying spinner - isAuthenticated && isAuthRoute (pre-redirect)");
      return <LoadingSpinner fullPage />;
    }
  }
  
  console.log("ProtectedRoute Render: Rendering children.");
  return <>{children}</>;
}
