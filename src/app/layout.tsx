import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';
import { MatrixCurtainTrigger } from '@/components/themes/MatrixCurtainTrigger';
import { Inter, Lora, Lobster, Roboto_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
});

const lobster = Lobster({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-lobster',
});

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn(
        'dark',
        inter.variable,
        lora.variable,
        lobster.variable,
        roboto_mono.variable
      )}>
        <body>
            <AuthProvider>
                <Providers>
                    <MatrixCurtainTrigger />
                    {children}
                </Providers>
            </AuthProvider>
        </body>
    </html>
  );
}
