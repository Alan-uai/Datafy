
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

// Perlin noise implementation
const Perlin = {
    rand_vect: function(){
        let theta = Math.random() * 2 * Math.PI;
        return {x: Math.cos(theta), y: Math.sin(theta)};
    },
    dot_prod_grid: function(x: number, y: number, vx: number, vy: number){
        let g_vect;
        let d_vect = {x: x - vx, y: y - vy};
        if (this.vectors[vy] && this.vectors[vy][vx]){
            g_vect = this.vectors[vy][vx];
        } else {
            g_vect = this.rand_vect();
            if(!this.vectors[vy]) this.vectors[vy] = [];
            this.vectors[vy][vx] = g_vect;
        }
        return d_vect.x * g_vect.x + d_vect.y * g_vect.y;
    },
    smootherstep: function(x: number){
        return 6*x**5 - 15*x**4 + 10*x**3;
    },
    interp: function(x: number, a: number, b: number){
        return a + this.smootherstep(x) * (b-a);
    },
    seed: function(){
        this.vectors = [] as any;
    },
    get: function(x: number, y: number){
        if (!this.vectors) this.seed();
        let xf = Math.floor(x);
        let yf = Math.floor(y);
        //interpolate
        let tl = this.dot_prod_grid(x, y, xf,   yf);
        let tr = this.dot_prod_grid(x, y, xf+1, yf);
        let bl = this.dot_prod_grid(x, y, xf,   yf+1);
        let br = this.dot_prod_grid(x, y, xf+1, yf+1);
        let xt = this.interp(x-xf, tl, tr);
        let xb = this.interp(x-xf, bl, br);
        return this.interp(y-yf, xt, xb);
    },
    vectors: [] as any
};
Perlin.seed();

const GenerativeTopographyTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const mousePos = useRef({ x: 0.5, y: 0.5 });

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number) => {
        const { width, height } = ctx.canvas;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 1;

        const time = frame * 0.005 * (speed / 100);
        const resolution = 20 * (size / 100);

        for (let y = 0; y < height; y += resolution) {
            ctx.beginPath();
            for (let x = 0; x < width; x += 5) {
                const p_x = x / width;
                const p_y = y / height;
                const noiseVal = Perlin.get(p_x * 2, p_y * 2 + time, 0.5);
                
                const lightDir = {x: mousePos.current.x - p_x, y: mousePos.current.y - p_y};
                const lightDist = Math.hypot(lightDir.x, lightDir.y);
                const brightness = Math.max(0, 1 - lightDist * 2);

                const finalY = y + noiseVal * 100 * (size / 100) * brightness;
                ctx.lineTo(x, finalY);
            }
            ctx.stroke();
        }
    }, [speed, size, mousePos]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const handleMouseMove = (e: MouseEvent) => {
            mousePos.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
        };

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            Perlin.seed();
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        let frameCount = 0;
        const animate = () => {
            frameCount++;
            draw(ctx, frameCount);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        setup();
        window.addEventListener('resize', setup);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', setup);
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

export default GenerativeTopographyTheme;
