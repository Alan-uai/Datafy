
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
        const cycleDuration = 3600 / speedRatio; 
        const progress = (frame % cycleDuration) / cycleDuration; 

        const currentOpacity = initialAnimationProgress.current;

        // Colors
        const dayColor = { r: 135, g: 206, b: 235 }; // Sky Blue
        const nightColor = { r: 0, g: 0, b: 50 };     // Deep Blue
        const sunsetColor = { r: 255, g: 127, b: 80 };  // Coral/Orange
        const sunriseColor = { r: 255, g: 182, b: 193 }; // Light Pink

        let r, g, b;

        // Color transition logic
        if (progress < 0.45) { // Daytime
            r = dayColor.r; g = dayColor.g; b = dayColor.b;
        } else if (progress < 0.55) { // Sunset (Day -> Sunset)
            const t = (progress - 0.45) / 0.1;
            r = dayColor.r + (sunsetColor.r - dayColor.r) * t;
            g = dayColor.g + (sunsetColor.g - dayColor.g) * t;
            b = dayColor.b + (sunsetColor.b - dayColor.b) * t;
        } else if (progress < 0.9) { // Nighttime
            const t = (progress - 0.55) / 0.35;
            r = sunsetColor.r + (nightColor.r - sunsetColor.r) * t;
            g = sunsetColor.g + (nightColor.g - sunsetColor.g) * t;
            b = sunsetColor.b + (nightColor.b - sunsetColor.b) * t;
        } else { // Sunrise (Night -> Sunrise -> Day)
             const t = (progress - 0.9) / 0.1;
             if (t < 0.5) { // Night to Sunrise
                const t2 = t * 2;
                r = nightColor.r + (sunriseColor.r - nightColor.r) * t2;
                g = nightColor.g + (sunriseColor.g - nightColor.g) * t2;
                b = nightColor.b + (sunriseColor.b - nightColor.b) * t2;
             } else { // Sunrise to Day
                const t2 = (t-0.5) * 2;
                r = sunriseColor.r + (dayColor.r - sunriseColor.r) * t2;
                g = sunriseColor.g + (dayColor.g - sunriseColor.g) * t2;
                b = sunriseColor.b + (dayColor.b - sunriseColor.b) * t2;
             }
        }
        
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${currentOpacity})`);
        bgGradient.addColorStop(1, `rgba(${Math.max(0,r-100)}, ${Math.max(0,g-100)}, ${Math.max(0,b-100)}, ${currentOpacity})`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // Sun/Moon
        const sunMoonBaseRadius = 50 * sizeRatio;
        const pathRadius = Math.min(width, height) / 2.5 - sunMoonBaseRadius;
        const sunMoonAngle = progress * 2 * Math.PI - Math.PI / 2;
        const sunMoonX = width / 2 + pathRadius * Math.cos(sunMoonAngle);
        const sunMoonY = height / 2 + pathRadius * Math.sin(sunMoonAngle);
        
        // Opacity transition for Sun and Moon
        let sunOpacity = 0;
        let moonOpacity = 0;

        if (progress < 0.45 || progress >= 0.95) { // Sun is fully or partially visible
            sunOpacity = 1;
        } else if (progress >= 0.45 && progress < 0.55) { // Fading out
            sunOpacity = 1 - (progress - 0.45) / 0.1;
        }

        if (progress >= 0.5 && progress < 0.9) { // Moon is fully or partially visible
            moonOpacity = 1;
        } else if (progress >= 0.45 && progress < 0.55) { // Fading in
            moonOpacity = (progress - 0.45) / 0.1;
        } else if (progress >= 0.9 && progress < 0.95) { // Fading out
             moonOpacity = 1 - ((progress - 0.9) / 0.05);
        }


        // Draw Sun
        if (sunOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 0, ${sunOpacity * currentOpacity})`;
            ctx.beginPath();
            ctx.arc(sunMoonX, sunMoonY, sunMoonBaseRadius, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Draw Moon
        if (moonOpacity > 0) {
            ctx.fillStyle = `rgba(240, 240, 240, ${moonOpacity * currentOpacity})`;
            ctx.beginPath();
            ctx.arc(sunMoonX, sunMoonY, sunMoonBaseRadius * 0.8, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Stars
        if (progress > 0.55 && progress < 0.9) {
            const starsOpacity = Math.min(1, (progress - 0.55) / 0.1);
            ctx.fillStyle = `rgba(255, 255, 255, ${starsOpacity * currentOpacity})`;
            for (let i = 0; i < 100 * sizeRatio; i++) {
                const x = (i * 139) % width; // Use a simple hash to keep star positions consistent
                const y = (i * 379) % height;
                const r = ((i * 53) % 15) / 10;
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
        const animationDuration = 1000;

        const animate = (currentTime: DOMHighResTimeStamp = 0) => {
            if (initialAnimationProgress.current < 1) {
                const elapsed = currentTime - animationStartTime;
                initialAnimationProgress.current = Math.min(1, elapsed / animationDuration);
            } else {
                initialAnimationProgress.current = 1;
            }

            frameCount++;
            draw(ctx, frameCount, speedRatio, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            initialAnimationProgress.current = 0;
            animate(performance.now());
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
