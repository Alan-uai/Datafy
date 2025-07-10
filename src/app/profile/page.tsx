
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { auth, signOut } from '@/lib/firebase';
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
  Smartphone,
  Crown,
  Package,
  BarChart3
} from 'lucide-react';
import { getUserProfile, updateUserProfile, checkPremiumStatus, type UserProfile as UserProfileType, createUserProfile } from '@/services/userService';
import { DynamicIcon } from '@/components/shared/DynamicIcon';

// Real UserLevelDisplay component
const UserLevelDisplay = ({ userProfile }: { userProfile: UserProfileType }) => {
  const calculateLevel = (daysActive: number, productsCount: number, listsCount: number) => {
    const totalScore = daysActive + (productsCount * 2) + (listsCount * 5);
    const level = Math.floor(totalScore / 20) + 1;
    const progress = ((totalScore % 20) / 20) * 100;
    return { level: Math.min(level, 50), progress: Math.round(progress) };
  };

  const { level, progress } = calculateLevel(
    userProfile.stats.daysActive,
    userProfile.stats.productsCount,
    userProfile.stats.listsCount
  );

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-400" />
          Nível {level}
        </CardTitle>
        <CardDescription className="text-violet-200">
          Progresso: {progress}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="bg-yellow-400 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-violet-300 text-xs mt-2">
          {20 - (userProfile.stats.daysActive + (userProfile.stats.productsCount * 2) + (userProfile.stats.listsCount * 5)) % 20} pontos para o próximo nível
        </p>
      </CardContent>
    </Card>
  );
};

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'privacy' | 'notifications' | 'premium'>('personal');
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserProfile();
      loadRealUserData();
    }
  }, [currentUser]);

  const loadRealUserData = async () => {
    if (!currentUser?.uid) return;

    try {
      // Carregar dados reais de produtos e listas do Firebase
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');

      // Contar produtos em todas as listas do usuário
      let totalProductsCount = 0;

      // Primeiro, buscar todas as listas do usuário
      const listsQuery = query(
        collection(db, 'productLists'),
        where('userId', '==', currentUser.uid)
      );
      const listsSnapshot = await getDocs(listsQuery);
      const listsCount = listsSnapshot.size;

      // Para cada lista, contar os produtos
      for (const listDoc of listsSnapshot.docs) {
        const productsQuery = query(
          collection(db, 'products'),
          where('userId', '==', currentUser.uid),
          where('listId', '==', listDoc.id)
        );
        const productsSnapshot = await getDocs(productsQuery);
        totalProductsCount += productsSnapshot.size;
      }

      // Calcular dias ativos (usar data de criação da conta)
      const accountCreatedAt = currentUser.metadata.creationTime 
        ? new Date(currentUser.metadata.creationTime) 
        : new Date();
      const daysActive = Math.max(1, Math.floor((Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));

      // Calcular score de eficiência baseado no uso
      let efficiencyScore = 0;
      if (totalProductsCount > 0) efficiencyScore += 40;
      if (listsCount > 0) efficiencyScore += 30;
      if (daysActive >= 7) efficiencyScore += 30;

      // Gerar conquistas baseadas nos dados reais
      const newAchievements = [];

      if (totalProductsCount > 0) {
        newAchievements.push({
          id: 'first_product',
          name: 'Primeiro Produto',
          description: 'Adicione seu primeiro produto ao Datafy.',
          iconType: 'ShoppingCart',
          color: 'bg-green-500',
          unlockedAt: new Date()
        });
      }

      if (listsCount > 0) {
        newAchievements.push({
          id: 'organizer',
          name: 'Organizador',
          description: 'Crie sua primeira lista de produtos.',
          iconType: 'List',
          color: 'bg-blue-500',
          unlockedAt: new Date()
        });
      }

      if (daysActive >= 7) {
        newAchievements.push({
          id: 'active_user',
          name: 'Usuário Ativo',
          description: 'Use o Datafy por 7 dias seguidos.',
          iconType: 'CalendarCheck',
          color: 'bg-purple-500',
          unlockedAt: new Date()
        });
      }

      if (efficiencyScore >= 80) {
        newAchievements.push({
          id: 'efficiency_master',
          name: 'Mestre da Eficiência',
          description: 'Alcance um score de eficiência de 80%.',
          iconType: 'ChartLine',
          color: 'bg-yellow-500',
          unlockedAt: new Date()
        });
      }

      if (totalProductsCount >= 50) {
        newAchievements.push({
          id: 'collector',
          name: 'Colecionador',
          description: 'Cadastre 50 produtos.',
          iconType: 'Package',
          color: 'bg-orange-500',
          unlockedAt: new Date()
        });
      }

      const updatedStats = {
        productsCount: totalProductsCount,
        listsCount,
        daysActive,
        efficiencyScore
      };

      // Atualizar o estado local
      setUserProfile(prev => prev ? {
        ...prev,
        stats: updatedStats,
        achievements: newAchievements
      } : prev);

      // Salvar no Firestore
      await updateUserProfile(currentUser.uid, { 
        stats: updatedStats,
        achievements: newAchievements
      });

      console.log('Real user stats loaded:', updatedStats);
    } catch (error) {
      console.error('Error loading real user data:', error);
    }
  };

  const loadUserProfile = async () => {
    if (!currentUser?.uid) return;

    setIsLoading(true);
    try {
      const profile = await getUserProfile(currentUser.uid);
      if (profile) {
        setUserProfile(profile);
      } else {
        // Create profile if doesn't exist
        const newProfile: Partial<UserProfileType> = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || '',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || undefined,
        };
        await createUserProfile(currentUser.uid, newProfile);
        const createdProfile = await getUserProfile(currentUser.uid);
        setUserProfile(createdProfile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o perfil."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const playInteractionSound = (type: 'click' | 'success' | 'error' | 'notification') => {
    if (!userProfile?.preferences.soundEnabled) return;

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

  const handleSave = async () => {
    if (!userProfile || !currentUser?.uid) return;

    playInteractionSound('click');
    try {
      // Validate required fields
      if (!userProfile.displayName?.trim()) {
        toast({
          variant: "destructive",
          title: "Campo Obrigatório",
          description: "Nome é obrigatório."
        });
        return;
      }

      await updateUserProfile(currentUser.uid, userProfile);

      setIsEditing(false);
      playInteractionSound('success');
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso."
      });
    } catch (error) {
      playInteractionSound('error');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível salvar o perfil."
      });
    }
  };

  const updateProfile = (field: keyof UserProfileType, value: any) => {
    if (!userProfile) return;
    setUserProfile(prev => ({ ...prev!, [field]: value }));
    playInteractionSound('click');
  };

  const updateNestedProfile = (section: 'notifications' | 'preferences' | 'privacy', field: string, value: any) => {
    if (!userProfile) return;
    setUserProfile(prev => ({
      ...prev!,
      [section]: { ...prev![section], [field]: value }
    }));
    playInteractionSound('notification');
  };

  const handlePremiumUpgrade = () => {
    playInteractionSound('click');
    // Here you would integrate with payment system
    toast({
      title: "Premium em breve!",
      description: "A funcionalidade Premium será lançada em breve. Fique ligado!"
    });
  };

  if (isLoading || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando perfil...</div>
      </div>
    );
  }

  const profileStats = [
    { label: 'Produtos Cadastrados', value: userProfile.stats.productsCount.toString(), icon: Target, color: 'text-blue-400' },
    { label: 'Listas Criadas', value: userProfile.stats.listsCount.toString(), icon: Trophy, color: 'text-green-400' },
    { label: 'Dias de Uso', value: userProfile.stats.daysActive.toString(), icon: Calendar, color: 'text-purple-400' },
    { label: 'Score de Eficiência', value: `${userProfile.stats.efficiencyScore}%`, icon: Star, color: 'text-yellow-400' },
  ];

  const tabs = [
    { id: 'personal', label: 'Pessoal', icon: User },
    { id: 'notifications', label: 'Conquistas', icon: Trophy },
    { id: 'privacy', label: 'Privacidade', icon: Eye },
    { id: 'premium', label: 'Premium', icon: Crown },
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
                    <AvatarImage src={userProfile.photoURL || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl">
                      {userProfile.displayName?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
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
                  {userProfile.displayName || 'Usuário'}
                </CardTitle>
                <CardDescription className="text-violet-200 flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  {userProfile.email}
                </CardDescription>

                <div className="flex justify-center gap-2 pt-2">
                  <Badge variant="secondary" className="bg-violet-500/20 text-violet-300">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                  {userProfile.isPremium && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
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
                        if (isEditing) {
                          handleSave();
                        } else {
                          setIsEditing(true);
                        }
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
                            value={userProfile.displayName || ''}
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
                            value={userProfile.birthDate || ''}
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
                              value={userProfile.location || ''}
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
                              value={userProfile.phone || ''}
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
                              value={userProfile.website || ''}
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
                            value={userProfile.bio || ''}
                            onChange={(e) => updateProfile('bio', e.target.value)}
                            disabled={!isEditing}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                            placeholder="Conte um pouco sobre você..."
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'notifications' && (
                    <motion.div
                      key="notifications"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-white mb-2">Conquistas e Progresso</h3>
                        <p className="text-violet-200">Acompanhe seu progresso e conquistas no Datafy</p>
                      </div>



                      {/* Lista completa de conquistas */}
                      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-400" />
                            Todas as Conquistas ({userProfile.achievements.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                          {userProfile.achievements.length > 0 ? (
                            userProfile.achievements.map((achievement, index) => (
                              <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * index }}
                                whileHover={{ scale: 1.02, x: 5 }}
                                className="flex items-center gap-4 p-3 bg-white/5 rounded-lg cursor-pointer"
                              >
                                <div className={`w-12 h-12 ${achievement.color} rounded-full flex items-center justify-center`}>
                                  <DynamicIcon name={achievement.iconType} className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{achievement.name}</p>
                                  <p className="text-violet-200 text-sm">{achievement.description}</p>
                                  {achievement.unlockedAt && (
                                    <p className="text-violet-300 text-xs mt-1">
                                      Conquistado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                                <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                                  Desbloqueado
                                </Badge>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Trophy className="w-16 h-16 text-violet-400 mx-auto mb-4 opacity-50" />
                              <p className="text-violet-200 mb-2">Nenhuma conquista ainda</p>
                              <p className="text-violet-300 text-sm">Continue usando o app para desbloquear conquistas!</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Próximas conquistas */}
                      <Card className="bg-white/5 backdrop-blur-lg border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-400" />
                            Próximas Conquistas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg opacity-75">
                            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <Star className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Usuário Experiente</p>
                              <p className="text-violet-200 text-sm">Use o app por 30 dias seguidos</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg opacity-75">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">Colecionador</p>
                              <p className="text-violet-200 text-sm">Cadastre 100 produtos</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
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
                      <div className="text-center py-8">
                        <Settings className="w-16 h-16 text-violet-400 mx-auto mb-4 opacity-50" />
                        <p className="text-violet-200 mb-2">Configurações de privacidade</p>
                        <p className="text-violet-300 text-sm mb-4">As configurações de privacidade foram movidas para a página de configurações.</p>
                        <Button
                          onClick={() => router.push('/settings')}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Ir para Configurações
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'premium' && (
                    <motion.div
                      key="premium"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-3 mb-4">
                          <Crown className="w-8 h-8 text-yellow-400" />
                          <h3 className="text-2xl font-bold text-white">Datafy Premium</h3>
                        </div>
                        <p className="text-violet-200">
                          Desbloqueie recursos avançados por apenas <span className="text-yellow-400 font-bold">R$ 24,90/mês</span>
                        </p>
                      </div>

                      {userProfile.isPremium ? (
                        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <Crown className="w-6 h-6 text-yellow-400" />
                            <span className="text-white font-bold text-lg">Você é Premium!</span>
                          </div>
                          <p className="text-purple-200 mb-4">
                            Obrigado por ser um usuário Premium. Aproveite todos os recursos exclusivos!
                          </p>
                          {userProfile.premiumExpiresAt && (
                            <p className="text-purple-300 text-sm">
                              Válido até: {new Date(userProfile.premiumExpiresAt).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="bg-white/5 rounded-lg p-6">
                          <h4 className="text-white font-medium mb-4">Recursos Premium:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <Package className="w-5 h-5 text-green-400" />
                              <div>
                                <p className="text-white font-medium">Listas Ilimitadas</p>
                                <p className="text-violet-200 text-sm">Crie quantas listas quiser</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <Target className="w-5 h-5 text-blue-400" />
                              <div>
                                <p className="text-white font-medium">Analytics Avançado</p>
                                <p className="text-violet-200 text-sm">Relatórios detalhados</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <Settings className="w-5 h-5 text-purple-400" />
                              <div>
                                <p className="text-white font-medium">Colunas Personalizadas</p>
                                <p className="text-violet-200 text-sm">Módulos avançados</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                              <Zap className="w-5 h-5 text-yellow-400" />
                              <div>
                                <p className="text-white font-medium">Comandos de Voz</p>
                                <p className="text-violet-200 text-sm">Controle por voz</p>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={handlePremiumUpgrade}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3"
                          >
                            <Crown className="w-5 h-5 mr-2" />
                            Assinar Premium - R$ 24,90/mês
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Logout Section */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 mt-6">
              <div className="text-center">
                <h3 className="text-white text-xl font-bold mb-4">Sair da Conta</h3>
                <p className="text-violet-200 mb-6">
                  Deseja sair da sua conta? Você precisará fazer login novamente para acessar seus dados.
                </p>
                <Button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
