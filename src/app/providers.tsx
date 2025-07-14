"use client";

import { ThemeAnimationProvider } from '@/contexts/ThemeAnimationContext';
import { Toaster } from "@/components/ui/toaster";
import { ThemeManager } from '@/components/shared/ThemeManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
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
