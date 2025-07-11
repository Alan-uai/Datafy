
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProductLists, getProductsByList, getProductsByUser } from '@/services/productService';
import type { Product, ProductList, Category } from '@/lib/types';
import { categories as initialCategories } from '@/lib/data';
import { Header } from '@/components/shared/Header';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, List } from 'lucide-react';
import { WIDGET_MAP, AllWidgetType } from '@/components/dashboard/widgets/widget-map';

const AnalyticsDashboard: React.FC<{ products: Product[]; categories: Category[] }> = ({ products, categories }) => {
  const widgetDataProps = { products, categories };
  const allWidgets = (Object.keys(WIDGET_MAP) as AllWidgetType[]).filter(
    // Exclude interactive widgets from the analytics page
    (id) => id !== 'expiryAttention'
  );

  return (
    <div className="space-y-6">
      {allWidgets.map(widgetId => {
        const WidgetComponent = WIDGET_MAP[widgetId].component;
        return <WidgetComponent key={widgetId} {...widgetDataProps as any} />;
      })}
    </div>
  );
};

export default function AnalyticsPage() {
  const { currentUser } = useAuth();
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsByList, setProductsByList] = useState<Record<string, Product[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [categories] = useState<Category[]>(initialCategories);

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const lists = await getProductLists(currentUser.uid);
        setProductLists(lists);

        const allUserProducts = await getProductsByUser(currentUser.uid);
        setAllProducts(allUserProducts);
        
        const productsMap: Record<string, Product[]> = {};
        for (const list of lists) {
          const products = await getProductsByList(currentUser.uid, list.id);
          productsMap[list.id] = products;
        }
        setProductsByList(productsMap);

      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p>Por favor, faça login para ver as análises.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-primary" />
              Análise de Inventário
            </h1>
            <p className="text-muted-foreground">
              Insights sobre seus produtos e listas.
            </p>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              {productLists.map(list => (
                <TabsTrigger key={list.id} value={list.id}>{list.name}</TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
                <AnalyticsDashboard products={allProducts} categories={categories} />
            </TabsContent>

            {productLists.map(list => (
              <TabsContent key={list.id} value={list.id} className="mt-6">
                <AnalyticsDashboard products={productsByList[list.id] || []} categories={categories} />
              </TabsContent>
            ))}
          </Tabs>

           {productLists.length === 0 && allProducts.length === 0 && (
            <div className="text-center py-16">
              <List className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhum dado para analisar</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Comece adicionando produtos em suas listas para ver os gráficos.
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
