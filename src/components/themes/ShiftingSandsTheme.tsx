
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

const ShiftingSandsTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number) => {
        const { width, height } = ctx.canvas;
        
        // Sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
        skyGradient.addColorStop(0, '#fca311');
        skyGradient.addColorStop(1, '#e5e5e5');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sunX = width / 2;
        const sunY = 100;
        ctx.fillStyle = '#ffc300';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 50 * (size/100), 0, Math.PI * 2);
        ctx.fill();

        // Dunes
        const duneColors = ['#d4a373', '#faedcd', '#ccd5ae'];
        for(let i = 0; i < duneColors.length; i++) {
            ctx.fillStyle = duneColors[i];
            ctx.beginPath();
            ctx.moveTo(-100, height);
            for (let x = -100; x < width + 100; x++) {
                const y = height * 0.6 + 
                          Math.sin((x + frame * speedRatio * (i+1) * 0.5) * 0.005) * 50 * (size/100) +
                          Math.sin((x - frame * speedRatio * 0.3) * 0.01) * 30 * (size/100) +
                          i * 50 * (size/100);
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width + 100, height);
            ctx.closePath();
            ctx.fill();
        }
    }, [size]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frameCount = 0;
        const speedRatio = speed / 100;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            frameCount++;
            draw(ctx, frameCount, speedRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        setup();
        window.addEventListener('resize', setup);
        
        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, speed]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default ShiftingSandsTheme;
