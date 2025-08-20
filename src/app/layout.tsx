
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';
import { MatrixCurtainTrigger } from '@/components/themes/MatrixCurtainTrigger';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';

const inter = localFont({
  src: [
    {
      path: '../../public/fonts/Inter-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Inter-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-inter',
});

const cinzel = localFont({
  src: [
    {
        path: '../../public/fonts/CinzelDecorative-Regular.ttf',
        weight: '400',
        style: 'normal',
    },
    {
        path: '../../public/fonts/CinzelDecorative-Bold.ttf',
        weight: '700',
        style: 'normal',
    }
  ],
  variable: '--font-cinzel',
});

const medieval = localFont({
  src: '../../public/fonts/MedievalSharp-Regular.ttf',
  weight: '400',
  variable: '--font-medieval',
});

const emilysCandy = localFont({
  src: '../../public/fonts/EmilysCandy-Regular.ttf',
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
