
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

    // Define character sets
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const hiragana = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
    const kanji = '日一国会人年大十二本中長出三同時政事自行社見月分議後前民生連五発間対上部東者党地員切動';
    const numerals = '0123456789';
    
    const latinUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const latinLower = 'abcdefghijklmnopqrstuvwxyz';
    const specialChars = '@#$€£¥§%&/()=?*<>|!çéàèùâêîôûëïü';

    // Characters for the bright leader of the drop
    const leadingChars = latinUpper + latinLower + specialChars;
    // Characters for the green trail
    const trailChars = katakana + hiragana + kanji + numerals;

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
        // Draw the green trail character first. This character will be part of the fading trail.
        const trailText = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
        ctx.fillStyle = '#0F0'; // Green color for the trail
        ctx.fillText(trailText, i * fontSize, drops[i] * fontSize);

        // Now, draw the bright leader character on top of the trail character at the tip of the drop.
        const leaderText = leadingChars.charAt(Math.floor(Math.random() * leadingChars.length));
        ctx.fillStyle = '#cceeff'; // Brighter color for the leader
        ctx.fillText(leaderText, i * fontSize, drops[i] * fontSize);
        
        // If the drop has reached the bottom of the screen, reset it to the top randomly
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Move the drop down for the next frame
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
