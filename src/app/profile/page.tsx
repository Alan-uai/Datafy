"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser !== undefined) {
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-xl mb-4">Você precisa estar logado para ver seu perfil.</p>
        <Link href="/login" passHref>
          <Button>Ir para Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || "User"} />
            <AvatarFallback className="text-4xl">
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <UserCircle size={64} />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl">{currentUser.displayName || "Usuário Datafy"}</CardTitle>
          <p className="text-muted-foreground">{currentUser.email}</p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-2">ID do Usuário: {currentUser.uid}</p>
          {/* Adicione mais informações do perfil aqui conforme necessário */}
          <Link href="/settings" passHref>
            <Button className="mt-4">Editar Perfil / Configurações</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
