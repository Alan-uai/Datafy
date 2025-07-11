
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Edit3, X, User, Trophy, Crown, LogOut } from 'lucide-react';
import type { UserProfile } from '@/services/userService';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalInfoForm } from './PersonalInfoForm';
import { AchievementList } from './AchievementList';
import { PremiumTab } from './PremiumTab';

interface ProfileTabsProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onLogout: () => void;
}

const TABS = [
  { id: 'personal', label: 'Pessoal', icon: User },
  { id: 'achievements', label: 'Conquistas', icon: Trophy },
  { id: 'premium', label: 'Premium', icon: Crown },
];

export const ProfileTabs: React.FC<ProfileTabsProps> = ({ userProfile, setUserProfile, onLogout }) => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'personal' | 'achievements' | 'premium'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [localProfile, setLocalProfile] = useState(userProfile);

  // Sync local state when prop changes
  React.useEffect(() => {
    setLocalProfile(userProfile);
  }, [userProfile]);

  const updateLocalProfileField = (field: keyof UserProfile, value: any) => {
    setLocalProfile(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSave = async () => {
    if (!localProfile || !currentUser?.uid) return;
    try {
      if (!localProfile.displayName?.trim()) {
        toast({ variant: "destructive", title: "Campo Obrigatório", description: "Nome é obrigatório." });
        return;
      }
      const dataToUpdate = {
        displayName: localProfile.displayName,
        birthDate: localProfile.birthDate,
        location: localProfile.location,
        phone: localProfile.phone,
        website: localProfile.website,
        bio: localProfile.bio,
      };

      // Update central state first for instant UI feedback
      setUserProfile(localProfile);

      // Then update Firestore
      await updateUserProfile(currentUser.uid, dataToUpdate);
      
      setIsEditing(false);
      toast({ title: "Perfil atualizado", description: "Suas informações foram salvas." });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o perfil." });
    }
  };
  
  const handleCancelEdit = () => {
    setLocalProfile(userProfile); // Revert local changes
    setIsEditing(false);
  };

  const renderTabContent = () => {
    if (!localProfile) return null;
    switch (activeTab) {
      case 'personal':
        return <PersonalInfoForm userProfile={localProfile} updateProfile={updateLocalProfileField} isEditing={isEditing} />;
      case 'achievements':
        return <AchievementList achievements={localProfile.achievements} />;
      case 'premium':
        return <PremiumTab userProfile={localProfile} setUserProfile={setUserProfile} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Card className="bg-card shadow-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Informações do Perfil</CardTitle>
            <div className="flex gap-2">
              {isEditing && activeTab === 'personal' && (
                <Button onClick={handleCancelEdit} variant="ghost">
                  <X className="w-4 h-4 mr-2" /> Cancelar
                </Button>
              )}
              {activeTab === 'personal' && (
                <Button onClick={isEditing ? handleSave : () => setIsEditing(true)}>
                  {isEditing ? <Save className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                  {isEditing ? 'Salvar' : 'Editar'}
                </Button>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1 mt-4">
            {TABS.map((tab) => (
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
            <motion.div 
              key={activeTab} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -20 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardContent className="p-4">
            <Button onClick={onLogout} variant="destructive" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />Sair da Conta
            </Button>
        </CardContent>
      </Card>
    </>
  );
};
