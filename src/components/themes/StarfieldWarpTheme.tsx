
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface StarfieldWarpThemeProps {
    config: Partial<ThemeConfig>;
}

interface Star {
    x: number;
    y: number;
    z: number;
    prevZ: number; // Store previous z for trail effect
}

const StarfieldWarpTheme: React.FC<StarfieldWarpThemeProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, stars: Star[], sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        ctx.fillStyle = 'rgba(0, 0, 16, 0.2)'; // Fainter trail effect
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = 'white';
        
        ctx.save();
        ctx.translate(halfWidth, halfHeight);

        stars.forEach(star => {
            const k = width / star.z;
            const px = star.x * k;
            const py = star.y * k;

            if (star.prevZ > 0) {
                 const prev_k = width / star.prevZ;
                 const prev_px = star.x * prev_k;
                 const prev_py = star.y * prev_k;

                 const d = star.z / width;
                 const alpha = (1 - d * d);

                 ctx.lineWidth = (1 - d) * 2 * sizeRatio;
                 ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                 ctx.beginPath();
                 ctx.moveTo(prev_px, prev_py);
                 ctx.lineTo(px, py);
                 ctx.stroke();
            }
        });

        ctx.restore();
    }, []);
    
    const update = useCallback((width: number, stars: Star[], speedRatio: number) => {
        stars.forEach(star => {
            star.prevZ = star.z;
            star.z -= speedRatio;
            if (star.z <= 0) {
                star.x = (Math.random() - 0.5) * width;
                star.y = (Math.random() - 0.5) * width;
                star.z = width;
                star.prevZ = width;
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let stars: Star[] = [];
        const speedRatio = (speed / 100) * 15; // Drastically increased speed
        const sizeRatio = size / 100;
        
        const animate = () => {
            update(canvas.width, stars, speedRatio);
            draw(ctx, stars, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            for (let i = 0; i < 1500 * sizeRatio; i++) {
                stars.push({
                    x: (Math.random() - 0.5) * canvas.width,
                    y: (Math.random() - 0.5) * canvas.height,
                    z: Math.random() * canvas.width,
                    prevZ: Math.random() * canvas.width,
                });
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
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default StarfieldWarpTheme;
