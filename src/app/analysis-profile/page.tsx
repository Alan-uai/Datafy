
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getProductLists, getProducts, type ProductList, type Product } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Package, Calendar, AlertTriangle, BarChart3, TrendingUp, 
  ShoppingCart, Clock, DollarSign, Award, Download, RefreshCw,
  Loader2, Brain, Target, Zap
} from 'lucide-react';
import { 
  isToday, 
  isPast, 
  isWithinInterval, 
  addDays, 
  startOfDay, 
  parseISO, 
  isValid, 
  format,
  differenceInDays,
  startOfMonth,
  subMonths,
  getMonth,
  getYear
} from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardStats {
  totalLists: number;
  totalProducts: number;
  expiredProducts: number;
  expiringInNext7Days: number;
  expiringInNext30Days: number;
  productsPerList: { listName: string; count: number }[];
  topBrands: { brand: string; count: number }[];
  wasteValue: number;
  efficiency: number;
  categoryStats: { [category: string]: number };
  temporalPatterns: {
    addedThisMonth: number;
    addedLastMonth: number;
    mostActiveDay: string;
  };
}

interface ExpiringProduct {
  id: string;
  produto: string;
  marca: string;
  validade: string;
  daysUntilExpiry: number;
  listName: string;
  unidade: string;
  estimatedValue?: number;
}

interface AIInsight {
  type: 'suggestion' | 'warning' | 'tip';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export default function AnalysisProfilePage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

  // Categorize products
  const categorizeProduct = (productName: string): string => {
    const name = productName.toLowerCase();
    if (name.includes('leite') || name.includes('queijo') || name.includes('iogurte') || name.includes('manteiga')) return 'Laticínios';
    if (name.includes('carne') || name.includes('frango') || name.includes('peixe') || name.includes('bacon')) return 'Carnes';
    if (name.includes('arroz') || name.includes('feijão') || name.includes('macarrão') || name.includes('pão')) return 'Grãos';
    if (name.includes('tomate') || name.includes('cebola') || name.includes('alface') || name.includes('cenoura')) return 'Vegetais';
    if (name.includes('banana') || name.includes('maçã') || name.includes('laranja') || name.includes('uva')) return 'Frutas';
    if (name.includes('água') || name.includes('suco') || name.includes('refrigerante') || name.includes('café')) return 'Bebidas';
    return 'Outros';
  };

  // Estimate product value (simplified)
  const estimateProductValue = (productName: string, quantity: string): number => {
    const name = productName.toLowerCase();
    const qty = parseFloat(quantity) || 1;
    
    // Basic price estimates in R$
    if (name.includes('carne')) return qty * 25;
    if (name.includes('queijo')) return qty * 15;
    if (name.includes('leite')) return qty * 4;
    if (name.includes('arroz')) return qty * 5;
    if (name.includes('feijão')) return qty * 8;
    return qty * 3; // Default estimate
  };

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
      const thisMonthStart = startOfMonth(new Date());
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      
      let expired = 0;
      let expiringIn7Days = 0;
      let expiringIn30Days = 0;
      let wasteValue = 0;
      let addedThisMonth = 0;
      let addedLastMonth = 0;
      const expiring: ExpiringProduct[] = [];
      const categoryStats: { [category: string]: number } = {};
      const dayStats: { [day: string]: number } = {};

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

