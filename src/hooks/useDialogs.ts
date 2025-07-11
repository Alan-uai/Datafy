
"use client";

import { useState } from 'react';
import type { Product, ProductList } from '@/lib/types';

export function useDialogs() {
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isManageListDialogOpen, setIsManageListDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingList, setEditingList] = useState<ProductList | null>(null);

  const openAddProductDialog = (product: Product | null) => {
    setEditingProduct(product);
    setIsAddProductDialogOpen(true);
  };

  const openManageListDialog = (list: ProductList | null) => {
    setEditingList(list);
    setIsManageListDialogOpen(true);
  };

  const closeDialogs = () => {
    setIsAddProductDialogOpen(false);
    setIsManageListDialogOpen(false);
    setEditingProduct(null);
    setEditingList(null);
  };

  return {
    isAddProductDialogOpen,
    isManageListDialogOpen,
    editingProduct,
    editingList,
    openAddProductDialog,
    openManageListDialog,
    closeDialogs,
  };
}
