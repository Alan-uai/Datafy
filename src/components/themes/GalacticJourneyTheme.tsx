
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Star {
    x: number;
    y: number;
    z: number;
    initialZ: number;
}

interface Planet {
    x: number;
    y: number;
    z: number;
    radius: number;
    color1: string;
    color2: string;
    rings: { radius: number; tilt: number; color: string } | null;
    moons: { dist: number; angle: number; radius: number; speed: number; }[];
}

interface Comet {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    len: number;
}

interface Nebula {
    x: number;
    y: number;
    radius: number;
    color: string;
}


const GalacticJourneyTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const starsRef = useRef<Star[]>([]);
    const planetRef = useRef<Planet | null>(null);
    const cometsRef = useRef<Comet[]>([]);
    const nebulasRef = useRef<Nebula[]>([]);
    const stateRef = useRef<'traveling' | 'approaching' | 'leaving'>('traveling');
    const progressRef = useRef(0);
    const mousePos = useRef({ x: 0, y: 0 });

    const resetStar = (star: Star, width: number) => {
        star.z = width + Math.random() * 100;
        star.x = (Math.random() - 0.5) * width * 2;
        star.y = (Math.random() - 0.5) * width * 2;
        star.initialZ = star.z;
    };
    
    const createPlanet = (width: number) => {
        const colors = [
            ['#a9a9a9', '#696969'], // Rocky
            ['#deb887', '#8b4513'], // Desert
            ['#4682b4', '#000080'], // Water
            ['#228b22', '#006400'], // Forest
            ['#ff4500', '#8b0000'], // Lava
            ['#add8e6', '#ffffff'], // Ice
        ];
        const [color1, color2] = colors[Math.floor(Math.random() * colors.length)];
        
        let rings = null;
        if (Math.random() > 0.7) {
            rings = {
                radius: (Math.random() * 50 + 80) * (size / 100),
                tilt: (Math.random() - 0.5) * Math.PI / 2,
                color: 'rgba(200, 200, 200, 0.5)'
            };
        }
        
        let moons = [];
        if (Math.random() > 0.5) {
            const moonCount = Math.floor(Math.random() * 3) + 1;
            for(let i=0; i<moonCount; i++) {
                 moons.push({
                    dist: (Math.random() * 40 + 80) * (size / 100) * (i + 1),
                    angle: Math.random() * Math.PI * 2,
                    radius: (Math.random() * 5 + 3) * (size/100),
                    speed: (Math.random() * 0.01 + 0.005)
                });
            }
        }

        planetRef.current = {
            x: (Math.random() - 0.5) * width * 0.5,
            y: (Math.random() - 0.5) * width * 0.5,
            z: width * 1.5,
            radius: (Math.random() * 50 + 50) * (size / 100),
            color1,
            color2,
            rings,
            moons,
        };
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, stars: Star[], planet: Planet | null) => {
        const { width, height } = ctx.canvas;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);
        
        const camX = (mousePos.current.x - halfWidth) * 0.1;
        const camY = (mousePos.current.y - halfHeight) * 0.1;

        ctx.save();
        ctx.translate(halfWidth - camX, halfHeight - camY);
        
        // Draw Nebulas
        nebulasRef.current.forEach(nebula => {
            const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
            gradient.addColorStop(0, `${nebula.color}30`);
            gradient.addColorStop(0.3, `${nebula.color}10`);
            gradient.addColorStop(1, `${nebula.color}00`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw Planet
        if (planet && planet.z > 0) {
            const k = width / planet.z;
            const px = planet.x * k;
            const py = planet.y * k;
            const radius = planet.radius * k;
            
            if (radius > 0) {
                 const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
                 gradient.addColorStop(0, planet.color1);
                 gradient.addColorStop(1, planet.color2);
                 ctx.fillStyle = gradient;
                 ctx.beginPath();
                 ctx.arc(px, py, radius, 0, Math.PI * 2);
                 ctx.fill();
                 
                 // Draw rings
                 if (planet.rings) {
                    ctx.save();
                    ctx.translate(px, py);
                    ctx.rotate(planet.rings.tilt);
                    ctx.strokeStyle = planet.rings.color;
                    ctx.lineWidth = 3 * k;
                    ctx.beginPath();
                    ctx.ellipse(0, 0, planet.rings.radius * k, planet.rings.radius * k * 0.3, 0, 0, Math.PI*2);
                    ctx.stroke();
                    ctx.restore();
                 }

                 // Draw moons
                 planet.moons.forEach(moon => {
                     const mx = px + Math.cos(moon.angle) * moon.dist * k;
                     const my = py + Math.sin(moon.angle) * moon.dist * k;
                     ctx.fillStyle = '#cccccc';
                     ctx.beginPath();
                     ctx.arc(mx, my, moon.radius * k, 0, Math.PI * 2);
                     ctx.fill();
                 });
            }
        }
        
        // Draw Comets
        cometsRef.current.forEach(comet => {
            const k = width / comet.z;
            const px = comet.x * k;
            const py = comet.y * k;
            
            const grad = ctx.createLinearGradient(px, py, px - comet.vx*comet.len, py - comet.vy*comet.len);
            grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px - comet.vx*comet.len, py - comet.vy*comet.len);
            ctx.stroke();
        });


        // Draw Stars
        stars.forEach(star => {
            const k = width / star.z;
            const px = star.x * k;
            const py = star.y * k;

            if (px >= -halfWidth-camX && px <= halfWidth-camX && py >= -halfHeight-camY && py <= halfHeight-camY) {
                const d = star.z / star.initialZ;
                const starSize = (1 - d * d) * 3 * (size / 100);
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - d})`;
                ctx.fillRect(px, py, starSize, starSize);
            }
        });

        ctx.restore();
    }, [size]);
    
    const update = useCallback((width: number, stars: Star[], planet: Planet | null, speedRatio: number) => {
        let currentSpeed = 1 * speedRatio;
        
        // Dynamic speed based on state
        switch(stateRef.current) {
            case 'traveling': currentSpeed = (1 + Math.sin(progressRef.current * Math.PI * 2)) * speedRatio; break;
            case 'approaching': currentSpeed = 0.5 * speedRatio; break;
            case 'leaving': currentSpeed = 3 * speedRatio; break;
        }

        stars.forEach(star => {
            star.z -= currentSpeed;
            if (star.z <= 0) resetStar(star, width);
        });

        cometsRef.current.forEach((comet, index) => {
            comet.z -= comet.vz * speedRatio;
            if (comet.z <= 0) cometsRef.current.splice(index, 1);
        });
        
        // State machine
        switch (stateRef.current) {
            case 'traveling':
                progressRef.current += 0.0005 * speedRatio;
                if (progressRef.current >= 1) {
                    stateRef.current = 'approaching';
                    progressRef.current = 0;
                    createPlanet(width);
                }
                break;
            case 'approaching':
                if (planet) {
                    planet.z -= currentSpeed * 5;
                    planet.moons.forEach(m => m.angle += m.speed * speedRatio);
                    if (planet.z <= width / 2) {
                        planet.z = width / 2;
                        stateRef.current = 'leaving';
                    }
                }
                break;
             case 'leaving':
                 if (planet) {
                    planet.z -= currentSpeed * 1.5;
                    planet.moons.forEach(m => m.angle += m.speed * speedRatio);
                    if(planet.z <= 0) {
                        stateRef.current = 'traveling';
                        progressRef.current = 0;
                        planetRef.current = null;
                    }
                }
                break;
        }

        // Randomly add new comets
        if (Math.random() < 0.001 * speedRatio) {
            cometsRef.current.push({
                x: (Math.random() - 0.5) * width,
                y: (Math.random() - 0.5) * width,
                z: width,
                vx: Math.random() * 2 + 1,
                vy: Math.random() * 2 + 1,
                vz: Math.random() * 4 + 2,
                len: Math.random() * 50 + 50
            });
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const speedRatio = speed / 50;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            starsRef.current = [];
            nebulasRef.current = [];
            for (let i = 0; i < 1500 * (size / 100); i++) {
                const star: Star = { x: 0, y: 0, z: 0, initialZ: canvas.width };
                resetStar(star, canvas.width);
                starsRef.current.push(star);
            }
             for (let i=0; i<5; i++) {
                nebulasRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 300 + 400,
                    color: ['rgba(255, 100, 255,', 'rgba(100, 255, 255,', 'rgba(255, 255, 100,'][i%3]
                });
            }

            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };
        
        const animate = () => {
            update(canvas.width, starsRef.current, planetRef.current, speedRatio);
            draw(ctx, starsRef.current, planetRef.current);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        setup();
        window.addEventListener('resize', setup);
        window.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            window.removeEventListener('resize', setup);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GalacticJourneyTheme;
