
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const GalaxyImpactTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const lastImpact = useRef(0);

    const createImpact = (width: number, height: number, sizeRatio: number) => {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const numParticles = 200 * sizeRatio;
        const colors = ['#ff4b1f', '#ff9068', '#ffffff', '#f7b733'];

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 15 + 5;
            particlesRef.current.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 100 + Math.random() * 50,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'lighter';
        particlesRef.current.forEach(p => {
            const progress = p.life / 150;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, progress * 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }, []);

    const update = useCallback((speedRatio: number) => {
        particlesRef.current.forEach((p, index) => {
            p.x += p.vx * speedRatio;
            p.y += p.vy * speedRatio;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life -= 1 * speedRatio;

            if (p.life <= 0) {
                particlesRef.current.splice(index, 1);
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
        lastImpact.current = Date.now();

        const resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            ctx.fillStyle = 'black';
            ctx.fillRect(0,0,canvas.width, canvas.height);
        };

        const animate = () => {
            const now = Date.now();
            if (now - lastImpact.current > 3000 / speedRatio) {
                createImpact(canvas.width, canvas.height, sizeRatio);
                lastImpact.current = now;
            }

            update(speedRatio);
            draw(ctx);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        resizeHandler();
        window.addEventListener('resize', resizeHandler);
        animate();

        return () => {
            window.removeEventListener('resize', resizeHandler);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GalaxyImpactTheme;
