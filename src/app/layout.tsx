import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { VoiceCommandProvider } from '@/contexts/VoiceCommandContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Datafy - Gestão Inteligente de Produtos",
  description: "Gerencie seus produtos com inteligência artificial",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <VoiceCommandProvider>
            {children}
            <Toaster />
          </VoiceCommandProvider>
        </AuthProvider>
      </body>
    </html>
  );
}