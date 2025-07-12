
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
 * Calculates the phase of the moon based on a simple algorithm.
 * @returns {object} { phase: (0-1), name: string }
 */
const getMoonPhase = (date: Date = new Date()): { phase: number, name: string, isWaxing: boolean, age: number } => {
    const synodicMonth = 29.53058867;
    const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
    const ageInDays = ((date.getTime() - knownNewMoon) / (1000 * 60 * 60 * 24)) % synodicMonth;
    const phase = ageInDays / synodicMonth;

    const names = ["Lua Nova", "Crescente Minguante", "Quarto Crescente", "Crescente Gibosa", "Lua Cheia", "Minguante Gibosa", "Quarto Minguante", "Minguante Crescente"];
    let name = names[Math.floor(phase * 8 + 0.5) % 8];
    const isWaxing = phase <= 0.5;

    return { phase, name, isWaxing, age: ageInDays };
};

/**
 * Checks for eclipse conditions (simplified simulation).
 * An eclipse is plausible near equinoxes/solstices if the moon phase is correct.
 * @returns { 'solar' | 'lunar' | null }
 */
const getEclipseType = (date: Date): 'solar' | 'lunar' | null => {
    const { phase, age } = getMoonPhase(date);
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Check if near an equinox or solstice (approx. days 80, 172, 265, 355)
    const isNearNode = [80, 172, 265, 355].some(nodeDay => Math.abs(dayOfYear - nodeDay) <= 2);
    
    if (!isNearNode) return null;

    if (age < 1 || age > 28.5) { // Near New Moon
        return 'solar';
    }
    if (age > 14 && age < 15.5) { // Near Full Moon
        return 'lunar';
    }
    return null;
}


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
        const animationTotalFrames = 24000;
        
        const cycleProgress = diurnoMode
            ? (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400
            : (frame % animationTotalFrames) / animationTotalFrames;

        const eclipse = diurnoMode && astrologicalEvents ? getEclipseType(now) : null;
        let eclipseProgress = 0;
        if (eclipse) {
            const hour = now.getHours();
            if (eclipse === 'solar' && hour >= 10 && hour <= 15) { // Simulate solar eclipse around midday
                eclipseProgress = Math.sin(( (hour - 10) / 5 ) * Math.PI) * 1.1;
            } else if (eclipse === 'lunar' && (hour >= 22 || hour <= 3)) { // Simulate lunar eclipse late night
                 const midnightOffset = hour >= 22 ? hour - 22 : hour + 2;
                 eclipseProgress = Math.sin((midnightOffset / 5) * Math.PI);
            }
        }
        
        const sunriseStart = 0.23, sunriseEnd = 0.28, sunsetStart = 0.72, sunsetEnd = 0.77;
        let skyColors;
        if (eclipse === 'solar' && eclipseProgress > 0) {
            skyColors = getSkyColors(cycleProgress, sunriseStart, sunriseEnd, sunsetStart, sunsetEnd, `rgba(25,25,50, ${eclipseProgress})`);
        } else {
            skyColors = getSkyColors(cycleProgress, sunriseStart, sunriseEnd, sunsetStart, sunsetEnd);
        }

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, skyColors.top);
        bgGradient.addColorStop(1, skyColors.bottom);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        const nightOpacity = Math.max(0, 1 - (Math.abs(cycleProgress - 0.5) / 0.25) * 4);
        const nightEffectOpacity = eclipse === 'solar' ? Math.max(nightOpacity, eclipseProgress) : nightOpacity;
        if (nightEffectOpacity > 0.1) {
            drawStars(ctx, starsRef.current, sizeRatio, nightEffectOpacity);
            if (astrologicalEvents) {
                drawShootingStars(ctx, shootingStarsRef.current, sizeRatio, nightEffectOpacity);
            }
        }
        
        const dayProgress = (cycleProgress - sunriseEnd) / (sunsetStart - sunriseEnd);
        drawCelestialBody(ctx, 'sun', { width, height, dayProgress, sizeRatio, frame, speedRatio, cycleProgress, sunriseStart, sunsetEnd, eclipse, eclipseProgress });
        drawCelestialBody(ctx, 'moon', { width, height, dayProgress, sizeRatio, now, diurnoMode, cycleProgress, sunriseEnd, sunsetStart, eclipse, eclipseProgress });

    }, [diurnoMode, astrologicalEvents]);

    const lerpColor = (c1: number[], c2: number[], t: number): number[] => ([
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
    ]);
    
    const getSkyColors = (progress: number, sunriseStart: number, sunriseEnd: number, sunsetStart: number, sunsetEnd: number, overrideColor?: string) => {
        const colors = {
            night: [[15, 23, 42], [30, 40, 70]],
            day: [[135, 206, 250], [240, 248, 255]],
            sunrise: [[252, 182, 193], [253, 224, 71]],
            sunset: [[253, 186, 116], [255, 100, 150]],
        };
        let c1, c2, t=0;

        if (progress < sunriseStart || progress >= sunsetEnd) { [c1, c2] = colors.night; } 
        else if (progress < sunriseEnd) { t = (progress - sunriseStart) / (sunriseEnd - sunriseStart); c1 = lerpColor(colors.night[0], colors.sunrise[0], t); c2 = lerpColor(colors.night[1], colors.sunrise[1], t); }
        else if (progress < sunsetStart) { [c1, c2] = colors.day; }
        else { t = (progress - sunsetStart) / (sunsetEnd - sunsetStart); c1 = lerpColor(colors.day[0], colors.sunset[0], t); c2 = lerpColor(colors.day[1], colors.sunset[1], t); }

        if(overrideColor) return { top: overrideColor, bottom: overrideColor };
        return { top: `rgb(${c1.join(',')})`, bottom: `rgb(${c2.join(',')})` };
    };

    const drawStars = (ctx: CanvasRenderingContext2D, stars: any[], sizeRatio: number, opacity: number) => {
        stars.forEach(star => {
            const flickerOpacity = star.opacity * (0.6 + Math.sin(star.flicker * performance.now() / 1000) * 0.4);
            ctx.fillStyle = `rgba(255, 255, 255, ${flickerOpacity * opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.r * sizeRatio, 0, Math.PI * 2);
            ctx.fill();
        });
    };

    const drawShootingStars = (ctx: CanvasRenderingContext2D, shootingStars: any[], sizeRatio: number, opacity: number) => {
        shootingStars.forEach(star => {
            const gradient = ctx.createLinearGradient(star.x, star.y, star.x - star.len, star.y + star.len);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = star.width * sizeRatio;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - star.len, star.y + star.len);
            ctx.stroke();
        });
    };
    
    const drawCelestialBody = (ctx: CanvasRenderingContext2D, type: 'sun' | 'moon', p: any) => {
        const celestialY = p.height * 0.9;
        const celestialRadiusX = p.width / 2.1;
        const celestialRadiusY = p.height / 1.5;
        const angle = p.dayProgress * Math.PI + (type === 'moon' ? Math.PI : 0);
        const x = p.width / 2 - Math.cos(angle) * celestialRadiusX;
        const y = celestialY - Math.sin(angle) * celestialRadiusY;
        
        let isVisible = false;
        if (type === 'sun' && p.cycleProgress > p.sunriseStart && p.cycleProgress < p.sunsetEnd) isVisible = true;
        if (type === 'moon' && (p.cycleProgress < p.sunriseEnd || p.cycleProgress > p.sunsetStart)) isVisible = true;
        if (!isVisible) return;
        
        const opacity = Math.sin(p.dayProgress * Math.PI + (type === 'moon' ? Math.PI : 0));
        if (opacity <= 0) return;

        if (type === 'sun') {
            const sunRadius = 45 * p.sizeRatio;
            // Corona
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI / 6) * i + p.frame * 0.001 * p.speedRatio;
                const length = sunRadius * (1.8 + Math.sin(p.frame * 0.05 * p.speedRatio + i * 2) * 0.3);
                const rayOpacity = 0.1 * opacity * (1 - p.eclipseProgress);
                ctx.strokeStyle = `rgba(253, 224, 71, ${rayOpacity})`;
                ctx.lineWidth = (3 + Math.sin(p.frame * 0.07 * p.speedRatio + i) * 2) * p.sizeRatio;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
                ctx.stroke();
            }
            ctx.restore();
            // Sun Body
            const sunGradient = ctx.createRadialGradient(x, y, 0, x, y, sunRadius);
            sunGradient.addColorStop(0, `rgba(255, 255, 240, ${opacity})`);
            sunGradient.addColorStop(0.8, `rgb(255, 235, 150)`);
            sunGradient.addColorStop(1, `rgba(251, 146, 60, 0)`);
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(x, y, sunRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Solar Eclipse
            if (p.eclipse === 'solar' && p.eclipseProgress > 0) {
                ctx.fillStyle = 'rgb(15, 23, 42)';
                ctx.beginPath();
                ctx.arc(x + (p.width * 0.01), y - (p.height * 0.01), sunRadius * 1.05, 0, 2 * Math.PI);
                ctx.clip(); // clip sun body
                ctx.beginPath();
                ctx.arc(x - sunRadius*2 + p.eclipseProgress * sunRadius * 4, y, sunRadius * 1.05, 0, 2 * Math.PI);
                ctx.fill();
            }

        } else { // Moon
            const moonRadius = 35 * p.sizeRatio;
            const moonData = getMoonPhase(p.diurnoMode ? p.now : undefined);
            const phase = p.diurnoMode ? moonData.phase : p.cycleProgress;

            // Moon Glow
            const glowGradient = ctx.createRadialGradient(x, y, moonRadius, x, y, moonRadius * 2);
            glowGradient.addColorStop(0, `rgba(200, 220, 255, ${opacity * 0.2})`);
            glowGradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(x, y, moonRadius * 2, 0, 2 * Math.PI);
            ctx.fill();
            
            // Lunar Eclipse
            let moonColor = [240, 240, 255];
            if (p.eclipse === 'lunar' && p.eclipseProgress > 0) {
                const redColor = [150, 60, 40];
                moonColor = lerpColor(moonColor, redColor, p.eclipseProgress);
            }
            ctx.fillStyle = `rgba(${moonColor.join(',')}, ${opacity})`;

            // Draw Moon with realistic phase
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, Math.PI * 2);
            ctx.fill();

            // Draw phase shadow
            const angle = Math.PI - phase * Math.PI * 2;
            const c = Math.cos(angle);
            const s = Math.sin(angle);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
            ctx.beginPath();
            if (Math.abs(c) > 0.001) {
                ctx.moveTo(0, -moonRadius);
                ctx.arcTo(moonRadius / c, 0, 0, moonRadius, moonRadius);
                ctx.lineTo(0, moonRadius);
            }
            if (s > 0) ctx.arc(0, 0, moonRadius, Math.PI * 1.5, Math.PI * 0.5, true);
            else ctx.arc(0, 0, moonRadius, Math.PI * 0.5, Math.PI * 1.5, true);
            ctx.fill();
            ctx.restore();
        }
    };

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        if (astrologicalEvents && Math.random() < 0.0005 * speedRatio && shootingStarsRef.current.length < 1) {
            shootingStarsRef.current.push({
                x: Math.random() * width, y: Math.random() * height * 0.2, len: Math.random() * 120 + 40,
                speed: Math.random() * 3 + 4, width: Math.random() * 1.5 + 0.5,
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
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frameCount = 0;
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const animate = () => {
            frameCount++;
            if (!diurnoMode) update(canvas.width, canvas.height, speedRatio);
            draw(ctx, frameCount, speedRatio, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            starsRef.current = [];
            for (let i = 0; i < 400 * sizeRatio; i++) {
                starsRef.current.push({
                    x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.9,
                    r: Math.random() * 1.2, opacity: Math.random() * 0.7 + 0.3,
                    flicker: Math.random() * 5
                });
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
    }, [draw, update, speed, size, diurnoMode]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
};

export default DayNightTheme;

    