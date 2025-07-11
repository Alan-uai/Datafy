
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

const SummerTheme = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;
        
        // Sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#87CEEB'); // Sky Blue
        skyGradient.addColorStop(1, '#ADD8E6'); // Light Blue
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sunX = width - 100;
        const sunY = 100;
        const sunRadius = 60;

        // Sun Rays
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(frame * 0.001);
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 0, 0.1)`;
            ctx.lineWidth = 15;
            ctx.moveTo(0, 0);
            ctx.lineTo(sunRadius * 4, 0);
            ctx.stroke();
            ctx.rotate(Math.PI / 6);
        }
        ctx.restore();

        // Sun Body
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Clouds (simple ellipses)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(200 + Math.sin(frame * 0.002) * 20, 150, 100, 40, 0, 0, 2 * Math.PI);
        ctx.ellipse(width - 300 + Math.sin(frame * 0.0015) * 15, 250, 120, 50, 0, 0, 2 * Math.PI);
        ctx.ellipse(width / 2 + Math.cos(frame * 0.001) * 25, height - 100, 150, 60, 0, 0, 2 * Math.PI);
        ctx.fill();

    }, []);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frameCount = 0;

        const animate = () => {
            frameCount++;
            draw(ctx, frameCount);
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        setup();
        window.addEventListener('resize', setup);
        
        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [draw]);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} className="block" />
        </div>
    );
};

export default SummerTheme;
