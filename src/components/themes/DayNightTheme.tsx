
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        const cycleDuration = 2400 / speedRatio; // Faster cycle with higher speed
        const progress = (frame % cycleDuration) / cycleDuration; // 0 to 1

        // Sky gradient
        const dayColor = { r: 135, g: 206, b: 235 };
        const nightColor = { r: 0, g: 0, b: 50 };
        const sunriseColor = { r: 255, g: 127, b: 80 };

        let r, g, b;
        if (progress < 0.45) { // Day
            r = dayColor.r; g = dayColor.g; b = dayColor.b;
        } else if (progress < 0.55) { // Sunset
            const t = (progress - 0.45) / 0.1;
            r = dayColor.r + (sunriseColor.r - dayColor.r) * t;
            g = dayColor.g + (sunriseColor.g - dayColor.g) * t;
            b = dayColor.b + (sunriseColor.b - dayColor.b) * t;
        } else if (progress < 0.95) { // Night
             const t = (progress - 0.55) / 0.4;
             r = sunriseColor.r + (nightColor.r - sunriseColor.r) * t;
             g = sunriseColor.g + (nightColor.g - sunriseColor.g) * t;
             b = sunriseColor.b + (nightColor.b - sunriseColor.b) * t;
        } else { // Sunrise
             const t = (progress - 0.95) / 0.05;
             r = nightColor.r + (sunriseColor.r - nightColor.r) * t;
             g = nightColor.g + (sunriseColor.g - nightColor.g) * t;
             b = nightColor.b + (sunriseColor.b - nightColor.b) * t;
        }
        
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
        bgGradient.addColorStop(1, `rgb(${Math.max(0,r-100)}, ${Math.max(0,g-100)}, ${Math.max(0,b-100)})`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Sun/Moon
        const sunMoonBaseRadius = 50 * sizeRatio;
        const pathRadius = Math.min(width, height) / 2 - sunMoonBaseRadius - 20;
        const sunMoonAngle = progress * 2 * Math.PI - Math.PI / 2;
        const sunMoonX = width / 2 + pathRadius * Math.cos(sunMoonAngle);
        const sunMoonY = height / 2 + pathRadius * Math.sin(sunMoonAngle);

        if (progress < 0.5) { // Sun visible
            ctx.fillStyle = `rgba(255, 255, 0, ${1 - (progress / 0.5)})`;
            ctx.beginPath();
            ctx.arc(sunMoonX, sunMoonY, sunMoonBaseRadius, 0, 2 * Math.PI);
            ctx.fill();
        } else { // Moon visible
            ctx.fillStyle = `rgba(240, 240, 240, ${(progress - 0.5) / 0.5})`;
            ctx.beginPath();
            ctx.arc(sunMoonX, sunMoonY, sunMoonBaseRadius * 0.8, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Stars
        if (progress > 0.6 && progress < 0.9) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.6) / 0.3})`;
            for (let i = 0; i < 100 * sizeRatio; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const r = Math.random() * 1.5;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
    }, []);
    
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
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw, speed, size]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default DayNightTheme;
