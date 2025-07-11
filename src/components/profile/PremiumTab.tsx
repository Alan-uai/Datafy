
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import type { UserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';

interface PremiumTabProps {
  userProfile: UserProfile;
}

export const PremiumTab: React.FC<PremiumTabProps> = ({ userProfile }) => {
  const { toast } = useToast();

  const handlePremiumUpgrade = () => {
    toast({ title: "Premium em breve!", description: "A funcionalidade Premium será lançada em breve." });
  };

  return (
    <div className="text-center p-8 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Crown className="w-8 h-8 text-yellow-400" />
        <h3 className="text-2xl font-bold">Datafy Premium</h3>
      </div>
      {userProfile.isPremium ? (
        <>
          <p className="text-green-400 mb-4">Você é um usuário Premium!</p>
          {userProfile.premiumExpiresAt && (
            <p className="text-muted-foreground">
              Válido até: {new Date(userProfile.premiumExpiresAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">
            Desbloqueie recursos avançados por <span className="text-yellow-400 font-bold">R$ 24,90/mês</span>.
          </p>
          <Button onClick={handlePremiumUpgrade} className="bg-gradient-to-r from-primary to-yellow-500 text-white font-bold py-3 px-8">
            <Crown className="w-5 h-5 mr-2" />Assinar Premium
          </Button>
        </>
      )}
    </div>
  );
};
