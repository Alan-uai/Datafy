
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
    diurnoMode?: boolean;
    astrologicalEvents?: boolean;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size, diurnoMode = false, astrologicalEvents = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const getMoonPhase = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
    
        let a = Math.floor((14 - month) / 12);
        let y = year + 4800 - a;
        let m = month + 12 * a - 3;
    
        let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        
        const synodicMonth = 29.53058867;
        const newMoonJDN = 2451549.5; // JDN of a known new moon (2000-01-06)
        
        const daysSinceNewMoon = jdn - newMoonJDN;
        const phase = (daysSinceNewMoon / synodicMonth) % 1;
        
        const age = phase * synodicMonth;
        const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * phase));
        
        return { age, illumination, phase };
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const now = new Date();
        const animationTotalFrames = 24000;
        
        const cycleProgress = diurnoMode
            ? (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400
            : (frame % animationTotalFrames) / animationTotalFrames;

        // Sky Colors
        const skyColors = getSkyColors(cycleProgress);
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, skyColors.top);
        bgGradient.addColorStop(0.6, skyColors.middle);
        bgGradient.addColorStop(1, skyColors.bottom);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        const isNight = cycleProgress < 0.25 || cycleProgress > 0.75;

        // Draw Sun and Moon
        drawCelestialBody(ctx, 'sun', { width, height, cycleProgress, sizeRatio, frame, speedRatio });
        drawCelestialBody(ctx, 'moon', { width, height, cycleProgress, sizeRatio, date: now });

    }, [diurnoMode]);

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
            const phaseInfo = getMoonPhase(p.date);
            
            ctx.save();
            ctx.translate(x, y);

            // Base Moon
            ctx.fillStyle = '#f0f0ff';
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Shadow
            ctx.fillStyle = '#444';
            ctx.beginPath();
            const phase = phaseInfo.phase; // 0 = New, 0.25 = First Q, 0.5 = Full, 0.75 = Last Q

            if (phase > 0 && phase < 1) {
                ctx.moveTo(0, -moonRadius);
                for (let i = -moonRadius; i <= moonRadius; i++) {
                    const angle = Math.acos(i / moonRadius);
                    const xPoint = moonRadius * Math.sin(angle);
                    const yPoint = moonRadius * Math.cos(angle);
                    
                    if (phase < 0.5) { // Waxing
                         ctx.lineTo(-xPoint * Math.cos(phase * 2 * Math.PI), yPoint);
                    } else { // Waning
                         ctx.lineTo(xPoint * Math.cos(phase * 2 * Math.PI), yPoint);
                    }
                }
                ctx.closePath();
                ctx.fill();
            }

            if(phase > 0.5) { // cover lit part for waning
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.rect(-moonRadius, -moonRadius, moonRadius, moonRadius * 2);
                ctx.fill();
            } else { // cover lit part for waxing
                ctx.fillStyle = '#444';
                ctx.beginPath();
                ctx.rect(0, -moonRadius, moonRadius, moonRadius * 2);
                ctx.fill();
            }
            
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
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
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
