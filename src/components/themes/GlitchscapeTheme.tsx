
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

const GlitchscapeTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    const draw = useCallback((ctx: CanvasRenderingContext2D, bufferCtx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        
        // Draw base grid on buffer
        bufferCtx.fillStyle = '#000';
        bufferCtx.fillRect(0,0,width,height);
        bufferCtx.strokeStyle = '#0f0';
        bufferCtx.lineWidth = 1;
        
        for(let i=0; i<100; i++) {
            bufferCtx.beginPath();
            bufferCtx.moveTo(Math.random() * width, Math.random() * height);
            bufferCtx.lineTo(Math.random() * width, Math.random() * height);
            bufferCtx.stroke();
        }
        
        // Clear main canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0,0,width,height);

        // Apply glitch effects
        const mouseEffect = Math.hypot(mousePos.current.x - width/2, mousePos.current.y - height/2) / Math.hypot(width/2, height/2);

        for (let i = 0; i < (10 * mouseEffect + 1) * speedRatio; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const spliceWidth = width - x;
            const spliceHeight = (Math.random() * 20 + 5) * sizeRatio;
            
            ctx.drawImage(bufferCtx.canvas, 0, y, spliceWidth, spliceHeight, x, y, spliceWidth, spliceHeight);
            ctx.drawImage(bufferCtx.canvas, spliceWidth, y, x, spliceHeight, 0, y, x, spliceHeight);
        }

        // Chromatic Aberration
        if (Math.random() < 0.1 * speedRatio) {
            const shift = (Math.random() * 10 - 5) * sizeRatio;
            ctx.globalCompositeOperation = 'lighter';
            ctx.drawImage(ctx.canvas, shift, 0);
            ctx.drawImage(ctx.canvas, -shift, 0);
            ctx.globalCompositeOperation = 'source-over';
        }

    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const bufferCanvas = document.createElement('canvas');
        const bufferCtx = bufferCanvas.getContext('2d');
        if(!bufferCtx) return;
        bufferCanvasRef.current = bufferCanvas;

        const speedRatio = speed / 100;
        const sizeRatio = size / 100;
        
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            bufferCanvas.width = canvas.width;
            bufferCanvas.height = canvas.height;
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        let frameCount = 0;
        const animate = () => {
            frameCount++;
            draw(ctx, bufferCtx, frameCount, speedRatio, sizeRatio);
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
    }, [draw, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default GlitchscapeTheme;
