
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Drop {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: string;
    life: number;
}

const LivingWatercolorTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const dropsRef = useRef<Drop[]>([]);
    
    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        
        ctx.fillStyle = '#fefae0';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 0.1;

        dropsRef.current.forEach(drop => {
            ctx.beginPath();
            ctx.fillStyle = drop.color;
            ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
            ctx.fill();
        });
        
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        dropsRef.current.forEach((drop, index) => {
            drop.radius += (drop.maxRadius - drop.radius) * 0.01 * speedRatio;
            drop.life -= 1 * speedRatio;

            if (drop.life <= 0) {
                dropsRef.current.splice(index, 1);
            }
        });
        
        if (Math.random() < 0.1 * speedRatio) {
            const colors = ['#e9c46a', '#f4a261', '#e76f51', '#2a9d8f', '#264653'];
            dropsRef.current.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: 0,
                maxRadius: (Math.random() * 100 + 100) * (size/100),
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 200,
            });
        }
    }, [size]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const speedRatio = speed / 100;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            dropsRef.current = [];
            
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
    }, [draw, update, speed]);

    return (
        <div className="fixed inset-0 -z-10 bg-[#fefae0]">
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default LivingWatercolorTheme;
