
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Lantern {
    x: number;
    y: number;
    radius: number;
    speedY: number;
    color: string;
    opacity: number;
}

const FloatingLanternsTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
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
            const glowGradient = ctx.createRadialGradient(lantern.x, lantern.y, 0, lantern.x, lantern.y, lantern.radius * 3);
            glowGradient.addColorStop(0, `${lantern.color}40`); // 25% opacity
            glowGradient.addColorStop(1, `${lantern.color}00`); // 0% opacity
            ctx.fillStyle = glowGradient;
            ctx.beginPath();
            ctx.arc(lantern.x, lantern.y, lantern.radius * 3, 0, Math.PI * 2);
            ctx.fill();

            // Draw lantern body
            ctx.fillStyle = lantern.color;
            ctx.beginPath();
            ctx.arc(lantern.x, lantern.y, lantern.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        lanternsRef.current.forEach((lantern, index) => {
            lantern.y -= lantern.speedY * speedRatio;
            lantern.x += Math.sin(lantern.y * 0.05) * 0.5; // Gentle sway

            if (lantern.y < -lantern.radius * 3) {
                // Reset lantern when it goes off screen
                lantern.y = height + lantern.radius * 3;
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
            const colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#a0c4ff'];
            for (let i = 0; i < 50 * sizeRatio; i++) {
                lanternsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 1.5,
                    radius: Math.random() * 10 + 10 * sizeRatio,
                    speedY: Math.random() * 0.5 + 0.2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    opacity: Math.random() * 0.5 + 0.5,
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

export default FloatingLanternsTheme;
