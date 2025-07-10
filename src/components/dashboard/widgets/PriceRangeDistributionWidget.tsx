import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { WidgetProps } from './widget-map';
import { WIDGET_MAP } from './widget-map';

const chartConfig = {
  count: {
    label: 'Nº de Produtos',
    color: 'hsl(var(--chart-2))',
  },
};

const priceRanges = [
  { name: 'R$0-10', min: 0, max: 10 },
  { name: 'R$10-20', min: 10, max: 20 },
  { name: 'R$20-50', min: 20, max: 50 },
  { name: 'R$50-100', min: 50, max: 100 },
  { name: 'R$100+', min: 100, max: Infinity },
];

export const PriceRangeDistributionWidget: React.FC<WidgetProps> = ({ products }) => {
  const chartData = useMemo(() => {
    const data = priceRanges.map(range => ({ name: range.name, count: 0 }));
    products.forEach(product => {
      const rangeIndex = priceRanges.findIndex(r => product.price >= r.min && product.price < r.max);
      if (rangeIndex !== -1) {
        data[rangeIndex].count++;
      }
    });
    return data;
  }, [products]);

  const widgetInfo = WIDGET_MAP.priceRangeDistribution;
  const Icon = widgetInfo.Icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {widgetInfo.title}
        </CardTitle>
        <CardDescription>{widgetInfo.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
            <YAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
