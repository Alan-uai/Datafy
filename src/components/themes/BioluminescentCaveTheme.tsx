
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Flora {
    x: number;
    y: number;
    radius: number;
    color: string;
    brightness: number; // 0 to 1
    type: 'mushroom' | 'crystal';
}

const BioluminescentCaveTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const floraRef = useRef<Flora[]>([]);
    const mousePos = useRef({ x: 0, y: 0 });

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;
        
        ctx.fillStyle = '#100c24';
        ctx.fillRect(0, 0, width, height);

        // Draw cave walls (simple parallax layers)
        for(let i=0; i<3; i++) {
            ctx.fillStyle = `rgba(0,0,0,${0.2 + i * 0.1})`;
            const parallax = (mousePos.current.x - width/2) * (0.01 * (i+1));
            ctx.beginPath();
            ctx.moveTo(-100 + parallax, height);
            for(let x=0; x<width+200; x+=50){
                 ctx.bezierCurveTo(x+25, height - (Math.sin(x*0.01 + i) * 50) - 100, x+25, height - (Math.sin(x*0.01+i)*50) - 100, x+50, height);
            }
            ctx.fill();
        }

        floraRef.current.forEach(f => {
            const glowRadius = f.radius * 5 * f.brightness;
            const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, glowRadius);
            grad.addColorStop(0, `${f.color}${Math.floor(f.brightness * 255).toString(16).padStart(2, '0')}`);
            grad.addColorStop(0.3, `${f.color}40`);
            grad.addColorStop(1, `${f.color}00`);
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(f.x, f.y, glowRadius, 0, Math.PI * 2);
            ctx.fill();

            if (f.type === 'mushroom') {
                ctx.fillStyle = f.color;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.fill();
            } else { // Crystal
                ctx.save();
                ctx.translate(f.x, f.y);
                ctx.rotate(frame * 0.001);
                ctx.fillStyle = f.color;
                ctx.beginPath();
                for(let i=0; i<5; i++){
                    const angle = (Math.PI*2/5) * i;
                    ctx.lineTo(Math.cos(angle) * f.radius, Math.sin(angle) * f.radius);
                }
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
        });
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        floraRef.current.forEach(f => {
            const dist = Math.hypot(f.x - mousePos.current.x, f.y - mousePos.current.y);
            const targetBrightness = Math.max(0.1, 1 - dist / 300);
            f.brightness += (targetBrightness - f.brightness) * 0.05 * speedRatio;
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            floraRef.current = [];
            const floraCount = Math.floor(100 * sizeRatio);
            for(let i=0; i<floraCount; i++) {
                 floraRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: (Math.random() * 8 + 4) * sizeRatio,
                    color: Math.random() > 0.5 ? '#7cfc00' : '#00ffff',
                    brightness: 0.1,
                    type: Math.random() > 0.5 ? 'mushroom' : 'crystal'
                });
            }

            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        let frameCount = 0;
        const animate = () => {
            frameCount++;
            update(canvas.width, canvas.height, speedRatio);
            draw(ctx, frameCount);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        setup();
        window.addEventListener('resize', setup);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', setup);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default BioluminescentCaveTheme;
