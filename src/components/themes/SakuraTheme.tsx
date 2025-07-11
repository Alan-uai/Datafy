
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

const SakuraTheme = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, petals: any[]) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, width, height);

        petals.forEach(p => {
            ctx.beginPath();
            ctx.fillStyle = p.color;
            // Simple ellipse for a petal
            ctx.ellipse(p.x, p.y, p.r, p.r / 2, p.tilt, 0, 2 * Math.PI);
            ctx.fill();
        });
    }, []);

    const update = useCallback((width: number, height: number, petals: any[]) => {
        petals.forEach(p => {
            p.y += p.speed;
            p.x += Math.sin(p.y / p.tiltAngle) * 0.5;
            p.tilt += p.tiltSpeed;

            if (p.y > height) {
                p.x = Math.random() * width;
                p.y = -20;
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let petals: any[] = [];
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            petals = [];
            for (let i = 0; i < 100; i++) {
                petals.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 5 + 5,
                    speed: Math.random() * 1 + 0.5,
                    color: `rgba(255, 183, 197, ${Math.random() * 0.5 + 0.5})`,
                    tilt: Math.random() * Math.PI,
                    tiltSpeed: (Math.random() - 0.5) * 0.02,
                    tiltAngle: Math.random() * 50 + 50,
                });
            }
            
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        const animate = () => {
            update(canvas.width, canvas.height, petals);
            draw(ctx, petals);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        setup();
        window.addEventListener('resize', setup);
        
        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw, update]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default SakuraTheme;
