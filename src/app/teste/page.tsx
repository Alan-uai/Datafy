
"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Terminal } from 'lucide-react';

const MatrixTest = () => {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const leaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const symbolCanvasRef = useRef<HTMLCanvasElement>(null); // Terceiro canvas
  const animationFrameId = useRef<number | null>(null);

  const draw = useCallback(() => {
    const trailCanvas = trailCanvasRef.current;
    const trailCtx = trailCanvas?.getContext('2d');
    
    const leaderCanvas = leaderCanvasRef.current;
    const leaderCtx = leaderCanvas?.getContext('2d');

    const symbolCanvas = symbolCanvasRef.current;
    const symbolCtx = symbolCanvas?.getContext('2d');

    if (!trailCanvas || !trailCtx || !leaderCanvas || !leaderCtx || !symbolCanvas || !symbolCtx) return;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const specialSymbols = '日一国会人年大十二本中長出三';

    const alphabet = katakana + latin + nums;
    const fontSize = 16;
    const columns = Math.floor(trailCanvas.width / fontSize);

    const drops = (trailCanvas as any).drops || Array(columns).fill(1);
    (trailCanvas as any).drops = drops;
    
    // Camada de rastro (a que desaparece lentamente)
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    
    trailCtx.fillStyle = '#0F0';
    trailCtx.font = `${fontSize}px monospace`;

    // Limpa as camadas da frente
    leaderCtx.clearRect(0, 0, leaderCanvas.width, leaderCanvas.height);
    leaderCtx.font = `${fontSize}px monospace`;

    symbolCtx.clearRect(0, 0, symbolCanvas.width, symbolCanvas.height);
    symbolCtx.font = `bold ${fontSize * 1.5}px monospace`;


    for (let i = 0; i < drops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Desenha o rastro verde
        trailCtx.fillText(text, x, y);

        // Desenha o caractere líder branco
        leaderCtx.fillStyle = '#cceeff';
        leaderCtx.fillText(text, x, y);

        // Ocasionalmente, desenha um símbolo especial e maior na terceira camada
        if (Math.random() > 0.99) {
            symbolCtx.fillStyle = '#FF6347'; // Cor de destaque para o símbolo
            symbolCtx.shadowBlur = 10;
            symbolCtx.shadowColor = '#FF6347';
            const symbol = specialSymbols.charAt(Math.floor(Math.random() * specialSymbols.length));
            symbolCtx.fillText(symbol, x, y);
        } else {
            symbolCtx.shadowBlur = 0;
        }

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
            draw();
            lastTime = timestamp;
        }
        animationFrameId.current = requestAnimationFrame(animate);
    }
    
    const setup = () => {
        const canvases = [trailCanvasRef.current, leaderCanvasRef.current, symbolCanvasRef.current];
        
        canvases.forEach(canvas => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });

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
    <div className="fixed inset-0 -z-20 bg-black">
      <canvas 
        ref={trailCanvasRef} 
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      />
      <canvas 
        ref={leaderCanvasRef} 
        className="absolute inset-0"
        style={{ zIndex: 2 }}
      />
      <canvas 
        ref={symbolCanvasRef} 
        className="absolute inset-0"
        style={{ zIndex: 3 }}
      />
    </div>
  );
};


export default function TestePage() {
  return (
    <div className={cn('matrix relative min-h-screen flex items-center justify-center')}>
      <MatrixTest />
      <Card className="w-96 z-10 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal />
            Card de Teste
          </CardTitle>
          <CardDescription>Este card está sobre o fundo Matrix.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>O conteúdo da interface deve ser legível e aparecer na frente da animação de fundo com os três canvas.</p>
        </CardContent>
      </Card>
    </div>
  );
}
