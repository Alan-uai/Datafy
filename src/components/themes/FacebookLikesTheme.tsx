
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Reaction {
  x: number;
  y: number;
  type: string;
  size: number;
  opacity: number;
  speed: number;
  sway: number;
}

const FacebookLikesTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const reactionsRef = useRef<Reaction[]>([]);
    
    // Simple SVG paths for reactions
    const reactionPaths: { [key: string]: string } = {
        'like': 'M38 12.8A6.3 6.3 0 0 0 32.7 10H19.3c-1.3 0-2.4.9-2.6 2.1L16 16.4V29h12.2a2.3 2.3 0 0 0 2.2-1.6l3.5-8.8a2.3 2.3 0 0 0-2.2-3zM14.2 29V15H11v14h3.2z',
        'love': 'M35.3 12.2C32.4 9 27.8 9 25 12.2c-2.8-3.2-7.4-3.2-10.3 0-3.4 3.6-3.4 9.5 0 13.1l10.3 11.4 10.3-11.4c3.4-3.6 3.4-9.5 0-13.1z',
        'haha': 'M25 10c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm-6.1 11.2c-1.2-1.9.4-4.2 2.5-4.2s3.6 2.3 2.5 4.2c-.6 1-1.8 1.6-3 1.6-1.2 0-2.4-.6-2-1.6zm12.1 0c-1.2-1.9.4-4.2 2.5-4.2s3.6 2.3 2.5 4.2c-.6 1-1.8 1.6-3 1.6-1.2 0-2.4-.6-2-1.6zM25 32c-3.6 0-6.8-1.8-8.8-4.5.7-.5 1.5-.8 2.3-.8 2.2 0 4.2 1.4 5.2 3.4.6 1.2 2 1.9 3.4 1.9s2.8-.7 3.4-1.9c1-2 3-3.4 5.2-3.4.8 0 1.6.3 2.3.8-2 2.7-5.2 4.5-8.8 4.5z'
    };
    const reactionColors: { [key: string]: string } = {
        'like': '#1877f2',
        'love': '#f33e58',
        'haha': '#f7b125'
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        reactionsRef.current.forEach(r => {
            ctx.save();
            ctx.globalAlpha = r.opacity;
            ctx.translate(r.x, r.y);
            const scale = r.size / 50;
            ctx.scale(scale, scale);
            ctx.fillStyle = reactionColors[r.type];
            const p = new Path2D(reactionPaths[r.type]);
            ctx.fill(p);
            ctx.restore();
        });
    }, [reactionPaths, reactionColors]);

    const update = useCallback((width: number, height: number, speedRatio: number, sizeRatio: number) => {
        reactionsRef.current.forEach(r => {
            r.y -= r.speed * speedRatio;
            r.x += Math.sin(r.y * r.sway) * speedRatio;
            r.opacity -= 0.002 * speedRatio;

            if (r.y < -r.size || r.opacity <= 0) {
                r.y = height + 50;
                r.x = Math.random() * width;
                r.opacity = 1;
                r.size = (Math.random() * 30 + 20) * sizeRatio;
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
            reactionsRef.current = [];
            const reactionTypes = Object.keys(reactionPaths);
            for (let i = 0; i < 50 * sizeRatio; i++) {
                reactionsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height + canvas.height,
                    type: reactionTypes[Math.floor(Math.random() * reactionTypes.length)],
                    size: (Math.random() * 30 + 20) * sizeRatio,
                    opacity: 1,
                    speed: Math.random() * 1.5 + 0.5,
                    sway: (Math.random() - 0.5) * 0.05
                });
            }
        };

        const animate = () => {
            update(canvas.width, canvas.height, speedRatio, sizeRatio);
            draw(ctx);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        setup();
        window.addEventListener('resize', setup);
        animate();

        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, update, speed, size, reactionPaths]);

    return (
        <div className="fixed inset-0 -z-10 bg-gray-100 dark:bg-gray-800">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default FacebookLikesTheme;
