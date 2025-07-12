
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
    diurnoMode?: boolean;
    astrologicalEvents?: boolean;
}

// --- Helper Functions ---

// Simple function to get moon phase (0=New, 0.25=FirstQ, 0.5=Full, 0.75=LastQ)
const getMoonPhase = (date: Date): number => {
    const K = 2451550.1; // Julian date of a known new moon
    const JD = date.getTime() / 86400000 - 0.5 + 2440588;
    const age = (JD - K) % 29.530588853;
    return age / 29.530588853;
};

// Check for simulated eclipse days
const getEclipseState = (date: Date): { type: 'solar' | 'lunar' | 'none', progress: number } => {
    // Simulate eclipse on the first day of each quarter for fun
    const day = date.getDate();
    const month = date.getMonth();
    const isEclipseDay = day === 1 && (month === 0 || month === 3 || month === 6 || month === 9);
    
    if (!isEclipseDay) {
        return { type: 'none', progress: 0 };
    }

    const totalSeconds = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    const cycleProgress = totalSeconds / 86400; // 0 to 1 over 24 hours

    const isDayTime = cycleProgress > 0.25 && cycleProgress < 0.75; // Approx 6am to 6pm

    if (isDayTime) { // Solar Eclipse
        const eclipseStart = 0.48; // Near midday
        const eclipseEnd = 0.52;
        if (cycleProgress > eclipseStart && cycleProgress < eclipseEnd) {
            const progress = (cycleProgress - eclipseStart) / (eclipseEnd - eclipseStart);
            return { type: 'solar', progress: Math.sin(progress * Math.PI) }; // Use sin for smooth in/out
        }
    } else { // Lunar Eclipse (Blood Moon)
        const eclipseStart = 0.98; // Near midnight
        const eclipseEnd = 1.0; // Wraps around
        if (cycleProgress > eclipseStart || cycleProgress < 0.02) {
             let progress = cycleProgress > eclipseStart 
                ? (cycleProgress - eclipseStart) / 0.04
                : (cycleProgress + (1 - eclipseStart)) / 0.04;
             return { type: 'lunar', progress: Math.sin(progress * Math.PI) };
        }
    }

    return { type: 'none', progress: 0 };
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

        const eclipse = astrologicalEvents ? getEclipseState(now) : { type: 'none', progress: 0 };
        
        // --- Sky Colors ---
        const sunriseStart = 0.23, dayStart = 0.28, sunsetStart = 0.72, nightStart = 0.77;
        const colors = {
            night: [15, 23, 42],
            day: [135, 206, 250],
            sunrise: [252, 182, 193],
            sunset: [253, 186, 116],
            eclipse: [51, 65, 85],
            lunarEclipse: [127, 29, 29]
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

        // Apply eclipse overlay color
        if (diurnoMode && eclipse.type === 'solar' && eclipse.progress > 0) {
            bgColor1 = lerpColor(bgColor1, colors.eclipse, eclipse.progress);
            bgColor2 = lerpColor(bgColor2, colors.eclipse, eclipse.progress);
        }
        if (diurnoMode && eclipse.type === 'lunar' && eclipse.progress > 0) {
            bgColor1 = lerpColor(bgColor1, colors.lunarEclipse, eclipse.progress);
            bgColor2 = lerpColor(bgColor2, colors.lunarEclipse, eclipse.progress);
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
                const coronaColor = diurnoMode && eclipse.type === 'solar' && eclipse.progress > 0.5 ? '255, 255, 255' : '253, 224, 71';
                for (let i = 0; i < 12; i++) {
                    const angle = (Math.PI / 6) * i + frame * 0.001 * speedRatio;
                    const length = sunRadius * (1.8 + Math.sin(frame * 0.05 * speedRatio + i*2) * 0.3) * (1 - (diurnoMode ? eclipse.progress : 0));
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
                // Eclipse shadow
                if (diurnoMode && eclipse.type === 'solar' && eclipse.progress > 0) {
                    const shadowX = sunX + sunRadius * 1.5 * (1 - eclipse.progress * 2);
                    ctx.fillStyle = `rgb(${colors.night.join(',')})`;
                    ctx.beginPath();
                    ctx.arc(shadowX, sunY, sunRadius, 0, 2 * Math.PI);
                    ctx.fill();
                }
            }
        }
        
        // Moon
        const moonRadius = 35 * sizeRatio;
        if (cycleProgress < dayStart || cycleProgress > sunsetStart) {
            const moonOpacity = 1 - Math.sin(dayProgress * Math.PI);
            if (moonOpacity > 0) {
                const moonPhase = getMoonPhase(now);
                const moonColor = diurnoMode && eclipse.type === 'lunar' && eclipse.progress > 0.5 
                    ? `rgba(255,100,100,${moonOpacity})` // Blood moon
                    : `rgba(240, 240, 255, ${moonOpacity})`;

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
                const dir = (moonPhase > 0.5) ? -1 : 1;
                const shadowX = dir * moonRadius * Math.cos(phaseAngle);
                ctx.beginPath();
                ctx.arc(shadowX, 0, moonRadius, 0, 2 * Math.PI);
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

    