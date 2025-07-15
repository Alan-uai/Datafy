
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

const ShiftingSandsTheme: React.FC<{ config: Partial<ThemeConfig> }> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100 } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);

    const draw = useCallback((ctx: CanvasRenderingContext2D, frame: number, speedRatio: number, sizeRatio: number) => {
        const { width, height } = ctx.canvas;
        const time = frame * 0.001 * speedRatio;
        
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0,0,0,height);
        skyGrad.addColorStop(0, '#fca5a5');
        skyGrad.addColorStop(0.5, '#fb923c');
        skyGrad.addColorStop(1, '#f97316');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0,0,width,height);
        
        // Sun
        ctx.fillStyle = 'rgba(255, 255, 224, 0.8)';
        ctx.beginPath();
        ctx.arc(width/2, height * 0.3, 50 * sizeRatio, 0, Math.PI * 2);
        ctx.fill();

        // Dunes
        for(let i=0; i<5; i++){
            ctx.beginPath();
            const duneColor = `rgb(252, 211, 77, ${0.2 + i * 0.15})`;
            ctx.fillStyle = duneColor;
            ctx.moveTo(-100, height);
            for (let x = -100; x < width + 100; x += 10) {
                const noiseX = (x / width + i * 10) * 2;
                const noiseY = (time + i * 20) * 0.5;
                const y = height * (0.6 + i*0.05) + Perlin.get(noiseX, noiseY) * 100 * sizeRatio;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(width+100, height);
            ctx.closePath();
            ctx.fill();
        }
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const speedRatio = speed / 100;
        const sizeRatio = size / 100;

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
            draw(ctx, frameCount, speedRatio, sizeRatio);
            animationFrameId.current = requestAnimationFrame(animate);
        };

        setup();
        window.addEventListener('resize', setup);

        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, speed, size]);

    return (
        <div className="fixed inset-0 -z-10 bg-yellow-100">
            <canvas ref={canvasRef} className="absolute inset-0" />
        </div>
    );
};

export default ShiftingSandsTheme;
