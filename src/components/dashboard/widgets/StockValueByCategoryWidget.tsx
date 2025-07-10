import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { WidgetProps } from './widget-map';

const chartConfig = {
  value: {
    label: 'Valor (R$)',
    color: 'hsl(var(--chart-1))',
  },
};

export const StockValueByCategoryWidget: React.FC<WidgetProps> = ({ products, categories }) => {
  const chartData = useMemo(() => {
    const categoryValues = products.reduce<Record<string, number>>((acc, product) => {
      const value = product.price * product.quantity;
      acc[product.category] = (acc[product.category] || 0) + value;
      return acc;
    }, {});

    return Object.entries(categoryValues).map(([categoryId, totalValue]) => ({
      name: categories.find(c => c.id === categoryId)?.name || 'Desconhecida',
      value: totalValue,
    }));
  }, [products, categories]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Valor do Estoque por Categoria</CardTitle>
                <CardDescription>Nenhum dado para exibir.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-60 items-center justify-center">
                <p className="text-muted-foreground">Adicione produtos com preço e quantidade.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valor do Estoque por Categoria</CardTitle>
        <CardDescription>Comparativo do valor total de estoque entre as categorias.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
