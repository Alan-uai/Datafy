
"use client";

import React, { useState } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Product, Category } from "@/lib/types";
import { format, isToday, isPast, addDays, isSameDay, startOfDay } from "date-fns";
import { ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";
import { cn } from '@/lib/utils';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  columnVisibility: Record<string, boolean>;
  sortKey: keyof Product | '';
  sortDirection: 'asc' | 'desc';
  onSort: (key: keyof Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  selectedProductIds: Set<string>;
  onProductClick: (product: Product, event: React.MouseEvent<HTMLElement>) => boolean; // Updated return type
  onProductPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onProductPointerUp: () => void;
  onProductPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  isMultiSelectMode: boolean; // Added prop
  dashboardScale: 'normal' | 'compact';
}

const getRowClass = (product: Product): string => {
  const today = startOfDay(new Date());
  const expiry = startOfDay(product.expiryDate);

  if (isPast(expiry) && !isSameDay(expiry, today)) return 'bg-red-500/20';
  if (isSameDay(expiry, today)) return 'bg-red-500/20';
  if (isSameDay(expiry, addDays(today, 1)) || isSameDay(expiry, addDays(today, 2))) return 'bg-orange-500/20';
  return '';
};

export function ProductTable({
  products,
  categories,
  columnVisibility,
  sortKey,
  sortDirection,
  onSort,
  onEditProduct,
  onDeleteProduct,
  selectedProductIds,
  onProductClick,
  onProductPointerDown,
  onProductPointerUp,
  onProductPointerMove,
  isMultiSelectMode, // Destructure new prop
  dashboardScale,
}: ProductTableProps) {

  const [isPopoverOpen, setIsPopoverOpen] = useState<string | null>(null); // State to control which popover is open

  const renderSortIcon = (key: keyof Product) => {
    if (sortKey !== key) return null;
    const iconClass = dashboardScale === 'compact' ? 'h-3 w-3 ml-1' : 'h-4 w-4 ml-2';
    return sortDirection === 'asc' ? <ArrowUp className={iconClass} /> : <ArrowDown className={iconClass} />;
  };
  
  const productsWithRowIndex = React.useMemo(() => {
    return products.map((product, index) => ({
      ...product,
      rowIndex: index + 1,
    }));
  }, [products]);

  return (
    <div className={cn("flex-1", dashboardScale === 'compact' ? 'overflow-hidden' : 'overflow-x-auto')}>
      <Table className={cn(dashboardScale === 'compact' ? 'text-sm table-fixed w-full' : '')}>
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            {columnVisibility['id'] && <TableHead className="text-center">ID</TableHead>}
            <TableHead className="text-center"><Button variant="ghost" onClick={() => onSort('name')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Produto {renderSortIcon('name')}</Button></TableHead>
            {columnVisibility['marca'] && <TableHead className="text-center"><Button variant="ghost" onClick={() => onSort('brand')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Marca {renderSortIcon('brand')}</Button></TableHead>}
            {columnVisibility['qtde'] && <TableHead className="text-center"><Button variant="ghost" onClick={() => onSort('quantity')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Qtde {renderSortIcon('quantity')}</Button></TableHead>}
            {columnVisibility['validade'] && <TableHead className="text-center"><Button variant="ghost" onClick={() => onSort('expiryDate')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Validade {renderSortIcon('expiryDate')}</Button></TableHead>}
            {columnVisibility['preco'] && <TableHead className="text-center"><Button variant="ghost" onClick={() => onSort('price')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Preço {renderSortIcon('price')}</Button></TableHead>}
            {columnVisibility['categoria'] && <TableHead className="text-center"><Button variant="ghost" onClick={() => onSort('category')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Categoria {renderSortIcon('category')}</Button></TableHead>}
            {columnVisibility['status'] && <TableHead className="text-center">Status</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {productsWithRowIndex.map((product) => (
            <Popover 
              key={product.id}
              open={isPopoverOpen === product.id && !isMultiSelectMode} // Control open state
              onOpenChange={(open) => {
                if (!isMultiSelectMode) {
                  setIsPopoverOpen(open ? product.id : null);
                }
              }}
            >
              <PopoverTrigger asChild>
                <TableRow
                  data-state={selectedProductIds.has(product.id) ? 'selected' : 'unselected'}
                  data-product-id={product.id}
                  className={cn(
                    'cursor-pointer',
                    dashboardScale === 'compact' ? 'h-10' : '',
                    getRowClass(product),
                    'data-[state=selected]:bg-primary/20'
                  )}
                  onPointerDown={onProductPointerDown}
                  onPointerUp={onProductPointerUp}
                  onPointerMove={onProductPointerMove}
                  onClick={(e) => {
                    const wasHandledByMultiSelect = onProductClick(product, e);
                    if (!wasHandledByMultiSelect && !isMultiSelectMode) {
                      setIsPopoverOpen(product.id);
                    } else if (isMultiSelectMode) {
                      setIsPopoverOpen(null); // Close popover if multi-select mode is active
                    }
                  }}
                >
                  {columnVisibility['id'] && <TableCell className={cn('font-mono text-xs text-muted-foreground text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{product.rowIndex}</TableCell>}
                  <TableCell className={cn('font-medium truncate text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>
                    <div className="flex items-center justify-center h-full w-full"> {/* Ensure it takes full cell space */}
                      {product.name}
                    </div>
                  </TableCell>
                  {columnVisibility['marca'] && <TableCell className={cn('truncate text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{product.brand}</TableCell>}
                  {columnVisibility['qtde'] && <TableCell className={cn('text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{product.quantity}</TableCell>}
                  {columnVisibility['validade'] && <TableCell className={cn('text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{format(product.expiryDate, 'dd/MM/yy')}</TableCell>}
                  {columnVisibility['preco'] && <TableCell className={cn('text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{product.price.toFixed(2).replace('.', ',')}</TableCell>}
                  {columnVisibility['categoria'] && <TableCell className={cn('truncate text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{categories.find(c => c.id === product.category)?.name || product.category}</TableCell>}
                  {columnVisibility['status'] && <TableCell className={cn('text-center', dashboardScale === 'compact' ? 'p-2' : 'p-4')}><Badge className="bg-green-500/80 hover:bg-green-500/90 text-white">OK</Badge></TableCell>}
                </TableRow>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => {
                    onEditProduct(product);
                    setIsPopoverOpen(null); // Close popover on edit
                  }}>
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir "{product.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação é permanente.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                          onDeleteProduct(product.id);
                          setIsPopoverOpen(null); // Close popover on delete
                        }}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </TableBody>
      </Table>
      {products.length === 0 && (
        <div className="text-center p-8 text-muted-foreground flex-1 flex items-center justify-center">
          Nenhum produto encontrado.
        </div>
      )}
    </div>
  );
}
