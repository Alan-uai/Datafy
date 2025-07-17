
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

const ChocolateFountainTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, chocolateType = 'black' } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const getColors = useCallback(() => {
        switch (chocolateType) {
            case 'white': return ['#FFF4E6', '#F8E9D6', '#E9D8C6'];
            case 'colorful': return ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#a0c4ff', '#ffc6ff'];
            case 'black':
            default: return ['#5D4037', '#4E342E', '#3E2723'];
        }
    }, [chocolateType]);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;
        const colors = getColors();

        ctx.fillStyle = '#211a18';
        ctx.fillRect(0, 0, width, height);

        const tiers = 3;
        const tierHeight = height / tiers;
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        for (let t = 0; t < tiers; t++) {
            const tierY = t * tierHeight;
            const tierWidth = width * (1 - t * 0.1);
            
            for (let i = 0; i < 50 * sizeRatio; i++) {
                const color = colors[i % colors.length];
                const x = (i / (50 * sizeRatio)) * tierWidth + (width - tierWidth) / 2;
                
                ctx.beginPath();
                ctx.fillStyle = color;

                const baseOffsetY = (frame * speedRatio * 5 + i * 20) % (tierHeight + 20) - 10;
                let y = tierY + baseOffsetY;

                const wave = Math.sin(x * 0.01 + frame * 0.05 * speedRatio) * 10 * sizeRatio;
                let currentX = x + wave;

                ctx.moveTo(currentX, y - 5);
                ctx.bezierCurveTo(currentX + 5, y, currentX, y + 5, currentX - 5, y);
                ctx.closePath();
                ctx.fill();
            }
        }
    }, [speed, size, getColors]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        let frameCount = 0;
        const animate = () => {
            frameCount++;
            draw(ctx, frameCount);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        resizeHandler();
        window.addEventListener('resize', resizeHandler);
        animate();

        return () => {
            window.removeEventListener('resize', resizeHandler);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default ChocolateFountainTheme;
