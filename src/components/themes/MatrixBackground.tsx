
"use client";

import React, { useRef, useEffect, useCallback } from 'react';

export default function MatrixBackground({ 
  mode = 'padrão', 
  speed = 100 
}: { 
  mode?: 'padrão' | 'merge';
  speed?: number; 
}) {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const leaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const draw = useCallback((
    trailCtx: CanvasRenderingContext2D,
    leaderCtx: CanvasRenderingContext2D | null,
    drops: number[]
  ) => {
    const trailCanvas = trailCtx.canvas;
    
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const alphabet = katakana + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const fontSize = 16;
    
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    trailCtx.font = `${fontSize}px monospace`;
    
    if (leaderCtx) {
        leaderCtx.clearRect(0, 0, leaderCtx.canvas.width, leaderCtx.canvas.height);
        leaderCtx.font = `${fontSize}px monospace`;
    }

    for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        trailCtx.fillStyle = '#0F0';
        trailCtx.fillText(text, x, y);

        if (mode === 'padrão' && leaderCtx) {
            leaderCtx.fillStyle = '#cceeff';
            leaderCtx.fillText(text, x, y);
        } else if (mode === 'merge') {
            trailCtx.fillStyle = '#cceeff';
            trailCtx.fillText(text, x, y);
        }

        if (y > trailCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }

  }, [mode]);
  
  useEffect(() => {
    const setup = () => {
        const trailCanvas = trailCanvasRef.current;
        const leaderCanvas = leaderCanvasRef.current;
        const trailCtx = trailCanvas?.getContext('2d');
        const leaderCtx = mode === 'padrão' ? leaderCanvas?.getContext('2d') : null;

        if (!trailCanvas || !trailCtx || (mode === 'padrão' && !leaderCtx)) {
            return;
        }

        const resizeCanvas = () => {
            if (trailCanvas) {
                trailCanvas.width = window.innerWidth;
                trailCanvas.height = window.innerHeight;
            }
            if (leaderCanvas) {
                leaderCanvas.width = window.innerWidth;
                leaderCanvas.height = window.innerHeight;
            }
        };

        resizeCanvas();
        
        const columns = Math.floor(trailCanvas.width / 16);
        const drops = Array(columns).fill(1).map((_, i) => Math.floor(Math.random() * trailCanvas.height));

        let lastTime = 0;
        const baseInterval = 50;
        const speedMultiplier = 100 / Math.max(1, speed);
        const interval = baseInterval * speedMultiplier;

        const animate = (timestamp: number = 0) => {
            if (timestamp - lastTime >= interval) {
                draw(trailCtx, leaderCtx, drops);
                lastTime = timestamp;
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        animate();

        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    };

    const cleanup = setup();
    return cleanup;
  }, [draw, mode, speed]);

  return (
    <div className="fixed inset-0 -z-10 bg-black">
      <canvas 
        ref={trailCanvasRef} 
        className="block"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />
      {mode === 'padrão' && (
        <canvas 
          ref={leaderCanvasRef} 
          className="block"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
        />
      )}
    </div>
  );
};
