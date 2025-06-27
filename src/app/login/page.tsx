
"use client";

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, GoogleAuthProvider } from 'firebase/auth';
import { auth, signInWithPopup } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/AppLogo';
import { Separator } from '@/components/ui/separator';
import { EmailPasswordLoginForm } from '@/components/auth/EmailPasswordLoginForm';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';

const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'O formato do email fornecido é inválido.';
    case 'auth/user-disabled':
      return 'Este usuário foi desabilitado.';
    case 'auth/invalid-credential':
      return 'Credenciais inválidas. Verifique seu email e senha.';
    case 'auth/operation-not-allowed':
      return 'Login com email e senha não está habilitado.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login com Google foi fechada antes da conclusão.';
    case 'auth/account-exists-with-different-credential':
      return 'Já existe uma conta com este email utilizando outro método de login.';
    case 'auth/network-request-failed':
      return 'Falha na conexão com a rede. Verifique sua internet e tente novamente.';
    default:
      return 'Ocorreu um erro desconhecido ao tentar fazer login.';
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login bem-sucedido!', description: 'Redirecionando para o painel...' });
      router.push('/dashboard');
    } catch (err: any) {
      const friendlyMessage = getFirebaseErrorMessage(err.code);
      setError(friendlyMessage);
      toast({ variant: 'destructive', title: 'Erro no Login', description: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);
    
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: 'Login com Google bem-sucedido!', description: 'Redirecionando para o painel...' });
      router.push('/dashboard');
    } catch (err: any) {
      const friendlyMessage = getFirebaseErrorMessage(err.code);
      setError(friendlyMessage);
      toast({ variant: 'destructive', title: 'Erro no Login com Google', description: friendlyMessage });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <AppLogo iconSize={40} textSize="text-4xl" />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Acesse sua conta Datafy para continuar.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <EmailPasswordLoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            error={error}
            isLoading={isLoading}
            onSubmit={handleLogin}
          />
        </CardContent>

        <div className="px-6 pb-2 flex items-center">
          <Separator className="flex-1" />
          <span className="px-2 text-xs text-muted-foreground">OU</span>
          <Separator className="flex-1" />
        </div>

        <CardContent>
          <GoogleSignInButton
            isGoogleLoading={isGoogleLoading}
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          />
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-0">
          <p className="text-sm text-center text-muted-foreground">
            Não tem uma conta?{' '}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Cadastre-se
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
