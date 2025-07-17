
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Cloud {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
}

const CloudSurfingTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const cloudsRef = useRef<Cloud[]>([]);
    
    const drawCloud = (ctx: CanvasRenderingContext2D, cloud: Cloud) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
        ctx.beginPath();
        const baseRadius = cloud.size / 3;
        ctx.arc(cloud.x, cloud.y, baseRadius, 0, Math.PI * 2);
        ctx.arc(cloud.x + baseRadius, cloud.y, baseRadius, 0, Math.PI * 2);
        ctx.arc(cloud.x - baseRadius, cloud.y, baseRadius, 0, Math.PI * 2);
        ctx.arc(cloud.x, cloud.y - baseRadius, baseRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(1, '#ADD8E6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(width / 2, height / 2);

        cloudsRef.current.sort((a,b) => a.z - b.z);

        cloudsRef.current.forEach(cloud => {
            const scale = 1 / (cloud.z / 2 + 1);
            ctx.save();
            ctx.translate(cloud.x * scale, cloud.y * scale);
            ctx.scale(scale, scale);
            drawCloud(ctx, cloud);
            ctx.restore();
        });

        ctx.restore();
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        cloudsRef.current.forEach(cloud => {
            cloud.z -= 0.5 * speedRatio;

            if (cloud.z < 0) {
                cloud.z = width;
                cloud.x = (Math.random() - 0.5) * width * 2;
                cloud.y = (Math.random() - 0.5) * height;
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
            cloudsRef.current = [];
            for (let i = 0; i < 30 * sizeRatio; i++) {
                cloudsRef.current.push({
                    x: (Math.random() - 0.5) * canvas.width * 2,
                    y: (Math.random() - 0.5) * canvas.height,
                    z: Math.random() * canvas.width,
                    size: (Math.random() * 50 + 50) * sizeRatio,
                    opacity: Math.random() * 0.5 + 0.4
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
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-sky-400">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default CloudSurfingTheme;
