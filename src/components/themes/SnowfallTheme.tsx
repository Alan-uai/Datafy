
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  density: number;
  type: 'soft' | 'crystal' | 'heavy';
}

const SnowfallTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, snowType = 'soft' } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const snowflakesRef = useRef<Snowflake[]>([]);

    const drawSnowflake = useCallback((ctx: CanvasRenderingContext2D, flake: Snowflake) => {
        const { x, y, radius, type } = flake;
        ctx.beginPath();
        
        switch (type) {
            case 'crystal':
                ctx.moveTo(x, y);
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
                }
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.lineWidth = radius / 5;
                ctx.stroke();
                break;
            case 'heavy':
                ctx.arc(x, y, radius, 0, Math.PI * 2, false);
                ctx.fillStyle = `rgba(220, 220, 255, 0.9)`;
                ctx.fill();
                break;
            case 'soft':
            default:
                ctx.arc(x, y, radius, 0, Math.PI * 2, false);
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = gradient;
                ctx.fill();
                break;
        }
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        snowflakesRef.current.forEach(flake => {
            drawSnowflake(ctx, flake);
        });
    }, [drawSnowflake]);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        snowflakesRef.current.forEach(flake => {
            flake.y += Math.pow(flake.density, 2) * 0.5 * speedRatio;
            flake.x += Math.sin(flake.y * 0.05) * flake.density * 0.5;

            if (flake.y > height) {
                flake.y = -10;
                flake.x = Math.random() * width;
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
            snowflakesRef.current = [];
            for (let i = 0; i < 200 * sizeRatio; i++) {
                snowflakesRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: (Math.random() * 3 + 1) * sizeRatio,
                    density: Math.random() * 3 + 1,
                    type: snowType,
                });
            }
        };

        const animate = () => {
            update(canvas.width, canvas.height, speedRatio);
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
    }, [draw, update, speed, size, snowType]);

    return (
        <div className="fixed inset-0 -z-10 bg-gray-800">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default SnowfallTheme;
