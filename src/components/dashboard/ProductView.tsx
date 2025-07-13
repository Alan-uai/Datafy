
"use client";

import React from 'react';
import { ProductTableControls } from './ProductTableControls';
import { ProductTable } from './ProductTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import type { Product, Category, ProductList, UserPreferences } from '@/lib/types';
import type { FilterType } from '@/hooks/useProductTableControls';
import { LoadingSpinner } from '../shared/LoadingSpinner';

interface ProductViewProps {
  activeListId: string | null;
  productLists: ProductList[];
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFilter: FilterType;
  onFilterChange: (value: FilterType) => void;
  sortKey: keyof Product | '';
  sortDirection: 'asc' | 'desc';
  onSort: (key: keyof Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  selectedProductIds: Set<string>;
  onProductClick: (product: Product, event: React.MouseEvent<HTMLElement>) => void;
  onProductPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onProductPointerUp: () => void;
  onProductPointerMove: (event: React.PointerEvent<HTMLElement>) => void;
  preferences: UserPreferences;
  onOpenManageListDialog: () => void;
  isLoading: boolean;
}

export const ProductView: React.FC<ProductViewProps> = ({
  activeListId,
  productLists,
  products,
  categories,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
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
  preferences,
  onOpenManageListDialog,
  isLoading
}) => {
  if (isLoading) {
    return <LoadingSpinner text="CARREGANDO PRODUTOS..." />
  }

  if (activeListId) {
    return (
      <div className="flex-1 flex flex-col">
        <ProductTableControls
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeFilter={activeFilter}
          onFilterChange={(value) => onFilterChange(value as FilterType)}
          dashboardScale={preferences.dashboardScale}
        />
        <ProductTable
          products={products}
          categories={categories}
          columnVisibility={preferences.columnVisibility}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
          onEditProduct={onEditProduct}
          onDeleteProduct={onDeleteProduct}
          selectedProductIds={selectedProductIds}
          onProductClick={onProductClick}
          onProductPointerDown={onProductPointerDown}
          onProductPointerUp={onProductPointerUp}
          onProductPointerMove={onProductPointerMove}
          dashboardScale={preferences.dashboardScale}
        />
      </div>
    );
  }

  if (productLists.length > 0) {
    return (
      <EmptyState
        title="Selecione uma lista"
        description="Escolha uma lista na barra acima para ver seus produtos."
        className="flex-1"
      />
    );
  }

  return (
    <EmptyState
        title="Crie sua primeira lista"
        description="Comece a organizar seus produtos criando uma lista."
        className="flex-1"
    >
        <Button className="mt-4" onClick={onOpenManageListDialog}>Criar Lista</Button>
    </EmptyState>
  );
};
