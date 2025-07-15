"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
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
    const [isVisible, setIsVisible] = useState(false);
    const [isCurtainActive, setIsCurtainActive] = useState(false); // State to manage if the initial curtain animation is still active

    const draw = useCallback((ctx: CanvasRenderingContext2D, currentDrops: number[], fontSize: number, isTrailCanvas: boolean) => {
        const { width, height } = ctx.canvas;

        const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
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
        } else {
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
        if (!isVisible) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let ctxTrail: CanvasRenderingContext2D | null = null;
        if (matrixMode === 'padrão' && canvasTrailRef.current) {
            ctxTrail = canvasTrailRef.current.getContext('2d');
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

            if (isMatrixCurtainPending) {
                dropsRef.current = Array(columns).fill(0); // All drops start at the very top for the initial curtain effect
                setIsCurtainActive(true); // Signal that initial curtain animation is active
            } else {
                // When not an initial curtain, drops start with a random negative offset for immediate random rain
                dropsRef.current = Array(columns).fill(0).map(() => -Math.floor(Math.random() * (canvas.height / fontSize / 2)));
                setIsCurtainActive(false); // Initial curtain animation is not active
            }

            let lastTime = 0;
            const baseInterval = 50;
            const speedMultiplier = 100 / Math.max(1, speed);
            const interval = baseInterval * speedMultiplier;

            const animate = (timestamp: number = 0) => {
                if (timestamp - lastTime >= interval) {
                    const FADE_ROWS_BUFFER = 10; // Number of additional rows to fall for the fade-out
                    const canvasRows = canvas.height / fontSize;
                    const fadeOutThresholdRow = canvasRows + FADE_ROWS_BUFFER;

                    let allDropsPastCurtainCompletionPoint = true; // Used to track initial curtain completion

                    for (let i = 0; i < dropsRef.current.length; i++) {
                        // Universal drop advancement
                        dropsRef.current[i]++;

                        // Universal drop reset: If the drop goes beyond the fade out threshold, reset it to a random negative offset
                        if (dropsRef.current[i] > fadeOutThresholdRow) {
                            dropsRef.current[i] = -Math.floor(Math.random() * (canvasRows / 2)); // Reset to random top offset
                        }

                        // Check for initial curtain completion (only relevant if isCurtainActive is true at start of animation)
                        if (isCurtainActive && dropsRef.current[i] < fadeOutThresholdRow) {
                            allDropsPastCurtainCompletionPoint = false;
                        }
                    }

                    // Only complete the initial curtain if it was active and all drops have passed the threshold
                    if (isCurtainActive && allDropsPastCurtainCompletionPoint) {
                        completeMatrixCurtain();
                        setIsCurtainActive(false); // Initial curtain animation is now complete
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
    }, [isVisible, draw, speed, size, matrixMode, isMatrixCurtainPending, completeMatrixCurtain, isCurtainActive]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        });

        observer.observe(canvas);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="fixed inset-0 -z-10 bg-black">
            {matrixMode === 'padrão' && (
                <canvas ref={canvasTrailRef} className="block absolute inset-0 z-[1]" />
            )}
            <canvas ref={canvasRef} className="block absolute inset-0 z-[2]" />
        </div>
    );
};

export default MatrixBackground;