
"use client";

import { useState } from "react";
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from "@/contexts/AuthContext";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { EmailPasswordLoginForm } from "@/components/auth/EmailPasswordLoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const { currentUser } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleAuthSuccess = () => {
    // ProtectedRoute will handle the redirect.
    setIsGoogleLoading(true);
  };

  const handleGoogleSuccess = (user: FirebaseUser | null) => {
     if (!user) return;
    // On the login page, we just need to sign the user in.
    // The AuthProvider and ProtectedRoute will handle the rest.
    handleAuthSuccess();
  };
  
  if (currentUser) {
    return <LoadingSpinner fullPage text="REDIRECIONANDO"/>;
  }

  return (
    <AuthLayout
      titleIcon={<Lock />}
      title="Entrar"
      description="Acesse sua conta para gerenciar seus produtos"
      footerText="Não tem uma conta?"
      footerLink="/signup"
      footerLinkText="Criar conta"
    >
        <GoogleSignInButton 
          isGoogleLoading={isGoogleLoading}
          onSuccess={(userCredential) => handleGoogleSuccess(userCredential.user)}
          onError={() => setIsGoogleLoading(false)}
        />
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-purple-200">ou</span>
            </div>
        </div>
        <EmailPasswordLoginForm 
          onSuccess={handleAuthSuccess}
        />
    </AuthLayout>
  );
}
