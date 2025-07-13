
"use-client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';
import { useThemeAnimation } from '@/contexts/ThemeAnimationContext';

interface MatrixBackgroundProps {
    config: Partial<ThemeConfig>;
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, matrixMode = 'padrão' } = config;
    const { isMatrixCurtainPending, completeMatrixCurtain } = useThemeAnimation();
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasTrailRef = useRef<HTMLCanvasElement>(null);
    const animationFrameId = useRef<number | null>(null);
    const dropsRef = useRef<number[]>([]);
    
    const draw = useCallback((ctx: CanvasRenderingContext2D, currentDrops: number[], fontSize: number, isTrailCanvas: boolean) => {
        const { width, height } = ctx.canvas;
        
        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂbiプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
        const hiragana = 'あいうえおかがきぎくぐけげこごさざしじすずせぜそぞただちぢっつづてでとどなにぬねのはばぱひびぴふぶぷへべぺほぼぽまみむめもゃやゅゆょよらりるれろゎわゐゑをん';
        const kanji = '日一国会人年大十二本中長出三同時政';
        const nums = '0123456789';
        const trailChars = katakana + hiragana + kanji + nums;

        const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const special = '!@#$%^&*()-+[]{};:<>?,./';
        const leaderChars = latin + nums + special;

        if (matrixMode === 'padrão') {
            if (isTrailCanvas) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, width, height);
                ctx.font = `${fontSize}px monospace`;
                for (let i = 0; i < currentDrops.length; i++) {
                    const x = i * fontSize;
                    const y = currentDrops[i] * fontSize;
                    ctx.fillStyle = '#0F0';
                    const trailText = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
                    ctx.fillText(trailText, x, y);
                }
            } else {
                ctx.clearRect(0, 0, width, height);
                ctx.font = `${fontSize}px monospace`;
                for (let i = 0; i < currentDrops.length; i++) {
                    const x = i * fontSize;
                    const y = (currentDrops[i] + 1) * fontSize;
                    ctx.fillStyle = 'rgba(200, 255, 220, 0.9)';
                    const leaderText = leaderChars.charAt(Math.floor(Math.random() * leaderChars.length));
                    ctx.fillText(leaderText, x, y);
                }
            }
        } else { // 'combinado'
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);
            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < currentDrops.length; i++) {
                const x = i * fontSize;
                const y = currentDrops[i] * fontSize;
                ctx.fillStyle = '#0F0';
                const trailText = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
                ctx.fillText(trailText, x, y);

                ctx.fillStyle = 'rgba(200, 255, 220, 0.9)';
                const leaderText = leaderChars.charAt(Math.floor(Math.random() * leaderChars.length));
                ctx.fillText(leaderText, x, y);
            }
        }
    }, [matrixMode]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let ctxTrail: CanvasRenderingContext2D | null = null;
        if (matrixMode === 'padrão') {
            const canvasTrail = canvasTrailRef.current;
            if (canvasTrail) ctxTrail = canvasTrail.getContext('2d');
        }
        
        let frameCount = 0;

        const setup = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (matrixMode === 'padrão' && canvasTrailRef.current) {
                canvasTrailRef.current.width = window.innerWidth;
                canvasTrailRef.current.height = window.innerHeight;
            }

            const baseFontSize = 16;
            const fontSize = Math.floor(baseFontSize * (size / 100));
            const columns = Math.ceil(canvas.width / fontSize);

            if (isMatrixCurtainPending) {
                // Curtain effect: start all drops at the top
                dropsRef.current = Array(columns).fill(0);
            } else {
                // Standard effect: start drops at random y-positions
                dropsRef.current = Array(columns).fill(1).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));
            }
            
            let lastTime = 0;
            const baseInterval = 50;
            const speedMultiplier = 100 / Math.max(1, speed);
            const interval = baseInterval * speedMultiplier;
            frameCount = 0;

            const animate = (timestamp: number = 0) => {
                frameCount++;
                if (frameCount === 1 && isMatrixCurtainPending) {
                    completeMatrixCurtain();
                }

                if (timestamp - lastTime >= interval) {
                    for (let i = 0; i < dropsRef.current.length; i++) {
                        const y = dropsRef.current[i] * fontSize;
                        if (y > canvas.height && Math.random() > 0.975) {
                            dropsRef.current[i] = 0;
                        }
                        dropsRef.current[i]++;
                    }
                    
                    if (matrixMode === 'padrão' && ctxTrail) {
                        draw(ctxTrail, dropsRef.current, fontSize, true);
                        draw(ctx, dropsRef.current, fontSize, false);
                    } else {
                        draw(ctx, dropsRef.current, fontSize, false);
                    }
                    lastTime = timestamp;
                }
                animationFrameId.current = requestAnimationFrame(animate);
            };
            
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            animate();
        };

        setup();
        window.addEventListener('resize', setup);

        return () => {
            window.removeEventListener('resize', setup);
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        };
    }, [draw, speed, size, matrixMode, isMatrixCurtainPending, completeMatrixCurtain]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
          {matrixMode === 'padrão' && <canvas ref={canvasTrailRef} className="block absolute inset-0 z-[1]" />}
          <canvas ref={canvasRef} className="block absolute inset-0 z-[2]" />
        </div>
    );
};

export default MatrixBackground;
