import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Providers } from './providers';
import { MatrixCurtainTrigger } from '@/components/themes/MatrixCurtainTrigger';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className='dark'>
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
