"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Phone, Globe } from 'lucide-react';
import type { UserProfile } from '@/services/userService';

interface PersonalInfoFormProps {
  userProfile: UserProfile;
  updateProfile: (field: keyof UserProfile, value: any) => void;
  isEditing: boolean;
}

export const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({ userProfile, updateProfile, isEditing }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label>Nome Completo</Label>
        <Input 
          value={userProfile.displayName || ''} 
          onChange={(e) => updateProfile('displayName', e.target.value)} 
          disabled={!isEditing} 
          placeholder="Seu nome completo"
        />
      </div>
      <div className="space-y-2">
        <Label>Data de Nascimento</Label>
        <Input 
          type="date" 
          value={userProfile.birthDate || ''} 
          onChange={(e) => updateProfile('birthDate', e.target.value)} 
          disabled={!isEditing} 
        />
      </div>
      <div className="space-y-2">
        <Label>Localização</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            value={userProfile.location || ''} 
            onChange={(e) => updateProfile('location', e.target.value)} 
            disabled={!isEditing} 
            className="pl-10" 
            placeholder="Cidade, Estado"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            value={userProfile.phone || ''} 
            onChange={(e) => updateProfile('phone', e.target.value)} 
            disabled={!isEditing} 
            className="pl-10" 
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Website</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input 
            value={userProfile.website || ''} 
            onChange={(e) => updateProfile('website', e.target.value)} 
            disabled={!isEditing} 
            className="pl-10" 
            placeholder="https://seusite.com"
          />
        </div>
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label>Biografia</Label>
        <Textarea 
          value={userProfile.bio || ''} 
          onChange={(e) => updateProfile('bio', e.target.value)} 
          disabled={!isEditing} 
          className="min-h-[100px]" 
          placeholder="Conte um pouco sobre você..."
        />
      </div>
    </div>
  );
};
