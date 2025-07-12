
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
    diurnoMode?: boolean;
    astrologicalEvents?: boolean;
}

// --- Helper Functions ---

/**
 * Calculates the phase of the moon.
 * @param {Date} date The date to calculate the phase for.
 * @returns {number} The phase of the moon, from 0 (New Moon) to 1.
 * 0.0: New Moon
 * 0.25: First Quarter
 * 0.5: Full Moon
 * 0.75: Last Quarter
 */
const getMoonPhase = (date: Date = new Date()): number => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let r = year % 100;
    r %= 19;
    if (r > 9) { r -= 19; }
    r = ((r * 11) % 30) + month + day;
    if (month < 3) { r += 2; }
    
    r -= (year < 2000) ? 4 : 8.3;

    r = Math.floor(r + 0.5) % 30;

    return r < 0 ? r + 30 : r;
};

const getNormalizedMoonPhase = (date: Date = new Date()): number => {
    const age = getMoonPhase(date);
    const synodicMonth = 29.53;
    return age / synodicMonth;
};


// --- Component ---

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size, diurnoMode = false, astrologicalEvents = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const starsRef = useRef<any[]>([]);
    const shootingStarsRef = useRef<any[]>([]);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const now = new Date();
        const animationTotalFrames = 12000; // Longer cycle for better transitions
        
        // --- Cycle Progress ---
        const cycleProgress = diurnoMode
            ? (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400
            : (frame % animationTotalFrames) / animationTotalFrames;

        // --- Sky Colors ---
        const sunriseStart = 0.23, dayStart = 0.28, sunsetStart = 0.72, nightStart = 0.77;
        const colors = {
            night: [15, 23, 42],
            day: [135, 206, 250],
            sunrise: [252, 182, 193],
            sunset: [253, 186, 116],
        };

        let t = 0;
        let bgColor1, bgColor2;

        if (cycleProgress < sunriseStart || cycleProgress >= nightStart) { // Night
            bgColor1 = colors.night;
            bgColor2 = [colors.night[0] + 20, colors.night[1] + 20, colors.night[2] + 30]; // Lighter near horizon
        } else if (cycleProgress < dayStart) { // Sunrise
            t = (cycleProgress - sunriseStart) / (dayStart - sunriseStart);
            bgColor1 = lerpColor(colors.night, colors.sunrise, t);
            bgColor2 = lerpColor([colors.night[0] + 20, colors.night[1] + 20, colors.night[2] + 30], colors.day, t);
        } else if (cycleProgress < sunsetStart) { // Day
            bgColor1 = colors.day;
            bgColor2 = [colors.day[0] + 20, colors.day[1] + 20, colors.day[2] + 5]; // Lighter blue at horizon
        } else { // Sunset
            t = (cycleProgress - sunsetStart) / (nightStart - sunsetStart);
            bgColor1 = lerpColor(colors.day, colors.sunset, t);
            bgColor2 = lerpColor([colors.day[0] + 20, colors.day[1] + 20, colors.day[2] + 5], colors.night, t);
        }

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, `rgb(${bgColor1.join(',')})`);
        bgGradient.addColorStop(1, `rgb(${bgColor2.join(',')})`);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        // --- Night Effects ---
        const nightOpacity = Math.max(0, 1 - (Math.abs(cycleProgress - 0.5) / 0.25));
        if (nightOpacity > 0.1) {
            starsRef.current.forEach(star => {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * nightOpacity})`;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r * sizeRatio, 0, Math.PI * 2);
                ctx.fill();
            });
            if (astrologicalEvents) {
                shootingStarsRef.current.forEach(star => {
                    const gradient = ctx.createLinearGradient(star.x, star.y, star.x - star.len, star.y + star.len);
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${nightOpacity})`);
                    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = star.width * sizeRatio;
                    ctx.beginPath();
                    ctx.moveTo(star.x, star.y);
                    ctx.lineTo(star.x - star.len, star.y + star.len);
                    ctx.stroke();
                });
            }
        }
        
        // --- Celestial Bodies ---
        const celestialY = height * 0.8;
        const celestialRadiusX = width / 2.1;
        const celestialRadiusY = height / 1.8;
        const dayProgress = (cycleProgress - dayStart) / (sunsetStart - dayStart);
        const sunAngle = dayProgress * Math.PI;
        const sunX = width / 2 - Math.cos(sunAngle) * celestialRadiusX;
        const sunY = celestialY - Math.sin(sunAngle) * celestialRadiusY;
        const moonX = width / 2 - Math.cos(sunAngle + Math.PI) * celestialRadiusX;
        const moonY = celestialY - Math.sin(sunAngle + Math.PI) * celestialRadiusY;

        // Sun
        const sunRadius = 45 * sizeRatio;
        if (cycleProgress > sunriseStart && cycleProgress < nightStart) {
            const sunOpacity = Math.sin(dayProgress * Math.PI);
            if (sunOpacity > 0) {
                // Corona / Rays
                const coronaColor = '253, 224, 71';
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI / 6) * i + frame * 0.001 * speedRatio;
                    const length = sunRadius * (1.8 + Math.sin(frame * 0.05 * speedRatio + i*2) * 0.3);
                    ctx.beginPath();
                    ctx.strokeStyle = `rgba(${coronaColor}, ${0.1 * sunOpacity})`;
                    ctx.lineWidth = 3 * sizeRatio;
                    ctx.moveTo(sunX, sunY);
                    ctx.lineTo(sunX + Math.cos(angle) * length, sunY + Math.sin(angle) * length);
                    ctx.stroke();
                }
                // Sun body
                const sunColor = `rgb(255, 235, 150)`;
                const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
                sunGradient.addColorStop(0, `rgba(255, 255, 240, ${sunOpacity})`);
                sunGradient.addColorStop(0.8, `${sunColor}`);
                sunGradient.addColorStop(1, `rgba(251, 146, 60, 0)`);
                ctx.fillStyle = sunGradient;
                ctx.beginPath();
                ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
        
        // Moon
        const moonRadius = 35 * sizeRatio;
        if (cycleProgress < dayStart || cycleProgress > sunsetStart) {
            const moonOpacity = 1 - Math.sin(dayProgress * Math.PI);
            if (moonOpacity > 0) {
                const moonPhase = diurnoMode ? getNormalizedMoonPhase(now) : cycleProgress; // Use real phase in diurno
                const moonColor = `rgba(240, 240, 255, ${moonOpacity})`;

                // Moon glow
                const glowGradient = ctx.createRadialGradient(moonX, moonY, moonRadius, moonX, moonY, moonRadius * 2);
                glowGradient.addColorStop(0, `rgba(200, 220, 255, ${moonOpacity * 0.2})`);
                glowGradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
                ctx.fillStyle = glowGradient;
                ctx.beginPath();
                ctx.arc(moonX, moonY, moonRadius * 2, 0, 2 * Math.PI);
                ctx.fill();

                // Moon body
                ctx.save();
                ctx.translate(moonX, moonY);
                // Craters (subtle texture)
                if (!ctx.moonPattern) {
                    const patternCanvas = document.createElement('canvas');
                    patternCanvas.width = 100;
                    patternCanvas.height = 100;
                    const pctx = patternCanvas.getContext('2d')!;
                    for(let i=0; i<30; i++) {
                        pctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.08})`;
                        pctx.beginPath();
                        pctx.arc(Math.random() * 100, Math.random() * 100, Math.random() * 5 + 1, 0, Math.PI * 2);
                        pctx.fill();
                    }
                    ctx.moonPattern = ctx.createPattern(patternCanvas, 'repeat')!;
                }
                ctx.fillStyle = moonColor;
                ctx.beginPath();
                ctx.arc(0, 0, moonRadius, -Math.PI/2, Math.PI * 1.5);
                ctx.fill();
                ctx.fillStyle = ctx.moonPattern;
                ctx.globalAlpha = 0.5 * moonOpacity;
                ctx.fill();
                ctx.globalAlpha = 1;

                // Phase shadow
                ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
                const phaseAngle = moonPhase * 2 * Math.PI;
                ctx.beginPath();
                ctx.arc(0, 0, moonRadius, -Math.PI/2, Math.PI/2, false); // Right hemisphere
                ctx.arc(0, 0, moonRadius, Math.PI/2, -Math.PI/2, true); // Left hemisphere
                ctx.closePath();
                ctx.clip();
                
                const shadowX = moonRadius * 2 * (0.5 - moonPhase);
                ctx.translate(shadowX, 0);
                ctx.beginPath();
                ctx.arc(0, 0, moonRadius, 0, Math.PI*2);
                ctx.fill();
                ctx.restore();
            }
        }

    }, [diurnoMode, astrologicalEvents]);
    
    const lerpColor = (c1: number[], c2: number[], t: number): number[] => ([
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
    ]);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        // Star twinkling
        starsRef.current.forEach(star => {
            if (Math.random() > 0.99) {
                star.opacity = Math.random() * 0.7 + 0.3;
            }
        });
        
        // Less frequent shooting stars
        if (astrologicalEvents && Math.random() < 0.001 * speedRatio && shootingStarsRef.current.length < 2) {
            shootingStarsRef.current.push({
                x: Math.random() * width,
                y: Math.random() * height * 0.3,
                len: Math.random() * 120 + 40,
                speed: Math.random() * 3 + 4,
                width: Math.random() * 1.5 + 0.5,
            });
        }
        shootingStarsRef.current.forEach((star, index) => {
            star.x -= star.speed * speedRatio;
            star.y += star.speed / 4 * speedRatio;
            if (star.x < -star.len || star.y > height + star.len) {
                shootingStarsRef.current.splice(index, 1);
            }
        });
    }, [astrologicalEvents]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d') as  CanvasRenderingContext2D & { moonPattern?: CanvasPattern | null };
        if (!ctx) return;
        
        let frameCount = 0;
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const animate = () => {
            frameCount++;
            if (!diurnoMode) {
                update(canvas.width, canvas.height, speedRatio);
            }
            draw(ctx, frameCount, speedRatio, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            starsRef.current = [];
            for (let i = 0; i < 300 * sizeRatio; i++) {
                starsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.9,
                    r: Math.random() * 1.2,
                    opacity: Math.random() * 0.7 + 0.3
                });
            }
            ctx.moonPattern = null;
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
    }, [draw, update, speed, size, diurnoMode]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
};

export default DayNightTheme;

    