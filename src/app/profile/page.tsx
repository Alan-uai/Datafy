
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  User, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
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
  Crown,
  Package,
  Eye,
  BarChart,
  ShoppingCart,
  List,
  CalendarCheck
} from 'lucide-react';
import { getUserProfile, updateUserProfile, type UserProfile as UserProfileType, createUserProfile } from '@/services/userService';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'achievements' | 'premium'>('personal');
  const [userProfile, setUserProfile] = useState<UserProfileType | null>(null);

  const loadUserProfile = useCallback(async () => {
    if (!currentUser?.uid) return;

    setIsLoading(true);
    try {
      let profile = await getUserProfile(currentUser.uid);
      if (!profile) {
        const newProfileData: Partial<UserProfileType> = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Novo Usuário',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || undefined,
        };
        await createUserProfile(currentUser.uid, newProfileData);
        profile = await getUserProfile(currentUser.uid);
      }
      
      if (profile) {
        await updateRealUserData(profile);
      } else {
         throw new Error("Não foi possível carregar ou criar o perfil.");
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
  }, [currentUser, toast]);

  const updateRealUserData = async (profile: UserProfileType) => {
    if (!currentUser?.uid) return;

    try {
        const { getProductsByUser, getProductLists } = await import('@/services/productService');
        const allUserProducts = await getProductsByUser(currentUser.uid);
        const lists = await getProductLists(currentUser.uid);

        const totalProductsCount = allUserProducts.length;
        const listsCount = lists.length;

        const accountCreatedAt = currentUser.metadata.creationTime 
            ? new Date(currentUser.metadata.creationTime) 
            : new Date();
        const daysActive = Math.max(1, Math.floor((Date.now() - accountCreatedAt.getTime()) / (1000 * 60 * 60 * 24)));

        let efficiencyScore = 0;
        if (totalProductsCount > 0) efficiencyScore += 40;
        if (listsCount > 0) efficiencyScore += 30;
        if (daysActive >= 7) efficiencyScore += 30;

        const updatedStats = {
            productsCount: totalProductsCount,
            listsCount,
            daysActive,
            efficiencyScore
        };

        const existingAchievements = new Map(profile.achievements.map(a => [a.id, a]));
        const newAchievements = [...profile.achievements];

        const checkForAchievement = (id: string, name: string, description: string, iconType: string, color: string) => {
          if (!existingAchievements.has(id)) {
            const achievement = { id, name, description, iconType, color, unlockedAt: new Date() };
            newAchievements.push(achievement);
            toast({
              title: "🏆 Conquista Desbloqueada!",
              description: name,
            });
          }
        };

        if (totalProductsCount > 0) checkForAchievement('first_product', 'Primeiro Produto', 'Adicione seu primeiro produto.', 'ShoppingCart', 'bg-green-500');
        if (listsCount > 0) checkForAchievement('organizer', 'Organizador', 'Crie sua primeira lista de produtos.', 'List', 'bg-blue-500');
        if (daysActive >= 7) checkForAchievement('active_user', 'Usuário Ativo', 'Use o Datafy por 7 dias.', 'CalendarCheck', 'bg-purple-500');
        if (efficiencyScore >= 80) checkForAchievement('efficiency_master', 'Mestre da Eficiência', 'Alcance um score de eficiência de 80%.', 'BarChart', 'bg-yellow-500');
        if (totalProductsCount >= 50) checkForAchievement('collector', 'Colecionador', 'Cadastre 50 produtos.', 'Package', 'bg-orange-500');

        const updatedProfile = {
          ...profile,
          stats: updatedStats,
          achievements: newAchievements
        };

        setUserProfile(updatedProfile);
        await updateUserProfile(currentUser.uid, { stats: updatedStats, achievements: newAchievements });
        
    } catch (error) {
        console.error('Error loading real user data:', error);
        toast({ variant: "destructive", title: "Erro ao atualizar dados", description: "Não foi possível carregar as estatísticas."});
    }
  };


  useEffect(() => {
    if (currentUser?.uid) {
      loadUserProfile();
    } else {
        setIsLoading(false);
    }
  }, [currentUser, loadUserProfile]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
       toast({ variant: "destructive", title: "Erro ao sair."});
    }
  };

  const handleSave = async () => {
    if (!userProfile || !currentUser?.uid) return;

    try {
      if (!userProfile.displayName?.trim()) {
        toast({ variant: "destructive", title: "Campo Obrigatório", description: "Nome é obrigatório." });
        return;
      }
      await updateUserProfile(currentUser.uid, {
          displayName: userProfile.displayName,
          birthDate: userProfile.birthDate,
          location: userProfile.location,
          phone: userProfile.phone,
          website: userProfile.website,
          bio: userProfile.bio
      });

      setIsEditing(false);
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o perfil." });
    }
  };

  const updateProfile = (field: keyof UserProfileType, value: any) => {
    setUserProfile(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handlePremiumUpgrade = () => {
    toast({ title: "Premium em breve!", description: "A funcionalidade Premium será lançada em breve." });
  };

  if (isLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  const calculateLevel = (stats: UserProfileType['stats']) => {
    const totalScore = (stats.daysActive * 1) + (stats.productsCount * 2) + (stats.listsCount * 5);
    const level = Math.floor(totalScore / 50) + 1; // 50 points per level
    const progress = ((totalScore % 50) / 50) * 100;
    const pointsToNextLevel = 50 - (totalScore % 50);
    return { level: Math.min(level, 100), progress: Math.round(progress), pointsToNextLevel };
  };

  const { level, progress, pointsToNextLevel } = calculateLevel(userProfile.stats);

  const profileStats = [
    { label: 'Produtos', value: userProfile.stats.productsCount.toString(), icon: Target, color: 'text-blue-400' },
    { label: 'Listas', value: userProfile.stats.listsCount.toString(), icon: Trophy, color: 'text-green-400' },
    { label: 'Dias Ativo', value: userProfile.stats.daysActive.toString(), icon: Calendar, color: 'text-purple-400' },
    { label: 'Eficiência', value: `${userProfile.stats.efficiencyScore}%`, icon: Sparkles, color: 'text-yellow-400' },
  ];

  const tabs = [
    { id: 'personal', label: 'Pessoal', icon: User },
    { id: 'achievements', label: 'Conquistas', icon: Trophy },
    { id: 'premium', label: 'Premium', icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 relative"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-white">Meu Perfil</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Gerencie suas informações, conquistas e preferências.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="xl:col-span-1 space-y-6"
          >
            <Card className="bg-card shadow-2xl">
              <CardHeader className="text-center pb-6">
                <motion.div
                  whileHover={{ scale: 1.1, rotateZ: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mx-auto mb-4 relative"
                >
                  <Avatar className="w-24 h-24 border-4 border-primary/50 shadow-xl">
                    <AvatarImage src={userProfile.photoURL || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                      {userProfile.displayName?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                   <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 rounded-full p-2 shadow-lg"
                  >
                    <Camera className="w-4 h-4 text-primary-foreground" />
                  </motion.button>
                </motion.div>

                <CardTitle className="text-white text-xl">
                  {userProfile.displayName || 'Usuário'}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  {userProfile.email}
                </CardDescription>

                <div className="flex justify-center gap-2 pt-2">
                  <Badge variant="secondary">Verificado</Badge>
                  {userProfile.isPremium && (
                    <Badge variant="default" className="bg-yellow-500 text-black">Premium</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-2 gap-2 text-center">
                  {profileStats.map((stat) => (
                    <motion.div key={stat.label} whileHover={{ scale: 1.05 }} className="bg-muted/50 rounded-lg p-2">
                      <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-1`} />
                      <p className="font-bold text-sm">{stat.value}</p>
                      <p className="text-muted-foreground text-xs">{stat.label}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-yellow-400" /> Nível {level}
                    </CardTitle>
                    <CardDescription>Progresso: {progress}%</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-muted-foreground text-xs mt-2">{pointsToNextLevel} pontos para o próximo nível.</p>
                </CardContent>
            </Card>

          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="xl:col-span-3"
          >
            <Card className="bg-card shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Informações do Perfil</CardTitle>
                   <div className="flex gap-2">
                     {isEditing && (
                        <Button onClick={() => setIsEditing(false)} variant="ghost">
                           <X className="w-4 h-4 mr-2" /> Cancelar
                        </Button>
                      )}
                      <Button onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                        {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                        {isEditing ? 'Salvar' : 'Editar'}
                      </Button>
                   </div>
                </div>
                <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1 mt-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2 px-3 rounded-md transition-all text-sm font-medium ${
                        activeTab === tab.id
                          ? 'bg-background text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  {activeTab === 'personal' && (
                    <motion.div key="personal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label>Nome Completo</Label><Input value={userProfile.displayName || ''} onChange={(e) => updateProfile('displayName', e.target.value)} disabled={!isEditing} placeholder="Seu nome completo"/></div>
                        <div className="space-y-2"><Label>Data de Nascimento</Label><Input type="date" value={userProfile.birthDate || ''} onChange={(e) => updateProfile('birthDate', e.target.value)} disabled={!isEditing} /></div>
                        <div className="space-y-2"><Label>Localização</Label><div className="relative"><MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input value={userProfile.location || ''} onChange={(e) => updateProfile('location', e.target.value)} disabled={!isEditing} className="pl-10" placeholder="Cidade, Estado"/></div></div>
                        <div className="space-y-2"><Label>Telefone</Label><div className="relative"><Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input value={userProfile.phone || ''} onChange={(e) => updateProfile('phone', e.target.value)} disabled={!isEditing} className="pl-10" placeholder="(11) 99999-9999"/></div></div>
                        <div className="space-y-2 md:col-span-2"><Label>Website</Label><div className="relative"><Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" /><Input value={userProfile.website || ''} onChange={(e) => updateProfile('website', e.target.value)} disabled={!isEditing} className="pl-10" placeholder="https://seusite.com"/></div></div>
                        <div className="space-y-2 md:col-span-2"><Label>Biografia</Label><Textarea value={userProfile.bio || ''} onChange={(e) => updateProfile('bio', e.target.value)} disabled={!isEditing} className="min-h-[100px]" placeholder="Conte um pouco sobre você..."/></div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'achievements' && (
                    <motion.div key="achievements" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                       <Card className="bg-background">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-400" /> Conquistas ({userProfile.achievements.length})</CardTitle></CardHeader>
                        <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                          {userProfile.achievements.length > 0 ? (
                            userProfile.achievements.sort((a,b) => (b.unlockedAt?.getTime() ?? 0) - (a.unlockedAt?.getTime() ?? 0)).map((achievement, index) => (
                              <motion.div key={achievement.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * index }} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                                <div className={`w-12 h-12 ${achievement.color} rounded-full flex items-center justify-center shadow-inner`}><DynamicIcon name={achievement.iconType} className="w-6 h-6 text-white" /></div>
                                <div className="flex-1">
                                  <p className="font-medium">{achievement.name}</p>
                                  <p className="text-muted-foreground text-sm">{achievement.description}</p>
                                  {achievement.unlockedAt && (<p className="text-muted-foreground text-xs mt-1">Conquistado em {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}</p>)}
                                </div>
                                <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-300">Desbloqueado</Badge>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-8"><Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" /><p className="text-muted-foreground">Nenhuma conquista ainda. Continue usando o app!</p></div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {activeTab === 'premium' && (
                     <motion.div key="premium" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center p-8 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-center gap-3 mb-4"><Crown className="w-8 h-8 text-yellow-400" /><h3 className="text-2xl font-bold">Datafy Premium</h3></div>
                        {userProfile.isPremium ? (
                            <>
                                <p className="text-green-400 mb-4">Você é um usuário Premium!</p>
                                {userProfile.premiumExpiresAt && <p className="text-muted-foreground">Válido até: {new Date(userProfile.premiumExpiresAt).toLocaleDateString('pt-BR')}</p>}
                            </>
                        ) : (
                            <>
                                <p className="text-muted-foreground mb-6">Desbloqueie recursos avançados por <span className="text-yellow-400 font-bold">R$ 24,90/mês</span>.</p>
                                <Button onClick={handlePremiumUpgrade} className="bg-gradient-to-r from-primary to-yellow-500 text-white font-bold py-3 px-8"><Crown className="w-5 h-5 mr-2" />Assinar Premium</Button>
                            </>
                        )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </CardContent>
            </Card>

            <div className="bg-card rounded-lg p-6 mt-6">
                <Button onClick={handleLogout} variant="destructive" className="w-full">
                  <LogOut className="w-4 h-4 mr-2" />Sair da Conta
                </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
