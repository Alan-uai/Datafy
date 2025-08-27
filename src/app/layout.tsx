
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';
import { MatrixCurtainTrigger } from '@/components/themes/MatrixCurtainTrigger';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { BodyWithFont } from '@/components/shared/BodyWithFont';

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
        <head>
          <meta name="google-adsense-account" content="ca-pub-4847787563661282" />
          <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4847787563661282"
     crossOrigin="anonymous"></script>
        </head>
        <AuthProvider>
            <BodyWithFont>
                <Providers>
                    <MatrixCurtainTrigger />
                    {children}
                </Providers>
            </BodyWithFont>
        </AuthProvider>
    </html>
  );
}
