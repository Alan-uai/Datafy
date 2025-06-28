"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useVoiceCommand } from '@/contexts/VoiceCommandContext';
import { 
  Settings, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  TestTube,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';

export default function SettingsPage() {
  const { 
    isVoiceEnabled, 
    setIsVoiceEnabled, 
    isListening,
    testMicrophone,
    lastRecognizedText 
  } = useVoiceCommand();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const playToggleSound = (enabled: boolean) => {
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.setValueAtTime(enabled ? 800 : 400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    }
  };

  const handleVoiceToggle = (enabled: boolean) => {
    playToggleSound(enabled);
    setIsVoiceEnabled(enabled);
  };

  const handleSoundToggle = (enabled: boolean) => {
    playToggleSound(enabled);
    setSoundEnabled(enabled);
  };

  const handleTestMicrophone = async () => {
    setIsTestingMic(true);
    setTestResult(null);

    try {
      await testMicrophone();
      setTimeout(() => {
        setTestResult('success');
        setIsTestingMic(false);
      }, 3000);
    } catch (error) {
      setTestResult('error');
      setIsTestingMic(false);
    }
  };

  const settingsCards = [
    {
      id: 'voice',
      title: 'Comandos por Voz',
      description: 'Ative para usar comandos de voz com "Datafy"',
      icon: isVoiceEnabled ? Mic : MicOff,
      color: 'from-blue-500 to-purple-600',
      delay: 0
    },
    {
      id: 'sound',
      title: 'Efeitos Sonoros',
      description: 'Sons de feedback para interações',
      icon: soundEnabled ? Volume2 : VolumeX,
      color: 'from-green-500 to-emerald-600',
      delay: 0.1
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Settings className="w-8 h-8 text-blue-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white">Configurações</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Personalize sua experiência no Datafy
          </p>
        </motion.div>

        {/* Settings Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {settingsCards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ delay: card.delay, duration: 0.6 }}
              whileHover={{ 
                scale: 1.02, 
                rotateY: 5,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}
            >
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 hover:border-white/20 transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color}`}>
                      <card.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg">{card.title}</CardTitle>
                      <CardDescription className="text-slate-400 text-sm">
                        {card.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={card.id} className="text-slate-300 font-medium">
                      {card.id === 'voice' ? (isVoiceEnabled ? 'Ativado' : 'Desativado') : 
                       (soundEnabled ? 'Ativado' : 'Desativado')}
                    </Label>
                    <Switch
                      id={card.id}
                      checked={card.id === 'voice' ? isVoiceEnabled : soundEnabled}
                      onCheckedChange={card.id === 'voice' ? handleVoiceToggle : handleSoundToggle}
                      className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Voice Command Testing */}
        <AnimatePresence>
          {isVoiceEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white/5 backdrop-blur-lg border-white/10 mb-8">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TestTube className="w-5 h-5 text-yellow-400" />
                    Teste do Microfone
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Teste se o microfone está detectando comandos corretamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={handleTestMicrophone}
                        disabled={isTestingMic}
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg"
                      >
                        {isTestingMic ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testando...
                          </>
                        ) : (
                          <>
                            <TestTube className="w-4 h-4 mr-2" />
                            Testar Microfone
                          </>
                        )}
                      </Button>
                    </motion.div>

                    {/* Real-time listening status */}
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                      <span className={`text-sm ${isListening ? 'text-green-400' : 'text-slate-400'}`}>
                        {isListening ? 'Ouvindo...' : 'Aguardando'}
                      </span>
                    </div>
                  </div>

                  {/* Test Result */}
                  <AnimatePresence>
                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex items-center gap-2 p-3 rounded-lg ${
                          testResult === 'success' 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}
                      >
                        {testResult === 'success' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                        <span className={testResult === 'success' ? 'text-green-300' : 'text-red-300'}>
                          {testResult === 'success' 
                            ? 'Microfone funcionando corretamente!' 
                            : 'Erro ao testar microfone. Verifique as permissões.'}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Last recognized text */}
                  {lastRecognizedText && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    >
                      <Label className="text-blue-300 text-sm font-medium">Último texto reconhecido:</Label>
                      <p className="text-blue-200 mt-1">"{lastRecognizedText}"</p>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-white/5 backdrop-blur-lg border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Como usar comandos de voz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-300 font-medium">Ativação:</span>
                  </div>
                  <p className="text-slate-400 text-sm ml-6">
                    Diga <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">"Datafy"</Badge> para ativar
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-400" />
                    <span className="text-slate-300 font-medium">Comandos:</span>
                  </div>
                  <div className="text-slate-400 text-sm ml-6 space-y-1">
                    <p>• "Adicionar produto [nome], marca [marca], [quantidade] unidades"</p>
                    <p>• "Apagar produto [ID]"</p>
                  </div>
                </div>
              </div>

              <Separator className="bg-white/10" />

              <div className="text-slate-400 text-sm">
                <p className="font-medium text-slate-300 mb-2">Exemplo completo:</p>
                <p className="bg-slate-800/50 p-3 rounded italic">
                  "Datafy, adicionar produto arroz, marca Pileco, 78 unidades, vence em 27 de junho"
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}