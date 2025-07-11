
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export default function TestePage() {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const leaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const drawBackground = useCallback(() => {
    const trailCanvas = trailCanvasRef.current;
    const leaderCanvas = leaderCanvasRef.current;
    if (!trailCanvas || !leaderCanvas) return;

    const trailCtx = trailCanvas.getContext('2d');
    const leaderCtx = leaderCanvas.getContext('2d');
    if (!trailCtx || !leaderCtx) return;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;
    const fontSize = 16;
    const columns = Math.floor(trailCanvas.width / fontSize);

    const drops = (trailCanvas as any).drops || Array(columns).fill(1).map((_,i) => i * fontSize);
    (trailCanvas as any).drops = drops;

    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    trailCtx.fillStyle = '#0F0';
    trailCtx.font = `${fontSize}px monospace`;

    leaderCtx.clearRect(0, 0, leaderCanvas.width, leaderCanvas.height);
    leaderCtx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        trailCtx.fillText(text, x, y);

        leaderCtx.fillStyle = '#cceeff';
        leaderCtx.fillText(text, x, y);

        if (y > trailCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
  }, []);
  
  useEffect(() => {
    let lastTime = 0;
    const interval = 50; 

    const animate = (timestamp: number) => {
      if (timestamp - lastTime >= interval) {
          drawBackground();
          lastTime = timestamp;
      }
      animationFrameId.current = requestAnimationFrame(animate);
    }
    
    const setup = () => {
        const canvases = [trailCanvasRef.current, leaderCanvasRef.current];
        
        canvases.forEach(canvas => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });
        
        if(trailCanvasRef.current) {
            (trailCanvasRef.current as any).drops = [];
        }
        
        if(animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = requestAnimationFrame(animate); 
    }
    
    if (typeof window !== 'undefined') {
        setup();
        window.addEventListener('resize', setup);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', setup);
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [drawBackground]);

  return (
    <div className={cn('matrix relative min-h-screen bg-black')}>
      <div className="fixed inset-0 -z-10">
        <canvas 
          ref={trailCanvasRef} 
          className="absolute inset-0 z-10"
        />
        <canvas 
          ref={leaderCanvasRef} 
          className="absolute inset-0 z-20"
        />
      </div>
    </div>
  );
}
