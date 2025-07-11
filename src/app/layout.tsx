import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getUserProfile } from '@/services/userService';
import { auth } from '@/lib/firebase';
import { cookies } from 'next/headers';
import { cn } from '@/lib/utils';


export const metadata: Metadata = {
  title: 'Datafy',
  description: 'Gerencie seu estoque e validade de produtos.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // We can't use the useUserProfile hook here because this is a server component.
  // We will read the theme from a cookie instead. This is faster and ensures no flicker
  // on initial load, as the server can render the correct theme immediately.
  const theme = cookies().get('theme')?.value || 'dark';
  const animation = cookies().get('matrixAnimation')?.value || 'cintilar';


  return (
    <html lang="pt-BR" className={cn(
        theme,
        theme === 'matrix' && `animate-${animation}`
      )}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
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
