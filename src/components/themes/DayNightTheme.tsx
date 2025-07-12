
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
    diurnoMode?: boolean;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size, diurnoMode = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const starsRef = useRef<any[]>([]);

    const lerpColor = (colorA: number[], colorB: number[], t: number): string => {
        const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * t);
        const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * t);
        const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * t);
        return `rgb(${r}, ${g}, ${b})`;
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        let cycleProgress: number;

        if (diurnoMode) {
            const now = new Date();
            const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            cycleProgress = totalSeconds / 86400; // 86400 seconds in a day
        } else {
            const cycleDuration = 3600 / speedRatio;
            cycleProgress = (frame % cycleDuration) / cycleDuration;
        }

        const nightColor = [15, 23, 42]; // Slate 900
        const dayColor = [100, 116, 139]; // Slate 500
        const sunsetColor = [251, 146, 60]; // Orange 400
        const sunriseColor = [244, 114, 182]; // Pink 400

        let bgColor1, bgColor2;

        if (cycleProgress < 0.25) { // Night -> Sunrise
            const t = cycleProgress / 0.25;
            bgColor1 = lerpColor(nightColor, sunriseColor, t);
            bgColor2 = lerpColor(nightColor, dayColor, t);
        } else if (cycleProgress < 0.5) { // Sunrise -> Day
            const t = (cycleProgress - 0.25) / 0.25;
            bgColor1 = lerpColor(sunriseColor, dayColor, t);
            bgColor2 = lerpColor(dayColor, dayColor, t);
        } else if (cycleProgress < 0.75) { // Day -> Sunset
            const t = (cycleProgress - 0.5) / 0.25;
            bgColor1 = lerpColor(dayColor, sunsetColor, t);
            bgColor2 = lerpColor(dayColor, nightColor, t);
        } else { // Sunset -> Night
            const t = (cycleProgress - 0.75) / 0.25;
            bgColor1 = lerpColor(sunsetColor, nightColor, t);
            bgColor2 = lerpColor(nightColor, nightColor, t);
        }

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, bgColor1);
        bgGradient.addColorStop(1, bgColor2);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        const isNight = cycleProgress < 0.25 || cycleProgress > 0.75;
        let nightOpacity = 0;
        if (cycleProgress < 0.25) nightOpacity = 1 - (cycleProgress / 0.25);
        if (cycleProgress > 0.75) nightOpacity = (cycleProgress - 0.75) / 0.25;

        if (isNight) {
            ctx.fillStyle = `rgba(255, 255, 255, ${nightOpacity * 0.7})`;
            starsRef.current.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r * sizeRatio, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        
        const celestialPathY = height * 0.6;
        const celestialRadiusX = width / 2.2;
        const celestialRadiusY = height / 2.5;
        const angle = cycleProgress * 2 * Math.PI + Math.PI / 2;
        
        const x = width / 2 - Math.cos(angle) * celestialRadiusX;
        const y = celestialPathY - Math.sin(angle) * celestialRadiusY;
        
        // Sun
        const sunRadius = 40 * sizeRatio;
        const sunOpacity = 1 - nightOpacity;
        if (sunOpacity > 0) {
            const sunGradient = ctx.createRadialGradient(x, y, 0, x, y, sunRadius);
            sunGradient.addColorStop(0, `rgba(255, 255, 224, ${sunOpacity})`);
            sunGradient.addColorStop(1, `rgba(251, 146, 60, 0)`);
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(x, y, sunRadius * 2, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = `rgba(253, 224, 71, ${sunOpacity})`;
            ctx.beginPath();
            ctx.arc(x, y, sunRadius, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Moon
        const moonRadius = 30 * sizeRatio;
        if (nightOpacity > 0) {
            const moonGradient = ctx.createRadialGradient(x, y, 0, x, y, moonRadius);
            moonGradient.addColorStop(0, `rgba(241, 245, 249, ${nightOpacity})`);
            moonGradient.addColorStop(1, `rgba(241, 245, 249, 0)`);
            ctx.fillStyle = moonGradient;
            ctx.beginPath();
            ctx.arc(x, y, moonRadius * 2, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = `rgba(226, 232, 240, ${nightOpacity})`;
            ctx.beginPath();
            ctx.arc(x, y, moonRadius, 0, 2 * Math.PI);
            ctx.fill();
        }

    }, [diurnoMode]);
    
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
            starsRef.current = [];
            for (let i = 0; i < 200 * sizeRatio; i++) {
                starsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.8,
                    r: Math.random() * 1.5,
                });
            }
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        setup();
        window.addEventListener('resize', setup);
        
        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw, speed, size, diurnoMode]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default DayNightTheme;
