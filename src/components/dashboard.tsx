"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddProductDialog } from "@/components/add-product-dialog";
import { products as initialProducts, categories as initialCategories } from "@/lib/data";
import type { Product, Category } from "@/lib/types";
import { format } from "date-fns";
import { Plus, Settings, Trash2, Edit, Search, Filter, ArrowUp, Grid3x3 } from "lucide-react";
import { ExpiryAttentionReportCard } from './dashboard/ExpiryAttentionReportCard';

export function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Convert Date objects to string for AI analysis
  const productsForAI = useMemo(() => {
    return products.map(p => ({
      ...p,
      validade: p.expiryDate.toISOString(),
      produto: p.name,
    }));
  }, [products]);
  
  useEffect(() => {
    setIsClient(true)
    // Simulating one product for the table as in the image
    const sampleProduct: Product = {
        id: '101',
        name: 'Arroz',
        brand: 'Pileco',
        quantity: 78,
        expiryDate: new Date('2025-07-27T00:00:00'),
        price: 24.90,
        category: 'pesado', // This category is not in the initial list, but is in the image
    };
    setProducts([sampleProduct]);
  }, []);

  const handleAddProduct = (newProduct: Omit<Product, "id">) => {
    setProducts((prev) => [
      ...prev,
      { ...newProduct, id: new Date().getTime().toString() },
    ]);
  };
  
  if (!isClient) {
      return (
        <div className="flex items-center justify-center h-full">
            <p>Carregando...</p>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-background relative">
        <div className="p-4 md:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Grid3x3 className="h-7 w-7"/>
                    <h1 className="text-2xl font-bold">Dashboard Personalizado</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline"><Settings className="mr-2 h-4 w-4" />Colunas</Button>
                    <Button variant="outline"><Settings className="mr-2 h-4 w-4" />Widgets</Button>
                </div>
            </header>

            <ExpiryAttentionReportCard listProducts={productsForAI} />

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                         {categories.slice(0, 2).map((cat, index) => {
                            const Icon = cat.icon;
                            return (
                                <Button key={cat.id} variant={index === 0 ? "secondary" : "ghost"} className={`gap-2 ${index === 0 ? 'bg-primary/20 text-primary' : ''}`}>
                                    <Icon className="h-4 w-4"/>
                                    {cat.name}
                                    <Edit className="h-3 w-3" />
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )
                        })}
                    </div>
                    <Button variant="outline"><Plus className="mr-2 h-4 w-4"/>Lista</Button>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Buscar produtos..." className="pl-10"/>
                    </div>
                    <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filtro</Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><div className="flex items-center gap-1">Produto <ArrowUp className="h-4 w-4"/></div></TableHead>
                            <TableHead>Marca</TableHead>
                            <TableHead>Qtde</TableHead>
                            <TableHead>Validade</TableHead>
                            <TableHead>Preço (R$)</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                        <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.brand}</TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{format(product.expiryDate, 'dd/MM/yyyy')}</TableCell>
                            <TableCell>R$ {product.price.toFixed(2).replace('.', ',')}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell><Badge className="bg-green-500/80 hover:bg-green-500/90 text-white">OK</Badge></TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {products.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    Nenhum produto encontrado.
                </div>
            )}
        </div>
        <AddProductDialog categories={categories} onAddProduct={handleAddProduct} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
                <Plus className="h-8 w-8" />
            </Button>
        </AddProductDialog>
    </div>
  );
}
