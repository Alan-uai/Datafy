"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getProductLists, getProducts, type ProductList, type Product } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import { User, Package, Calendar, AlertTriangle, BarChart3, TrendingUp, ShoppingCart, Clock } from 'lucide-react';
import { 
  isToday, 
  isPast, 
  isWithinInterval, 
  addDays, 
  startOfDay, 
  parseISO, 
  isValid, 
  format,
  differenceInDays 
} from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalLists: number;
  totalProducts: number;
  expiredProducts: number;
  expiringInNext7Days: number;
  expiringInNext30Days: number;
  productsPerList: { listName: string; count: number }[];
  topBrands: { brand: string; count: number }[];
}

interface ExpiringProduct {
  id: string;
  produto: string;
  marca: string;
  validade: string;
  daysUntilExpiry: number;
  listName: string;
  unidade: string;
}

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calculateStats = useCallback(async () => {
    if (!currentUser?.uid) return;

    setIsLoading(true);
    try {
      const lists = await getProductLists(currentUser.uid);
      let allProducts: (Product & { listName: string })[] = [];

      // Fetch all products from all lists
      for (const list of lists) {
        const products = await getProducts(currentUser.uid, list.id);
        const productsWithListName = products.map(p => ({ ...p, listName: list.name }));
        allProducts = [...allProducts, ...productsWithListName];
      }

      const today = startOfDay(new Date());
      let expired = 0;
      let expiringIn7Days = 0;
      let expiringIn30Days = 0;
      const expiring: ExpiringProduct[] = [];

      // Count products by list
      const productsPerList = lists.map(list => ({
        listName: list.name,
        count: allProducts.filter(p => p.listName === list.name).length
      }));

      // Count products by brand
      const brandCounts: { [key: string]: number } = {};
      allProducts.forEach(product => {
        const brand = product.marca || 'Sem marca';
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      });
      const topBrands = Object.entries(brandCounts)
        .map(([brand, count]) => ({ brand, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Analyze expiry dates
      allProducts.forEach(product => {
        if (product.validade && isValid(parseISO(product.validade))) {
          const productDate = startOfDay(parseISO(product.validade));
          const daysUntilExpiry = differenceInDays(productDate, today);

          if (isPast(productDate) && !isToday(productDate)) {
            expired++;
          } else if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            if (daysUntilExpiry <= 7) {
              expiringIn7Days++;
            }
            expiringIn30Days++;

            expiring.push({
              id: product.id,
              produto: product.produto,
              marca: product.marca || 'Sem marca',
              validade: product.validade,
              daysUntilExpiry,
              listName: product.listName,
              unidade: product.unidade
            });
          }
        }
      });

      // Sort expiring products by urgency
      expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      setStats({
        totalLists: lists.length,
        totalProducts: allProducts.length,
        expiredProducts: expired,
        expiringInNext7Days: expiringIn7Days,
        expiringInNext30Days: expiringIn30Days,
        productsPerList,
        topBrands
      });

      setExpiringProducts(expiring);
    } catch (error) {
      console.error("Error calculating stats:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as estatísticas." });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid, toast]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  const getExpiryRowStyle = (daysUntilExpiry: number) => {
    if (daysUntilExpiry < 0) return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    if (daysUntilExpiry === 0) return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
    if (daysUntilExpiry <= 3) return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    if (daysUntilExpiry <= 7) return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
    return "";
  };

  const formatDaysText = (days: number) => {
    if (days < 0) return `Vencido há ${Math.abs(days)} dia(s)`;
    if (days === 0) return "Vence hoje";
    if (days === 1) return "Vence amanhã";
    return `Vence em ${days} dia(s)`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <BarChart3 className="mx-auto h-8 w-8 animate-pulse mb-4" />
            <p>Carregando estatísticas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Perfil do Usuário</h1>
        </div>
        <p className="text-muted-foreground">
          {currentUser?.email || 'Usuário'} • Visão geral das suas listas e produtos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Listas</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLists || 0}</div>
            <p className="text-xs text-muted-foreground">Listas criadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Produtos cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.expiredProducts || 0}</div>
            <p className="text-xs text-muted-foreground">Produtos vencidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencem em 7 dias</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.expiringInNext7Days || 0}</div>
            <p className="text-xs text-muted-foreground">Produtos próximos ao vencimento</p>
          </CardContent>
        </Card>
      </div>

      {/* Second row - advanced metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
</Card>
      </div>

      {/* Second row - advanced metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
</Card>
      </div>

      {/* Second row - advanced metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
</Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Products per List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Produtos por Lista
            </CardTitle>
            <CardDescription>Distribuição de produtos entre suas listas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.productsPerList.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{item.listName}</span>
                    <span>{item.count} produtos</span>
                  </div>
                  <Progress 
                    value={(item.count / (stats.totalProducts || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Brands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Marcas Mais Cadastradas
            </CardTitle>
            <CardDescription>Top 5 marcas nos seus produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topBrands.map((brand, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{brand.brand}</span>
                    <span>{brand.count} produtos</span>
                  </div>
                  <Progress 
                    value={(brand.count / (stats.totalProducts || 1)) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Produtos Próximos ao Vencimento
          </CardTitle>
          <CardDescription>
            Todos os produtos que vencem nos próximos 30 dias (visualização apenas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expiringProducts.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Produto</TableHead>
                    <TableHead className="text-center">Marca</TableHead>
                    <TableHead className="text-center">Quantidade</TableHead>
                    <TableHead className="text-center">Lista</TableHead>
                    <TableHead className="text-center">Validade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringProducts.map((product, index) => (
                    <TableRow key={index} className={getExpiryRowStyle(product.daysUntilExpiry)}>
                      <TableCell className="text-center font-medium">{product.produto}</TableCell>
                      <TableCell className="text-center">{product.marca}</TableCell>
                      <TableCell className="text-center">{product.unidade}</TableCell>
                      <TableCell className="text-center">{product.listName}</TableCell>
                      <TableCell className="text-center">
                        {format(parseISO(product.validade), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {formatDaysText(product.daysUntilExpiry)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum produto vencendo nos próximos 30 dias!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}