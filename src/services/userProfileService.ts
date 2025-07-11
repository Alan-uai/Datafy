
"use client";

import type { User } from "firebase/auth";
import type { Toast } from "@/hooks/use-toast";
import type { UserProfile } from "./userService";
import { getProductLists, getProductsByUser } from "./productService";
import { updateUserProfile } from "./userService";

const checkForAchievement = (
  profile: UserProfile, 
  id: string, 
  name: string, 
  description: string, 
  iconType: string, 
  color: string, 
  toast: (options: Omit<Parameters<typeof Toast>[0], "id">) => void
) => {
  const existingAchievements = new Map(profile.achievements.map(a => [a.id, a]));
  if (!existingAchievements.has(id)) {
    const newAchievement = { id, name, description, iconType, color, unlockedAt: new Date() };
    profile.achievements.push(newAchievement);
    toast({
      title: "🏆 Conquista Desbloqueada!",
      description: name,
    });
    return true;
  }
  return false;
};

export const updateUserStatsAndAchievements = async (
  profile: UserProfile,
  currentUser: User,
  toast: (options: Omit<Parameters<typeof Toast>[0], "id">) => void
): Promise<UserProfile> => {
  try {
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
    
    let achievementsUpdated = false;
    if (totalProductsCount > 0) achievementsUpdated = achievementsUpdated || checkForAchievement(profile, 'first_product', 'Primeiro Produto', 'Adicione seu primeiro produto.', 'ShoppingCart', 'bg-green-500', toast);
    if (listsCount > 0) achievementsUpdated = achievementsUpdated || checkForAchievement(profile, 'organizer', 'Organizador', 'Crie sua primeira lista de produtos.', 'List', 'bg-blue-500', toast);
    if (daysActive >= 7) achievementsUpdated = achievementsUpdated || checkForAchievement(profile, 'active_user', 'Usuário Ativo', 'Use o Datafy por 7 dias.', 'CalendarCheck', 'bg-purple-500', toast);
    if (efficiencyScore >= 80) achievementsUpdated = achievementsUpdated || checkForAchievement(profile, 'efficiency_master', 'Mestre da Eficiência', 'Alcance um score de eficiência de 80%.', 'BarChart', 'bg-yellow-500', toast);
    if (totalProductsCount >= 50) achievementsUpdated = achievementsUpdated || checkForAchievement(profile, 'collector', 'Colecionador', 'Cadastre 50 produtos.', 'Package', 'bg-orange-500', toast);

    const updatedProfile = {
      ...profile,
      stats: updatedStats,
    };

    if (JSON.stringify(profile.stats) !== JSON.stringify(updatedStats) || achievementsUpdated) {
        await updateUserProfile(currentUser.uid, { stats: updatedStats, achievements: updatedProfile.achievements });
    }

    return updatedProfile;

  } catch (error) {
    console.error('Error loading real user data:', error);
    toast({ variant: "destructive", title: "Erro ao atualizar dados", description: "Não foi possível carregar as estatísticas."});
    return profile;
  }
};
