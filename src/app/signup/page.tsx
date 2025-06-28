
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SignupForm } from "@/components/auth/SignupForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AppLogo } from "@/components/shared/AppLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, UserPlus, Star, Zap } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [currentForm, setCurrentForm] = useState<'selection' | 'email'>('selection');
  const [soundEnabled, setSoundEnabled] = useState(false);

  const playSuccessSound = () => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  };

  const handleButtonClick = (action: () => void) => {
    setSoundEnabled(true);
    playSuccessSound();
    action();
  };

  // Floating features
  const features = [
    { icon: Star, text: "Gestão Inteligente", delay: 0 },
    { icon: Zap, text: "Sincronização Rápida", delay: 0.5 },
    { icon: UserPlus, text: "Interface Amigável", delay: 1 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-cyan-800 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Floating feature bubbles */}
      {features.map((feature, index) => (
        <motion.div
          key={index}
          className="absolute hidden lg:block"
          style={{
            left: `${15 + index * 25}%`,
            top: `${20 + index * 15}%`,
          }}
          initial={{ opacity: 0, scale: 0, rotate: -180 }}
          animate={{ 
            opacity: 0.8, 
            scale: 1, 
            rotate: 0,
            y: [0, -10, 0],
          }}
          transition={{
            delay: feature.delay,
            duration: 0.8,
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }
          }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
            <feature.icon className="w-6 h-6 text-emerald-300" />
          </div>
          <p className="text-emerald-200 text-sm mt-2 text-center font-medium">
            {feature.text}
          </p>
        </motion.div>
      ))}

      <div className="w-full max-w-md z-10">
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              rotateY: [0, 10, 0, -10, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <AppLogo iconSize={64} textSize="text-4xl" className="text-white drop-shadow-2xl" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-emerald-200 mt-4 text-lg font-light"
          >
            Crie sua conta e comece a organizar
          </motion.p>
        </motion.div>

        <AnimatePresence mode="wait">
          {currentForm === 'selection' ? (
            <motion.div
              key="selection"
              initial={{ opacity: 0, scale: 0.9, rotateX: -15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 15 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl transform-gpu">
                <CardHeader className="text-center">
                  <CardTitle className="text-white text-2xl flex items-center justify-center gap-2">
                    <UserPlus className="w-6 h-6 text-emerald-400" />
                    Criar Conta
                  </CardTitle>
                  <CardDescription className="text-emerald-200">
                    Junte-se ao Datafy e organize melhor seus produtos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    whileHover={{ 
                      scale: 1.02, 
                      y: -3,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
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
                      <span className="bg-transparent px-2 text-emerald-200">ou</span>
                    </div>
                  </div>

                  <motion.div
                    whileHover={{ 
                      scale: 1.02, 
                      y: -3,
                      boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)"
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Button
                      onClick={() => handleButtonClick(() => setCurrentForm('email'))}
                      className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg"
                      size="lg"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Criar com Email
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center pt-4"
                  >
                    <p className="text-emerald-200 text-sm">
                      Já tem uma conta?{" "}
                      <Link 
                        href="/login" 
                        className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4"
                        onClick={() => setSoundEnabled(true)}
                      >
                        Fazer login
                      </Link>
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: -15 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
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
                      className="text-emerald-200 hover:text-white hover:bg-white/10 p-0 h-auto mb-4"
                    >
                      ← Voltar
                    </Button>
                  </motion.div>
                  <CardTitle className="text-white text-2xl flex items-center gap-2">
                    <Zap className="w-6 h-6 text-emerald-400" />
                    Criar Conta
                  </CardTitle>
                  <CardDescription className="text-emerald-200">
                    Preencha os dados para criar sua conta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <SignupForm 
                      onSuccess={() => {
                        playSuccessSound();
                        router.push('/dashboard');
                      }}
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
