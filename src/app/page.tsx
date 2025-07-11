
"use client";

import Dashboard from "@/app/dashboard/page";
import { Header } from "@/components/shared/Header";
import MatrixBackground from "@/components/shared/MatrixBackground";
import { useEffect, useState } from "react";

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'matrix'>('dark');
  const [matrixConfig, setMatrixConfig] = useState({ mode: 'padrão' as 'padrão' | 'merge', speed: 100 });

  useEffect(() => {
    const themeCookie = getCookie('theme') as 'dark' | 'matrix' || 'dark';
    const modeCookie = getCookie('matrixMode') as 'padrão' | 'merge' || 'padrão';
    const speedCookie = Number(getCookie('matrixSpeed')) || 100;
    
    setTheme(themeCookie);
    setMatrixConfig({ mode: modeCookie, speed: speedCookie });

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const newTheme = (getCookie('theme') as 'dark' | 'matrix') || 'dark';
                const newMode = (getCookie('matrixMode') as 'padrão' | 'merge') || 'padrão';
                const newSpeed = Number(getCookie('matrixSpeed')) || 100;
                setTheme(newTheme);
                setMatrixConfig({ mode: newMode, speed: newSpeed });
            }
        });
    });

    observer.observe(document.documentElement, { attributes: true });
    
    return () => observer.disconnect();

  }, []);

  return (
    <div className="relative min-h-screen flex flex-col">
      {theme === 'matrix' && <MatrixBackground key={`${matrixConfig.mode}-${matrixConfig.speed}`} {...matrixConfig} />}
      
      <div className="relative z-10 flex flex-col flex-1 bg-transparent">
        <Header />
        <main className="flex-1">
          <Dashboard />
        </main>
      </div>
    </div>
  );
}
