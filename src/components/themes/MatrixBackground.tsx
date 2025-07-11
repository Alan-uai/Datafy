
"use-client";

import React, { useRef, useEffect, useCallback } from 'react';

interface MatrixBackgroundProps {
    speed: number;
    size: number;
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ speed = 100, size = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const draw = useCallback((ctx: CanvasRenderingContext2D, drops: number[], fontSize: number) => {
    const { width, height } = ctx.canvas;
    
    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const hiragana = 'あいうえおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをん';
    const kanji = '日一国会人年大十二本中長出三同時政';
    const nums = '0123456789';
    const trailChars = katakana + hiragana + kanji + nums;

    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const special = '!@#$%^&*()-+[]{};:<>?,./';
    const leaderChars = latin + nums + special;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, width, height);
    
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Trail
        ctx.fillStyle = '#0F0';
        const trailText = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
        ctx.fillText(trailText, x, y);

        // Leader
        ctx.fillStyle = 'rgba(200, 255, 220, 0.9)';
        const leaderText = leaderChars.charAt(Math.floor(Math.random() * leaderChars.length));
        ctx.fillText(leaderText, x, y);

        if (y > height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
  }, []);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let drops: number[] = [];

    const setup = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const baseFontSize = 16;
        const fontSize = Math.floor(baseFontSize * (size / 100));
        const columns = Math.ceil(canvas.width / fontSize);

        drops = Array(columns).fill(1).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));
        
        let lastTime = 0;
        const baseInterval = 50; // Corresponds to 100% speed
        const speedMultiplier = 100 / Math.max(1, speed);
        const interval = baseInterval * speedMultiplier;

        const animate = (timestamp: number = 0) => {
            if (timestamp - lastTime >= interval) {
                draw(ctx, drops, fontSize);
                lastTime = timestamp;
            }
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        animate();
    };

    setup();
    window.addEventListener('resize', setup);

    return () => {
        window.removeEventListener('resize', setup);
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    };
  }, [draw, speed, size]);

  return (
    <div className="fixed inset-0 -z-10 bg-black">
      <canvas ref={canvasRef} className="block" />
    </div>
  );
};

export default MatrixBackground;
