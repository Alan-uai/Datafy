
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mail, Camera } from 'lucide-react';
import type { UserProfile } from '@/services/userService';
import { ProfileStats } from './ProfileStats';
import { LevelIndicator } from './LevelIndicator';

interface ProfileCardProps {
  userProfile: UserProfile;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ userProfile }) => {
  return (
    <>
      <Card className="bg-card shadow-2xl">
        <CardHeader className="text-center pb-6">
          <motion.div
            whileHover={{ scale: 1.1, rotateZ: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mx-auto mb-4 relative"
          >
            <Avatar className="w-24 h-24 border-4 border-primary/50 shadow-xl">
              <AvatarImage src={userProfile.photoURL || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {userProfile.displayName?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 rounded-full p-2 shadow-lg"
            >
              <Camera className="w-4 h-4 text-primary-foreground" />
            </motion.button>
          </motion.div>

          <CardTitle className="text-white text-xl">
            {userProfile.displayName || 'Usuário'}
          </CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {userProfile.email}
          </CardDescription>

          <div className="flex justify-center gap-2 pt-2">
            <Badge variant="secondary">Verificado</Badge>
            {userProfile.isPremium && (
              <Badge variant="default" className="bg-yellow-500 text-black">Premium</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
            <ProfileStats stats={userProfile.stats} />
        </CardContent>
      </Card>
      
      <LevelIndicator stats={userProfile.stats} />
    </>
  );
};
