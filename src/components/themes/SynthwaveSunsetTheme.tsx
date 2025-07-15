
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface SynthwaveSunsetThemeProps {
    config: Partial<ThemeConfig>;
}

const SynthwaveSunsetTheme: React.FC<SynthwaveSunsetThemeProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        const horizon = height * 0.6;
        
        // Sky Gradient
        const skyGradient = ctx.createLinearGradient(0, 0, 0, horizon);
        skyGradient.addColorStop(0, '#2c003e'); // Dark purple
        skyGradient.addColorStop(1, '#ff6ac1'); // Pink
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, horizon);

        // Sun
        const sunRadius = 100 * sizeRatio;
        const sunY = horizon - 50 * sizeRatio;
        const sunGradient = ctx.createRadialGradient(width / 2, sunY, sunRadius * 0.8, width / 2, sunY, sunRadius);
        sunGradient.addColorStop(0, '#fff568'); // Yellow
        sunGradient.addColorStop(1, 'rgba(255, 106, 193, 0)');
        ctx.fillStyle = sunGradient;
        ctx.fillRect(0, 0, width, horizon);
        
        // Sun lines
        ctx.strokeStyle = 'rgba(255, 245, 104, 0.8)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const y = sunY + sunRadius * (0.3 + i * 0.1);
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Grid
        ctx.save();
        ctx.translate(width / 2, horizon);
        ctx.scale(1, 0.5);
        ctx.strokeStyle = '#00f7ff'; // Cyan
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f7ff';

        const lineCount = 30 * sizeRatio;
        const gridSpeed = (frame * 0.01 * speedRatio) % 1;

        for (let i = -lineCount; i <= lineCount; i++) {
            const perspective = 1 - (i + gridSpeed) / lineCount;
            const y = (i + gridSpeed) * 10;
            const x = perspective * width * 2;
            
            ctx.beginPath();
            ctx.moveTo(-x, y);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(i * (width / 9) - width, 0);
            ctx.lineTo(-width * 5, height * 2);
            ctx.stroke();
            ctx.moveTo(-(i * (width / 9) - width), 0);
            ctx.lineTo(width * 5, height * 2);
            ctx.stroke();
        }
        ctx.restore();

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
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
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
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default SynthwaveSunsetTheme;
