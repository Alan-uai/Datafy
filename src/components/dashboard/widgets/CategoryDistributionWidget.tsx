import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartStyle } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import type { WidgetProps } from './widget-map';
import { WIDGET_MAP } from './widget-map';

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export const CategoryDistributionWidget: React.FC<WidgetProps> = ({ products, categories }) => {
  const chartData = useMemo(() => {
    const categoryCounts = products.reduce<Record<string, number>>((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(categoryCounts).map(([categoryId, count]) => ({
      name: categories.find(c => c.id === categoryId)?.name || 'Desconhecida',
      value: count,
    }));
  }, [products, categories]);

  const widgetInfo = WIDGET_MAP.categoryDistribution;
  const Icon = widgetInfo.Icon;

  const chartConfig = useMemo(() => {
    const config: any = {};
    chartData.forEach((data, index) => {
        config[data.name] = {
            label: data.name,
            color: CHART_COLORS[index % CHART_COLORS.length],
        };
    });
    return config;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {widgetInfo.title}
                </CardTitle>
                <CardDescription>Nenhum produto para exibir no gráfico.</CardDescription>
            </CardHeader>
            <CardContent className="flex h-60 items-center justify-center">
                <p className="text-muted-foreground">Adicione produtos para ver o gráfico.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {widgetInfo.title}
        </CardTitle>
        <CardDescription>{widgetInfo.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={5}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
                </Pie>
            </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
