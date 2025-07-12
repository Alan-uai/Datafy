
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserPreferences, PremiumPlan, ThemeName, ThemeConfig } from '@/lib/types';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconType: string;
  color: string;
  unlockedAt: Date | null;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  birthDate?: string;
  location?: string;
  phone?: string;
  website?: string;
  bio?: string;
  premium: PremiumPlan | null;
  stats: {
    productsCount: number;
    listsCount: number;
    daysActive: number;
    efficiencyScore: number;
  };
  achievements: Achievement[];
  notifications: {
    email: boolean;
    push: boolean;
    expiryWarnings: boolean;
  };
  preferences: UserPreferences;
  privacy: {
    showEmail: boolean;
    showActivity: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

const defaultThemeConfig: ThemeConfig = {
    themeAnimation: 'nenhuma',
    themeSpeed: 100,
    themeSize: 100,
    matrixMode: 'padrão',
    diurnoMode: false,
    astrologicalEvents: true,
};

const allThemes: ThemeName[] = ['dark', 'light', 'matrix', 'padrão', 'verão', 'espaço', 'sakura', 'dia-noite'];

export const defaultProfile: Omit<UserProfile, 'uid' | 'displayName' | 'email' | 'photoURL' | 'createdAt' | 'updatedAt'> = {
  premium: null,
  stats: { productsCount: 0, listsCount: 0, daysActive: 0, efficiencyScore: 0 },
  achievements: [],
  notifications: { email: true, push: true, expiryWarnings: true },
  preferences: { 
    activeTheme: 'dark', 
    lastCustomTheme: 'matrix',
    themeConfigs: allThemes.reduce((acc, theme) => {
        acc[theme] = { ...defaultThemeConfig };
        return acc;
    }, {} as Record<ThemeName, Partial<ThemeConfig>>),
    soundEnabled: true, 
    language: 'pt-BR',
    columnVisibility: {
      'id': false,
      'produto': true,
      'marca': true,
      'qtde': true,
      'validade': true,
      'preco': false,
      'categoria': true,
      'status': true,
    },
    activeWidgets: ['expiryAttention', 'statsCards'],
    isEditingWidgets: false,
    dashboardScale: 'normal',
    attentionHorizonDays: 7,
  },
  privacy: { showEmail: false, showActivity: true },
};

export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<UserProfile> => {
  const userRef = doc(db, 'users', uid);
  const now = serverTimestamp();
  
  const newUserProfileData = {
    ...defaultProfile,
    uid,
    displayName: data.displayName || null,
    email: data.email || null,
    photoURL: data.photoURL === undefined ? null : data.photoURL || null,
    createdAt: now,
    updatedAt: now,
    stats: { ...defaultProfile.stats, ...(data.stats || {}) },
    achievements: data.achievements || defaultProfile.achievements,
    notifications: { ...defaultProfile.notifications, ...(data.notifications || {}) },
    preferences: { 
        ...defaultProfile.preferences, 
        ...(data.preferences || {}),
        themeConfigs: {
            ...defaultProfile.preferences.themeConfigs,
            ...(data.preferences?.themeConfigs || {}),
        }
    },
    privacy: { ...defaultProfile.privacy, ...(data.privacy || {}) },
    premium: data.premium || defaultProfile.premium,
  };

  await setDoc(userRef, newUserProfileData);
  
  const docSnap = await getDoc(userRef);
  const createdProfile = docSnap.data();

  // Convert server timestamps to Date objects for immediate use
  return {
      ...createdProfile,
      createdAt: createdProfile?.createdAt.toDate(),
      updatedAt: createdProfile?.updatedAt.toDate()
  } as UserProfile;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    // Ensure all default fields are present by merging with defaults
    const profile: UserProfile = {
      ...defaultProfile,
      ...data,
      uid: data.uid,
      displayName: data.displayName,
      email: data.email,
      photoURL: data.photoURL,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      premium: data.premium ? {
          ...data.premium,
          startedAt: data.premium.startedAt?.toDate ? data.premium.startedAt.toDate() : null,
          expiresAt: data.premium.expiresAt?.toDate ? data.premium.expiresAt.toDate() : null,
      } : null,
      achievements: (data.achievements || []).map((ach: any) => ({
        ...ach,
        unlockedAt: ach.unlockedAt?.toDate ? ach.unlockedAt.toDate() : null
      })),
       preferences: {
        ...defaultProfile.preferences,
        ...(data.preferences || {}),
        themeConfigs: {
            ...defaultProfile.preferences.themeConfigs,
            ...(data.preferences?.themeConfigs || {}),
        }
      },
      stats: {
          ...defaultProfile.stats,
          ...(data.stats || {})
      }
    };
    return profile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  
  const updates: Record<string, any> = { ...data, updatedAt: serverTimestamp() };

  // Convert nested objects to dot notation for atomic updates
  if (data.preferences) {
    for (const [key, value] of Object.entries(data.preferences)) {
        if (key === 'themeConfigs') {
            for (const [theme, config] of Object.entries(value)) {
                for (const [configKey, configValue] of Object.entries(config)) {
                    updates[`preferences.themeConfigs.${theme}.${configKey}`] = configValue;
                }
            }
        } else {
            updates[`preferences.${key}`] = value;
        }
    }
    delete updates.preferences; // Remove the object to avoid overwriting
  }
  if (data.stats) {
      for (const [key, value] of Object.entries(data.stats)) {
        updates[`stats.${key}`] = value;
      }
      delete updates.stats;
  }
  if (data.notifications) {
      for (const [key, value] of Object.entries(data.notifications)) {
        updates[`notifications.${key}`] = value;
      }
      delete updates.notifications;
  }
  if (data.privacy) {
      for (const [key, value] of Object.entries(data.privacy)) {
        updates[`privacy.${key}`] = value;
      }
      delete updates.privacy;
  }
  
  await updateDoc(userRef, updates);
};


export const updateUserPreferences = async (uid: string, preferences: Partial<UserPreferences>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  
  const updates: Record<string, any> = { 'updatedAt': serverTimestamp() };
  for (const [key, value] of Object.entries(preferences)) {
       if (key === 'themeConfigs') {
            for (const [theme, config] of Object.entries(value as object)) {
                for (const [configKey, configValue] of Object.entries(config)) {
                    updates[`preferences.themeConfigs.${theme}.${configKey}`] = configValue;
                }
            }
        } else {
            updates[`preferences.${key}`] = value;
        }
  }
  
  await updateDoc(userRef, updates);
}


export const checkPremiumStatus = async (uid: string): Promise<boolean> => {
    const profile = await getUserProfile(uid);
    if (!profile?.premium) return false;
    
    // Check for expiration if premiumExpiresAt exists
    if (profile.premium.expiresAt && new Date(profile.premium.expiresAt) < new Date()) {
        // Expiration date has passed, update profile to non-premium
        await updateUserProfile(uid, { premium: null });
        return false;
    }

    // Is premium and not expired
    return true;
}
