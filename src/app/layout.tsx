
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeManager } from '@/components/shared/ThemeManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function RootLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeManager />
      <ProtectedRoute>
        {children}
      </ProtectedRoute>
      <Toaster />
    </AuthProvider>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className='dark'>
        <body>
            <RootLayoutWrapper>
                {children}
            </RootLayoutWrapper>
        </body>
    </html>
  );
}
