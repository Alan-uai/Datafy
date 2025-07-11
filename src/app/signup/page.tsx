
"use client";

import { useState } from "react";
import type { User as FirebaseUser } from 'firebase/auth';
import { useAuth } from "@/contexts/AuthContext";

import { AuthLayout } from "@/components/auth/AuthLayout";
import { SignupForm } from "@/components/auth/SignupForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { UserPlus } from "lucide-react";

export default function SignupPage() {
  const { currentUser } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  const handleAuthSuccess = (user: FirebaseUser | null) => {
    if (!user) return;
    // The AuthProvider will now handle creating the profile if it doesn't exist.
    // We just need to set the loading state to allow ProtectedRoute to redirect.
    setIsAuthenticating(true);
  };
  
  if (currentUser || isAuthenticating) {
    return <LoadingSpinner fullPage text="PREPARANDO SUA CONTA"/>;
  }

  return (
    <AuthLayout
      titleIcon={<UserPlus />}
      title="Criar Conta"
      description="Junte-se ao Datafy e organize melhor seus produtos"
      footerText="Já tem uma conta?"
      footerLink="/login"
      footerLinkText="Fazer login"
      gradientFrom="from-emerald-900"
      gradientVia="via-teal-900"
      gradientTo="to-cyan-800"
    >
      <GoogleSignInButton 
        onSuccess={(userCredential) => handleAuthSuccess(userCredential.user)}
        onError={() => setIsAuthenticating(false)}
        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
      />
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-transparent px-2 text-emerald-200">ou</span>
        </div>
      </div>
      <SignupForm 
        onSuccess={(user) => handleAuthSuccess(user)}
      />
    </AuthLayout>
  );
}
