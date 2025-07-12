
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
    diurnoMode?: boolean;
    astrologicalEvents?: boolean;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size, diurnoMode = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const now = new Date();
        const animationTotalFrames = 24000;
        
        const cycleProgress = diurnoMode
            ? (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400
            : (frame % animationTotalFrames) / animationTotalFrames;

        const dayProgress = cycleProgress * 2; // 0 to 2
        
        // Sky Colors
        const skyColors = getSkyColors(cycleProgress);
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, skyColors.top);
        bgGradient.addColorStop(0.6, skyColors.middle);
        bgGradient.addColorStop(1, skyColors.bottom);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Draw Sun and Moon
        drawCelestialBody(ctx, 'sun', { width, height, dayProgress, sizeRatio, frame, speedRatio });
        drawCelestialBody(ctx, 'moon', { width, height, dayProgress, sizeRatio, date: now });

    }, [diurnoMode]);

    const lerpColor = (c1: number[], c2: number[], t: number): number[] => ([
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
    ]);
    
    const getSkyColors = (progress: number) => {
        const nightTop = [15, 23, 42];
        const nightMid = [25, 35, 60];
        const nightBot = [30, 40, 70];
        
        const dawnTop = [115, 125, 180];
        const dawnMid = [252, 182, 193];
        const dawnBot = [253, 224, 71];

        const dayTop = [135, 206, 250];
        const dayMid = [170, 220, 255];
        const dayBot = [240, 248, 255];
        
        const duskTop = [115, 125, 180];
        const duskMid = [253, 186, 116];
        const duskBot = [255, 100, 150];

        let top, middle, bottom;

        if (progress < 0.23 || progress > 0.77) { top = nightTop; middle = nightMid; bottom = nightBot; }
        else if (progress < 0.28) { let t = (progress - 0.23) / 0.05; top = lerpColor(nightTop, dawnTop, t); middle = lerpColor(nightMid, dawnMid, t); bottom = lerpColor(nightBot, dawnBot, t); } 
        else if (progress < 0.5) { let t = (progress - 0.28) / 0.22; top = lerpColor(dawnTop, dayTop, t); middle = lerpColor(dawnMid, dayMid, t); bottom = lerpColor(dawnBot, dayBot, t); } 
        else if (progress < 0.72) { let t = (progress - 0.5) / 0.22; top = lerpColor(dayTop, duskTop, t); middle = lerpColor(dayMid, duskMid, t); bottom = lerpColor(dayBot, duskBot, t); }
        else { let t = (progress - 0.72) / 0.05; top = lerpColor(duskTop, nightTop, t); middle = lerpColor(duskMid, nightMid, t); bottom = lerpColor(duskBot, nightBot, t); }

        return { top: `rgb(${top.join(',')})`, middle: `rgb(${middle.join(',')})`, bottom: `rgb(${bottom.join(',')})` };
    };
    
    // Calculates moon phase. Returns value from 0 (new) to 1 (full) to 0 (new)
    const getMoonPhase = (date: Date) => {
        // A known new moon (e.g., January 21, 2023)
        const knownNewMoon = new Date('2023-01-21T20:53:00Z').getTime();
        const lunarCycle = 29.530588853 * 24 * 60 * 60 * 1000; // milliseconds
        const daysSinceNewMoon = (date.getTime() - knownNewMoon) / lunarCycle;
        const currentPhase = daysSinceNewMoon - Math.floor(daysSinceNewMoon); // get the fractional part
        return currentPhase;
    };

    const drawCelestialBody = (ctx: CanvasRenderingContext2D, type: 'sun' | 'moon', p: any) => {
        const isDay = p.dayProgress > 0.5 && p.dayProgress < 1.5;
        let isVisible = (type === 'sun' && isDay) || (type === 'moon' && !isDay);
        if (!isVisible) return;

        const bodyProgress = type === 'sun' ? (p.dayProgress - 0.5) * Math.PI : (p.dayProgress - 1.5) * Math.PI;
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
            const phase = getMoonPhase(p.date); // 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter

            ctx.save();
            ctx.translate(x, y);

            // Draw dark side of the moon (always there)
            ctx.fillStyle = 'rgba(100, 100, 110, 0.8)';
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Draw lit side of the moon
            ctx.fillStyle = 'rgb(240, 240, 255)';
            ctx.beginPath();
            
            if (phase < 0.5) { // Waxing
                const xOffset = moonRadius * (1 - (phase / 0.5) * 2);
                ctx.arc(0, 0, moonRadius, -Math.PI / 2, Math.PI / 2); // Right lit semicircle
                ctx.ellipse(0, 0, Math.abs(xOffset), moonRadius, 0, Math.PI/2, -Math.PI/2, xOffset < 0);
            } else { // Waning
                const xOffset = moonRadius * ((phase - 0.5) / 0.5 * 2 - 1);
                ctx.arc(0, 0, moonRadius, Math.PI / 2, -Math.PI / 2); // Left lit semicircle
                ctx.ellipse(0, 0, Math.abs(xOffset), moonRadius, 0, -Math.PI/2, Math.PI/2, xOffset < 0);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    };
    
    useEffect(() => {
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
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        setup();
        window.addEventListener('resize', setup);
        
        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="absolute inset-0 z-0 block w-full h-full" />
        </div>
    );
};

export default DayNightTheme;
