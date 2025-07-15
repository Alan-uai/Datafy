
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface Cell {
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    color: string;
    targetRadius: number;
    life: number;
}

const LivingOrganismTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const cellsRef = useRef<Cell[]>([]);
    const mousePos = useRef({ x: 0, y: 0, active: false });

    const createCell = (width: number, height: number, sizeRatio: number, x?:number, y?:number) => {
        return {
            x: x || Math.random() * width,
            y: y || Math.random() * height,
            radius: 0,
            targetRadius: (Math.random() * 20 + 10) * sizeRatio,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`,
            life: 200 + Math.random() * 200,
        };
    }

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        ctx.fillStyle = '#011a24';
        ctx.fillRect(0, 0, width, height);

        cellsRef.current.forEach(cell => {
            ctx.beginPath();
            const opacity = cell.life / 400;
            const grad = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.radius);
            
            // Correctly format HSL string into HSLA
            const colorWithAlpha = cell.color.replace(')', `, ${opacity})`).replace('hsl', 'hsla');
            const colorTransparent = cell.color.replace(')', ', 0)').replace('hsl', 'hsla');

            grad.addColorStop(0, colorWithAlpha);
            grad.addColorStop(1, colorTransparent);

            ctx.fillStyle = grad;
            ctx.arc(cell.x, cell.y, cell.radius, 0, Math.PI * 2);
            ctx.fill();
        });
    }, []);

    const update = useCallback((width: number, height: number, speedRatio: number, sizeRatio: number) => {
        cellsRef.current.forEach((cell, index) => {
            cell.x += cell.vx * speedRatio;
            cell.y += cell.vy * speedRatio;
            cell.life -= 1 * speedRatio;

            // Lerp radius
            cell.radius += (cell.targetRadius - cell.radius) * 0.1;

            if (cell.x < 0 || cell.x > width) cell.vx *= -1;
            if (cell.y < 0 || cell.y > height) cell.vy *= -1;

            // Split
            if (cell.life < 100 && Math.random() < 0.005 * speedRatio) {
                cell.life = 0; // mark for removal
                cellsRef.current.push(createCell(width, height, sizeRatio, cell.x, cell.y));
                cellsRef.current.push(createCell(width, height, sizeRatio, cell.x, cell.y));
            }
            
            // Mouse interaction
            if(mousePos.current.active) {
                const dx = cell.x - mousePos.current.x;
                const dy = cell.y - mousePos.current.y;
                const dist = Math.hypot(dx, dy);
                if (dist < 100) {
                    cell.vx += dx / dist * 0.5;
                    cell.vy += dy / dist * 0.5;
                }
            }

            // Limit speed
            const maxSpeed = 2;
            const speed = Math.hypot(cell.vx, cell.vy);
            if (speed > maxSpeed) {
                cell.vx = (cell.vx / speed) * maxSpeed;
                cell.vy = (cell.vy / speed) * maxSpeed;
            }

            if (cell.life <= 0) {
                cellsRef.current.splice(index, 1);
            }
        });
        
        // Add new cells
        if (cellsRef.current.length < 50 * sizeRatio && Math.random() < 0.1) {
            cellsRef.current.push(createCell(width, height, sizeRatio));
        }

    }, [size]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY, active: true };
        };
        const handleMouseLeave = () => {
            mousePos.current.active = false;
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            cellsRef.current = [];
            for (let i = 0; i < 30 * sizeRatio; i++) {
                cellsRef.current.push(createCell(canvas.width, canvas.height, sizeRatio));
            }

            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            update(canvas.width, canvas.height, speedRatio, sizeRatio);
            draw(ctx);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        setup();
        window.addEventListener('resize', setup);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        
        return () => {
            window.removeEventListener('resize', setup);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default LivingOrganismTheme;
