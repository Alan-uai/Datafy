"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { EmailPasswordLoginForm } from "@/components/auth/EmailPasswordLoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Lock } from "lucide-react";

export default function LoginPage() {
  const { loading } = useAuth();
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const handleAuthStart = () => {
    setIsEmailLoading(true);
  };

  const handleAuthEnd = () => {
    setIsEmailLoading(false);
  };
  
  if (loading) {
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
          onSuccess={() => { /* AuthProvider will handle success and loading state */ }}
          onError={handleAuthEnd}
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
          onAuthStart={handleAuthStart}
          onAuthEnd={handleAuthEnd}
          isSubmitting={isEmailLoading}
        />
    </AuthLayout>
  );
}
