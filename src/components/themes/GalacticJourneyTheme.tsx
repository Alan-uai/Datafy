
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
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
}

const GalacticJourneyTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const starsRef = useRef<Star[]>([]);
    const planetRef = useRef<Planet | null>(null);
    const stateRef = useRef<'traveling' | 'approaching' | 'leaving'>('traveling');
    const progressRef = useRef(0);

    const resetStar = (star: Star, width: number) => {
        star.z = width;
        star.x = (Math.random() - 0.5) * width * 1.5;
        star.y = (Math.random() - 0.5) * width * 1.5;
        star.initialZ = width;
    };
    
    const createPlanet = (width: number) => {
        const colors = [
            ['#a9a9a9', '#696969'], // Rocky
            ['#deb887', '#8b4513'], // Desert
            ['#4682b4', '#000080'], // Water
            ['#228b22', '#006400'], // Forest
        ];
        const [color1, color2] = colors[Math.floor(Math.random() * colors.length)];
        planetRef.current = {
            x: (Math.random() - 0.5) * width * 0.5,
            y: (Math.random() - 0.5) * width * 0.5,
            z: width * 1.5,
            radius: (Math.random() * 50 + 50) * (size / 100),
            color1,
            color2,
        };
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, stars: Star[], planet: Planet | null) => {
        const { width, height } = ctx.canvas;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(halfWidth, halfHeight);
        
        // Draw Planet
        if (planet) {
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
            }
        }

        // Draw Stars
        stars.forEach(star => {
            const k = width / star.z;
            const px = star.x * k;
            const py = star.y * k;

            if (px >= -halfWidth && px <= halfWidth && py >= -halfHeight && py <= halfHeight) {
                const d = star.z / star.initialZ;
                const starSize = (1 - d * d) * 3 * (size / 100);
                ctx.fillStyle = `rgba(255, 255, 255, ${1 - d})`;
                ctx.fillRect(px, py, starSize, starSize);
            }
        });

        ctx.restore();
    }, [size]);
    
    const update = useCallback((width: number, stars: Star[], planet: Planet | null, speedRatio: number) => {
        const travelSpeed = 1 * speedRatio;
        const approachSpeed = 0.5 * speedRatio;
        
        switch (stateRef.current) {
            case 'traveling':
                progressRef.current += 0.001 * speedRatio;
                stars.forEach(star => {
                    star.z -= travelSpeed;
                    if (star.z <= 0) resetStar(star, width);
                });
                if (progressRef.current >= 1) {
                    stateRef.current = 'approaching';
                    progressRef.current = 0;
                    createPlanet(width);
                }
                break;
            case 'approaching':
                 stars.forEach(star => {
                    star.z -= approachSpeed;
                    if (star.z <= 0) resetStar(star, width);
                });
                if (planet) {
                    planet.z -= approachSpeed * 5; // Planet approaches faster
                    if (planet.z <= width / 2) {
                        planet.z = width / 2;
                        stateRef.current = 'leaving';
                    }
                }
                break;
             case 'leaving':
                 stars.forEach(star => {
                    star.z -= travelSpeed;
                    if (star.z <= 0) resetStar(star, width);
                });
                 if (planet) {
                    planet.z -= approachSpeed * 5;
                    if(planet.z <= 0) {
                        stateRef.current = 'traveling';
                        progressRef.current = 0;
                        planetRef.current = null;
                    }
                }
                break;
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const speedRatio = speed / 50;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            starsRef.current = [];
            for (let i = 0; i < 1500 * (size / 100); i++) {
                const star: Star = { x: 0, y: 0, z: 0, initialZ: canvas.width };
                resetStar(star, canvas.width);
                starsRef.current.push(star);
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
        
        return () => {
            window.removeEventListener('resize', setup);
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
