
"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { EmailPasswordLoginForm } from "@/components/auth/EmailPasswordLoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const { currentUser, loading } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthStart = () => {
    setIsAuthenticating(true);
  };

  const handleAuthEnd = () => {
    setIsAuthenticating(false);
  };
  
  // This state will be true if the AuthProvider is working or if a local sign-in process has started.
  const showLoading = loading || isAuthenticating;

  // If we have a user, ProtectedRoute will handle the redirect. Show loading spinner until then.
  if (currentUser) {
    return <LoadingSpinner fullPage text="REDIRECIONANDO"/>;
  }
  
  if (showLoading && !currentUser) {
      return <LoadingSpinner fullPage text="AUTENTICANDO..." />;
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
          onSuccess={() => { /* AuthProvider will handle success */ }}
          onError={handleAuthEnd}
          onClick={handleAuthStart}
          isGoogleLoading={isAuthenticating}
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
          onSuccess={() => { /* AuthProvider will handle success */ }}
        />
    </AuthLayout>
  );
}
