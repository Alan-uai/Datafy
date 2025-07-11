
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function TestePage() {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const leaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const draw = useCallback(() => {
    const trailCanvas = trailCanvasRef.current;
    if (!trailCanvas) return;
    const trailCtx = trailCanvas.getContext('2d');
    
    const leaderCanvas = leaderCanvasRef.current;
    if (!leaderCanvas) return;
    const leaderCtx = leaderCanvas.getContext('2d');

    const uiCanvas = uiCanvasRef.current;
    if (!uiCanvas) return;
    const uiCtx = uiCanvas.getContext('2d');

    if (!trailCtx || !leaderCtx || !uiCtx) return;

    // --- Draw Matrix Rain (Background Canvases) ---
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const alphabet = katakana + latin + nums;
    const fontSize = 16;
    const columns = Math.floor(trailCanvas.width / fontSize);

    const drops = (trailCanvas as any).drops || Array(columns).fill(1);
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

    // --- Draw UI Card (Foreground Canvas) ---
    // This is the critical fix: clear the UI canvas before redrawing
    uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height); 

    const cardWidth = 400;
    const cardHeight = 150;
    const cardX = (uiCanvas.width - cardWidth) / 2;
    const cardY = (uiCanvas.height - cardHeight) / 2;
    const cornerRadius = 8;

    // Card Background
    uiCtx.fillStyle = 'rgba(20, 20, 25, 0.85)'; // Semi-transparent dark background
    uiCtx.strokeStyle = 'rgba(120, 255, 120, 0.5)'; // Greenish border
    uiCtx.lineWidth = 1;

    uiCtx.beginPath();
    uiCtx.moveTo(cardX + cornerRadius, cardY);
    uiCtx.lineTo(cardX + cardWidth - cornerRadius, cardY);
    uiCtx.quadraticCurveTo(cardX + cardWidth, cardY, cardX + cardWidth, cardY + cornerRadius);
    uiCtx.lineTo(cardX + cardWidth, cardY + cardHeight - cornerRadius);
    uiCtx.quadraticCurveTo(cardX + cardWidth, cardY + cardHeight, cardX + cardWidth - cornerRadius, cardY + cardHeight);
    uiCtx.lineTo(cardX + cornerRadius, cardY + cardHeight);
    uiCtx.quadraticCurveTo(cardX, cardY + cardHeight, cardX, cardY + cardHeight - cornerRadius);
    uiCtx.lineTo(cardX, cardY + cornerRadius);
    uiCtx.quadraticCurveTo(cardX, cardY, cardX + cornerRadius, cardY);
    uiCtx.closePath();
    
    uiCtx.fill();
    uiCtx.stroke();
    
    // Card Title
    uiCtx.fillStyle = 'hsl(120, 100%, 75%)'; // Bright green for text
    uiCtx.font = 'bold 18px Inter, sans-serif';
    uiCtx.fillText('Card de Teste (em Canvas)', cardX + 20, cardY + 40);

    // Card Description
    uiCtx.fillStyle = 'hsl(120, 80%, 85%)';
    uiCtx.font = '14px Inter, sans-serif';
    uiCtx.fillText('Este card foi desenhado em um terceiro canvas,', cardX + 20, cardY + 70);
    uiCtx.fillText('posicionado sobre a animação de fundo.', cardX + 20, cardY + 90);

  }, []);

  useEffect(() => {
    let lastTime = 0;
    const interval = 50; 

    const animate = (timestamp: number) => {
      const allCanvasesReady = trailCanvasRef.current && leaderCanvasRef.current && uiCanvasRef.current;
      
      if (allCanvasesReady && (timestamp - lastTime >= interval)) {
          draw();
          lastTime = timestamp;
      }
      animationFrameId.current = requestAnimationFrame(animate);
    }
    
    const setup = () => {
        const canvases = [trailCanvasRef.current, leaderCanvasRef.current, uiCanvasRef.current];
        
        canvases.forEach(canvas => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });
        
        if(trailCanvasRef.current) {
            (trailCanvasRef.current as any).drops = []; // Reset drops on resize
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
  }, [draw]);

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
        <canvas
          ref={uiCanvasRef}
          className="absolute inset-0 z-30"
        />
      </div>
    </div>
  );
}
