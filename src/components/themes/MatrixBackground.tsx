
"use-client";

import React, { useRef, useEffect, useCallback } from 'react';
import type { ThemeConfig } from '@/lib/types';

interface MatrixBackgroundProps {
    config: Partial<ThemeConfig>;
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ config }) => {
    const { themeSpeed: speed = 100, themeSize: size = 100, matrixMode = 'padrão' } = config;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasTrailRef = useRef<HTMLCanvasElement>(null); // New canvas for trail
    const animationFrameId = useRef<number | null>(null);
    const dropsRef = useRef<number[]>([]); // Use useRef for mutable drops array

    // The draw function now only renders based on the current drops state
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
            if (isTrailCanvas) { // Trail Canvas
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, width, height); // Apply fade effect
                ctx.font = `${fontSize}px monospace`;
                for (let i = 0; i < currentDrops.length; i++) {
                    const x = i * fontSize;
                    const y = currentDrops[i] * fontSize;
                    ctx.fillStyle = '#0F0'; // Green for trail
                    const trailText = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
                    ctx.fillText(trailText, x, y);
                }
            } else { // Leader Canvas
                ctx.clearRect(0, 0, width, height); // Clear to ensure no previous trails/fade
                ctx.font = `${fontSize}px monospace`;
                for (let i = 0; i < currentDrops.length; i++) {
                    const x = i * fontSize;
                    const y = (currentDrops[i] + 1) * fontSize; // Adjusted Y for leader to be at the tip
                    ctx.fillStyle = 'rgba(200, 255, 220, 0.9)'; // Bright for leader
                    const leaderText = leaderChars.charAt(Math.floor(Math.random() * leaderChars.length));
                    ctx.fillText(leaderText, x, y);
                }
            }
        } else { // matrixMode === 'combinado'
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height); // Apply fade effect for combined mode
            ctx.font = `${fontSize}px monospace`;
            for (let i = 0; i < currentDrops.length; i++) {
                const x = i * fontSize;
                const y = currentDrops[i] * fontSize;
                // Trail
                ctx.fillStyle = '#0F0';
                const trailText = trailChars.charAt(Math.floor(Math.random() * trailChars.length));
                ctx.fillText(trailText, x, y);

                // Leader
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
            if (canvasTrail) {
                canvasTrail.width = window.innerWidth;
                canvasTrail.height = window.innerHeight;
                ctxTrail = canvasTrail.getContext('2d');
            }
        }

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

            dropsRef.current = Array(columns).fill(1).map(() => Math.floor(Math.random() * (canvas.height / fontSize)));
            
            let lastTime = 0;
            const baseInterval = 50; // Corresponds to 100% speed
            const speedMultiplier = 100 / Math.max(1, speed);
            const interval = baseInterval * speedMultiplier;

            const animate = (timestamp: number = 0) => {
                if (timestamp - lastTime >= interval) {
                    // Update drops once per frame
                    for (let i = 0; i < dropsRef.current.length; i++) {
                        const y = dropsRef.current[i] * fontSize;
                        if (y > canvas.height && Math.random() > 0.975) {
                            dropsRef.current[i] = 0;
                        }
                        dropsRef.current[i]++;
                    }

                    // Draw on canvases based on mode
                    if (matrixMode === 'padrão' && ctxTrail) {
                        draw(ctxTrail, dropsRef.current, fontSize, true); // Draw trail on separate canvas
                        draw(ctx, dropsRef.current, fontSize, false); // Draw leader on main canvas
                    } else {
                        draw(ctx, dropsRef.current, fontSize, false); // Combined mode draws everything on main canvas
                    }
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
    }, [draw, speed, size, matrixMode]);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
          {matrixMode === 'padrão' && <canvas ref={canvasTrailRef} className="block absolute inset-0 z-[1]" />}
          <canvas ref={canvasRef} className="block absolute inset-0 z-[2]" />
        </div>
    );
};

export default MatrixBackground;
