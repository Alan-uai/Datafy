
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cookies } from 'next/headers';
import { cn } from '@/lib/utils';
import { ThemeManager } from '@/components/shared/ThemeManager';


export const metadata: Metadata = {
  title: 'Datafy',
  description: 'Gerencie seu estoque e validade de produtos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const themeCookie = cookieStore.get('theme')?.value || 'dark';
  const animationCookie = cookieStore.get('matrixAnimation')?.value || 'cintilar';

  return (
    <html lang="pt-BR" className={cn(
        themeCookie,
        themeCookie === 'matrix' && `animate-${animationCookie}`
      )}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <ThemeManager />
        <AuthProvider>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
