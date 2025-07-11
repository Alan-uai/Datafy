
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lógica do MatrixBackground clonada diretamente aqui para teste
const MatrixBackgroundClone = ({ mode = 'padrão', speed = 100 }) => {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const leaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const draw = useCallback(() => {
    const trailCanvas = trailCanvasRef.current;
    const trailCtx = trailCanvas?.getContext('2d');
    
    const leaderCanvas = leaderCanvasRef.current;
    const leaderCtx = leaderCanvas?.getContext('2d');

    if (!trailCanvas || !trailCtx) return;
    if (mode === 'padrão' && (!leaderCanvas || !leaderCtx)) return;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
    const kanji = '日一国会人年大十二本中長出三同時政事自行社見月分議後前民生連五発間対上部東者党地員切動';
    const numerals = '0123456789';
    const latinUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const latinLower = 'abcdefghijklmnopqrstuvwxyz';
    const specialChars = '@#$€£¥§%&/()=?*<>|!çéàèùâêîôûëïü';
    
    const leadingChars = latinUpper + latinLower + specialChars;
    const trailChars = katakana + hiragana + kanji + numerals;

    const fontSize = 16;
    const columns = Math.floor(trailCanvas.width / fontSize);

    const drops = (trailCanvas as any).drops || [];
    if (drops.length === 0) {
      for (let i = 0; i < columns; i++) {
        drops[i] = 1;
      }
      (trailCanvas as any).drops = drops;
    }

    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    trailCtx.font = `${fontSize}px monospace`;
    
    if (leaderCtx) {
        leaderCtx.clearRect(0, 0, leaderCanvas!.width, leaderCanvas!.height);
        leaderCtx.font = `${fontSize}px monospace`;
    }

    for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        const trailText = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
        trailCtx.fillStyle = '#0F0';
        trailCtx.fillText(trailText, x, y);

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
    let lastTime = 0;
    const baseInterval = 50; 
    const speedMultiplier = 100 / Math.max(1, speed);
    const interval = baseInterval * speedMultiplier;

    const animate = (timestamp: number) => {
        if (timestamp - lastTime >= interval) {
            draw();
            lastTime = timestamp;
        }
        animationFrameId.current = requestAnimationFrame(animate);
    }
    
    const setup = () => {
        const trailCanvas = trailCanvasRef.current;
        const leaderCanvas = leaderCanvasRef.current;

        const setCanvasSize = (canvas: HTMLCanvasElement) => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            (canvas as any).drops = [];
        }
        
        if (trailCanvas) setCanvasSize(trailCanvas);
        if (mode === 'padrão' && leaderCanvas) setCanvasSize(leaderCanvas);

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


export default function TestePage() {
  return (
    <div className={cn('matrix', 'animate-cintilate')}>
      <MatrixBackgroundClone mode="padrão" speed={100} />
      <div className="relative z-10 flex h-screen flex-col items-center justify-center p-8">
        <div className="text-center">
            <h1 className="text-5xl font-bold">Página de Teste Matrix</h1>
            <p className="mt-4 text-lg text-muted-foreground">
                Se você vê a "chuva digital" como fundo, o componente está funcionando.
            </p>
        </div>

        <Card className="mt-8 w-full max-w-md animate-rotate">
           <CardHeader>
                <CardTitle>Card de Teste</CardTitle>
           </CardHeader>
           <CardContent>
                <p>Este card deve ter um fundo semitransparente e uma borda animada, permitindo que a animação de fundo seja visível.</p>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
