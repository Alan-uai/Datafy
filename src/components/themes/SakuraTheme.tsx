
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface SakuraThemeProps {
    speed: number;
    size: number;
}

const SakuraTheme: React.FC<SakuraThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const initialAnimationProgress = useRef(0); // 0 to 1 for fade-in

    const draw = useCallback((ctx: CanvasRenderingContext2D, petals: any[]) => {
        const { width, height } = ctx.canvas;
        ctx.clearRect(0, 0, width, height);

        const currentOpacity = initialAnimationProgress.current; // Current opacity for fade-in

        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, `rgba(252, 236, 236, ${currentOpacity})`); // Apply opacity
        skyGradient.addColorStop(1, `rgba(248, 210, 232, ${currentOpacity})`); // Apply opacity
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        petals.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.beginPath();
            // Apply opacity to petal color
            const petalColor = p.color.replace(/rgb\((\d+), (\d+), (\d+)\)/, `rgba($1, $2, $3, ${p.opacity * currentOpacity})`);
            ctx.fillStyle = petalColor;
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
        
        const animationStartTime = performance.now();
        const animationDuration = 1500; // 1.5 seconds fade-in for petals

        const animate = (currentTime: DOMHighResTimeStamp = 0) => {
            if (initialAnimationProgress.current < 1) {
                const elapsed = currentTime - animationStartTime;
                initialAnimationProgress.current = Math.min(1, elapsed / animationDuration);
            } else {
                initialAnimationProgress.current = 1; 
            }

            update(canvas.width, canvas.height, petals, speedRatio);
            draw(ctx, petals);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            petals = [];
            const numPetals = 150 * sizeRatio;
            for (let i = 0; i < numPetals; i++) {
                petals.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height, // Initial random position, fade-in will handle appearance
                    radius: (Math.random() * 5 + 5) * sizeRatio,
                    speedY: Math.random() * 1 + 0.5,
                    speedX: Math.random() * 2 - 1,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    // Store base color as rgb string and opacity separately to apply fade-in
                    color: `rgb(255, 183, 197)`,
                    opacity: Math.random() * 0.5 + 0.5
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
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default SakuraTheme;
