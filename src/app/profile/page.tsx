
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  Target,
  MapPin,
  Phone,
  Globe,
  Camera,
  Heart,
  Star,
  Zap,
  Lock,
  Bell,
  Palette,
  Moon,
  Sun,
  Music,
  Eye,
  Smartphone
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  displayName: string;
  bio: string;
  location: string;
  phone: string;
  website: string;
  birthDate: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  preferences: {
    darkMode: boolean;
    language: string;
    timezone: string;
    soundEnabled: boolean;
  };
  privacy: {
    profileVisible: boolean;
    showEmail: boolean;
    showPhone: boolean;
  };
}

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'modules' | 'privacy'>('personal');
  
  const [profile, setProfile] = useState<UserProfile>({
    displayName: currentUser?.displayName || '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    birthDate: '',
    notifications: {
      email: true,
      push: true,
      marketing: false,
    },
    preferences: {
      darkMode: true,
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      soundEnabled: true,
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false,
    }
  });

  useEffect(() => {
    if (currentUser?.displayName) {
      setProfile(prev => ({ ...prev, displayName: currentUser.displayName || '' }));
    }
  }, [currentUser]);

  const playInteractionSound = (type: 'click' | 'success' | 'error' | 'notification') => {
    if (!soundEnabled) return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'click':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        break;
      case 'success':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1);
        break;
      case 'error':
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        break;
      case 'notification':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.05);
        break;
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
    // Aqui você implementaria a lógica para salvar o perfil
  };

  const updateProfile = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    playInteractionSound('click');
  };

  const updateNestedProfile = (section: 'notifications' | 'preferences' | 'privacy', field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
    playInteractionSound('notification');
  };

  const profileStats = [
    { label: 'Produtos Cadastrados', value: '156', icon: Target, color: 'text-blue-400' },
    { label: 'Listas Criadas', value: '12', icon: Trophy, color: 'text-green-400' },
    { label: 'Dias de Uso', value: '45', icon: Calendar, color: 'text-purple-400' },
    { label: 'Score de Eficiência', value: '89%', icon: Star, color: 'text-yellow-400' },
  ];

  const achievements = [
    { name: 'Primeiro Produto', description: 'Adicionou seu primeiro produto', icon: Star, color: 'bg-yellow-500' },
    { name: 'Organizador', description: 'Criou 10 listas', icon: Trophy, color: 'bg-green-500' },
    { name: 'Expert', description: '30 dias de uso', icon: Zap, color: 'bg-blue-500' },
  ];

  const tabs = [
    { id: 'personal', label: 'Pessoal', icon: User },
    { id: 'modules', label: 'Módulos', icon: Settings },
    { id: 'privacy', label: 'Privacidade', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
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
            Gerencie suas informações pessoais e preferências
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Profile Summary Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8 }}
            className="xl:col-span-1"
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotateZ: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto mb-4 relative"
                >
                  <Avatar className="w-24 h-24 border-4 border-white/20 shadow-xl">
                    <AvatarImage src={currentUser?.photoURL || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl">
                      {currentUser?.displayName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute -bottom-2 -right-2 bg-violet-500 hover:bg-violet-600 rounded-full p-2 shadow-lg"
                    onClick={() => playInteractionSound('click')}
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </motion.button>
                </motion.div>
                
                <CardTitle className="text-white text-xl">
                  {profile.displayName || 'Usuário'}
                </CardTitle>
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
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  {profileStats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.05 }}
                      className="bg-white/5 rounded-lg p-3 text-center"
                    >
                      <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-1`} />
                      <p className="text-white font-bold text-sm">{stat.value}</p>
                      <p className="text-violet-200 text-xs">{stat.label.split(' ')[0]}</p>
                    </motion.div>
                  ))}
                </div>

                <Separator className="bg-white/20" />

                {/* Quick Actions */}
                <div className="space-y-2">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    Conquistas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center gap-3 p-2 bg-white/5 rounded-lg cursor-pointer"
                    >
                      <div className={`w-8 h-8 ${achievement.color} rounded-full flex items-center justify-center`}>
                        <achievement.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{achievement.name}</p>
                        <p className="text-violet-200 text-xs">{achievement.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="xl:col-span-3"
          >
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-2xl">Informações do Perfil</CardTitle>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                      onClick={() => {
                        playInteractionSound('click');
                        setIsEditing(!isEditing);
                      }}
                      variant={isEditing ? "default" : "outline"}
                      className={isEditing ? "bg-green-600 hover:bg-green-700" : "border-white/20 text-white hover:bg-white/10"}
                    >
                      {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                      {isEditing ? 'Salvar' : 'Editar'}
                    </Button>
                  </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-1 bg-white/5 rounded-lg p-1 mt-4">
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        playInteractionSound('click');
                      }}
                      className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all ${
                        activeTab === tab.id
                          ? 'bg-violet-600 text-white shadow-lg'
                          : 'text-violet-200 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </motion.button>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  {activeTab === 'personal' && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-white">Nome Completo</Label>
                          <Input
                            value={profile.displayName}
                            onChange={(e) => updateProfile('displayName', e.target.value)}
                            disabled={!isEditing}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                            placeholder="Seu nome completo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">Data de Nascimento</Label>
                          <Input
                            type="date"
                            value={profile.birthDate}
                            onChange={(e) => updateProfile('birthDate', e.target.value)}
                            disabled={!isEditing}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">Localização</Label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                            <Input
                              value={profile.location}
                              onChange={(e) => updateProfile('location', e.target.value)}
                              disabled={!isEditing}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10"
                              placeholder="Cidade, Estado"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-white">Telefone</Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                            <Input
                              value={profile.phone}
                              onChange={(e) => updateProfile('phone', e.target.value)}
                              disabled={!isEditing}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10"
                              placeholder="(11) 99999-9999"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-white">Website</Label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-3 w-4 h-4 text-white/50" />
                            <Input
                              value={profile.website}
                              onChange={(e) => updateProfile('website', e.target.value)}
                              disabled={!isEditing}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 pl-10"
                              placeholder="https://seusite.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-white">Biografia</Label>
                          <Textarea
                            value={profile.bio}
                            onChange={(e) => updateProfile('bio', e.target.value)}
                            disabled={!isEditing}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                            placeholder="Conte um pouco sobre você..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'modules' && (
                    <motion.div
                      key="modules"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-white mb-2">Módulos de Ferramentas</h3>
                        <p className="text-violet-200">Personalize as colunas da sua tabela de produtos</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-medium">Gerenciar Colunas</h4>
                          <Button
                            onClick={() => {
                              playInteractionSound('click');
                              router.push('/dashboard');
                            }}
                            className="bg-violet-600 hover:bg-violet-700"
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configurar Tabela
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-violet-200 text-sm">
                            Você pode personalizar as colunas da tabela de produtos diretamente no dashboard. 
                            Clique no botão "Configurar Tabela" para acessar o gerenciador de layouts.
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4">
                              <h5 className="text-white font-medium mb-2">Tipos de Coluna Disponíveis</h5>
                              <ul className="text-violet-200 text-sm space-y-1">
                                <li>• Texto simples</li>
                                <li>• Números e valores monetários</li>
                                <li>• Datas</li>
                                <li>• Checkbox (marcação)</li>
                                <li>• Unidades de medida</li>
                              </ul>
                            </div>
                            
                            <div className="bg-white/5 rounded-lg p-4">
                              <h5 className="text-white font-medium mb-2">Recursos</h5>
                              <ul className="text-violet-200 text-sm space-y-1">
                                <li>• Salvar layouts personalizados</li>
                                <li>• Alternar entre configurações</li>
                                <li>• Restaurar layout padrão</li>
                                <li>• Reordenar colunas</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'privacy' && (
                    <motion.div
                      key="privacy"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Eye className="w-5 h-5 text-violet-400" />
                            <div>
                              <Label className="text-white">Perfil Público</Label>
                              <p className="text-violet-200 text-sm">Permitir que outros vejam seu perfil</p>
                            </div>
                          </div>
                          <Switch
                            checked={profile.privacy.profileVisible}
                            onCheckedChange={(checked) => updateNestedProfile('privacy', 'profileVisible', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mail className="w-5 h-5 text-violet-400" />
                            <div>
                              <Label className="text-white">Mostrar Email</Label>
                              <p className="text-violet-200 text-sm">Exibir email no perfil público</p>
                            </div>
                          </div>
                          <Switch
                            checked={profile.privacy.showEmail}
                            onCheckedChange={(checked) => updateNestedProfile('privacy', 'showEmail', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Smartphone className="w-5 h-5 text-violet-400" />
                            <div>
                              <Label className="text-white">Mostrar Telefone</Label>
                              <p className="text-violet-200 text-sm">Exibir telefone no perfil público</p>
                            </div>
                          </div>
                          <Switch
                            checked={profile.privacy.showPhone}
                            onCheckedChange={(checked) => updateNestedProfile('privacy', 'showPhone', checked)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
