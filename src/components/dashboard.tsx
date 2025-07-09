"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AddProductDialog } from "./add-product-dialog";
import { products as initialProducts, categories as initialCategories } from "@/lib/data";
import type { Product, Category } from "@/lib/types";
import { format, differenceInDays, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CalendarClock, Package, CircleDollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<Category[]>(initialCategories);
  const [filter, setFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    setProducts(initialProducts);
  }, [])

  const handleAddProduct = (newProduct: Omit<Product, "id">) => {
    setProducts((prev) => [
      ...prev,
      { ...newProduct, id: new Date().getTime().toString() },
    ]);
  };
  
  const filteredProducts = useMemo(() => {
    if (filter === "all") return products;
    return products.filter((p) => p.category === filter);
  }, [products, filter]);

  const summary = useMemo(() => {
    const expiringSoon = products.filter(p => {
        const daysLeft = differenceInDays(p.expiryDate, new Date());
        return !isPast(p.expiryDate) && daysLeft <= 7;
    }).length;
    const totalStock = products.reduce((acc, p) => acc + p.quantity, 0);
    const totalValue = products.reduce((acc, p) => acc + p.price * p.quantity, 0);
    return { expiringSoon, totalStock, totalValue };
  }, [products]);

  const getExpiryBadge = (date: Date) => {
    const daysLeft = differenceInDays(date, new Date());
    if (isPast(date)) {
        return <Badge variant="destructive" className="flex items-center gap-1.5 whitespace-nowrap"><AlertCircle className="h-3 w-3" /> Vencido</Badge>;
    }
    if (daysLeft <= 3) {
        return <Badge variant="destructive" className="flex items-center gap-1.5 whitespace-nowrap"><AlertCircle className="h-3 w-3" /> {daysLeft}d restantes</Badge>;
    }
    if (daysLeft <= 7) {
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 flex items-center gap-1.5 whitespace-nowrap"><Clock className="h-3 w-3" /> {daysLeft}d restantes</Badge>;
    }
    return <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30 flex items-center gap-1.5 whitespace-nowrap"><CheckCircle className="h-3 w-3" /> {daysLeft}d restantes</Badge>;
  }

  if (!isClient) {
      return (
        <div className="flex items-center justify-center h-full">
            <p>Carregando...</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="flex-shrink-0 flex items-center justify-between p-4 md:p-6 border-b">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Resumo do seu inventário.</p>
        </div>
        <AddProductDialog categories={categories} onAddProduct={handleAddProduct} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Item
          </Button>
        </AddProductDialog>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens a Vencer</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Vencem nos próximos 7 dias</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalStock}</div>
              <p className="text-xs text-muted-foreground">Unidades de todos os produtos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
              <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <p className="text-xs text-muted-foreground">Valor monetário total dos itens</p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle>Produtos</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">Gerencie seus produtos aqui.</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>Todos</Button>
                        {categories.map(cat => {
                            const Icon = cat.icon;
                            return (
                                <Button key={cat.id} variant={filter === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setFilter(cat.id)} className="gap-2">
                                    <Icon className="h-4 w-4"/>
                                    {cat.name}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead className="text-center">Qtd.</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Validade</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-muted-foreground">{product.brand}</TableCell>
                            <TableCell className="text-center">{product.quantity}</TableCell>
                            <TableCell>{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                            <TableCell>{getExpiryBadge(product.expiryDate)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
                {filteredProducts.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        Nenhum produto encontrado para esta categoria.
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
