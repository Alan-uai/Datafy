
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const initialAnimationProgress = useRef(0); // 0 to 1 for fade-in

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        const cycleDuration = 2400 / speedRatio; 
        const progress = (frame % cycleDuration) / cycleDuration; 

        const currentOpacity = initialAnimationProgress.current; // Current opacity for fade-in

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
        bgGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${currentOpacity})`);
        bgGradient.addColorStop(1, `rgba(${Math.max(0,r-100)}, ${Math.max(0,g-100)}, ${Math.max(0,b-100)}, ${currentOpacity})`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Sun/Moon
        const sunMoonBaseRadius = 50 * sizeRatio;
        const pathRadius = Math.min(width, height) / 2.5 - sunMoonBaseRadius;
        const sunMoonAngle = progress * 2 * Math.PI - Math.PI / 2; // Full 360-degree rotation
        const sunMoonX = width / 2 + pathRadius * Math.cos(sunMoonAngle);
        const sunMoonY = height / 2 + pathRadius * Math.sin(sunMoonAngle);
        
        // Determine sun/moon opacity based on progress
        let sunOpacity, moonOpacity;
        if (progress < 0.5) { // Day
            sunOpacity = 1;
            moonOpacity = 0;
        } else { // Night
            sunOpacity = 0;
            moonOpacity = 1;
        }

        // Draw Sun
        ctx.fillStyle = `rgba(255, 255, 0, ${sunOpacity * currentOpacity})`;
        ctx.beginPath();
        ctx.arc(sunMoonX, sunMoonY, sunMoonBaseRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw Moon
        ctx.fillStyle = `rgba(240, 240, 240, ${moonOpacity * currentOpacity})`;
        ctx.beginPath();
        ctx.arc(sunMoonX, sunMoonY, sunMoonBaseRadius * 0.8, 0, 2 * Math.PI);
        ctx.fill();


        // Stars
        if (progress > 0.6 && progress < 0.9) {
            ctx.fillStyle = `rgba(255, 255, 255, ${ ((progress - 0.6) / 0.3) * currentOpacity })`; // Apply opacity
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

        const animationStartTime = performance.now();
        const animationDuration = 1000; // 1 second fade-in

        const animate = (currentTime: DOMHighResTimeStamp = 0) => {
            if (initialAnimationProgress.current < 1) {
                const elapsed = currentTime - animationStartTime;
                initialAnimationProgress.current = Math.min(1, elapsed / animationDuration);
            } else {
                initialAnimationProgress.current = 1; // Ensure it's 1 after animation
            }

            frameCount++;
            draw(ctx, frameCount, speedRatio, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            // Reset initial animation progress and start time when setup is called (on mount or resize)
            initialAnimationProgress.current = 0;
            animate(performance.now()); // Pass current time to restart animation
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
