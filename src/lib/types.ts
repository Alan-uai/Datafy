
import type {LucideProps} from 'lucide-react';
import type {ForwardRefExoticComponent, RefAttributes} from 'react';

export type Category = {
  id: string;
  name: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  expiryDate: Date;
  price: number;
  category: string;
  listId: string;
};

export type ProductList = {
    id: string;
    name: string;
    icon: string;
    userId: string;
    createdAt: any; // Firestore Timestamp
};

export type PremiumPlan = {
  type: 'I' | 'II' | 'III';
  startedAt: any; // Firestore Timestamp
  expiresAt?: any; // Firestore Timestamp for future use
}

export type ThemeName = 
  | 'dark' | 'light' | 'matrix' | 'padrão' | 'verão' | 'espaço' | 'sakura' | 'dia-noite' 
  | 'deep-ocean' | 'enchanted-forest' | 'starfield-warp'
  | 'galactic-journey' | 'floating-lanterns' | 'cyberpunk-city'
  | 'cyberpunk-traffic' | 'chinese-lanterns'
  | 'living-organism' | 'generative-topography' | 'dynamic-weather'
  | 'fractal-explorer' | 'glitchscape' | 'bioluminescent-cave'
  | 'interstellar-black-hole' | 'glitch' | 'user-media'
  | 'facebook-likes' | 'galaxy-impact' | 'snowfall' | 'vampire-aesthetic'
  | 'chocolate-fountain' | 'zodiac-wheel' | 'cloud-surfing' | 'mystic-eye';

export type FontName = 'default' | 'datafy' | 'royal-inferno' | 'who-is-hot';


export interface ThemeConfig {
    themeAnimation: 'cintilar' | 'girar' | 'nenhuma';
    themeSpeed: number;
    themeSize: number;
    matrixMode: 'padrão' | 'combinado';
    diurnoMode: boolean;
    astrologicalEvents: boolean;
    glitchType?: 'classic' | 'rgb-shift' | 'blocky' | 'invert' | 'scanlines';
    snowType?: 'soft' | 'crystal' | 'heavy';
    chocolateType?: 'black' | 'white' | 'colorful';
    zodiacSign?: 'all' | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
    eyeType?: 'human' | 'demon' | 'angelic' | 'reptile' | 'cybernetic';
    userMediaUrl?: string;
}

export interface NotificationPreferences {
    pushToken: string | null;
    lowStock: {
        enabled: boolean;
        frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    };
    expiry: {
        enabled: boolean;
        thresholdDays: number;
        frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
    };
    achievements: {
        enabled: boolean;
        tier: 'any' | 'silver' | 'gold' | 'diamond';
    };
}


export interface UserPreferences {
    activeTheme: ThemeName;
    activeFont: FontName;
    defaultThemeMode: 'light' | 'dark';
    lastCustomTheme: ThemeName;
    themeConfigs: Record<string, Partial<ThemeConfig>>;
    soundEnabled: boolean;
    language: 'pt-BR' | 'en-US';
    columnVisibility: Record<string, boolean>;
    activeWidgets: any[]; // Using any to avoid circular dependency with widget-map
    lastActiveListId?: string;
    isEditingWidgets: boolean;
    dashboardScale: 'normal' | 'compact';
    attentionHorizonDays: number;
    notifications: NotificationPreferences;
}
