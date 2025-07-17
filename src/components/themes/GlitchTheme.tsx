
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ThemeConfig } from '@/lib/types';

const GlitchTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, glitchType = 'classic' } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bufferCanvasRef = useRef(document.createElement('canvas'));
    const animationFrameId = useRef<number | null>(null);

    const drawBase = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        for (let i = 0; i < 50; i++) {
            ctx.fillRect(Math.random() * width, Math.random() * height, Math.random() * 50, Math.random() * 50);
        }
    }, []);

    const drawGlitch = useCallback((ctx: CanvasRenderingContext2D, buffer: HTMLCanvasElement, width: number, height: number, speedRatio: number, sizeRatio: number) => {
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(buffer, 0, 0);

        if (Math.random() > 0.9 - speedRatio * 0.1) {
            for (let i = 0; i < (Math.random() * 5 + 1); i++) {
                const y = Math.random() * height;
                const h = (Math.random() * 50 + 10) * sizeRatio;
                const xShift = (Math.random() - 0.5) * 50 * sizeRatio;

                switch (glitchType) {
                    case 'classic':
                        ctx.drawImage(buffer, 0, y, width, h, xShift, y, width, h);
                        break;
                    case 'rgb-shift':
                        ctx.globalCompositeOperation = 'lighter';
                        ctx.drawImage(buffer, 0, y, width, h, xShift, y, width, h);
                        ctx.drawImage(buffer, 0, y, width, h, -xShift, y, width, h);
                        ctx.globalCompositeOperation = 'source-over';
                        break;
                    case 'blocky':
                         const w = (Math.random() * 100 + 50) * sizeRatio;
                         ctx.drawImage(buffer, xShift, y, w, h, Math.random() * width, y, w, h);
                         break;
                    case 'invert':
                         ctx.globalCompositeOperation = 'difference';
                         ctx.fillStyle = 'white';
                         ctx.fillRect(0, y, width, h);
                         ctx.globalCompositeOperation = 'source-over';
                         break;
                    case 'scanlines':
                        ctx.fillStyle = 'rgba(0,0,0,0.3)';
                        for(let j=y; j<y+h; j+=3){
                            ctx.fillRect(0, j, width, 1);
                        }
                        break;
                }
            }
        }
    }, [glitchType]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const buffer = bufferCanvasRef.current;
        const bufferCtx = buffer.getContext('2d');
        if (!bufferCtx) return;

        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            buffer.width = canvas.width;
            buffer.height = canvas.height;
            drawBase(bufferCtx, buffer.width, buffer.height);
        };
        
        let lastTime = 0;
        const animate = (time: number) => {
            const deltaTime = time - lastTime;
            if(deltaTime > 1000 / (10 * speedRatio)) { // Limit frame rate
                drawGlitch(ctx, buffer, canvas.width, canvas.height, speedRatio, sizeRatio);
                lastTime = time;
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };

        resizeHandler();
        window.addEventListener('resize', resizeHandler);
        animate(0);

        return () => {
            window.removeEventListener('resize', resizeHandler);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [drawBase, drawGlitch, speed, size, glitchType]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default GlitchTheme;
