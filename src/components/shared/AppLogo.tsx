
"use client";

import React from 'react';
import type { LucideProps } from 'lucide-react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

interface AppLogoProps {
  iconSize?: number;
  text?: string;
  textSize?: string;
  className?: string;
}

export function AppLogo({ 
  iconSize = 24, 
  text, 
  textSize = 'text-xl', 
  className 
}: AppLogoProps) {
  return (
    <motion.div 
      className={`flex items-center gap-2 font-bold ${className}`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <ShieldAlert style={{ width: iconSize, height: iconSize }} className="text-primary" />
      {text && <h1 className={textSize}>{text}</h1>}
    </motion.div>
  );
}

    