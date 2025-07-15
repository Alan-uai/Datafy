
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Lantern {
    x: number;
    y: number;
    size: number;
    speedY: number;
    color: string;
    opacity: number;
    type: 'round' | 'cylinder';
    sway: number;
}

const ChineseLanternsTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const lanternsRef = useRef<Lantern[]>([]);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0a0a23');
        gradient.addColorStop(1, '#202040');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        lanternsRef.current.forEach(lantern => {
            ctx.save();
            ctx.globalAlpha = lantern.opacity;
            
            // Draw lantern glow
            const glowGradient = ctx.createRadialGradient(lantern.x, lantern.y, 0, lantern.x, lantern.y, lantern.size * 2);
            glowGradient.addColorStop(0, `${lantern.color}40`);
            glowGradient.addColorStop(1, `${lantern.color}00`);
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(lantern.x, lantern.y, lantern.size * 2, 0, Math.PI * 2);
            ctx.fill();

            // Draw lantern body
            ctx.fillStyle = lantern.color;
            ctx.strokeStyle = '#FFD700'; // Gold color
            ctx.lineWidth = 2;

            if (lantern.type === 'round') {
                ctx.beginPath();
                ctx.arc(lantern.x, lantern.y, lantern.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else { // Cylinder
                const w = lantern.size * 1.5;
                const h = lantern.size * 2;
                ctx.beginPath();
                ctx.moveTo(lantern.x - w/2, lantern.y - h/2);
                ctx.bezierCurveTo(lantern.x, lantern.y - h/2 - 20, lantern.x, lantern.y - h/2 - 20, lantern.x + w/2, lantern.y - h/2);
                ctx.lineTo(lantern.x + w/2, lantern.y + h/2);
                ctx.bezierCurveTo(lantern.x, lantern.y + h/2 + 20, lantern.x, lantern.y + h/2 + 20, lantern.x - w/2, lantern.y + h/2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            
            ctx.restore();
        });
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        lanternsRef.current.forEach((lantern) => {
            lantern.y -= lantern.speedY * speedRatio;
            lantern.x += Math.sin(lantern.y * lantern.sway) * 0.5;

            if (lantern.y < -lantern.size * 3) {
                lantern.y = height + lantern.size * 3;
                lantern.x = Math.random() * width;
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
            lanternsRef.current = [];
            const colors = ['#D81E5B', '#F0544F', '#C6D8D3', '#FDF0D5'];
            for (let i = 0; i < 50 * sizeRatio; i++) {
                lanternsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 1.5,
                    size: Math.random() * 10 + 10 * sizeRatio,
                    speedY: Math.random() * 0.5 + 0.2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    opacity: Math.random() * 0.5 + 0.5,
                    type: Math.random() > 0.5 ? 'round' : 'cylinder',
                    sway: Math.random() * 0.1 + 0.02
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
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default ChineseLanternsTheme;
