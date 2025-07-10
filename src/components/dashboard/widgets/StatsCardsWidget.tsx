import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Archive, Shapes } from 'lucide-react';
import type { WidgetProps } from './widget-map';

export const StatsCardsWidget: React.FC<WidgetProps> = ({ products }) => {
  const stats = useMemo(() => {
    const totalValue = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
    const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
    const uniqueCategories = new Set(products.map(p => p.category)).size;
    return { totalValue, totalItems, uniqueCategories };
  }, [products]);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {stats.totalValue.toFixed(2).replace('.', ',')}</div>
          <p className="text-xs text-muted-foreground">Valor total de todos os produtos</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Itens Totais</CardTitle>
          <Archive className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">Soma de todas as quantidades</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categorias</CardTitle>
          <Shapes className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueCategories}</div>
          <p className="text-xs text-muted-foreground">Número de categorias únicas</p>
        </CardContent>
      </Card>
    </div>
  );
};
