
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';
import { MatrixCurtainTrigger } from '@/components/themes/MatrixCurtainTrigger';
import localFont from 'next/font/local';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

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

// A wrapper component to access user preferences
const BodyWithFont = ({ children }: { children: React.ReactNode }) => {
  const { userProfile } = useAuth();
  const fontClass = userProfile?.preferences.activeFont || 'datafy';

  const fontClassMap: { [key: string]: string } = {
    datafy: 'font-body',
    'royal-inferno': 'font-royal-inferno',
    'who-is-hot': 'font-who-is-hot',
  };

  return <body className={cn(fontClassMap[fontClass] || 'font-body')}>{children}</body>
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.React.Node;
}>) {
  return (
    <html lang="pt-BR" className={cn(
        'dark', // Removed font-body from here
        datafyFont.variable,
        royalInfernoFont.variable,
        whoIsHotFont.variable
      )}>
        <head>
          <meta name="google-adsense-account" content="ca-pub-4847787563661282" />
          <Script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4847787563661282"
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        </head>
        <AuthProvider>
            <Providers>
                <BodyWithFont>
                    <MatrixCurtainTrigger />
                    {children}
                </BodyWithFont>
            </Providers>
        </AuthProvider>
    </html>
  );
}
