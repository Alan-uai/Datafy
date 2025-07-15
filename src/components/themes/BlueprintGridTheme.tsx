
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface BlueprintGridThemeProps {
    config: Partial<ThemeConfig>;
}

const BlueprintGridTheme: React.FC<BlueprintGridThemeProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.fillStyle = '#1e3a8a'; // Blueprint blue background
        ctx.fillRect(0, 0, width, height);

        const gridSize = 50 * sizeRatio;
        const mainLineColor = 'rgba(147, 197, 253, 0.2)'; // Lighter blue for grid
        const subLineColor = 'rgba(147, 197, 253, 0.05)';
        
        ctx.lineWidth = 1;

        // Draw sub-grid lines
        ctx.strokeStyle = subLineColor;
        for (let x = 0; x <= width; x += gridSize / 5) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize / 5) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw main grid lines
        ctx.strokeStyle = mainLineColor;
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Animated scanning line
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#60a5fa';
        const scanLineY = (frame * 2 * speedRatio) % (height + 100) - 50;
        ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
        ctx.fillRect(0, scanLineY, width, 2);
        ctx.shadowBlur = 0;

    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let frameCount = 0;
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const animate = () => {
            frameCount++;
            draw(ctx, frameCount, speedRatio, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const setup = () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        setup();
        window.addEventListener('resize', setup);

        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="absolute inset-0 z-[2] block w-full h-full" />
        </div>
    );
};

export default BlueprintGridTheme;
