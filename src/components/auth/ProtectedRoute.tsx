
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { createUserProfile } from '@/services/userService';

const unprotectedRoutes = ['/login', '/signup'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isVerifyingProfile, setIsVerifyingProfile] = useState(true);

  useEffect(() => {
    if (authLoading) return; // Wait for Firebase Auth to initialize

    const verifyAndRedirect = async () => {
      if (currentUser) {
        // User is logged in, check if profile exists and create if not
        try {
          // This also handles first-time Google sign-ins which act as signups
          await createUserProfile(currentUser.uid, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL || undefined,
          });
        } catch (error) {
          console.error("Failed to ensure user profile exists", error);
          // Handle error, maybe log out user
        }
        
        setIsVerifyingProfile(false); // Profile is verified/created

        const isUnprotected = unprotectedRoutes.includes(pathname);
        if (isUnprotected) {
          router.push('/');
        }
      } else {
        // User is not logged in
        setIsVerifyingProfile(false);
        const isUnprotected = unprotectedRoutes.includes(pathname);
        if (!isUnprotected) {
          router.push('/login');
        }
      }
    };

    verifyAndRedirect();
  }, [currentUser, authLoading, router, pathname]);

  const loading = authLoading || isVerifyingProfile;
  const isUnprotected = unprotectedRoutes.includes(pathname);

  if (loading) {
    // Show a spinner during auth check or profile verification, except on public routes if no user is detected yet
    if (isUnprotected && !currentUser) {
       // Allows login/signup page to render immediately without spinner flicker
    } else {
      return <LoadingSpinner />;
    }
  }

  // Allow access to unprotected routes if user is not logged in
  if (!currentUser && isUnprotected) {
    return <>{children}</>;
  }

  // Allow access to protected routes if user is logged in and profile is verified
  if (currentUser && !isUnprotected) {
    return <>{children}</>;
  }

  // Fallback, should be covered by loading spinner during redirection
  return <LoadingSpinner />;
}
