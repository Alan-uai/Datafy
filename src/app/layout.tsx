
"use client";

import type {Metadata} from 'next';
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
  // Metadata cannot be in a client component, so we wrap it.
  // This is a common pattern.
  return (
    <html lang="pt-BR" className='dark'>
        <head>
            <title>Datafy</title>
            <meta name="description" content="Gerencie seu estoque e validade de produtos." />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet" />
        </head>
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
