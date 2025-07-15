
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface EnchantedForestThemeProps {
    config: Partial<ThemeConfig>;
}

const EnchantedForestTheme: React.FC<EnchantedForestThemeProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const treesRef = useRef<any[]>([]);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, fireflies: any[], speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0c1445');
        gradient.addColorStop(0.7, '#2c3e50');
        gradient.addColorStop(1, '#1a2a1f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Sort trees by z-index for correct layering
        treesRef.current.sort((a, b) => a.z - b.z);

        treesRef.current.forEach(tree => {
            const scale = tree.z;
            const treeHeight = 150 * scale * sizeRatio;
            const treeWidth = 60 * scale * sizeRatio;
            const parallaxX = (mousePos.current.x - width / 2) * (scale * 0.1);

            ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + scale * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(tree.x + parallaxX - treeWidth / 2, height);
            ctx.lineTo(tree.x + parallaxX, height - treeHeight);
            ctx.lineTo(tree.x + parallaxX + treeWidth / 2, height);
            ctx.closePath();
            ctx.fill();
        });


        // Draw Fireflies
        fireflies.forEach(f => {
            ctx.beginPath();
            const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius * sizeRatio);
            g.addColorStop(0, `rgba(255, 255, 150, ${f.opacity})`);
            g.addColorStop(0.5, `rgba(255, 255, 0, ${f.opacity * 0.5})`);
            g.addColorStop(1, 'rgba(255, 255, 0, 0)');
            ctx.fillStyle = g;
            ctx.arc(f.x, f.y, f.radius * sizeRatio, 0, Math.PI * 2);
            ctx.fill();
        });
    }, []);

    const update = useCallback((width: number, height: number, fireflies: any[], speedRatio: number) => {
        // Update trees for forward motion
        treesRef.current.forEach((tree, index) => {
            tree.z += 0.0005 * speedRatio;
            tree.y = height * (1 - tree.z);
            if (tree.z > 1.2) {
                // Reset tree when it's too close
                tree.z = Math.random() * 0.1;
                tree.x = Math.random() * width;
            }
        });

        fireflies.forEach(f => {
            const dx = mousePos.current.x - f.x;
            const dy = mousePos.current.y - f.y;
            f.vx += dx * 0.0001 * speedRatio;
            f.vy += dy * 0.0001 * speedRatio;

            f.vx += (Math.random() - 0.5) * 0.1;
            f.vy += (Math.random() - 0.5) * 0.1;

            f.vx *= 0.95;
            f.vy *= 0.95;

            f.x += f.vx * speedRatio;
            f.y += f.vy * speedRatio;
            
            f.opacity = Math.max(0, Math.min(1, f.opacity + (Math.random() - 0.5) * 0.1));
            
            if (f.x > width || f.x < 0 || f.y > height || f.y < 0) {
                f.x = Math.random() * width;
                f.y = Math.random() * height;
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let fireflies: any[] = [];
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;
        let frameCount = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            fireflies = [];
            treesRef.current = [];
            for (let i = 0; i < 50; i++) {
                treesRef.current.push({
                    x: Math.random() * canvas.width,
                    z: Math.random() // z will represent depth (0-1)
                });
            }
            for (let i = 0; i < 100; i++) {
                fireflies.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 3 + 2,
                    opacity: Math.random(),
                    vx: 0,
                    vy: 0
                });
            }
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        const animate = () => {
            frameCount++;
            update(canvas.width, canvas.height, fireflies, speedRatio);
            draw(ctx, frameCount, fireflies, speedRatio, sizeRatio);
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
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default EnchantedForestTheme;
