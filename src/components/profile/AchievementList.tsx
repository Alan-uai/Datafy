
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import type { Achievement } from '@/services/userService';
import { EmptyState } from '@/components/shared/EmptyState';

interface AchievementListProps {
  achievements: Achievement[];
}

export const AchievementList: React.FC<AchievementListProps> = ({ achievements }) => {
  const sortedAchievements = [...achievements].sort((a, b) => (b.unlockedAt?.getTime() ?? 0) - (a.unlockedAt?.getTime() ?? 0));

  return (
    <Card className="bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Conquistas ({achievements.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {sortedAchievements.length > 0 ? (
          sortedAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
            >
              <div className={`w-12 h-12 ${achievement.color} rounded-full flex items-center justify-center shadow-inner`}>
                <DynamicIcon name={achievement.iconType} className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{achievement.name}</p>
                <p className="text-muted-foreground text-sm">{achievement.description}</p>
                {achievement.unlockedAt && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Conquistado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-300">Desbloqueado</Badge>
            </motion.div>
          ))
        ) : (
            <EmptyState
                icon={<Trophy className="opacity-50"/>}
                title="Nenhuma conquista ainda."
                description="Continue usando o app para desbloquear novas conquistas!"
                className="py-8"
            />
        )}
      </CardContent>
    </Card>
  );
};
