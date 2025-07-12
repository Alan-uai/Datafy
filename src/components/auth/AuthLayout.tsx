"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLogo } from '@/components/shared/AppLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AuthLayoutProps {
  children: React.ReactNode;
  titleIcon: React.ReactNode;
  title: string;
  description: string;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
  gradientFrom?: string;
  gradientVia?: string;
  gradientTo?: string;
}

export function AuthLayout({
  children,
  titleIcon,
  title,
  description,
  footerText,
  footerLink,
  footerLinkText,
  gradientFrom = 'from-slate-900',
  gradientVia = 'via-purple-900',
  gradientTo = 'to-slate-800',
}: AuthLayoutProps) {
  const [particles, setParticles] = useState<{
    id: number;
    x: number;
    y: number;
    delay: number;
    duration: number;
  }[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2,
    })));
  }, []);

  const gradientClasses = cn('bg-gradient-to-br', gradientFrom, gradientVia, gradientTo);
  const textColorClass = gradientFrom === 'from-slate-900' ? 'text-purple-200' : 'text-emerald-200';
  const linkColorClass = gradientFrom === 'from-slate-900' ? 'text-purple-400 hover:text-purple-300' : 'text-emerald-400 hover:text-emerald-300';
  const iconColorClass = gradientFrom === 'from-slate-900' ? 'text-purple-400' : 'text-emerald-400';

  return (
    <div className={cn("min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-hidden relative", gradientClasses)}>
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
            transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="w-full max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: -50, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <AppLogo iconSize={64} textSize="text-4xl" className="text-white drop-shadow-2xl" />
          <p className={cn("mt-4 text-lg font-light", textColorClass)}>
            {description}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-white text-2xl flex items-center justify-center gap-2">
                <span className={iconColorClass}>{titleIcon}</span>
                {title}
              </CardTitle>
              <CardDescription className={textColorClass}>
                {description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {children}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-center pt-4"
              >
                <p className={cn("text-sm", textColorClass)}>
                  {footerText}{" "}
                  <Link href={footerLink} className={cn("font-medium underline underline-offset-4", linkColorClass)}>
                    {footerLinkText}
                  </Link>
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
