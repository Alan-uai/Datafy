
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface DeepOceanThemeProps {
    config: Partial<ThemeConfig>;
}

const DeepOceanTheme: React.FC<DeepOceanThemeProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, particles: any[], bubbles: any[], speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        
        // Background Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#001a33');
        gradient.addColorStop(0.5, '#003366');
        gradient.addColorStop(1, '#004c99');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Light Rays
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const rayCount = 5;
        for (let i = 0; i < rayCount; i++) {
            ctx.beginPath();
            ctx.moveTo((width / rayCount) * i + Math.sin(frame * 0.001 * speedRatio + i) * 100, -50);
            ctx.lineTo(mousePos.current.x + (Math.random() - 0.5) * 400, height * 1.2);
            ctx.lineTo(mousePos.current.x + (Math.random() - 0.5) * 400 + 100, height * 1.2);
            ctx.lineTo((width / rayCount) * i + Math.sin(frame * 0.0015 * speedRatio + i) * 100 + 200, -50);
            const rayGradient = ctx.createLinearGradient(0, 0, 0, height);
            rayGradient.addColorStop(0, `rgba(173, 216, 230, ${0.05 + Math.sin(frame * 0.002 * speedRatio + i) * 0.03})`);
            rayGradient.addColorStop(1, 'rgba(173, 216, 230, 0)');
            ctx.fillStyle = rayGradient;
            ctx.fill();
        }
        ctx.restore();

        // Particles
        particles.forEach(p => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.arc(p.x, p.y, p.radius * sizeRatio, 0, Math.PI * 2);
            ctx.fill();
        });

        // Bubbles
        bubbles.forEach(b => {
             ctx.beginPath();
             ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity})`;
             ctx.lineWidth = 1;
             ctx.arc(b.x, b.y, b.radius * sizeRatio, 0, Math.PI * 2);
             ctx.stroke();
        });


    }, []);

    const update = useCallback((width: number, height: number, particles: any[], bubbles: any[], speedRatio: number) => {
        particles.forEach(p => {
            p.y += p.vy * speedRatio;
            p.x += p.vx * speedRatio;
            if (p.y > height) {
                p.y = 0;
                p.x = Math.random() * width;
            }
        });
         bubbles.forEach(b => {
            b.y -= b.vy * speedRatio;
            b.x += Math.sin(b.y * 0.05) * 0.5;
            if (b.y < -b.radius) {
                b.y = height + b.radius;
                b.x = Math.random() * width;
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let particles: any[] = [];
        let bubbles: any[] = [];
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;
        let frameCount = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            bubbles = [];

            for (let i = 0; i < 100; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5,
                    opacity: Math.random() * 0.5,
                    vx: (Math.random() - 0.5) * 0.2,
                    vy: Math.random() * 0.5 + 0.1
                });
            }
             for (let i = 0; i < 30; i++) {
                bubbles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 10 + 5,
                    opacity: Math.random() * 0.3 + 0.1,
                    vy: Math.random() * 1 + 0.5
                });
            }
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            frameCount++;
            update(canvas.width, canvas.height, particles, bubbles, speedRatio);
            draw(ctx, frameCount, particles, bubbles, speedRatio, sizeRatio);
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

export default DeepOceanTheme;
