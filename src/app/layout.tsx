
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ThemeManager } from '@/components/shared/ThemeManager';
import { Header } from '@/components/shared/Header';
import { usePathname } from 'next/navigation';

export default function RootLayoutWrapper({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className='dark'>
        <body>
            <AuthProvider>
                <RootLayoutContent>{children}</RootLayoutContent>
            </AuthProvider>
        </body>
    </html>
  );
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  return (
    <>
      <ThemeManager />
      <ProtectedRoute>
        {isAuthRoute ? (
          children
        ) : (
          <div className="relative min-h-screen flex flex-col bg-transparent">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        )}
      </ProtectedRoute>
      <Toaster />
    </>
  );
}
