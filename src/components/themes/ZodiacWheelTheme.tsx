
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

const ZODIAC_SYMBOLS: { [key: string]: string } = {
    aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
    libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓'
};
const ZODIAC_ORDER = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

const ZodiacWheelTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, zodiacSign = 'all' } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.4 * (size / 100);
        const rotation = (frame * 0.001 * speed) % (Math.PI * 2);

        ctx.fillStyle = '#0a0a23';
        ctx.fillRect(0, 0, width, height);
        
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        // Draw wheel
        const grad = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, radius);
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw signs
        ctx.font = `${radius * 0.15}px serif`;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ZODIAC_ORDER.forEach((sign, i) => {
            if (zodiacSign === 'all' || zodiacSign === sign) {
                const angle = (Math.PI / 6) * i - Math.PI / 2;
                const x = Math.cos(angle) * radius * 0.85;
                const y = Math.sin(angle) * radius * 0.85;
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(-rotation); // Counter-rotate text
                ctx.fillText(ZODIAC_SYMBOLS[sign], 0, 0);
                ctx.restore();
            }
        });
        
        ctx.restore();
    }, [speed, size, zodiacSign]);

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

export default ZodiacWheelTheme;
