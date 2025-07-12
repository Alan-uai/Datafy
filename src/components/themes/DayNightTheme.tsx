
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DayNightThemeProps {
    speed: number;
    size: number;
    diurnoMode?: boolean;
    astrologicalEvents?: boolean;
}

// Simple function to get moon phase (0=New, 0.25=FirstQ, 0.5=Full, 0.75=LastQ)
const getMoonPhase = (date: Date): number => {
    const K = 2451550.1; // Julian date of a known new moon
    const T = (date.getTime() / 86400000 - 10957.5) / 365.25;
    const JD = date.getTime() / 86400000 - 0.5 + 2440588;
    const M = (359.2242 + 29.105356 * T);
    const Mprime = (306.0253 + 385.816918 * T);
    const F = (21.2964 + 390.670506 * T);
    let P = -0.4068 * Math.sin(Mprime * Math.PI/180) + (0.1734 - 0.000393*T) * Math.sin(M * Math.PI/180) + 0.0161*Math.sin(2*Mprime * Math.PI/180) - 0.0097*Math.sin(2*F * Math.PI/180) - 0.0073*Math.sin((Mprime-M) * Math.PI/180) + 0.0050*Math.sin((Mprime+M) * Math.PI/180);
    const age = (JD - K) % 29.530588853;
    return age / 29.530588853;
};


