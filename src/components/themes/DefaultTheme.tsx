
"use client";

import React, { useRef, useEffect } from 'react';

const DefaultTheme = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const drawGradient = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const gradient = ctx.createLinearGradient(0, canvas.height, canvas.width, 0);
            gradient.addColorStop(0, '#000000'); // Black
            gradient.addColorStop(0.5, '#00008B'); // Dark Blue
            gradient.addColorStop(1, '#FFFFFF'); // White

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        drawGradient();
        window.addEventListener('resize', drawGradient);

        return () => {
            window.removeEventListener('resize', drawGradient);
        };
    }, []);

    return (
        <div className="fixed inset-0 -z-10">
            <canvas ref={canvasRef} />
        </div>
    );
};

export default DefaultTheme;
