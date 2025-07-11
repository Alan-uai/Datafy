
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Crown, Check } from 'lucide-react';

export interface Plan {
  level: 'I' | 'II' | 'III';
  name: string;
  price: string;
  description: string;
  features: { text: string; icon: LucideIcon; highlighted?: boolean }[];
  buttonClass: string;
}

interface PremiumPlanCardProps {
  plan: Plan;
  currentPlan?: 'I' | 'II' | 'III' | null;
  onSelect: () => void;
}

export const PremiumPlanCard: React.FC<PremiumPlanCardProps> = ({ plan, currentPlan, onSelect }) => {
  const isCurrentPlan = plan.level === currentPlan;
  const isDowngrade = currentPlan && plan.level < currentPlan;

  return (
    <Card className="flex flex-col shadow-lg transform hover:scale-105 transition-transform duration-300">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-xl font-bold">
          <Crown className="w-6 h-6 text-yellow-400" />
          {plan.name}
        </CardTitle>
        <CardDescription className="text-3xl font-extrabold">
          R$ {plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span>
        </CardDescription>
        <p className="text-sm text-muted-foreground min-h-[40px]">{plan.description}</p>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start text-left gap-3">
              <feature.icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", feature.highlighted ? 'text-primary' : 'text-muted-foreground')} />
              <span>{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSelect}
          disabled={isCurrentPlan || isDowngrade}
          className={cn("w-full font-bold text-white shadow-lg", plan.buttonClass)}
        >
          {isCurrentPlan ? 'Plano Atual' : (isDowngrade ? 'Indisponível' : 'Assinar Agora')}
        </Button>
      </CardFooter>
    </Card>
  );
};
