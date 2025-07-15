
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Drop {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: string;
    speed: number;
}

const LivingWatercolorTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const dropsRef = useRef<Drop[]>([]);
    
    const colors = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#67e8f9', '#a5b4fc'];

    const draw = useCallback((ctx: CanvasRenderingContext2D, bufferCtx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        
        // Draw drops on buffer
        dropsRef.current.forEach(drop => {
            bufferCtx.beginPath();
            const grad = bufferCtx.createRadialGradient(drop.x, drop.y, 0, drop.x, drop.y, drop.radius);
            grad.addColorStop(0, `${drop.color}`);
            grad.addColorStop(1, `${drop.color}00`);
            bufferCtx.fillStyle = grad;
            bufferCtx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            bufferCtx.fill();
        });

        // Apply blur and copy to main canvas
        ctx.fillStyle = '#fefcf8';
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 0.9;
        ctx.filter = 'blur(15px) contrast(1.2)';
        ctx.drawImage(bufferCtx.canvas, 0, 0);
        ctx.filter = 'none';
        ctx.globalAlpha = 1;

    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number, sizeRatio: number) => {
        dropsRef.current.forEach((drop, index) => {
            drop.radius += drop.speed * speedRatio;
            if (drop.radius > drop.maxRadius) {
                dropsRef.current.splice(index, 1);
            }
        });
        
        if (Math.random() < 0.1 * speedRatio) {
            dropsRef.current.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 0,
                maxRadius: (Math.random() * 100 + 100) * sizeRatio,
                color: colors[Math.floor(Math.random() * colors.length)],
                speed: Math.random() * 0.5 + 0.2
            });
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const bufferCanvas = document.createElement('canvas');
        const bufferCtx = bufferCanvas.getContext('2d');
        if(!bufferCtx) return;
        bufferCanvasRef.current = bufferCanvas;

        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            bufferCanvas.width = canvas.width;
            bufferCanvas.height = canvas.height;
            dropsRef.current = [];
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            update(canvas.width, canvas.height, speedRatio, sizeRatio);
            draw(ctx, bufferCtx);
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
        <div className="fixed inset-0 -z-10 bg-white">
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default LivingWatercolorTheme;
