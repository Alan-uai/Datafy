
"use client";

import React from 'react';
import { GoogleAuthProvider, signInWithPopup, UserCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface GoogleSignInButtonProps {
  onSuccess: (userCredential: UserCredential) => void;
  onClick?: () => void;
  className?: string;
  isGoogleLoading?: boolean;
}

export function GoogleSignInButton({ onSuccess, onClick, className, isGoogleLoading }: GoogleSignInButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSignIn = async () => {
    onClick?.();
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      onSuccess(result);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao entrar com Google',
        description: error.message,
      });
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSignIn} 
      disabled={isLoading || isGoogleLoading}
      className={className || "w-full bg-white text-black hover:bg-gray-200"}
      variant="outline"
    >
      <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 109.8 512 0 402.2 0 256S109.8 0 244 0c73 0 135.5 24.3 184.2 63.8l-65.4 65.4C333.6 101.4 293.3 84 244 84c-83.3 0-151.7 67.9-151.7 152s68.4 152 151.7 152c97.7 0 130.6-72.9 135.2-108.9H244v-85.1h243.9c1.3 7.8 2.1 15.9 2.1 24.1z"></path>
      </svg>
      {isLoading || isGoogleLoading ? 'Aguarde...' : 'Entrar com Google'}
    </Button>
  );
}
