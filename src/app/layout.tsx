
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';
import { MatrixCurtainTrigger } from '@/components/themes/MatrixCurtainTrigger';
import { Inter, Cinzel_Decorative, MedievalSharp, Emilys_Candy } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const cinzel = Cinzel_Decorative({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cinzel',
});

const medieval = MedievalSharp({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-medieval',
});

const emilysCandy = Emilys_Candy({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-emilys-candy',
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
        cinzel.variable,
        medieval.variable,
        emilysCandy.variable
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
