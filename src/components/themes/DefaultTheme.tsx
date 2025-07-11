
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface DefaultThemeProps {
    speed: number;
    size: number;
}

const DefaultTheme: React.FC<DefaultThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    const draw = useCallback((ctx: CanvasRenderingContext2D, particles: any[], speedRatio: number) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const gradient = ctx.createLinearGradient(0, height, width, 0);
        gradient.addColorStop(0, '#020024');
        gradient.addColorStop(0.5, '#090979');
        gradient.addColorStop(1, '#00d4ff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        particles.forEach(p => {
            ctx.beginPath();
            let dist = Math.hypot(p.x - mousePos.current.x, p.y - mousePos.current.y);
            let opacity = Math.max(0, 1 - dist / 300);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * opacity})`;
            ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
            ctx.fill();
        });
    }, []);

    const update = useCallback((width: number, height: number, particles: any[], speedRatio: number) => {
        particles.forEach(p => {
            p.x += p.vx * speedRatio;
            p.y += p.vy * speedRatio;
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;
        });
    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let particles: any[] = [];
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;
        
        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            particles = [];
            const numParticles = Math.floor(200 * sizeRatio);
            for (let i = 0; i < numParticles; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.2,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                });
            }
            
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        const animate = () => {
            update(canvas.width, canvas.height, particles, speedRatio);
            draw(ctx, particles, speedRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        setup();
        window.addEventListener('resize', setup);
        window.addEventListener('mousemove', handleMouseMove);
        
        return () => {
            window.removeEventListener('resize', setup);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default DefaultTheme;
