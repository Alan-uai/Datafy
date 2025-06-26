"use client";

import { useState, type FormEvent, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define PasswordStrength type locally for now, could be moved to types later
type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4; // 0: very weak, 1: weak, 2: medium, 3: strong, 4: very strong
  text: string;
  color: string;
};

// Define checkPasswordStrength function locally for now, could be moved to a utility file later
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
    score = 0; // Treat short passwords as very weak
  }


  return { score: Math.min(score, 4) as PasswordStrength["score"], text, color };
};


interface SignupFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (confirmPassword: string) => void;
  error: string | null;
  isLoading: boolean;
  onSubmit: (e: FormEvent) => void;
}

export function SignupForm({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  error,
  isLoading,
  onSubmit,
}: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, text: '', color: '' });
  const passwordInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    // Update strength only when password changes or input is focused
    if (passwordInputRef.current === document.activeElement || password.length > 0) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, text: '', color: '' });
    }
  }, [password]);


  return (
    <form onSubmit={onSubmit}>
      <div className="space-y-4">
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
          {password.length > 0 && (
             <div className="mt-1 flex items-center">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-300 ease-in-out",
                         passwordStrength.score === 0 ? 'bg-destructive' :
                         passwordStrength.score === 1 ? 'bg-destructive' :
                         passwordStrength.score === 2 ? 'bg-orange-500' :
                         passwordStrength.score === 3 ? 'bg-yellow-500' :
                         'bg-green-500'
                      )}
                      style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    />
                </div>
                <span className={cn("ml-2 text-xs font-medium", passwordStrength.color)}>
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
      </div>
      <Button type="submit" className="w-full mt-6" disabled={isLoading}>
        {
          isLoading ? (
            <span>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando conta...
            </span>
          ) : (
            'Criar Conta'
          )
        }
      </Button>
    </form>
  );
}
