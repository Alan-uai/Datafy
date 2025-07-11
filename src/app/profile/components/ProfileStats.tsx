
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Target, Trophy, Calendar, Sparkles } from 'lucide-react';
import type { UserProfile } from '@/services/userService';

interface ProfileStatsProps {
  stats: UserProfile['stats'];
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const profileStats = [
    { label: 'Produtos', value: stats.productsCount.toString(), icon: Target, color: 'text-blue-400' },
    { label: 'Listas', value: stats.listsCount.toString(), icon: Trophy, color: 'text-green-400' },
    { label: 'Dias Ativo', value: stats.daysActive.toString(), icon: Calendar, color: 'text-purple-400' },
    { label: 'Eficiência', value: `${stats.efficiencyScore}%`, icon: Sparkles, color: 'text-yellow-400' },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 text-center">
      {profileStats.map((stat) => (
        <motion.div key={stat.label} whileHover={{ scale: 1.05 }} className="bg-muted/50 rounded-lg p-2">
          <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-1`} />
          <p className="font-bold text-sm">{stat.value}</p>
          <p className="text-muted-foreground text-xs">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
};
