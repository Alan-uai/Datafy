"use client";

import React, { useRef, useEffect } from 'react';

export default function MatrixPage() {
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const leaderCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const trailCanvas = trailCanvasRef.current;
    const leaderCanvas = leaderCanvasRef.current;
    if (!trailCanvas || !leaderCanvas) return;

    const trailCtx = trailCanvas.getContext('2d');
    const leaderCtx = leaderCanvas.getContext('2d');
    if (!trailCtx || !leaderCtx) return;

    const setupCanvas = (canvas: HTMLCanvasElement) => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    setupCanvas(trailCanvas);
    setupCanvas(leaderCanvas);
    
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

    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    let animationTimeoutId: any;

    const draw = () => {
      // --- Trail Canvas ---
      // Apply fade effect to the trail canvas
      trailCtx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
      trailCtx.font = `${fontSize}px monospace`;
      
      // Draw the green trail characters
      for (let i = 0; i < drops.length; i++) {
        const text = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
        trailCtx.fillStyle = '#0F0';
        // The trail character is drawn at the *previous* position of the leader
        if (drops[i] > 1) {
             trailCtx.fillText(text, i * fontSize, (drops[i] - 1) * fontSize);
        }
      }

      // --- Leader Canvas ---
      // Clear the leader canvas completely in each frame
      leaderCtx.clearRect(0, 0, leaderCanvas.width, leaderCanvas.height);
      leaderCtx.font = `${fontSize}px monospace`;

      for(let i = 0; i < drops.length; i++) {
        const leaderText = leadingChars.charAt(Math.floor(Math.random() * leadingChars.length));
        leaderCtx.fillStyle = '#cceeff';
        leaderCtx.fillText(leaderText, i * fontSize, drops[i] * fontSize);
        
        // Reset drop when it goes off screen
        if (drops[i] * fontSize > trailCanvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
      animationTimeoutId = setTimeout(() => requestAnimationFrame(draw), 200); // Slow down animation
    };

    draw();
    
    const handleResize = () => {
        if (!trailCanvasRef.current || !leaderCanvasRef.current) return;
        setupCanvas(trailCanvasRef.current);
        setupCanvas(leaderCanvasRef.current);
    }

    window.addEventListener('resize', handleResize);

    return () => {
        if (animationTimeoutId) clearTimeout(animationTimeoutId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div style={{ position: 'relative', background: 'black' }}>
        <canvas 
            ref={trailCanvasRef} 
            className="block"
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        />
        <canvas 
            ref={leaderCanvasRef} 
            className="block"
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 2 }}
        />
    </div>
  );
}
