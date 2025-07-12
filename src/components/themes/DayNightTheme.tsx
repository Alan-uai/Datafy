
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { MoonPhase } from 'astronomy-engine';
import dynamic from 'next/dynamic';

const Celestial = dynamic(() => import('d3-celestial'), {
  ssr: false,
  loading: () => null, // Or a loading spinner
});

interface AstroData {
  moonIllumination: ReturnType<typeof MoonPhase>;
  eclipseToday: 'solar' | 'lunar' | null;
  lat: number;
  lon: number;
}

interface DayNightThemeProps {
    speed: number;
    size: number;
    diurnoMode?: boolean;
    astrologicalEvents?: boolean;
}

const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size, diurnoMode = false, astrologicalEvents = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const celestialContainerRef = useRef<HTMLDivElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const [astro, setAstro] = useState<AstroData | null>(null);
    const [isLoadingAstro, setIsLoadingAstro] = useState(true);

    useEffect(() => {
        if (!diurnoMode) {
            setIsLoadingAstro(false);
            return;
        }
        setIsLoadingAstro(true);
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            fetch(`/api/astro-info?tz=${encodeURIComponent(tz)}`)
                .then(r => {
                    if (!r.ok) throw new Error(`API failed with status ${r.status}`);
                    return r.json();
                })
                .then(data => {
                    if (data.error) throw new Error(data.error);
                    setAstro(data);
                })
                .catch(console.error)
                .finally(() => setIsLoadingAstro(false));
        } catch (e) {
            console.error("Error getting timezone or fetching astro data", e);
            setIsLoadingAstro(false);
        }
    }, [diurnoMode]);

    useEffect(() => {
        if (!diurnoMode || !astro || !celestialContainerRef.current || !Celestial) return;
        
        celestialContainerRef.current.innerHTML = ''; // Clear previous map
        
        const config = {
            width: 0,
            height: 0,
            projection: "airy" as const,
            transform: "equatorial" as const,
            center: [astro.lon, astro.lat, 0],
            background: { fill: "transparent" },
            stars: {
                show: true,
                limit: 5,
                colors: true,
                style: { fill: "#ffffff", opacity: 1 },
                size: 1.2 * (size / 100),
            },
            constellations: {
                show: true,
                names: true,
                nameStyle: { fill: "#ffffff", font: `${10 * (size / 100)}px 'Helvetica', Arial, sans-serif`, align: "center", baseline: "middle", opacity: 0.6 },
                lines: true,
                lineStyle: { stroke: "#ffffff", width: 0.8, opacity: 0.4 },
            }
        };

        const celestial = (Celestial as any).Celestial();
        
        const resize = () => {
            if (!celestialContainerRef.current) return;
            const { width, height } = celestialContainerRef.current.getBoundingClientRect();
            celestial.display({ ...config, width, height, time: new Date() });
        };
        
        resize();
        window.addEventListener('resize', resize);

        return () => window.removeEventListener('resize', resize);
    }, [astro, diurnoMode, size, Celestial]);


    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const now = new Date();
        const animationTotalFrames = 24000;
        
        const cycleProgress = diurnoMode
            ? (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) / 86400
            : (frame % animationTotalFrames) / animationTotalFrames;

        const eclipse = astro?.eclipseToday ?? null;
        let eclipseProgress = 0;
        if (eclipse && diurnoMode) {
            const totalSecondsInDay = 86400;
            const currentSecond = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
            const peakTime = totalSecondsInDay / 2; // Simulate peak at midday UTC
            const duration = 14400; // 4 hours duration
            
            if (Math.abs(currentSecond - peakTime) < duration / 2) {
                eclipseProgress = Math.sin(( (currentSecond - (peakTime - duration/2)) / duration ) * Math.PI);
            }
        }
        
        const dayProgress = cycleProgress * 2; // 0 to 2
        
        // Sky Colors
        const skyColors = getSkyColors(cycleProgress);
        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, skyColors.top);
        bgGradient.addColorStop(0.6, skyColors.middle);
        bgGradient.addColorStop(1, skyColors.bottom);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Night effects (stars, etc.)
        const nightOpacity = Math.max(0, 1 - (Math.abs(cycleProgress - 0.5) / 0.25) * 4);
        if (diurnoMode && celestialContainerRef.current) {
             celestialContainerRef.current.style.opacity = `${nightOpacity}`;
        }

        // Draw Sun and Moon
        drawCelestialBody(ctx, 'sun', { width, height, dayProgress, sizeRatio, frame, speedRatio, eclipse, eclipseProgress });
        drawCelestialBody(ctx, 'moon', { width, height, dayProgress, sizeRatio, astro, eclipse, eclipseProgress });

    }, [diurnoMode, astro]);

    const lerpColor = (c1: number[], c2: number[], t: number): number[] => ([
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t),
    ]);
    
    const getSkyColors = (progress: number) => {
        const nightTop = [15, 23, 42];
        const nightMid = [25, 35, 60];
        const nightBot = [30, 40, 70];
        
        const dawnTop = [115, 125, 180];
        const dawnMid = [252, 182, 193];
        const dawnBot = [253, 224, 71];

        const dayTop = [135, 206, 250];
        const dayMid = [170, 220, 255];
        const dayBot = [240, 248, 255];
        
        const duskTop = [115, 125, 180];
        const duskMid = [253, 186, 116];
        const duskBot = [255, 100, 150];

        let top, middle, bottom;

        if (progress < 0.23 || progress > 0.77) { top = nightTop; middle = nightMid; bottom = nightBot; }
        else if (progress < 0.28) { let t = (progress - 0.23) / 0.05; top = lerpColor(nightTop, dawnTop, t); middle = lerpColor(nightMid, dawnMid, t); bottom = lerpColor(nightBot, dawnBot, t); } 
        else if (progress < 0.5) { let t = (progress - 0.28) / 0.22; top = lerpColor(dawnTop, dayTop, t); middle = lerpColor(dawnMid, dayMid, t); bottom = lerpColor(dawnBot, dayBot, t); } 
        else if (progress < 0.72) { let t = (progress - 0.5) / 0.22; top = lerpColor(dayTop, duskTop, t); middle = lerpColor(dayMid, duskMid, t); bottom = lerpColor(dayBot, duskBot, t); }
        else { let t = (progress - 0.72) / 0.05; top = lerpColor(duskTop, nightTop, t); middle = lerpColor(duskMid, nightMid, t); bottom = lerpColor(duskBot, nightBot, t); }

        return { top: `rgb(${top.join(',')})`, middle: `rgb(${middle.join(',')})`, bottom: `rgb(${bottom.join(',')})` };
    };
    
    const drawCelestialBody = (ctx: CanvasRenderingContext2D, type: 'sun' | 'moon', p: any) => {
        const isDay = p.dayProgress > 0.5 && p.dayProgress < 1.5;
        let isVisible = (type === 'sun' && isDay) || (type === 'moon' && !isDay);
        if (!isVisible && !p.eclipse) return;

        const bodyProgress = type === 'sun' ? (p.dayProgress - 0.5) * Math.PI : (p.dayProgress - 1.5) * Math.PI;
        const x = p.width / 2 - Math.cos(bodyProgress) * p.width / 2.1;
        const y = p.height * 0.9 - Math.sin(bodyProgress) * p.height / 1.5;

        if (type === 'sun') {
            const sunRadius = 45 * p.sizeRatio;
            ctx.fillStyle = `rgba(255, 235, 150, 1)`;
            ctx.beginPath();
            ctx.arc(x, y, sunRadius, 0, 2 * Math.PI);
            ctx.fill();

            if (p.eclipse === 'solar' && p.eclipseProgress > 0) {
                ctx.fillStyle = 'rgb(15, 23, 42)';
                ctx.beginPath();
                ctx.arc(x, y, sunRadius * 1.05, 0, 2 * Math.PI);
                ctx.fill();
            }
        } else { // Moon
            const moonRadius = 35 * p.sizeRatio;
            if (!p.astro?.moonIllumination) return;

            let brightColor = [240, 240, 255];
            if (p.eclipse === 'lunar' && p.eclipseProgress > 0) {
                brightColor = lerpColor(brightColor, [150, 60, 40], p.eclipseProgress);
            }
            
            ctx.save();
            ctx.translate(x, y);
            
            ctx.fillStyle = `rgba(100, 100, 110, 0.8)`;
            ctx.beginPath();
            ctx.arc(0, 0, moonRadius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = `rgb(${brightColor.join(',')})`;
            ctx.beginPath();
            const phaseAngle = p.astro.moonIllumination.phaseAngle; 
            const k = p.astro.moonIllumination.fraction; 
            
            const illuminatedX = Math.cos(phaseAngle * Math.PI / 180) * moonRadius;
            
            if (k < 0.01) { }
            else if (k > 0.99) { ctx.arc(0, 0, moonRadius, 0, Math.PI * 2); }
            else if (phaseAngle < 180) { // Waxing
              ctx.arc(0, 0, moonRadius, -Math.PI / 2, Math.PI / 2);
              ctx.bezierCurveTo(-illuminatedX, moonRadius, -illuminatedX, -moonRadius, 0, -moonRadius);
            } else { // Waning
              ctx.arc(0, 0, moonRadius, Math.PI / 2, -Math.PI / 2);
              ctx.bezierCurveTo(-illuminatedX, -moonRadius, -illuminatedX, moonRadius, 0, moonRadius);
            }
            ctx.fill();
            ctx.restore();
        }
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        if (isLoadingAstro) return;
        
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
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if(celestialContainerRef.current) celestialContainerRef.current.innerHTML = '';
        };
    }, [draw, speed, size, isLoadingAstro]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <div ref={celestialContainerRef} id="celestial-map" className="absolute inset-0 z-10 transition-opacity duration-1000"></div>
            <canvas ref={canvasRef} className="absolute inset-0 z-0 block w-full h-full" />
        </div>
    );
};

export default DayNightTheme;
