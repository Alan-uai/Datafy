
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface SakuraThemeProps {
    speed: number;
    size: number;
}

const SakuraTheme: React.FC<SakuraThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, petals: any[]) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#fcecec');
        skyGradient.addColorStop(1, '#f8d2e8');
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        petals.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.ellipse(0, 0, p.radius, p.radius / 2, 0, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        });
    }, []);

    const update = useCallback((width: number, height: number, petals: any[], speedRatio: number) => {
        petals.forEach(p => {
            p.y += p.speedY * speedRatio;
            p.x += p.speedX * speedRatio;
            p.rotation += p.rotationSpeed * speedRatio;

            if (p.y > height + 20) {
                p.x = Math.random() * width;
                p.y = -20;
            }
             if (p.x > width + 20) {
                p.x = -20;
            }
             if (p.x < -20) {
                p.x = width + 20;
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let petals: any[] = [];
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            petals = [];
            const numPetals = 150 * sizeRatio;
            for (let i = 0; i < numPetals; i++) {
                petals.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: (Math.random() * 5 + 5) * sizeRatio,
                    speedY: Math.random() * 1 + 0.5,
                    speedX: Math.random() * 2 - 1,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    color: `rgba(255, 183, 197, ${Math.random() * 0.5 + 0.5})`,
                });
            }
            
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        const animate = () => {
            update(canvas.width, canvas.height, petals, speedRatio);
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
    }, [draw, update, speed, size]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default SakuraTheme;
