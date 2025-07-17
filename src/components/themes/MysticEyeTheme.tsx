
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface EyeColors {
  bg: string;
  sclera: string;
  iris: string;
  pupil: string;
}

const eyeColorSchemes: { [key: string]: EyeColors } = {
    human: { bg: '#111', sclera: '#fff', iris: '#69a2ff', pupil: '#000' },
    demon: { bg: '#200', sclera: '#ffdddd', iris: '#ff4444', pupil: '#000' },
    angelic: { bg: '#eef', sclera: '#fff', iris: '#ffd700', pupil: '#f0e68c' },
    reptile: { bg: '#121', sclera: '#f0fff0', iris: '#d4af37', pupil: '#000' },
    cybernetic: { bg: '#011', sclera: '#ccc', iris: '#00ffff', pupil: '#f0f' }
};

const MysticEyeTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, eyeType = 'human' } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef({ x: 0, y: 0 });

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        const { width, height } = ctx.canvas;
        const cx = width / 2;
        const cy = height / 2;
        const eyeRadius = Math.min(width, height) * 0.3 * (size / 100);
        const colors = eyeColorSchemes[eyeType];

        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, width, height);

        // Calculate pupil position based on mouse
        const dx = mousePos.current.x - cx;
        const dy = mousePos.current.y - cy;
        const angle = Math.atan2(dy, dx);
        const maxDist = eyeRadius * 0.4;
        const dist = Math.min(Math.hypot(dx, dy) * 0.1, maxDist);
        const pupilX = cx + Math.cos(angle) * dist;
        const pupilY = cy + Math.sin(angle) * dist;

        // Sclera (white part)
        ctx.fillStyle = colors.sclera;
        ctx.beginPath();
        ctx.ellipse(cx, cy, eyeRadius, eyeRadius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        const irisRadius = eyeRadius * 0.5;
        const irisGrad = ctx.createRadialGradient(pupilX, pupilY, 0, pupilX, pupilY, irisRadius);
        irisGrad.addColorStop(0, colors.iris);
        irisGrad.addColorStop(1, colors.pupil);
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(pupilX, pupilY, irisRadius, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = colors.pupil;
        ctx.beginPath();
        if (eyeType === 'reptile') {
             ctx.ellipse(pupilX, pupilY, irisRadius * 0.1, irisRadius * 0.4, 0, 0, Math.PI*2);
        } else {
             ctx.arc(pupilX, pupilY, irisRadius * 0.3, 0, Math.PI * 2);
        }
        ctx.fill();
        
        // Eyelids
        ctx.fillStyle = colors.bg;
        ctx.beginPath();
        ctx.moveTo(cx - eyeRadius * 1.2, cy);
        ctx.quadraticCurveTo(cx, cy - eyeRadius, cx + eyeRadius * 1.2, cy);
        ctx.quadraticCurveTo(cx, cy + eyeRadius * 0.1, cx - eyeRadius * 1.2, cy);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - eyeRadius * 1.2, cy);
        ctx.quadraticCurveTo(cx, cy + eyeRadius, cx + eyeRadius * 1.2, cy);
        ctx.quadraticCurveTo(cx, cy - eyeRadius * 0.1, cx - eyeRadius * 1.2, cy);
        ctx.fill();

    }, [size, eyeType]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX, y: e.clientY };
        };

        const resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const animate = () => {
            draw(ctx);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        resizeHandler();
        window.addEventListener('resize', resizeHandler);
        window.addEventListener('mousemove', handleMouseMove);
        animate();

        return () => {
            window.removeEventListener('resize', resizeHandler);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default MysticEyeTheme;
