
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

export type ThemeName = 'dark' | 'matrix' | 'padrão' | 'verão' | 'espaço' | 'sakura' | 'dia-noite';

export interface UserPreferences {
    theme: ThemeName;
    soundEnabled: boolean;
    language: 'pt-BR' | 'en-US';
    columnVisibility: Record<string, boolean>;
    activeWidgets: any[]; // Using any to avoid circular dependency with widget-map
    lastActiveListId?: string;
    isEditingWidgets: boolean;
    dashboardScale: 'normal' | 'compact';
    attentionHorizonDays: number;
    matrixAnimation: 'cintilar' | 'girar';
    matrixMode: 'padrão' | 'merge';
    matrixSpeed: number;
}
