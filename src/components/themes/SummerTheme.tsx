
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

interface SummerThemeProps {
    speed: number;
    size: number;
}

interface Cloud {
    x: number;
    y: number;
    parts: { dx: number, dy: number, r: number }[];
    speed: number;
}

interface Bird {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    flapSpeed: number;
    angle: number;
}

const SummerTheme: React.FC<SummerThemeProps> = ({ speed, size }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const cloudsRef = useRef<Cloud[]>([]);
    const birdsRef = useRef<Bird[]>([]);
    const waveOffsetRef = useRef(0);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number) => {
        const { width, height } = ctx.canvas;
        
        // Sky
        const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
        skyGradient.addColorStop(0, '#87CEEB'); // Sky Blue
        skyGradient.addColorStop(0.7, '#f0f8ff'); // Alice Blue
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, width, height);

        // Sun
        const sunX = width - 100;
        const sunY = 100;
        const sunRadius = 60 * (size / 100);

        ctx.save();
        ctx.translate(sunX, sunY);
        const rayAngle = frame * 0.001 * speedRatio;
        ctx.rotate(rayAngle);
        for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            const rayOpacity = 0.15 + Math.sin(frame * 0.01 * speedRatio + i) * 0.05;
            ctx.strokeStyle = `rgba(255, 255, 0, ${rayOpacity})`;
            ctx.lineWidth = 20 * (size/100);
            ctx.lineCap = 'round';
            ctx.moveTo(sunRadius + 10, 0);
            ctx.lineTo(sunRadius * 4, 0);
            ctx.stroke();
            ctx.rotate(Math.PI / 6);
        }
        ctx.restore();

        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
        sunGradient.addColorStop(0, 'rgba(255, 255, 180, 1)');
        sunGradient.addColorStop(1, 'rgba(255, 200, 0, 1)');
        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        cloudsRef.current.forEach(cloud => {
            cloud.parts.forEach(part => {
                ctx.beginPath();
                ctx.arc(cloud.x + part.dx, cloud.y + part.dy, part.r, 0, 2 * Math.PI);
                ctx.fill();
            });
        });

        // Birds
        birdsRef.current.forEach(bird => {
            ctx.save();
            ctx.translate(bird.x, bird.y);
            ctx.beginPath();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = bird.size / 5;
            const wingAngle = Math.sin(frame * bird.flapSpeed * speedRatio) * 0.5;
            ctx.moveTo(0,0);
            ctx.quadraticCurveTo(bird.size/2, bird.size/2 * wingAngle, bird.size, 0);
            ctx.moveTo(0,0);
            ctx.quadraticCurveTo(-bird.size/2, bird.size/2 * wingAngle, -bird.size, 0);
            ctx.stroke();
            ctx.restore();
        });

        // Sea
        ctx.save();
        ctx.translate(0, height * 0.85);
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(0, Math.sin(waveOffsetRef.current + i) * 10);
            for (let x = 0; x < width; x++) {
                ctx.lineTo(x, Math.sin((x + waveOffsetRef.current) * 0.01 + i) * 10 * (size/100));
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.fillStyle = `rgba(30, 144, 255, ${0.3 + i * 0.1})`;
            ctx.fill();
        }
        ctx.restore();


    }, [size]);

    const update = useCallback((width: number, height: number, speedRatio: number) => {
        // Update clouds
        cloudsRef.current.forEach(cloud => {
            cloud.x += cloud.speed * speedRatio;
            if (cloud.x > width + cloud.parts[2].r * 2) {
                cloud.x = -cloud.parts[2].r * 2;
            }
        });
        
        // Update birds
        birdsRef.current.forEach((bird, index) => {
            bird.x += bird.speedX * speedRatio;
            bird.y += bird.speedY * speedRatio;
            if (bird.x > width + 50 || bird.x < -50) {
                 birdsRef.current.splice(index, 1);
            }
        });

        if (Math.random() < 0.005 * speedRatio && birdsRef.current.length < 5) {
             birdsRef.current.push({
                x: -20,
                y: Math.random() * height/2,
                size: (Math.random() * 10 + 10) * (size / 100),
                speedX: Math.random() * 1 + 1,
                speedY: (Math.random() - 0.5) * 0.5,
                flapSpeed: Math.random() * 0.2 + 0.2,
                angle: 0
            });
        }
        waveOffsetRef.current += 0.02 * speedRatio;

    }, [size]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        let frameCount = 0;
        const speedRatio = speed / 100;
        
        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            cloudsRef.current = [];
            for (let i = 0; i < 5; i++) {
                const cloudBaseRadius = (Math.random() * 30 + 50) * (size / 100);
                cloudsRef.current.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height * 0.4,
                    parts: [
                        { dx: 0, dy: 0, r: cloudBaseRadius },
                        { dx: cloudBaseRadius * 0.8, dy: 0, r: cloudBaseRadius * 0.9 },
                        { dx: cloudBaseRadius * 1.6, dy: 0, r: cloudBaseRadius * 0.8 },
                    ],
                    speed: (Math.random() * 0.3 + 0.1)
                });
            }
            birdsRef.current = [];

            if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        }

        const animate = () => {
            frameCount++;
            update(canvas.width, canvas.height, speedRatio);
            draw(ctx, frameCount, speedRatio);
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

export default SummerTheme;
