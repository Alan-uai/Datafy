
"use client";

import React, { useRef, useEffect } from 'react';

export default function MatrixPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to fill the screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Characters used for the rain
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numerals = '0123456789';
    const characters = katakana + latin + numerals;

    const fontSize = 16;
    const columns = Math.floor(canvas.width / fontSize);

    // Array to store the y-position of each drop
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    let animationFrameId: number;

    const draw = () => {
      // Semi-transparent black background for the fading trail effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Get a random character
        const text = characters.charAt(Math.floor(Math.random() * characters.length));
        
        // The y-position of the drop
        const y = drops[i] * fontSize;

        // The character is white only if it's a latin character, otherwise it's green.
        if (latin.includes(text)) {
            ctx.fillStyle = '#cceeff'; // Brighter color for the leading character
        } else {
            ctx.fillStyle = '#0F0'; // Green color for the trail
        }

        ctx.fillText(text, i * fontSize, y);

        // Reset the drop to the top randomly to make the rain effect uneven
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
       animationFrameId = window.requestAnimationFrame(draw);
    };

    draw();
    
    const handleResize = () => {
        if (!canvasRef.current || !ctx) return;
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
    }

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
        window.cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="block bg-black" />;
}
