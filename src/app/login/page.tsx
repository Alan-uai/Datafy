
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { EmailPasswordLoginForm } from "@/components/auth/EmailPasswordLoginForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppLogo } from "@/components/shared/AppLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Lock, Shield } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [currentForm, setCurrentForm] = useState<'selection' | 'email'>('selection');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Initialize audio context on user interaction
  const enableSound = () => {
    setSoundEnabled(true);
  };

  const playClickSound = () => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  const handleButtonClick = (action: () => void) => {
    playClickSound();
    enableSound();
    action();
  };

  // Floating particles animation
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Floating geometric shapes */}
      <motion.div
        className="absolute top-20 left-20 w-20 h-20 border-2 border-purple-400/30 rotate-45"
        animate={{
          rotate: [45, 405],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      <motion.div
        className="absolute bottom-20 right-20 w-16 h-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full"
        animate={{
          y: [0, -30, 0],
          x: [0, 20, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="w-full max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: -50, rotateX: -15 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <AppLogo iconSize={64} textSize="text-4xl" className="text-white drop-shadow-2xl" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-purple-200 mt-4 text-lg font-light"
          >
            Entre na sua conta e gerencie seus produtos
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentForm === 'selection' ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl flex items-center justify-center gap-2">
                    <Lock className="w-6 h-6 text-purple-400" />
                    Entrar
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Escolha como deseja fazer login
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <GoogleSignInButton 
                      onSuccess={() => router.push('/dashboard')}
                      onClick={() => handleButtonClick(() => {})}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg"
                    />
                  </motion.div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/20" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-transparent px-2 text-purple-200">ou</span>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => handleButtonClick(() => setCurrentForm('email'))}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg"
                      size="lg"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Continuar com Email
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center pt-4"
                  >
                    <p className="text-purple-200 text-sm">
                      Não tem uma conta?{" "}
                      <Link 
                        href="/signup" 
                        className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4"
                        onClick={enableSound}
                      >
                        Criar conta
                      </Link>
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
                <CardHeader>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Button
                      variant="ghost"
                      onClick={() => handleButtonClick(() => setCurrentForm('selection'))}
                      className="text-purple-200 hover:text-white hover:bg-white/10 p-0 h-auto mb-4"
                    >
                      ← Voltar
                    </Button>
                  </motion.div>
                  <CardTitle className="text-white text-2xl flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    Login com Email
                  </CardTitle>
                  <CardDescription className="text-purple-200">
                    Digite suas credenciais para acessar sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <EmailPasswordLoginForm 
                      onSuccess={() => router.push('/dashboard')}
                      onButtonClick={() => handleButtonClick(() => {})}
                    />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
