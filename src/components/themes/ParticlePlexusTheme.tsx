
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
}

const ParticlePlexusTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const mousePos = useRef<{ x: number | null, y: number | null, radius: number }>({ x: null, y: null, radius: 150 });

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particlesRef.current.length; i++) {
            const p1 = particlesRef.current[i];
            ctx.fillStyle = `hsl(200, 100%, 70%)`;
            ctx.beginPath();
            ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
            ctx.fill();

            for (let j = i + 1; j < particlesRef.current.length; j++) {
                const p2 = particlesRef.current[j];
                const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
                if (dist < 100 * (size / 100)) {
                    ctx.strokeStyle = `hsla(200, 100%, 70%, ${1 - dist / (100 * (size / 100))})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }, [size]);
    
    const update = useCallback((width: number, height: number, speedRatio: number) => {
        particlesRef.current.forEach(p => {
            p.x += p.vx * speedRatio;
            p.y += p.vy * speedRatio;
            
            if(p.x < 0 || p.x > width) p.vx *= -1;
            if(p.y < 0 || p.y > height) p.vy *= -1;

            if(mousePos.current.x !== null && mousePos.current.y !== null) {
                const dist = Math.hypot(p.x - mousePos.current.x, p.y - mousePos.current.y);
                if (dist < mousePos.current.radius) {
                    p.vx += (p.x - mousePos.current.x) / (dist * 20);
                    p.vy += (p.y - mousePos.current.y) / (dist * 20);
                }
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
        
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current.x = e.clientX;
            mousePos.current.y = e.clientY;
        };
        const handleMouseOut = () => {
            mousePos.current.x = null;
            mousePos.current.y = null;
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particlesRef.current = [];
            const particleCount = Math.floor(canvas.width / 15);
            for (let i = 0; i < particleCount; i++) {
                particlesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: (Math.random() * 1.5 + 1) * sizeRatio
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
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseOut);
        
        return () => {
            window.removeEventListener('resize', setup);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseOut);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-[#0a192f]">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default ParticlePlexusTheme;
