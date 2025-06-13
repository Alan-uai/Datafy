
import type { Timestamp } from 'firebase/firestore';

export interface ProductList {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  icon: string; // lucide-react icon name
  createdAt: Timestamp | Date | string; // Allow for Firestore Timestamp, Date object, or ISO string
}

export interface Product {
  id: string; // This will be the display ID, can be re-sequenced
  originalId?: string; // This will be the stable, unique key for React/Framer Motion
  listId: string; // ID of the ProductList it belongs to
  produto: string;
  marca?: string; // Made optional for consistency with Zod schema
  unidade: string;
  validade: string;
  isExploding?: boolean;
}

// Tipos para o novo flow de Alertas de Validade Crítica
export interface CriticalExpiryItem {
  productName: string;
  brand?: string;
  quantity: string;
  expiryDate: string;
  daysUntilExpiry: number;
  riskScore: number; // Higher is more critical
  suggestion: string;
}

export interface ExpiryAttentionReport {
  criticalItems: CriticalExpiryItem[];
  overallSummary: string;
  analyzedProductsCount: number;
  criticalProductsCount: number;
}

export interface GenerateExpiryAttentionReportInput {
  products: Product[];
  attentionHorizonDays?: number; // How many days in advance to look for expiries
  topNProducts?: number; // How many top critical products to report
}

