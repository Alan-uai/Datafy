
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface EnchantedForestThemeProps {
    config: Partial<ThemeConfig>;
}

const EnchantedForestTheme: React.FC<EnchantedForestThemeProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, fireflies: any[], speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        
        // Background Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0c1445'); // Dark blue
        gradient.addColorStop(0.7, '#2c3e50'); // Dark slate gray
        gradient.addColorStop(1, '#1a2a1f'); // Dark green
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Draw Parallax Trees (simple representation)
        ctx.fillStyle = '#000';
        for (let i = 0; i < 3; i++) {
            const parallaxFactor = (i + 1) * 0.1;
            const offsetX = (mousePos.current.x - width / 2) * parallaxFactor;
            for (let j = 0; j < 10; j++) {
                const x = (width / 9) * j + offsetX;
                const h = (150 + i * 50) * sizeRatio;
                const w = (60 + i * 30) * sizeRatio;
                ctx.globalAlpha = 0.2 + i * 0.1;
                ctx.beginPath();
                ctx.moveTo(x - w / 2, height);
                ctx.lineTo(x, height - h);
                ctx.lineTo(x + w / 2, height);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        // Draw Fireflies
        fireflies.forEach(f => {
            ctx.beginPath();
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * sizeRatio);
            g.addColorStop(0, `rgba(255, 255, 150, ${f.opacity})`);
            g.addColorStop(0.5, `rgba(255, 255, 0, ${f.opacity * 0.5})`);
            g.addColorStop(1, 'rgba(255, 255, 0, 0)');
            ctx.fillStyle = g;
            ctx.arc(f.x, f.y, f.radius * sizeRatio, 0, Math.PI * 2);
            ctx.fill();
        });
    }, []);

    const update = useCallback((width: number, height: number, fireflies: any[], speedRatio: number) => {
        fireflies.forEach(f => {
            // Move towards mouse
            const dx = mousePos.current.x - f.x;
            const dy = mousePos.current.y - f.y;
            f.vx += dx * 0.0001 * speedRatio;
            f.vy += dy * 0.0001 * speedRatio;

            // Random flutter
            f.vx += (Math.random() - 0.5) * 0.1;
            f.vy += (Math.random() - 0.5) * 0.1;

            // Damping
            f.vx *= 0.95;
            f.vy *= 0.95;

            f.x += f.vx * speedRatio;
            f.y += f.vy * speedRatio;
            
            f.opacity = Math.max(0, Math.min(1, f.opacity + (Math.random() - 0.5) * 0.1));
            
            if (f.x > width || f.x < 0 || f.y > height || f.y < 0) {
                f.x = Math.random() * width;
                f.y = Math.random() * height;
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let fireflies: any[] = [];
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;
        let frameCount = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            fireflies = [];
            for (let i = 0; i < 100; i++) {
                fireflies.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 2,
                    opacity: Math.random(),
                    vx: 0,
                    vy: 0
                });
            }
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            frameCount++;
            update(canvas.width, canvas.height, fireflies, speedRatio);
            draw(ctx, frameCount, fireflies, speedRatio, sizeRatio);
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
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default EnchantedForestTheme;
