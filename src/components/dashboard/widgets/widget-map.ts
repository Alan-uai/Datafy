import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Package, PieChart, BarChart, CircleDollarSign, ShieldAlert } from 'lucide-react';
import type { Product, Category, UserPreferences } from '@/lib/types';
import { StatsCardsWidget } from './StatsCardsWidget';
import { CategoryDistributionWidget } from './CategoryDistributionWidget';
import { StockValueByCategoryWidget } from './StockValueByCategoryWidget';
import { LowStockItemsWidget } from './LowStockItemsWidget';
import { PriceRangeDistributionWidget } from './PriceRangeDistributionWidget';
import { ExpiryAttentionReportCard } from '../ExpiryAttentionReportCard';

export type WidgetProps = {
  products: Product[];
  categories: Category[];
  preferences: UserPreferences;
  savePreferences: (newPreferences: Partial<UserPreferences>) => void;
};

export type ExpiryWidgetProps = {
  listProducts: Product[];
  preferences: UserPreferences;
  savePreferences: (newPreferences: Partial<UserPreferences>) => void;
}

export type WidgetConfig = {
  id: AllWidgetType;
  title: string;
  description: string;
  Icon: LucideIcon;
  component: React.FC<WidgetProps> | React.FC<ExpiryWidgetProps>;
  premium?: boolean;
};

export const WIDGET_MAP: Record<AllWidgetType, WidgetConfig> = {
  statsCards: {
    id: "statsCards",
    title: "Estatísticas Rápidas",
    description: "Visão geral do seu inventário.",
    Icon: LayoutDashboard,
    component: StatsCardsWidget,
    premium: false,
  },
  expiryAttention: {
    id: "expiryAttention",
    title: "Radar de Validade",
    description: "Análise de itens críticos próximos da validade.",
    Icon: ShieldAlert,
    component: ExpiryAttentionReportCard,
    premium: false,
  },
  lowStockItems: {
    id: "lowStockItems",
    title: "Itens com Baixo Estoque",
    description: "Produtos que precisam de reposição.",
    Icon: Package,
    component: LowStockItemsWidget,
    premium: true,
  },
  categoryDistribution: {
    id: "categoryDistribution",
    title: "Distribuição por Categoria",
    description: "Gráfico de pizza das categorias de produtos.",
    Icon: PieChart,
    component: CategoryDistributionWidget,
    premium: true,
  },
  stockValueByCategory: {
    id: "stockValueByCategory",
    title: "Valor por Categoria",
    description: "Valor total do estoque para cada categoria.",
    Icon: BarChart,
    component: StockValueByCategoryWidget,
    premium: true,
  },
  priceRangeDistribution: {
    id: "priceRangeDistribution",
    title: "Distribuição de Preços",
    description: "Como os produtos se distribuem por faixa de preço.",
    Icon: CircleDollarSign,
    component: PriceRangeDistributionWidget,
    premium: true,
  },
} as const;

export type AllWidgetType = keyof typeof WIDGET_MAP;
