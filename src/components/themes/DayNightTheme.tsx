
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

const DayNightTheme = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;
        const cycleDuration = 1200; // 20 seconds for a full cycle (1200 frames at 60fps)
        const progress = (frame % cycleDuration) / cycleDuration; // 0 to 1

        // Determine if it's day or night
        const isDay = progress < 0.5;
        const transitionProgress = isDay ? (progress / 0.5) : ((progress - 0.5) / 0.5);

        // Background gradient
        let bgGradient;
        if (isDay) {
            // Day: light blue to lighter blue
            const dayStart = { r: 135, g: 206, b: 235 }; // Sky blue
            const dayEnd = { r: 173, g: 216, b: 230 }; // Light blue
            bgGradient = ctx.createLinearGradient(0, 0, 0, height);
            bgGradient.addColorStop(0, `rgb(${dayStart.r}, ${dayStart.g}, ${dayStart.b})`);
            bgGradient.addColorStop(1, `rgb(${dayEnd.r}, ${dayEnd.g}, ${dayEnd.b})`);
        } else {
            // Night: dark blue to black
            const nightStart = { r: 0, g: 0, b: 50 }; // Dark blue
            const nightEnd = { r: 0, g: 0, b: 0 }; // Black
            bgGradient = ctx.createLinearGradient(0, 0, 0, height);
            bgGradient.addColorStop(0, `rgb(${nightStart.r}, ${nightStart.g}, ${nightStart.b})`);
            bgGradient.addColorStop(1, `rgb(${nightEnd.r}, ${nightEnd.g}, ${nightEnd.b})`);
        }
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Sun/Moon
        const sunMoonRadius = 50;
        const pathRadius = Math.min(width, height) / 2 - sunMoonRadius - 20;
        const sunMoonAngle = progress * 2 * Math.PI - Math.PI / 2;
        const sunMoonX = width / 2 + pathRadius * Math.cos(sunMoonAngle);
        const sunMoonY = height / 2 + pathRadius * Math.sin(sunMoonAngle);

        if (isDay) {
            // Sun
            ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.beginPath();
            ctx.arc(sunMoonX, sunMoonY, sunMoonRadius, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            // Moon
            ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
            ctx.beginPath();
            ctx.arc(sunMoonX, sunMoonY, sunMoonRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
        
    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frameCount = 0;

        const animate = () => {
            frameCount++;
            draw(ctx, frameCount);
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
    }, [draw]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default DayNightTheme;
