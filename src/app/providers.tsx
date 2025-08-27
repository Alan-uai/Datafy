
"use client";

import { ThemeAnimationProvider } from '@/contexts/ThemeAnimationContext';
import { Toaster } from "@/components/ui/toaster";
import { ThemeManager } from '@/components/shared/ThemeManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ReactNode, useEffect } from 'react';
import { registerServiceWorker } from '@/lib/firebase-sw';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ThemeAnimationProvider>
      <ThemeManager />
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
      <Toaster />
    </ThemeAnimationProvider>
  );
}
