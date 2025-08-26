
"use client";

import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { FontName } from '@/lib/types';
import React from 'react';

// This component wraps the body and applies the user-selected font class.
// It must be a client component because it uses the useAuth hook.
export const BodyWithFont = ({ children }: { children: React.ReactNode }) => {
  const { userProfile } = useAuth();
  
  // Determine the active font, defaulting to 'datafy' if not set.
  const activeFont = userProfile?.preferences?.activeFont || 'datafy';

  const fontClassMap: { [key in FontName]: string } = {
    datafy: 'font-body',
    'royal-inferno': 'font-royal-inferno',
    'who-is-hot': 'font-who-is-hot',
  };

  const bodyFontClass = fontClassMap[activeFont] || 'font-body';

  return <body className={cn('font-body', bodyFontClass)}>{children}</body>
};
