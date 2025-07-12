
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const lerpColor = (colorA: number[], colorB: number[], t: number) => {
        return colorA.map((c, i) => c + (colorB[i] - c) * t);
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const cycleDuration = 7200 / speedRatio;
        const totalProgress = (frame % cycleDuration) / cycleDuration; // 0 to 1

        // --- Define Colors ---
        const dayColor = [135, 206, 255];   // Sky Blue
        const nightColor = [0, 0, 30];       // Deep Blue
        const sunsetColor = [255, 140, 0];    // Orange
        const sunriseColor = [255, 182, 193];  // Pink

        // --- Determine Phase and Colors ---
        let bgColor;
        const dayPhaseProgress = totalProgress * 2;       // 0 to 1 during the day
        const nightPhaseProgress = (totalProgress - 0.5) * 2; // 0 to 1 during the night

        if (totalProgress < 0.5) { // Day Phase
            if (dayPhaseProgress < 0.1) { // Sunrise
                bgColor = lerpColor(sunriseColor, dayColor, dayPhaseProgress / 0.1);
            } else if (dayPhaseProgress > 0.9) { // Sunset
                bgColor = lerpColor(dayColor, sunsetColor, (dayPhaseProgress - 0.9) / 0.1);
            } else { // Daytime
                bgColor = dayColor;
            }
        } else { // Night Phase
            if (nightPhaseProgress < 0.1) { // Sunset -> Night
                bgColor = lerpColor(sunsetColor, nightColor, nightPhaseProgress / 0.1);
            } else if (nightPhaseProgress > 0.9) { // Night -> Sunrise
                bgColor = lerpColor(nightColor, sunriseColor, (nightPhaseProgress - 0.9) / 0.1);
            } else { // Nighttime
                bgColor = nightColor;
            }
        }
        
        const [r, g, b] = bgColor;
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, `rgb(${r}, ${g}, ${b})`);
        bgGradient.addColorStop(1, `rgb(${Math.max(0,r-80)}, ${Math.max(0,g-80)}, ${Math.max(0,b-80)})`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // --- Celestial Bodies ---
        const pathRadius = Math.min(width, height) / 2.5;

        // Sun
        if (totalProgress < 0.55) { // Render sun during day and sunset
            const sunAngle = dayPhaseProgress * Math.PI - Math.PI; // -PI to 0
            const sunX = width / 2 - pathRadius * Math.cos(sunAngle);
            const sunY = height / 1.5 - pathRadius * Math.sin(sunAngle);
            const sunRadius = 50 * sizeRatio * (1 + Math.sin(dayPhaseProgress * Math.PI) * 0.2); // Brighter/bigger at midday
            const sunOpacity = totalProgress < 0.45 ? 1 : 1 - ((totalProgress - 0.45) / 0.1);

            ctx.fillStyle = `rgba(255, 255, 0, ${sunOpacity})`;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Moon & Stars
        if (totalProgress > 0.45) { // Render moon during sunset and night
            const moonAngle = nightPhaseProgress * Math.PI - Math.PI; // -PI to 0
            const moonX = width / 2 - pathRadius * Math.cos(moonAngle);
            const moonY = height / 1.5 - pathRadius * Math.sin(moonAngle);
            const moonRadius = 40 * sizeRatio * (1 + Math.sin(nightPhaseProgress * Math.PI) * 0.2); // Bigger at midnight
            const moonOpacity = totalProgress < 0.55 ? (totalProgress - 0.45) / 0.1 : (totalProgress > 0.95 ? 1 - ((totalProgress - 0.95) / 0.05) : 1);
            
            // Stars
            if (moonOpacity > 0) {
                 ctx.fillStyle = `rgba(255, 255, 255, ${moonOpacity * 0.7})`;
                 for (let i = 0; i < 150 * sizeRatio; i++) {
                    const sx = ((i * 139) * (width/150)) % width;
                    const sy = ((i * 379) * (height/150)) % height;
                    const sr = ((i * 53) % 15) / 10 + 0.5;
                    ctx.beginPath();
                    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Moon
            ctx.fillStyle = `rgba(240, 240, 255, ${moonOpacity})`;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius, 0, 2 * Math.PI);
            ctx.fill();
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