      // Analyze products
      allProducts.forEach(product => {
        // Category analysis
        const category = categorizeProduct(product.produto);
        categoryStats[category] = (categoryStats[category] || 0) + 1;

        // Temporal analysis
        if (product.createdAt) {
          const createdDate = new Date(product.createdAt.seconds * 1000);
          if (createdDate >= thisMonthStart) {
            addedThisMonth++;
          } else if (createdDate >= lastMonthStart && createdDate < thisMonthStart) {
            addedLastMonth++;
          }
          
          const dayName = format(createdDate, 'EEEE');
          dayStats[dayName] = (dayStats[dayName] || 0) + 1;
        }

        // Expiry analysis
        if (product.validade && isValid(parseISO(product.validade))) {
          const productDate = startOfDay(parseISO(product.validade));
          const daysUntilExpiry = differenceInDays(productDate, today);
          const estimatedValue = estimateProductValue(product.produto, product.unidade);

          if (isPast(productDate) && !isToday(productDate)) {
            expired++;
            wasteValue += estimatedValue;
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
              unidade: product.unidade,
              estimatedValue
            });
          }
        }
      });

      // Calculate efficiency score (0-100)
      const totalValue = allProducts.reduce((sum, p) => sum + estimateProductValue(p.produto, p.unidade), 0);
      const efficiency = totalValue > 0 ? Math.max(0, Math.round(((totalValue - wasteValue) / totalValue) * 100)) : 100;

      // Find most active day
      const mostActiveDay = Object.entries(dayStats).reduce((a, b) => dayStats[a[0]] > dayStats[b[0]] ? a : b, ['Segunda', 0])[0];

      // Sort expiring products by urgency
      expiring.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

      setStats({
        totalLists: lists.length,
        totalProducts: allProducts.length,
        expiredProducts: expired,
        expiringInNext7Days: expiringIn7Days,
        expiringInNext30Days: expiringIn30Days,
        productsPerList,
        topBrands,
        wasteValue,
        efficiency,
        categoryStats,
        temporalPatterns: {
          addedThisMonth,
          addedLastMonth,
          mostActiveDay
        }
      });

      setExpiringProducts(expiring);
    } catch (error) {
      console.error("Error calculating stats:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar as estatísticas." });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid, toast]);

  const generateAIInsights = useCallback(async () => {
    if (!stats) return;
    
    setIsGeneratingInsights(true);
    try {
      // Simulate AI analysis (in a real app, this would call your AI service)
      const insights: AIInsight[] = [];

      if (stats.efficiency < 70) {
        insights.push({
          type: 'warning',
          title: 'Eficiência Baixa',
          description: `Sua eficiência está em ${stats.efficiency}%. Considere melhorar o controle de validades.`,
          priority: 'high'
        });
      }

      if (stats.wasteValue > 50) {
        insights.push({
          type: 'warning',
          title: 'Alto Desperdício',
          description: `R$ ${stats.wasteValue.toFixed(2)} em produtos vencidos. Implemente o sistema FIFO.`,
          priority: 'high'
        });
      }

      if (stats.temporalPatterns.addedThisMonth > stats.temporalPatterns.addedLastMonth * 1.5) {
        insights.push({
          type: 'tip',
          title: 'Aumento de Compras',
          description: 'Você tem comprado mais este mês. Monitore para evitar desperdício.',
          priority: 'medium'
        });
      }

      const topCategory = Object.entries(stats.categoryStats).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
      if (topCategory[1] > stats.totalProducts * 0.4) {
        insights.push({
          type: 'suggestion',
          title: 'Diversificação',
          description: `${topCategory[0]} representa ${Math.round((topCategory[1] / stats.totalProducts) * 100)}% dos produtos. Considere diversificar.`,
          priority: 'low'
        });
      }

      setAiInsights(insights);
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [stats]);

  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  useEffect(() => {
    if (stats) {
      generateAIInsights();
    }
  }, [stats, generateAIInsights]);

  const exportReport = () => {
    if (!stats) return;
    
    const report = {
      generatedAt: new Date().toISOString(),
      user: currentUser?.email,
      metrics: stats,
      expiringProducts: expiringProducts,
      insights: aiInsights
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Relatório exportado", description: "Download iniciado com sucesso!" });
  };

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

  const categoryChartData = {
    labels: Object.keys(stats?.categoryStats || {}),
    datasets: [{
      data: Object.values(stats?.categoryStats || {}),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
      ]
    }]
  };

  const temporalChartData = {
    labels: ['Mês Passado', 'Este Mês'],
    datasets: [{
      label: 'Produtos Adicionados',
      data: [stats?.temporalPatterns.addedLastMonth || 0, stats?.temporalPatterns.addedThisMonth || 0],
      backgroundColor: ['#36A2EB', '#4BC0C0']
    }]
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
            <p>Carregando analytics avançados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <User className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Analytics Avançado</h1>
            </div>
            <p className="text-muted-foreground">
              {currentUser?.email || 'Usuário'} • Dashboard completo de inteligência de estoque
            </p>
          </div>
          <div className="flex flex-col w-full sm:w-auto gap-2 mt-4 sm:mt-0 sm:ml-auto">
            <Button onClick={exportReport} variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button onClick={calculateStats} variant="outline" size="sm" className="w-full sm:w-auto">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
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
            <CardTitle className="text-sm font-medium">Produtos Vencidos</CardTitle>
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

      {/* Advanced Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Desperdiçado</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {stats?.wasteValue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Em produtos vencidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Eficiência</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.efficiency || 0) >= 80 ? 'text-green-600' : (stats?.efficiency || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats?.efficiency || 0}%
            </div>
            <p className="text-xs text-muted-foreground">Gestão de estoque</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adicionados Este Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.temporalPatterns?.addedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">vs {stats?.temporalPatterns?.addedLastMonth || 0} mês passado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dia Mais Ativo</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{stats?.temporalPatterns?.mostActiveDay || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Para adicionar produtos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Por Categoria
            </CardTitle>
            <CardDescription>Distribuição por tipo de produto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {Object.keys(stats?.categoryStats || {}).length > 0 ? (
                <Doughnut data={categoryChartData} options={{ maintainAspectRatio: false }} />
              ) : (
                <p className="text-muted-foreground">Sem dados de categoria</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Temporal Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Padrões Temporais
            </CardTitle>
            <CardDescription>Comparação mensal de atividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <Bar data={temporalChartData} options={{ maintainAspectRatio: false }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Insights de IA
            {isGeneratingInsights && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>Análises inteligentes baseadas nos seus dados</CardDescription>
        </CardHeader>
        <CardContent>
          {aiInsights.length > 0 ? (
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className={cn(
                  "p-4 rounded-lg border-l-4",
                  insight.priority === 'high' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                  'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                )}>
                  <div className="flex items-start gap-3">
                    {insight.type === 'warning' ? <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" /> :
                     insight.type === 'suggestion' ? <Zap className="h-5 w-5 text-blue-500 mt-0.5" /> :
                     <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />}
                    <div>
                      <h4 className="font-semibold">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Gerando insights inteligentes...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expiring Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Produtos Próximos ao Vencimento
          </CardTitle>
          <CardDescription>
            Todos os produtos que vencem nos próximos 30 dias com valores estimados
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
                    <TableHead className="text-center">Valor Est.</TableHead>
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
                      <TableCell className="text-center font-medium">
                        R$ {product.estimatedValue?.toFixed(2) || '0.00'}
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
