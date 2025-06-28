
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  LogOut,
  Settings,
  Shield,
  Sparkles,
  Trophy,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser]);

  const playInteractionSound = (type: 'click' | 'success' | 'error') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'click') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    } else if (type === 'success') {
      oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
    } else {
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const handleLogout = async () => {
    playInteractionSound('click');
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      playInteractionSound('error');
    }
  };

  const handleSave = () => {
    playInteractionSound('success');
    setIsEditing(false);
    // Aqui você implementaria a lógica para salvar o nome
  };

  const profileStats = [
    { label: 'Produtos Cadastrados', value: '156', icon: Target, color: 'text-blue-400' },
    { label: 'Listas Criadas', value: '12', icon: Trophy, color: 'text-green-400' },
    { label: 'Dias de Uso', value: '45', icon: Calendar, color: 'text-purple-400' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with floating elements */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 relative"
        >
          {/* Floating decorative elements */}
          <motion.div
            className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full opacity-60"
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute -top-8 -right-8 w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-40"
            animate={{
              y: [0, 15, 0],
              x: [0, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <User className="w-8 h-8 text-violet-400" />
            </motion.div>
            <h1 className="text-4xl font-bold text-white">Meu Perfil</h1>
          </div>
          <p className="text-violet-200 text-lg">
            Gerencie suas informações pessoais
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2"
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotateZ: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto mb-4"
                >
                  <Avatar className="w-24 h-24 border-4 border-white/20 shadow-xl">
                    <AvatarImage src={currentUser?.photoURL || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl">
                      {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                
                <div className="space-y-2">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Seu nome"
                        />
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            size="sm"
                            onClick={() => {
                              playInteractionSound('success');
                              handleSave();
                            }}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="w-4 h-4" />
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              playInteractionSound('click');
                              setIsEditing(false);
                              setDisplayName(currentUser?.displayName || '');
                            }}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="display"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <CardTitle className="text-white text-2xl">
                          {currentUser?.displayName || 'Usuário'}
                        </CardTitle>
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              playInteractionSound('click');
                              setIsEditing(true);
                            }}
                            className="text-violet-300 hover:text-white hover:bg-white/10"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <CardDescription className="text-violet-200 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    {currentUser?.email}
                  </CardDescription>
                  
                  <div className="flex justify-center gap-2 pt-2">
                    <Badge variant="secondary" className="bg-violet-500/20 text-violet-300">
                      <Shield className="w-3 h-3 mr-1" />
                      Verificado
                    </Badge>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <Separator className="bg-white/20" />
                
                {/* Account Info */}
                <div className="space-y-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-violet-400" />
                    Informações da Conta
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-violet-400" />
                        <div>
                          <Label className="text-white">Email</Label>
                          <p className="text-violet-200 text-sm">{currentUser?.email}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-violet-400" />
                        <div>
                          <Label className="text-white">Membro desde</Label>
                          <p className="text-violet-200 text-sm">
                            {currentUser?.metadata?.creationTime 
                              ? new Date(currentUser.metadata.creationTime).toLocaleDateString('pt-BR')
                              : 'Data não disponível'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="bg-white/20" />

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      onClick={() => {
                        playInteractionSound('click');
                        router.push('/settings');
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </Button>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      variant="destructive"
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6"
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  Estatísticas
                </CardTitle>
                <CardDescription className="text-violet-200">
                  Seu progresso no Datafy
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileStats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer"
                  >
                    <stat.icon className={`w-8 h-8 ${stat.color}`} />
                    <div>
                      <p className="text-white font-bold text-xl">{stat.value}</p>
                      <p className="text-violet-200 text-sm">{stat.label}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Achievement Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05, rotate: 2 }}
            >
              <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border-yellow-500/30">
                <CardContent className="p-4 text-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                  </motion.div>
                  <h3 className="text-white font-bold">Organizador Expert</h3>
                  <p className="text-yellow-200 text-sm">
                    Parabéns! Você dominou o Datafy
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
