
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Car {
    x: number;
    y: number;
    z: number; // depth
    speed: number;
    color: string;
    length: number;
}

interface BuildingLayer {
    color: string;
    depth: number; // 0 (far) to 1 (near)
    buildings: { x: number; width: number; height: number; windows: any[] }[];
}


const CyberpunkTrafficTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const carsRef = useRef<Car[]>([]);
    const layersRef = useRef<BuildingLayer[]>([]);
    const mousePos = useRef({ x: 0, y: 0 });

    const createBuildingLayers = (width: number, height: number, sizeRatio: number) => {
        layersRef.current = [];
        const layerColors = ['#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F'];
        const layerDepths = [0.1, 0.3, 0.5, 0.7, 0.9];
        
        layerDepths.forEach((depth, i) => {
            const layer: BuildingLayer = {
                color: layerColors[i % layerColors.length],
                depth,
                buildings: []
            };
            
            let currentX = -50;
            while(currentX < width + 50) {
                const buildingWidth = (Math.random() * 150 + 50) * sizeRatio * depth;
                const buildingHeight = (Math.random() * (height * 0.6) + height * 0.2) * depth;
                layer.buildings.push({ x: currentX, width: buildingWidth, height: buildingHeight, windows: [] });
                currentX += buildingWidth + (Math.random() * 50 + 20) * sizeRatio;
            }
            layersRef.current.push(layer);
        });
    };

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;

        const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
        bgGradient.addColorStop(0, '#0c0a1a');
        bgGradient.addColorStop(0.5, '#2e1a47');
        bgGradient.addColorStop(1, '#4f2a6d');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, width, height);
        
        layersRef.current.forEach(layer => {
            const parallaxX = (mousePos.current.x - width / 2) * (layer.depth * 0.1);
            ctx.fillStyle = layer.color;
            layer.buildings.forEach(b => {
                ctx.fillRect(b.x + parallaxX, height - b.height, b.width, b.height);
            });
        });
        
        ctx.save();
        carsRef.current.sort((a,b) => a.z - b.z); // Draw cars from back to front
        carsRef.current.forEach(car => {
            const perspective = car.z / 10;
            const carY = height * 0.5 + car.y * perspective;
            const carLength = car.length * perspective;
            const carHeight = 2 * perspective;
            
            const grad = ctx.createLinearGradient(car.x, carY, car.x + carLength, carY);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.5, car.color);
            grad.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad;
            ctx.fillRect(car.x, carY - carHeight/2, carLength, carHeight);
        });
        ctx.restore();
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        carsRef.current.forEach((car, index) => {
            car.x += car.speed * speedRatio;
            if(car.speed > 0 && car.x > width + car.length) {
                car.x = -car.length;
            } else if (car.speed < 0 && car.x < -car.length) {
                car.x = width + car.length;
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

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            createBuildingLayers(canvas.width, canvas.height, sizeRatio);

            carsRef.current = [];
            for (let i = 0; i < 100 * sizeRatio; i++) {
                const z = Math.random() * 9 + 1; // 1 to 10
                carsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: (Math.random() - 0.5) * canvas.height * 0.8,
                    z: z,
                    speed: (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 2 + 1 + z/2),
                    color: Math.random() > 0.5 ? '#ff47da' : '#00f6ff',
                    length: Math.random() * 30 + 20,
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

export default CyberpunkTrafficTheme;
