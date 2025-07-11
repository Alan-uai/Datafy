
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
    const hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
    const kanji = '日一国会人年大十二本中長出三同時政事自行社見月分議後前民生連五発間対上部東者党地員切動';
    const numerals = '0123456789';
    const latinUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const latinLower = 'abcdefghijklmnopqrstuvwxyz';
    const specialChars = '@#$€£¥§%&/()=?*<>|!çéàèùâêîôûëïü';
    
    const leadingChars = latinUpper + latinLower + specialChars;
    const trailChars = katakana + hiragana + kanji + numerals;
    const alphabet = leadingChars + trailChars;

    const fontSize = 16;
    
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    trailCtx.font = `${fontSize}px monospace`;
    
    if (leaderCtx) {
        leaderCtx.clearRect(0, 0, leaderCtx.canvas.width, leaderCtx.canvas.height);
        leaderCtx.font = `${fontSize}px monospace`;
    }

    for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        
        trailCtx.fillStyle = '#0F0';
        trailCtx.fillText(text, x, y);

        const leaderText = leadingChars.charAt(Math.floor(Math.random() * leadingChars.length));
        
        if (mode === 'padrão' && leaderCtx) {
            leaderCtx.fillStyle = '#cceeff';
            leaderCtx.fillText(leaderText, x, y);
        } else if (mode === 'merge') {
            trailCtx.fillStyle = '#cceeff';
            trailCtx.fillText(leaderText, x, y);
        }

        if (y > trailCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }

  }, [mode]);

  useEffect(() => {
    const canvases = [trailCanvasRef.current, leaderCanvasRef.current];
    const trailCanvas = trailCanvasRef.current;
    const leaderCanvas = leaderCanvasRef.current;
    const trailCtx = trailCanvas?.getContext('2d');
    const leaderCtx = mode === 'padrão' ? leaderCanvas?.getContext('2d') : null;
    let drops: number[] = [];

    const setup = () => {
        canvases.forEach(canvas => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });
        if (trailCanvas) {
            const columns = Math.floor(trailCanvas.width / 16);
            drops = Array(columns).fill(1).map((_, i) => Math.floor(Math.random() * trailCanvas.height));
        }
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        animate();
    };

    let lastTime = 0;
    const baseInterval = 50;
    const speedMultiplier = 100 / Math.max(1, speed);
    const interval = baseInterval * speedMultiplier;

    const animate = (timestamp: number = 0) => {
        if (timestamp - lastTime >= interval) {
            if (trailCtx) {
                draw(trailCtx, leaderCtx, drops);
            }
            lastTime = timestamp;
        }
        animationFrameId.current = requestAnimationFrame(animate);
    };
    
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
