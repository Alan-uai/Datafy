
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Particle {
  theta: number; // Angle on the disk
  radius: number; // Distance from center
  yOffset: number; // Vertical position on the disk
  color: string;
  size: number;
}

const InterstellarBlackHoleTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const particlesRef = useRef<Particle[]>([]);

    const setup = useCallback((width: number, height: number, numParticles: number) => {
        particlesRef.current = [];
        const baseColors = [
            'rgba(255, 255, 255, 0.9)', 
            'rgba(255, 240, 200, 0.9)', 
            'rgba(255, 200, 150, 0.8)',
            'rgba(240, 150, 100, 0.7)'
        ];
        for (let i = 0; i < numParticles; i++) {
            particlesRef.current.push({
                theta: Math.random() * Math.PI * 2,
                radius: (Math.random() * Math.random()) * width * 0.4 + width * 0.1,
                yOffset: (Math.random() - 0.5) * 20,
                color: baseColors[Math.floor(Math.random() * baseColors.length)],
                size: Math.random() * 2 + 0.5,
            });
        }
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, speedRatio: number, sizeRatio: number) => {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        const cx = width / 2;
        const cy = height / 2;
        const holeRadius = Math.min(width, height) * 0.15 * sizeRatio;

        particlesRef.current.forEach(p => {
            const perspective = p.radius / (width * 0.5);
            const x = cx + Math.sin(p.theta) * p.radius;
            let y = cy + Math.cos(p.theta) * p.radius * 0.2 + p.yOffset; // Flatten the disk
            
            // Lensing effect
            const distToCenter = Math.hypot(x - cx, y - cy);
            if (distToCenter < holeRadius && Math.cos(p.theta) > 0) {
              // This part of the disk is behind the black hole, so we bend it
              y = cy - (y - cy) * 1.5; // Flip and exaggerate Y
            }

            // Doppler effect simulation
            const brightness = Math.max(0.3, Math.sin(p.theta) ** 2);
            ctx.fillStyle = p.color.replace(/(\d\.\d+)\)/, `${parseFloat(RegExp.$1) * brightness})`);
            
            ctx.beginPath();
            ctx.arc(x, y, p.size * perspective * sizeRatio, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Draw the black hole itself on top
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Thin line for the part of the disk in front
        ctx.strokeStyle = 'rgba(150, 120, 100, 0.2)';
        ctx.lineWidth = 2 * sizeRatio;
        ctx.beginPath();
        ctx.moveTo(cx - holeRadius, cy);
        ctx.lineTo(cx + holeRadius, cy);
        ctx.stroke();

    }, [size]);

    const update = useCallback((width: number, speedRatio: number) => {
        particlesRef.current.forEach(p => {
            p.theta -= (0.005 / (p.radius / (width * 0.2))) * speedRatio;
            if (p.theta < 0) p.theta += Math.PI * 2;
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
            setup(canvas.width, canvas.height, 4000 * sizeRatio);
        };

        const animate = () => {
            update(canvas.width, speedRatio);
            draw(ctx, canvas.width, canvas.height, speedRatio, sizeRatio);
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
