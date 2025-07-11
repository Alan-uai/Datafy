
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
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

  return (
    <html lang="pt-BR" className='dark'>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
            <ThemeManager />
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
