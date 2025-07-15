
"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ThemeConfig } from '@/lib/types';

const MAX_ITER = 100;

const FractalExplorerTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [view, setView] = useState({ x: -0.5, y: 0, scale: 2.5 });
    const [colorOffset, setColorOffset] = useState(0);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const { width, height } = canvas;
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;

        for (let i = 0; i < width; i++) {
            for (let j = 0; j < height; j++) {
                const x0 = (i - width / 2) * view.scale / width + view.x;
                const y0 = (j - height / 2) * view.scale / width + view.y;

                let x = 0, y = 0;
                let iteration = 0;
                while (x * x + y * y <= 4 && iteration < MAX_ITER) {
                    let xtemp = x * x - y * y + x0;
                    y = 2 * x * y + y0;
                    x = xtemp;
                    iteration++;
                }
                
                const pixelIndex = (j * width + i) * 4;
                if (iteration < MAX_ITER) {
                    const hue = (iteration * 5 + colorOffset) % 360;
                    const rgb = hslToRgb(hue / 360, 1, 0.5);
                    data[pixelIndex] = rgb[0];
                    data[pixelIndex + 1] = rgb[1];
                    data[pixelIndex + 2] = rgb[2];
                    data[pixelIndex + 3] = 255;
                } else {
                    data[pixelIndex] = 0;
                    data[pixelIndex + 1] = 0;
                    data[pixelIndex + 2] = 0;
                    data[pixelIndex + 3] = 255;
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);

    }, [view, colorOffset]);

    useEffect(() => {
        draw();
    }, [draw]);

    useEffect(() => {
        const interval = setInterval(() => {
            setColorOffset(prev => (prev + 1 * (speed / 100)) % 360);
        }, 20);
        return () => clearInterval(interval);
    }, [speed]);


    const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const newX = (event.clientX - rect.left - canvas.width / 2) * view.scale / canvas.width + view.x;
        const newY = (event.clientY - rect.top - canvas.height / 2) * view.scale / canvas.width + view.y;
        
        setView({ x: newX, y: newY, scale: view.scale * 0.5 });
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            draw();
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    function hslToRgb(h: number, s: number, l: number) {
        let r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    return (
        <canvas 
            ref={canvasRef} 
            className="fixed inset-0 -z-10 cursor-pointer" 
            onClick={handleCanvasClick} 
        />
    );
};

export default FractalExplorerTheme;
