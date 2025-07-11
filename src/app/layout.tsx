
"use client";

import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className='dark'>
        <body>
            <AuthProvider>
                {children}
            </AuthProvider>
            <Toaster />
        </body>
    </html>
  );
}
