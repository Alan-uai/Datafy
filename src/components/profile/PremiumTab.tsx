
"use client";

import React from 'react';
import type { UserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { Crown, BarChart3, Bot, Cloud, Check } from 'lucide-react';
import { PremiumPlanCard, Plan } from './PremiumPlanCard';

interface PremiumTabProps {
  userProfile: UserProfile;
}

const PLANS: Plan[] = [
  {
    level: 'I',
    name: 'Datafy Premium I',
    price: '24,90',
    description: 'O essencial para otimizar seu controle de estoque.',
    features: [
      { text: 'Widgets de análise avançada', icon: BarChart3 },
      { text: 'Sugestões de ícones para listas (IA)', icon: Bot },
      { text: 'Tema visual "Matrix"', icon: Bot },
    ],
    buttonClass: 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  },
  {
    level: 'II',
    name: 'Datafy Premium II',
    price: '59,90',
    description: 'Ferramentas poderosas para gerenciamento e insights.',
    features: [
      { text: 'Todos os benefícios do Premium I', icon: Check, highlighted: true },
      { text: 'Relatórios de gastos mensais', icon: BarChart3 },
      { text: 'Sugestões de receitas (IA)', icon: Bot },
      { text: 'Backup automático na nuvem', icon: Cloud },
    ],
    buttonClass: 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  },
  {
    level: 'III',
    name: 'Datafy Premium III',
    price: '89,90',
    description: 'A solução definitiva para total automação e controle.',
    features: [
      { text: 'Todos os benefícios do Premium II', icon: Check, highlighted: true },
      { text: 'Análise preditiva de compras', icon: Bot },
      { text: 'Suporte prioritário via chat', icon: Cloud },
      { text: 'Acesso antecipado a novos recursos', icon: Bot },
    ],
    buttonClass: 'bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700',
  }
];

export const PremiumTab: React.FC<PremiumTabProps> = ({ userProfile }) => {
  const { toast } = useToast();

  const handlePremiumUpgrade = () => {
    toast({ title: "Premium em breve!", description: "A funcionalidade de assinatura será lançada em breve." });
  };

  return (
    <div className="text-center p-4 sm:p-6 bg-muted/30 rounded-lg">
      <div className="flex items-center justify-center gap-3 mb-4">
        <Crown className="w-8 h-8 text-yellow-400" />
        <h3 className="text-2xl font-bold">Planos Datafy Premium</h3>
      </div>
      {userProfile.premium ? (
        <div className="py-8">
          <p className="text-green-400 text-lg mb-2">Você é um usuário Premium {userProfile.premium.type}!</p>
          {userProfile.premium.expiresAt && (
            <p className="text-muted-foreground">
              Válido até: {new Date(userProfile.premium.expiresAt).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Desbloqueie recursos avançados com um de nossos planos e leve seu gerenciamento de inventário para o próximo nível.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <PremiumPlanCard 
                key={plan.level}
                plan={plan}
                onSelect={handlePremiumUpgrade}
                currentPlan={userProfile.premium?.type}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
