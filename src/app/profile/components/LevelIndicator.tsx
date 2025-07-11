
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';
import type { UserProfile } from '@/services/userService';

interface LevelIndicatorProps {
  stats: UserProfile['stats'];
}

const calculateLevel = (stats: UserProfile['stats']) => {
  const totalScore = (stats.daysActive * 1) + (stats.productsCount * 2) + (stats.listsCount * 5);
  const level = Math.floor(totalScore / 50) + 1; // 50 points per level
  const progress = ((totalScore % 50) / 50) * 100;
  const pointsToNextLevel = 50 - (totalScore % 50);
  return { level: Math.min(level, 100), progress: Math.round(progress), pointsToNextLevel };
};

export const LevelIndicator: React.FC<LevelIndicatorProps> = ({ stats }) => {
  const { level, progress, pointsToNextLevel } = calculateLevel(stats);

  return (
    <Card className="bg-card shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-yellow-400" /> Nível {level}
        </CardTitle>
        <CardDescription>Progresso: {progress}%</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-muted rounded-full h-2.5">
          <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-muted-foreground text-xs mt-2">{pointsToNextLevel} pontos para o próximo nível.</p>
      </CardContent>
    </Card>
  );
};
