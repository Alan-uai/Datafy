
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Bat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  flap: number;
}

const VampireAestheticTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const batsRef = useRef<Bat[]>([]);
    
    const drawBat = (ctx: CanvasRenderingContext2D, bat: Bat) => {
        const { x, y, size, flap } = bat;
        const wingAngle = Math.sin(flap) * 0.8;
        ctx.fillStyle = 'black';
        ctx.beginPath();
        // Body
        ctx.arc(x, y, size / 3, 0, Math.PI * 2);
        // Wings
        ctx.moveTo(x, y);
        ctx.lineTo(x - size, y + wingAngle * size);
        ctx.lineTo(x - size * 0.8, y);
        ctx.lineTo(x, y);
        ctx.moveTo(x, y);
        ctx.lineTo(x + size, y + wingAngle * size);
        ctx.lineTo(x + size * 0.8, y);
        ctx.lineTo(x, y);
        ctx.fill();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1a0000');
        grad.addColorStop(0.7, '#4d0000');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Moon
        ctx.fillStyle = '#f0e68c';
        ctx.beginPath();
        ctx.arc(width - 100, 100, 50 * (size / 100), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = grad; // Use bg grad to create crescent
        ctx.beginPath();
        ctx.arc(width - 120, 90, 45 * (size / 100), 0, Math.PI * 2);
        ctx.fill();
        
        batsRef.current.forEach(bat => drawBat(ctx, bat));

    }, [size]);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        batsRef.current.forEach((bat, index) => {
            bat.x += bat.vx * speedRatio;
            bat.y += bat.vy * speedRatio;
            bat.flap += 0.3 * speedRatio;

            if (bat.x < -50 || bat.x > width + 50 || bat.y < -50 || bat.y > height + 50) {
                 batsRef.current.splice(index, 1);
            }
        });

        if (Math.random() < 0.02 * speedRatio && batsRef.current.length < 20 * (size/100)) {
            const side = Math.floor(Math.random() * 4);
            let x, y, vx, vy;
            switch(side) {
                case 0: // top
                    x = Math.random() * width; y = -50; vx = (Math.random()-0.5)*2; vy = Math.random()*2+1; break;
                case 1: // right
                    x = width + 50; y = Math.random() * height; vx = -Math.random()*2-1; vy = (Math.random()-0.5)*2; break;
                case 2: // bottom
                    x = Math.random() * width; y = height + 50; vx = (Math.random()-0.5)*2; vy = -Math.random()*2-1; break;
                case 3: // left
                default:
                    x = -50; y = Math.random() * height; vx = Math.random()*2+1; vy = (Math.random()-0.5)*2; break;
            }
            batsRef.current.push({ x, y, vx, vy, size: Math.random() * 10 + 5, flap: Math.random() * Math.PI * 2 });
        }

    }, [size]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const speedRatio = speed / 100;

        const resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            batsRef.current = [];
        };

        let frameCount = 0;
        const animate = () => {
            frameCount++;
            update(canvas.width, canvas.height, speedRatio);
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
    }, [draw, update, speed]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default VampireAestheticTheme;
