
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';
import { MatrixCurtainTrigger } from '@/components/themes/MatrixCurtainTrigger';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';

const datafyFont = localFont({
  src: '../../public/fonts/Datafy.ttf',
  display: 'swap',
  variable: '--font-datafy',
});

const royalInfernoFont = localFont({
  src: '../../public/fonts/RoyalInferno.ttf',
  display: 'swap',
  variable: '--font-royal-inferno',
});

const whoIsHotFont = localFont({
  src: '../../public/fonts/WhoIsHot.ttf',
  display: 'swap',
  variable: '--font-who-is-hot',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={cn(
        'dark',
        datafyFont.variable,
        royalInfernoFont.variable,
        whoIsHotFont.variable
      )}>
        <body className="font-body">
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
