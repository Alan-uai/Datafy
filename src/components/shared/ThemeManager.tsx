
"use client";

import { useEffect, useState } from 'react';
import { MatrixBackground } from '@/components/shared/MatrixBackground';

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

export const ThemeManager = () => {
  const [theme, setTheme] = useState(() => getCookie('theme') || 'dark');
  const [mode, setMode] = useState<'padrão' | 'merge'>(() => (getCookie('matrixMode') as 'padrão' | 'merge') || 'padrão');
  const [speed, setSpeed] = useState<number>(() => Number(getCookie('matrixSpeed')) || 100);

  useEffect(() => {
    // This component will run on the client and update its state if cookies change.
    // This is useful for SPAs where the user changes the theme without a full page reload.
    const interval = setInterval(() => {
        const themeCookie = getCookie('theme');
        const modeCookie = getCookie('matrixMode') as 'padrão' | 'merge';
        const speedCookie = Number(getCookie('matrixSpeed'));

        if (themeCookie && theme !== themeCookie) {
            setTheme(themeCookie);
        }
        if (modeCookie && mode !== modeCookie) {
            setMode(modeCookie);
        }
        if (speedCookie && speed !== speedCookie) {
            setSpeed(speedCookie);
        }
    }, 500); // Check for cookie changes periodically

    return () => clearInterval(interval);
  }, [theme, mode, speed]);

  return theme === 'matrix' ? <MatrixBackground key={`${mode}-${speed}`} mode={mode} speed={speed} /> : null;
};

    