const DayNightTheme: React.FC<DayNightThemeProps> = ({ speed, size, diurnoMode = false, astrologicalEvents = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const starsRef = useRef<any[]>([]);
    const shootingStarsRef = useRef<any[]>([]);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        let cycleProgress: number;
        const now = new Date();

        if (diurnoMode) {
            const totalSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
            cycleProgress = totalSeconds / 86400; // 86400 seconds in a day
        } else {
            const cycleDuration = 7200 / speedRatio;
            cycleProgress = (frame % cycleDuration) / cycleDuration;
        }

        const sunriseStart = 0.20; // 4:48 AM
        const dayStart = 0.30;     // 7:12 AM
        const sunsetStart = 0.70;  // 5:12 PM
        const nightStart = 0.80;   // 7:12 PM

        const nightColor = [15, 23, 42]; // Slate 900
        const dayColor = [135, 206, 235]; // Sky Blue
        const sunsetColor = [251, 146, 60]; // Orange 400
        const sunriseColor = [244, 114, 182]; // Pink 400

        let bgColor1, bgColor2;
        let t = 0;

        if (cycleProgress < sunriseStart) { // Deep Night
            bgColor1 = `rgb(${nightColor.join(',')})`;
            bgColor2 = `rgb(${nightColor.join(',')})`;
        } else if (cycleProgress < dayStart) { // Sunrise
            t = (cycleProgress - sunriseStart) / (dayStart - sunriseStart);
            bgColor1 = `rgb(${Math.round(nightColor[0] + (sunriseColor[0] - nightColor[0]) * t)}, ${Math.round(nightColor[1] + (sunriseColor[1] - nightColor[1]) * t)}, ${Math.round(nightColor[2] + (sunriseColor[2] - nightColor[2]) * t)})`;
            bgColor2 = `rgb(${Math.round(nightColor[0] + (dayColor[0] - nightColor[0]) * t)}, ${Math.round(nightColor[1] + (dayColor[1] - nightColor[1]) * t)}, ${Math.round(nightColor[2] + (dayColor[2] - nightColor[2]) * t)})`;
        } else if (cycleProgress < sunsetStart) { // Day
            bgColor1 = `rgb(${dayColor.join(',')})`;
            bgColor2 = `rgb(${dayColor.join(',')})`;
        } else if (cycleProgress < nightStart) { // Sunset
            t = (cycleProgress - sunsetStart) / (nightStart - sunsetStart);
            bgColor1 = `rgb(${Math.round(dayColor[0] + (sunsetColor[0] - dayColor[0]) * t)}, ${Math.round(dayColor[1] + (sunsetColor[1] - dayColor[1]) * t)}, ${Math.round(dayColor[2] + (sunsetColor[2] - dayColor[2]) * t)})`;
            bgColor2 = `rgb(${Math.round(dayColor[0] + (nightColor[0] - dayColor[0]) * t)}, ${Math.round(dayColor[1] + (nightColor[1] - dayColor[1]) * t)}, ${Math.round(dayColor[2] + (nightColor[2] - nightColor[2]) * t)})`;
        } else { // Night
            bgColor1 = `rgb(${nightColor.join(',')})`;
            bgColor2 = `rgb(${nightColor.join(',')})`;
        }

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, bgColor1);
        bgGradient.addColorStop(1, bgColor2);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);

        // Night effects (stars, moon, meteors)
        const isNight = cycleProgress < dayStart || cycleProgress > sunsetStart;
        let nightOpacity = 0;
        if (cycleProgress < sunriseStart) nightOpacity = 1;
        else if (cycleProgress < dayStart) nightOpacity = 1 - t;
        else if (cycleProgress > nightStart) nightOpacity = 1;
        else if (cycleProgress > sunsetStart) nightOpacity = t;

        if (isNight && nightOpacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${nightOpacity * 0.7})`;
            starsRef.current.forEach(star => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r * sizeRatio, 0, Math.PI * 2);
                ctx.fill();
            });

            // Shooting stars
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
        
        // Celestial body (Sun/Moon) position calculation
        const celestialPathY = height * 0.7;
        const celestialRadiusX = width / 2.1;
        const celestialRadiusY = height / 2.2;
        const dayAngle = (cycleProgress - dayStart) / (sunsetStart - dayStart) * Math.PI; // 0 to PI
        const nightAngle = ((cycleProgress - nightStart + 1) % 1) / (1 - nightStart + dayStart) * Math.PI; // 0 to PI

        const sunX = width / 2 - Math.cos(dayAngle) * celestialRadiusX;
        const sunY = celestialPathY - Math.sin(dayAngle) * celestialRadiusY;
        const moonX = width / 2 - Math.cos(nightAngle) * celestialRadiusX;
        const moonY = celestialPathY - Math.sin(nightAngle) * celestialRadiusY;

        // Sun
        const sunRadius = 40 * sizeRatio;
        const sunOpacity = 1 - nightOpacity;
        if (sunOpacity > 0 && cycleProgress > sunriseStart && cycleProgress < nightStart) {
            const middayProgress = Math.sin(dayAngle); // 0 -> 1 -> 0
            const sunColor = lerpColor([253, 224, 71], [255, 255, 255], middayProgress * 0.5);

            const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
            sunGradient.addColorStop(0, `rgba(255, 255, 224, ${sunOpacity * 0.8})`);
            sunGradient.addColorStop(0.5, `rgba(${sunColor.r},${sunColor.g},${sunColor.b}, ${sunOpacity * 0.6})`);
            sunGradient.addColorStop(1, `rgba(251, 146, 60, 0)`);
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius * (1.5 + middayProgress * 0.5), 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = `rgba(${sunColor.r},${sunColor.g},${sunColor.b}, ${sunOpacity})`;
            ctx.beginPath();
            ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI);
            ctx.fill();
        }

        // Moon
        const moonRadius = 30 * sizeRatio;
        if (nightOpacity > 0 && (cycleProgress < dayStart || cycleProgress > sunsetStart)) {
            const moonPhase = getMoonPhase(now);
            const midnightProgress = Math.sin(nightAngle); // 0 -> 1 -> 0

            const moonGradient = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius);
            moonGradient.addColorStop(0, `rgba(241, 245, 249, ${nightOpacity * 0.8})`);
            moonGradient.addColorStop(1, `rgba(241, 245, 249, 0)`);
            ctx.fillStyle = moonGradient;
            ctx.beginPath();
            ctx.arc(moonX, moonY, moonRadius * (1.5 + midnightProgress * 0.5), 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.save();
            ctx.translate(moonX, moonY);
            ctx.beginPath();
            ctx.fillStyle = `rgba(226, 232, 240, ${nightOpacity})`;
            ctx.arc(0, 0, moonRadius, 0, 2 * Math.PI);
            ctx.fill();

            // Phase shadow
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Dark side color
            const phaseAngle = moonPhase * 2 * Math.PI;
            const dir = (moonPhase > 0.5) ? -1 : 1;
            const shadowX = dir * moonRadius * Math.cos(phaseAngle);
            ctx.beginPath();
            ctx.arc(shadowX, 0, moonRadius, 0, 2*Math.PI);
            ctx.fill();
            ctx.restore();
        }

    }, [diurnoMode, astrologicalEvents]);
    
    const lerpColor = (c1: number[], c2: number[], t: number) => ({
        r: Math.round(c1[0] + (c2[0] - c1[0]) * t),
        g: Math.round(c1[1] + (c2[1] - c1[1]) * t),
        b: Math.round(c1[2] + (c2[2] - c1[2]) * t),
    });

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        if (astrologicalEvents && Math.random() < 0.02 * speedRatio && shootingStarsRef.current.length < 3) {
            shootingStarsRef.current.push({
                x: Math.random() * width,
                y: Math.random() * height * 0.5,
                len: Math.random() * 80 + 20,
                speed: Math.random() * 2 + 3,
                width: Math.random() * 1 + 0.5,
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
            update(canvas.width, canvas.height, speedRatio);
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
    }, [draw, update, speed, size, diurnoMode]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default DayNightTheme;
