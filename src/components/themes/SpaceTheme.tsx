
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface SpaceThemeProps {
    speed: number;
    size: number;
}

const SpaceTheme: React.FC<SpaceThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const initialAnimationProgress = useRef(0); // 0 to 1 for fade-in

    const draw = useCallback((ctx: CanvasRenderingContext2D, stars: any[], shootingStars: any[], nebulas: any[]) => {
        const { width, height } = ctx.canvas;
        const currentOpacity = initialAnimationProgress.current; // Current opacity for fade-in

        ctx.fillStyle = '#000010';
        ctx.fillRect(0, 0, width, height);

        // Draw Nebulas with fade-in
        nebulas.forEach(nebula => {
            const gradient = ctx.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, nebula.radius);
            gradient.addColorStop(0, `rgba(${nebula.color}, ${0.2 * currentOpacity})`);
            gradient.addColorStop(0.4, `rgba(${nebula.color}, ${0.1 * currentOpacity})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        });

        // Draw Stars with fade-in
        stars.forEach(star => {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * currentOpacity})`; // Apply opacity
            ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
            ctx.fill();
        });

        // Draw Shooting Stars with fade-in
        shootingStars.forEach(star => {
            ctx.beginPath();
            const gradient = ctx.createLinearGradient(star.x, star.y, star.x - star.len, star.y + star.len);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${1 * currentOpacity})`); // Apply opacity
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.strokeStyle = gradient;
            ctx.lineWidth = star.width;
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - star.len, star.y + star.len);
            ctx.stroke();
        });
    }, []);

    const update = useCallback((width: number, height: number, stars: any[], shootingStars: any[], nebulas: any[], speedRatio: number) => {
        stars.forEach(star => {
            star.x += star.vx * speedRatio;
            star.y += star.vy * speedRatio;

            if (star.x < 0 || star.x > width) star.vx *= -1;
            if (star.y < 0 || star.y > height) star.vy *= -1;
        });

        shootingStars.forEach((star, index) => {
            star.x += star.speed * speedRatio;
            star.y -= star.speed / 5 * speedRatio;
            if (star.x > width + star.len || star.y < -star.len) {
                shootingStars.splice(index, 1);
            }
        });
        
        if (Math.random() < 0.01 * speedRatio) {
             shootingStars.push({
                x: Math.random() * width,
                y: Math.random() * height / 2,
                len: Math.random() * 80 + 20,
                speed: Math.random() * 2 + 3,
                width: Math.random() * 1 + 0.5,
            });
        }

        nebulas.forEach(nebula => {
            nebula.x += nebula.vx * speedRatio * 0.1;
            nebula.y += nebula.vy * speedRatio * 0.1;
            if (nebula.x - nebula.radius > width) nebula.x = -nebula.radius;
            if (nebula.x + nebula.radius < 0) nebula.x = width + nebula.radius;
            if (nebula.y - nebula.radius > height) nebula.y = -nebula.radius;
            if (nebula.y + nebula.radius < 0) nebula.y = height + nebula.radius;
        });

    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let stars: any[] = [];
        let shootingStars: any[] = [];
        let nebulas: any[] = [];

        const speedRatio = speed / 100;
        const sizeRatio = size / 100;
        
        const animationStartTime = performance.now();
        const animationDuration = 1500; // 1.5 seconds fade-in

        const animate = (currentTime: DOMHighResTimeStamp = 0) => {
            if (initialAnimationProgress.current < 1) {
                const elapsed = currentTime - animationStartTime;
                initialAnimationProgress.current = Math.min(1, elapsed / animationDuration);
            } else {
                initialAnimationProgress.current = 1; 
            }

            update(canvas.width, canvas.height, stars, shootingStars, nebulas, speedRatio);
            draw(ctx, stars, shootingStars, nebulas);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            stars = [];
            nebulas = [];
            shootingStars = [];
            
            for (let i = 0; i < 300 * sizeRatio; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 1.5 * sizeRatio,
                    opacity: Math.random() * 0.5 + 0.3,
                    vx: (Math.random() - 0.5) * 0.1,
                    vy: (Math.random() - 0.5) * 0.1
                });
            }

            for (let i = 0; i < 3; i++) {
                nebulas.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 200 + 400 * sizeRatio,
                    color: [['138, 43, 226'], ['0, 191, 255'], ['255, 20, 147']][i],
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5
                });
            }
            
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            initialAnimationProgress.current = 0;
            animate(performance.now());
        }

        setup();
        window.addEventListener('resize', setup);
        
        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default SpaceTheme;
