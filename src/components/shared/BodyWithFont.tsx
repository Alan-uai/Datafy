
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { FontName } from '@/lib/types';
import React from 'react';

// This component wraps the body and applies the user-selected font class.
// It must be a client component because it uses the useAuth hook.
export const BodyWithFont = ({ children }: { children: React.ReactNode }) => {
  const { userProfile } = useAuth();
  
  // Determine the active font, defaulting to 'default' if not set.
  const activeFont = userProfile?.preferences?.activeFont || 'default';

  const fontClassMap: { [key in FontName]: string } = {
    default: 'font-sans',
    datafy: 'font-body',
    'royal-inferno': 'font-royal-inferno',
    'who-is-hot': 'font-who-is-hot',
  };

  const bodyFontClass = fontClassMap[activeFont] || 'font-sans';

  return <body className={cn('font-sans', bodyFontClass)}>{children}</body>
};
