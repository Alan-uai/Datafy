
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Raindrop {
    x: number;
    y: number;
    length: number;
    speed: number;
}

const CyberpunkCityTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const raindropsRef = useRef<Raindrop[]>([]);

    const draw = useCallback((ctx: CanvasRenderingContext2D, speedRatio: number) => {
        const { width, height } = ctx.canvas;

        // Background with slight purple tint
        ctx.fillStyle = 'rgba(10, 0, 20, 0.2)';
        ctx.fillRect(0, 0, width, height);
        
        // Raindrops
        ctx.strokeStyle = `rgba(173, 216, 230, 0.7)`;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';

        raindropsRef.current.forEach(drop => {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);
            ctx.stroke();
        });
        
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        raindropsRef.current.forEach(drop => {
            drop.y += drop.speed * speedRatio;
            if (drop.y > height) {
                drop.y = Math.random() * -height;
                drop.x = Math.random() * width;
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
            raindropsRef.current = [];
            for (let i = 0; i < 300 * sizeRatio; i++) {
                raindropsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * -canvas.height,
                    length: Math.random() * 20 + 10,
                    speed: Math.random() * 5 + 5,
                });
            }
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            update(canvas.width, canvas.height, speedRatio);
            draw(ctx, speedRatio);
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
        <div 
            className="fixed inset-0 -z-10 bg-gray-900"
            style={{
                backgroundImage: 'linear-gradient(#0a0014 1px, transparent 1px), linear-gradient(to right, #0a0014 1px, #1a0a2e 1px)',
                backgroundSize: '20px 20px',
            }}
        >
            <canvas ref={canvasRef} className="absolute inset-0 mix-blend-screen opacity-70" />
            <div 
                className="absolute bottom-0 left-0 w-full h-1/3"
                style={{
                    background: 'linear-gradient(to top, rgba(255, 0, 255, 0.2), transparent)',
                    filter: 'blur(50px)',
                }}
            />
             <div 
                className="absolute bottom-0 left-0 w-full h-1/4"
                style={{
                    background: 'linear-gradient(to top, rgba(0, 255, 255, 0.2), transparent)',
                    filter: 'blur(50px)',
                }}
            />
        </div>
    );
};

export default CyberpunkCityTheme;
