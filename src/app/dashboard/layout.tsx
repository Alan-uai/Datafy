
"use client";

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react'; // Import useState
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  // Add state to track if the initial auth check is complete
  const [isAuthCheckComplete, setIsAuthCheckComplete] = useState(false);

  // Effect to mark auth check as complete when loading becomes false
  useEffect(() => {
    if (!loading) {
      setIsAuthCheckComplete(true);
    }
  }, [loading]); // Dependency on loading

  // Effect to redirect if auth check is complete and no current user
  useEffect(() => {
    // Only redirect if the auth check is complete and there's no current user
    if (isAuthCheckComplete && !currentUser) {
      // Use replace to prevent going back to the protected page via browser back button
      router.replace('/login');
    }
  }, [isAuthCheckComplete, currentUser, router]); // Dependencies

  // Show loading spinner while authentication state is being determined
  // or if the check is complete and there's no user (will be followed by redirect) - simplified condition
  if (loading || (isAuthCheckComplete && !currentUser)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
      </div>
    );
  }

  // If loading is false and currentUser is not null, render the dashboard content
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
