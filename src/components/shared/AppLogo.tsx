
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard } from 'lucide-react';

interface AppLogoProps {
  iconSize?: number;
  textSize?: string;
  className?: string;
}

export function AppLogo({ 
  iconSize = 24, 
  textSize = 'text-xl', 
  className 
}: AppLogoProps) {
  return (
    <motion.div 
      className={`flex items-center gap-2 font-bold ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <LayoutDashboard style={{ width: iconSize, height: iconSize }} className="text-primary" />
      <h1 className={textSize}>Datafy</h1>
    </motion.div>
  );
}
