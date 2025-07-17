
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number; // previous z
}

const InterstellarBlackHoleTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const starsRef = useRef<Star[]>([]);

    const setup = useCallback((width: number, height: number, numStars: number) => {
        starsRef.current = new Array(numStars).fill(0).map(() => ({
            x: (Math.random() - 0.5) * width * 1.5,
            y: (Math.random() - 0.5) * height * 1.5,
            z: Math.random() * width,
            pz: Math.random() * width,
        }));
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, speedRatio: number) => {
        ctx.fillStyle = 'rgba(0, 0, 10, 0.4)';
        ctx.fillRect(0, 0, width, height);
        ctx.save();
        ctx.translate(width / 2, height / 2);

        // Black Hole
        const holeRadius = 20 * (size / 100);
        const grad = ctx.createRadialGradient(0, 0, holeRadius, 0, 0, holeRadius * 20);
        grad.addColorStop(0, 'black');
        grad.addColorStop(0.01, 'rgba(10,0,20,1)');
        grad.addColorStop(0.2, 'rgba(50,0,80,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, holeRadius * 20, 0, Math.PI * 2);
        ctx.fill();

        starsRef.current.forEach(star => {
            const sx = star.x / (star.z / width);
            const sy = star.y / (star.z / width);
            const r = Math.max(0.1, (1 - star.z / width) * 5);

            // Previous position for the tail
            const px = star.x / (star.pz / width);
            const py = star.y / (star.pz / width);
            
            // Warp effect towards center
            const dist = Math.hypot(sx, sy);
            const angle = Math.atan2(sy, sx);
            const warpFactor = Math.max(0, 1 - dist / (width * 0.4));
            
            const finalSx = sx - Math.cos(angle) * warpFactor * 50 * speedRatio;
            const finalSy = sy - Math.sin(angle) * warpFactor * 50 * speedRatio;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(finalSx, finalSy);
            ctx.lineWidth = r;
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - star.z / width})`;
            ctx.stroke();
        });

        ctx.restore();
    }, [size]);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        starsRef.current.forEach(star => {
            star.pz = star.z;
            star.z -= 2 * speedRatio;
            
            if (star.z < 1) {
                star.z = width;
                star.pz = width;
                star.x = (Math.random() - 0.5) * width * 1.5;
                star.y = (Math.random() - 0.5) * height * 1.5;
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

        const resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            setup(canvas.width, canvas.height, 800 * sizeRatio);
        };

        const animate = () => {
            update(canvas.width, canvas.height, speedRatio);
            draw(ctx, canvas.width, canvas.height, speedRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        resizeHandler();
        window.addEventListener('resize', resizeHandler);
        animate();

        return () => {
            window.removeEventListener('resize', resizeHandler);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw, update, setup, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default InterstellarBlackHoleTheme;
