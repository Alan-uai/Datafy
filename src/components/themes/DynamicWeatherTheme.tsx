
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Particle {
    x: number;
    y: number;
    type: 'rain' | 'snow';
    speed: number;
    size: number;
    opacity: number;
}

const DynamicWeatherTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const cloudsRef = useRef<any[]>([]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;

        // Sky gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#7d7d7d');
        skyGradient.addColorStop(1, '#c2c2c2');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // Draw landscape (simple hills)
        ctx.fillStyle = '#6a8a6b';
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height * 0.8);
        ctx.bezierCurveTo(width * 0.3, height * 0.7, width * 0.6, height * 0.9, width, height * 0.8);
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();

        // Draw clouds
        cloudsRef.current.forEach(cloud => {
            ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
            ctx.beginPath();
            cloud.parts.forEach((part: any) => {
                ctx.arc(cloud.x + part.dx, cloud.y + part.dy, part.r, 0, Math.PI * 2);
            });
            ctx.closePath();
            ctx.fill();
        });

        // Draw particles
        particlesRef.current.forEach(p => {
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            if (p.type === 'rain') {
                ctx.fillRect(p.x, p.y, p.size, p.size * 5);
            } else { // snow
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        // Update clouds
        cloudsRef.current.forEach(cloud => {
            cloud.x += cloud.speed * speedRatio;
            if (cloud.x > width + 200) {
                cloud.x = -200;
            }
        });

        // Update particles
        particlesRef.current.forEach(p => {
            p.y += p.speed * speedRatio;
            if (p.type === 'snow') {
                p.x += Math.sin(p.y * 0.05);
            }
            if (p.y > height) {
                p.y = -20;
                p.x = Math.random() * width;
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particlesRef.current = [];
            cloudsRef.current = [];
            
            // Create clouds
            for (let i = 0; i < 10; i++) {
                 const parts = [];
                 const baseRadius = (Math.random() * 40 + 40) * sizeRatio;
                 for(let j=0; j<5; j++) {
                    parts.push({dx: (Math.random()-0.5)*100, dy: (Math.random()-0.5)*20, r: baseRadius * (Math.random()*0.5+0.5)})
                 }
                 cloudsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.2,
                    parts: parts,
                    opacity: Math.random() * 0.4 + 0.6,
                    speed: (Math.random() * 0.5 + 0.2)
                 });
            }

            // Create particles
            const particleType = Math.random() > 0.5 ? 'rain' : 'snow';
            for (let i = 0; i < 300 * sizeRatio; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    type: particleType,
                    speed: Math.random() * 3 + 2,
                    size: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.3
                });
            }
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            update(canvas.width, canvas.height, speedRatio);
            draw(ctx);
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
        <div className="fixed inset-0 -z-10 bg-gray-700">
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default DynamicWeatherTheme;
