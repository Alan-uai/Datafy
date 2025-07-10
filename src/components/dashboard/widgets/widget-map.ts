import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, Package, PieChart, LineChart, BarChart, CircleDollarSign } from 'lucide-react';
import type { Product, Category } from '@/lib/types';
import { StatsCardsWidget } from './StatsCardsWidget';
import { CategoryDistributionWidget } from './CategoryDistributionWidget';
import { StockValueByCategoryWidget } from './StockValueByCategoryWidget';
import { LowStockItemsWidget } from './LowStockItemsWidget';
import { PriceRangeDistributionWidget } from './PriceRangeDistributionWidget';

export type WidgetProps = {
  products: Product[];
  categories: Category[];
};

export type WidgetConfig = {
  title: string;
  description: string;
  Icon: LucideIcon;
  component: React.FC<WidgetProps>;
};

export const WIDGET_MAP = {
  statsCards: {
    title: "Estatísticas Rápidas",
    description: "Visão geral do seu inventário.",
    Icon: LayoutDashboard,
    component: StatsCardsWidget,
  },
  categoryDistribution: {
    title: "Distribuição por Categoria",
    description: "Gráfico de pizza das categorias de produtos.",
    Icon: PieChart,
    component: CategoryDistributionWidget,
  },
  stockValueByCategory: {
    title: "Valor por Categoria",
    description: "Valor total do estoque para cada categoria.",
    Icon: BarChart,
    component: StockValueByCategoryWidget,
  },
  lowStockItems: {
    title: "Itens com Baixo Estoque",
    description: "Produtos que precisam de reposição.",
    Icon: Package,
    component: LowStockItemsWidget,
  },
  priceRangeDistribution: {
    title: "Distribuição de Preços",
    description: "Como os produtos se distribuem por faixa de preço.",
    Icon: CircleDollarSign,
    component: PriceRangeDistributionWidget,
  },
} as const;

export type AllWidgetType = keyof typeof WIDGET_MAP;
