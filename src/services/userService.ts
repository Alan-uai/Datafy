
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, Achievement } from '@/types';

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const createUserProfile = async (uid: string, userData: Partial<UserProfile>): Promise<void> => {
  try {
    const defaultProfile: Partial<UserProfile> = {
      ...userData,
      isPremium: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        productsCount: 0,
        listsCount: 0,
        daysActive: 1,
        efficiencyScore: 0
      },
      achievements: [],
      notifications: {
        email: true,
        push: true,
        marketing: false
      },
      preferences: {
        darkMode: true,
        language: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        soundEnabled: true
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showPhone: false
      }
    };

    await setDoc(doc(db, 'users', uid), defaultProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const updateUserStats = async (uid: string, statsUpdate: Partial<UserProfile['stats']>): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const currentStats = userDoc.data().stats || {};
      await updateDoc(doc(db, 'users', uid), {
        stats: { ...currentStats, ...statsUpdate },
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

export const unlockAchievement = async (uid: string, achievement: Omit<Achievement, 'unlockedAt'>): Promise<void> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const currentAchievements = userDoc.data().achievements || [];
      const newAchievement = {
        ...achievement,
        unlockedAt: new Date()
      };
      
      // Check if achievement already exists
      const exists = currentAchievements.some((a: Achievement) => a.id === achievement.id);
      if (!exists) {
        await updateDoc(doc(db, 'users', uid), {
          achievements: [...currentAchievements, newAchievement],
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    throw error;
  }
};

export const activatePremium = async (uid: string, months: number = 1): Promise<void> => {
  try {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);
    
    await updateDoc(doc(db, 'users', uid), {
      isPremium: true,
      premiumExpiresAt: expiresAt,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error activating premium:', error);
    throw error;
  }
};

export const checkPremiumStatus = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.isPremium && userData.premiumExpiresAt) {
        const now = new Date();
        const expiresAt = userData.premiumExpiresAt.toDate();
        
        if (now > expiresAt) {
          // Premium expired, update user
          await updateDoc(doc(db, 'users', uid), {
            isPremium: false,
            updatedAt: serverTimestamp()
          });
          return false;
        }
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
};

// Built-in achievements
export const ACHIEVEMENTS = {
  FIRST_PRODUCT: {
    id: 'first_product',
    name: 'Primeiro Produto',
    description: 'Adicionou seu primeiro produto',
    iconType: 'Star',
    color: 'bg-yellow-500'
  },
  ORGANIZER: {
    id: 'organizer',
    name: 'Organizador',
    description: 'Criou 10 listas',
    iconType: 'Trophy',
    color: 'bg-green-500'
  },
  EXPERT: {
    id: 'expert',
    name: 'Expert',
    description: '30 dias de uso',
    iconType: 'Zap',
    color: 'bg-blue-500'
  },
  PREMIUM_USER: {
    id: 'premium_user',
    name: 'Usuário Premium',
    description: 'Ativou a assinatura Premium',
    iconType: 'Crown',
    color: 'bg-purple-500'
  },
  BULK_MASTER: {
    id: 'bulk_master',
    name: 'Mestre em Lote',
    description: 'Adicionou 50+ produtos de uma vez',
    iconType: 'Package',
    color: 'bg-orange-500'
  }
};
