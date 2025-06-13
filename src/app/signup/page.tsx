
"use client";

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, type User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/shared/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Este email já está em uso por outra conta.';
    case 'auth/invalid-email':
      return 'O formato do email fornecido é inválido.';
    case 'auth/operation-not-allowed':
      return 'Criação de contas com email e senha não está habilitada.';
    case 'auth/weak-password':
      return 'A senha fornecida é muito fraca. Por favor, escolha uma senha mais forte.';
    case 'auth/network-request-failed':
      return 'Falha na conexão com a rede. Verifique sua internet e tente novamente.';
    default:
      return 'Ocorreu um erro desconhecido ao tentar criar a conta.';
  }
};

type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4; // 0: very weak, 1: weak, 2: medium, 3: strong, 4: very strong
  text: string;
  color: string;
};

const checkPasswordStrength = (password: string): PasswordStrength => {
  let score = 0;
  if (!password) return { score: 0, text: '', color: '' };

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (password.length < 6) score = Math.min(score, 1);

  let text = '';
  let color = '';

  switch (score) {
    case 0:
    case 1:
      text = 'Muito Fraca';
      color = 'text-destructive';
      break;
    case 2:
      text = 'Fraca';
      color = 'text-orange-500';
      break;
    case 3:
      text = 'Média';
      color = 'text-yellow-500';
      break;
    case 4:
      text = 'Forte';
      color = 'text-green-500';
      break;
    default: 
      text = 'Muito Forte';
      color = 'text-green-700';
      break;
  }
  if (password.length > 0 && password.length < 6) {
    text = 'Curta';
    color = 'text-destructive';
    score = 0;
  }

  return { score: Math.min(score, 4) as PasswordStrength["score"], text, color };
};


export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { setCurrentUser } = useAuth();
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, text: '', color: '' });
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (passwordInputRef.current === document.activeElement || password.length > 0) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, text: '', color: '' });
    }
  }, [password]);


  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      const message = 'As senhas não coincidem.';
      setError(message);
      toast({ variant: 'destructive', title: 'Erro no Cadastro', description: message });
      return;
    }
    if (passwordStrength.score < 2 && password.length > 0) { 
      const message = 'A senha é muito fraca. Por favor, escolha uma senha mais forte.';
      setError(message);
      toast({ variant: 'destructive', title: 'Senha Fraca', description: message });
      return;
    }
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user as FirebaseUser); 
      
      toast({ title: 'Cadastro bem-sucedido!', description: 'Redirecionando para o painel...' });
      router.push('/dashboard');
    } catch (err: any) {
      const friendlyMessage = getFirebaseErrorMessage(err.code);
      setError(friendlyMessage);
      toast({ variant: 'destructive', title: 'Erro no Cadastro', description: friendlyMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <AppLogo iconSize={40} textSize="text-4xl" />
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Criar Conta</CardTitle>
          <CardDescription>Crie sua conta Datafy para começar a organizar.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  ref={passwordInputRef}
                  placeholder="Crie uma senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordStrength(checkPasswordStrength(password))}
                  onBlur={() => { if(!password) setPasswordStrength({ score: 0, text: '', color: ''})}}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordStrength.text && (
                <div className="mt-1 flex items-center">
                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        passwordStrength.score === 0 ? 'bg-destructive' :
                        passwordStrength.score === 1 ? 'bg-destructive' :
                        passwordStrength.score === 2 ? 'bg-orange-500' :
                        passwordStrength.score === 3 ? 'bg-yellow-500' :
                        'bg-green-500' 
                      }`}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                  </div>
                  <span className={`ml-2 text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Já tem uma conta?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Faça login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
