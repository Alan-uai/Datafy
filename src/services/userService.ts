
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  isPremium?: boolean;
  premiumExpiresAt?: string;
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
  preferences: {
    theme: 'dark' | 'light' | 'system';
    soundEnabled: boolean;
    language: 'pt-BR' | 'en-US';
    columnVisibility?: Record<string, boolean>;
  };
  privacy: {
    showEmail: boolean;
    showActivity: boolean;
  };
  createdAt: any;
  updatedAt: any;
}

const defaultProfile: Omit<UserProfile, 'uid' | 'displayName' | 'email' | 'photoURL' | 'createdAt' | 'updatedAt'> = {
  isPremium: false,
  stats: { productsCount: 0, listsCount: 0, daysActive: 0, efficiencyScore: 0 },
  achievements: [],
  notifications: { email: true, push: true, expiryWarnings: true },
  preferences: { 
    theme: 'dark', 
    soundEnabled: true, 
    language: 'pt-BR',
    columnVisibility: {
      'produto': true,
      'marca': true,
      'qtde': true,
      'validade': true,
      'preco': true,
      'categoria': true,
      'status': true,
    }
  },
  privacy: { showEmail: false, showActivity: true },
};

export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  const existingProfile = await getDoc(userRef);

  if (!existingProfile.exists()) {
    const newUserProfile = {
      ...defaultProfile,
      uid,
      displayName: data.displayName || null,
      email: data.email || null,
      photoURL: data.photoURL || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...data,
      preferences: {
        ...defaultProfile.preferences,
        ...data.preferences,
      }
    };
    await setDoc(userRef, newUserProfile);
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Convert Firestore Timestamps to Dates
    const profile: UserProfile = {
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
      achievements: data.achievements.map((ach: any) => ({
        ...ach,
        unlockedAt: ach.unlockedAt?.toDate() ?? null
      }))
    } as UserProfile;
    return profile;
  }
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  
  // Custom merge for nested preference object
  const updates: any = { ...data, updatedAt: serverTimestamp() };
  if (data.preferences) {
      const existingProfile = await getUserProfile(uid);
      updates.preferences = {
          ...existingProfile?.preferences,
          ...data.preferences
      };
  }

  await updateDoc(userRef, updates);
};

export const checkPremiumStatus = async (uid: string): Promise<boolean> => {
    const profile = await getUserProfile(uid);
    if (!profile?.isPremium) return false;
    
    // Check for expiration if premiumExpiresAt exists
    if (profile.premiumExpiresAt && new Date(profile.premiumExpiresAt) < new Date()) {
        // Premium expired, update status
        await updateUserProfile(uid, { isPremium: false });
        return false;
    }

    return true;
}
