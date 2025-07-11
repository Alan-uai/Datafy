
"use client";

import React from 'react';
import type { Product, Category } from '@/lib/types';
import { WIDGET_MAP, AllWidgetType } from '@/components/dashboard/widgets/widget-map';

export interface AnalyticsDashboardProps {
    products: Product[];
    categories: Category[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ products, categories }) => {
  const widgetDataProps = { products, categories };
  
  // Filter out non-analytics or specific widgets if needed
  const analyticsWidgets = (Object.keys(WIDGET_MAP) as AllWidgetType[]).filter(
    (id) => id !== 'expiryAttention' // Example: Exclude the expiry attention widget
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {analyticsWidgets.map(widgetId => {
        const WidgetComponent = WIDGET_MAP[widgetId].component;
        const widgetInfo = WIDGET_MAP[widgetId];
        
        // Skip rendering premium widgets if not applicable, though this should be handled by a premium check
        if (widgetInfo.premium) return null;

        return <WidgetComponent key={widgetId} {...widgetDataProps as any} />;
      })}
    </div>
  );
};
