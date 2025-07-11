
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

const SpaceTheme = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, stars: any[]) => {
        const { width, height } = ctx.canvas;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, width, height);

        stars.forEach(star => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
            ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
            ctx.fill();
        });
    }, []);

    const update = useCallback((stars: any[]) => {
        stars.forEach(star => {
            star.opacity += star.opacitySpeed;
            if (star.opacity > 1 || star.opacity < 0.1) {
                star.opacitySpeed *= -1;
            }
        });
    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let stars: any[] = [];
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            for (let i = 0; i < 200; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 1.5,
                    opacity: Math.random(),
                    opacitySpeed: (Math.random() - 0.5) * 0.01
                });
            }
            
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        const animate = () => {
            update(stars);
            draw(ctx, stars);
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
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default SpaceTheme;
