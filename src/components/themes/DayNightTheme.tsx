"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ThemeConfig } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

interface DayNightThemeProps {
    config: Partial<ThemeConfig>;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, diurnoMode = false } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const { currentUser, loading } = useAuth(); // Get currentUser and loading
    const [isInitialized, setIsInitialized] = useState(false);

    const lerpColor = (c1: number[], c2: number[], t: number): number[] => ([
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
    ]);
    
    const getSkyColors = (progress: number) => {
        const nightTop = [15, 23, 42]; const nightMid = [25, 35, 60]; const nightBot = [30, 40, 70];
        const dawnTop = [115, 125, 180]; const dawnMid = [252, 182, 193]; const dawnBot = [253, 224, 71];
        const dayTop = [135, 206, 250]; const dayMid = [170, 220, 255]; const dayBot = [240, 248, 255];
        const duskTop = [115, 125, 180]; const duskMid = [253, 186, 116]; const duskBot = [255, 100, 150];

        let top, middle, bottom;
        if (progress < 0.23 || progress > 0.77) { top = nightTop; middle = nightMid; bottom = nightBot; }
        else if (progress < 0.28) { let t = (progress - 0.23) / 0.05; top = lerpColor(nightTop, dawnTop, t); middle = lerpColor(nightMid, dawnMid, t); bottom = lerpColor(nightBot, dawnBot, t); } 
        else if (progress < 0.5) { let t = (progress - 0.28) / 0.22; top = lerpColor(dawnTop, dayTop, t); middle = lerpColor(dawnMid, dayMid, t); bottom = lerpColor(dawnBot, dayBot, t); } 
        else if (progress < 0.72) { let t = (progress - 0.5) / 0.22; top = lerpColor(dayTop, duskTop, t); middle = lerpColor(dayMid, duskMid, t); bottom = lerpColor(dayBot, duskBot, t); }
        else { let t = (progress - 0.72) / 0.05; top = lerpColor(duskTop, nightTop, t); middle = lerpColor(duskMid, nightMid, t); bottom = lerpColor(duskBot, nightBot, t); }

        return { top: `rgb(${top.join(',')})`, middle: `rgb(${middle.join(',')})`, bottom: `rgb(${bottom.join(',')})` };
    };

    const drawCelestialBody = (ctx: CanvasRenderingContext2D, type: 'sun' | 'moon', p: any) => {
        const isDay = p.cycleProgress >= 0.25 && p.cycleProgress <= 0.75;
        let isVisible = (type === 'sun' && isDay) || (type === 'moon' && !isDay);
        if (!isVisible) return;
        
        const bodyProgress = type === 'sun' ? ((p.cycleProgress - 0.25) * 2 * Math.PI) : ((p.cycleProgress + 0.25) * 2 * Math.PI);
        const x = p.width / 2 - Math.cos(bodyProgress) * p.width / 2.1;
        const y = p.height * 0.9 - Math.sin(bodyProgress) * p.height / 1.5;

        if (type === 'sun') {
            const sunRadius = 45 * p.sizeRatio;
            ctx.fillStyle = `rgba(255, 235, 150, 1)`;
            ctx.beginPath();
            ctx.arc(x, y, sunRadius, 0, 2 * Math.PI);
            ctx.fill();
        } else { // Moon
            const moonRadius = 35 * p.sizeRatio;
            
            ctx.save();
            ctx.translate(x, y);

            // Base Moon color
            ctx.fillStyle = '#f0f0ff';
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.restore();
        }
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const now = new Date();
        const animationTotalFrames = 24000;
        
        const cycleProgress = diurnoMode
            ? (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400
            : (frame % animationTotalFrames) / animationTotalFrames;

        const isNight = cycleProgress < 0.25 || cycleProgress > 0.75;
        
        // Sky Colors
        const skyColors = getSkyColors(cycleProgress);
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, skyColors.top);
        bgGradient.addColorStop(0.6, skyColors.middle);
        bgGradient.addColorStop(1, skyColors.bottom);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw Sun and Moon
        drawCelestialBody(ctx, 'sun', { width, height, cycleProgress, sizeRatio, frame, speedRatio });
        drawCelestialBody(ctx, 'moon', { width, height, cycleProgress, sizeRatio });

    }, [diurnoMode]);
    
    useEffect(() => {
        if (!currentUser || loading) return; // Only run if user is logged in and not loading
        if (isInitialized) return; // Only initialize once

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frameCount = 0;
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const animate = () => {
            frameCount++;
            draw(ctx, frameCount, speedRatio, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const setup = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        setup();
        window.addEventListener('resize', setup);
        setIsInitialized(true); // Mark as initialized

        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, speed, size, currentUser, loading, isInitialized]); // Add currentUser, loading, isInitialized to dependencies

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="absolute inset-0 z-[2] block w-full h-full" />
        </div>
    );
};

export default DayNightTheme;
