import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { WidgetProps } from './widget-map';
import { WIDGET_MAP } from './widget-map';

const LOW_STOCK_THRESHOLD = 10;

export const LowStockItemsWidget: React.FC<WidgetProps> = ({ products }) => {
  const lowStockProducts = useMemo(() => {
    return products
      .filter(p => p.quantity < LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [products]);

  const widgetInfo = WIDGET_MAP.lowStockItems;
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
        {lowStockProducts.length > 0 ? (
          <ul className="space-y-2">
            {lowStockProducts.map(product => (
              <li key={product.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{product.name}</span>
                  <span className="text-muted-foreground"> ({product.brand})</span>
                </div>
                <Badge variant={product.quantity === 0 ? "destructive" : "secondary"}>
                  {product.quantity} un.
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-muted-foreground py-4">Nenhum item com baixo estoque. Bom trabalho!</p>
        )}
      </CardContent>
    </Card>
  );
};
