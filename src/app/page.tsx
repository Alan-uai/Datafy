
"use client";

import React, { useMemo, useState, useCallback, useRef } from "react";
import { debounce } from 'lodash';
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProductData } from "@/hooks/useProductData";
import { useProductTableControls } from "@/hooks/useProductTableControls";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { useDialogs } from "@/hooks/useDialogs";

import { categories as initialCategories } from "@/lib/data";
import { arrayMove } from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { WidgetManager } from "@/components/dashboard/WidgetManager";
import { ProductListTabs } from "@/components/dashboard/ProductListTabs";
import { ProductView } from "@/components/dashboard/ProductView";
import { MultiSelectBar } from "@/components/dashboard/MultiSelectBar";
import { AddProductDialog } from "@/components/dialogs/AddProductDialog";
import { ManageListDialog } from "@/components/dialogs/ManageListDialog";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Header } from "@/components/shared/Header";
import { Plus, Settings } from 'lucide-react';
import type { AllWidgetType } from "@/components/dashboard/widgets/widget-map";

const COLUMN_NAMES: Record<string, string> = {
  'id': 'ID',
  'produto': 'Produto',
  'marca': 'Marca',
  'qtde': 'Qtde',
  'validade': 'Validade',
  'preco': 'Preço',
  'categoria': 'Categoria',
  'status': 'Status',
};

function DashboardHeader({ isEditingWidgets, onWidgetEditToggle, columnVisibility, onColumnVisibilityChange }: {
  isEditingWidgets: boolean;
  onWidgetEditToggle: () => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (key: string, value: boolean) => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold border-none bg-transparent">Dashboard</h1>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              <span>Colunas</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.entries(COLUMN_NAMES).map(([key, name]) => (
              <DropdownMenuCheckboxItem
                key={key}
                className="capitalize"
                checked={columnVisibility[key] ?? true}
                onCheckedChange={(value) => onColumnVisibilityChange(key, !!value)}
                onSelect={(e) => e.preventDefault()}
              >
                {name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={onWidgetEditToggle}>
          <Settings className="h-4 w-4 mr-2" />
          <span>{isEditingWidgets ? "Finalizar Edição" : "Editar Widgets"}</span>
        </Button>
      </div>
    </header>
  );
}

export default function Dashboard() {
  const { userProfile, savePreferences, isLoading: isProfileLoading } = useUserProfile();
  
  const { 
    productLists, 
    products, 
    activeListId, 
    isLoading: isProductDataLoading,
    handleListChange,
    handleListCreate,
    handleListUpdate,
    handleListDelete,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleDeleteMultipleProducts,
    handleMoveMultipleProducts
  } = useProductData(userProfile, savePreferences);

  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    sortKey,
    sortDirection,
    handleSort,
    filteredProducts
  } = useProductTableControls(products);
  
  const productsForAI = useMemo(() => {
    if (!products) return [];
    return products.map(p => ({
      id: p.id,
      produto: p.name,
      marca: p.brand,
      unidade: p.quantity?.toString() ?? '1',
      validade: p.expiryDate instanceof Date ? p.expiryDate.toISOString() : new Date().toISOString(),
    }));
  }, [products]);


  const {
    selectedProductIds,
    isMultiSelectMode,
    handleProductClick,
    handleProductPointerDown,
    handleProductPointerUp,
    handleProductPointerMove,
    resetSelection,
  } = useMultiSelect(0.5);

  const {
    isAddProductDialogOpen,
    isManageListDialogOpen,
    editingProduct,
    editingList,
    openAddProductDialog,
    openManageListDialog,
    closeDialogs
  } = useDialogs();
  
  // Widget Preferences Handlers
  const handleWidgetEditing = () => {
    if (!userProfile) return;
    savePreferences({ isEditingWidgets: !userProfile.preferences.isEditingWidgets });
  }

  const handleColumnVisibilityChange = (key: string, value: boolean) => {
    if (!userProfile) return;
    const newVisibility = { ...userProfile.preferences.columnVisibility, [key]: value };
    savePreferences({ columnVisibility: newVisibility });
  };
  const handleWidgetDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (userProfile && over && active.id !== over.id) {
      const oldIndex = userProfile.preferences.activeWidgets.indexOf(active.id as AllWidgetType);
      const newIndex = userProfile.preferences.activeWidgets.indexOf(over.id as AllWidgetType);
      if (oldIndex !== -1 && newIndex !== -1) {
        savePreferences({ activeWidgets: arrayMove(userProfile.preferences.activeWidgets, oldIndex, newIndex) });
      }
    }
  };
  const addWidget = (widgetId: AllWidgetType) => {
    if (userProfile?.preferences.activeWidgets) {
        savePreferences({ activeWidgets: [...userProfile.preferences.activeWidgets, widgetId] });
    }
  };
  const removeWidget = (widgetId: AllWidgetType) => {
    if (userProfile?.preferences.activeWidgets) {
        savePreferences({ activeWidgets: userProfile.preferences.activeWidgets.filter(id => id !== widgetId) });
    }
  };

  if (isProfileLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  const { preferences, premium } = userProfile;
  
  const widgetDataProps = useMemo(() => ({
    products,
    categories: initialCategories,
    listProducts: productsForAI,
    preferences,
    savePreferences,
  }), [products, productsForAI, preferences, savePreferences]);


  return (
    <div className="relative min-h-screen flex flex-col bg-transparent">
        <Header />
        <main className="flex-1 flex flex-col">
            <div className="p-4 md:p-6">
                <DashboardHeader
                  isEditingWidgets={preferences.isEditingWidgets}
                  onWidgetEditToggle={handleWidgetEditing}
                  columnVisibility={preferences.columnVisibility}
                  onColumnVisibilityChange={handleColumnVisibilityChange}
                />
                <WidgetManager
                    isEditingWidgets={preferences.isEditingWidgets}
                    hasPremium={!!premium}
                    activeWidgets={preferences.activeWidgets}
                    widgetDataProps={widgetDataProps}
                    onAddWidget={addWidget}
                    onRemoveWidget={removeWidget}
                    onDragEnd={handleWidgetDragEnd}
                />
            </div>
            
            <div className="flex-1 flex flex-col border-t border-white/10 bg-card/20 backdrop-blur-sm rounded-t-xl">
                <ProductListTabs
                    productLists={productLists}
                    activeListId={activeListId}
                    onListChange={listId => {
                      handleListChange(listId);
                      resetSelection();
                    }}
                    onManageList={openManageListDialog}
                    onDeleteList={handleListDelete}
                    dashboardScale={preferences.dashboardScale}
                />
                
                <ProductView
                  activeListId={activeListId}
                  productLists={productLists}
                  products={filteredProducts}
                  categories={initialCategories}
                  searchQuery={searchQuery}
                  onSearchChange={e => setSearchQuery(e.target.value)}
                  activeFilter={activeFilter}
                  onFilterChange={value => setActiveFilter(value as any)}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  onEditProduct={product => openAddProductDialog(product)}
                  onDeleteProduct={handleDeleteProduct}
                  selectedProductIds={selectedProductIds}
                  onProductClick={handleProductClick}
                  onProductPointerDown={handleProductPointerDown}
                  onProductPointerUp={handleProductPointerUp}
                  onProductPointerMove={handleProductPointerMove}
                  preferences={preferences}
                  onOpenManageListDialog={() => openManageListDialog(null)}
                  isLoading={isProductDataLoading}
                />
            </div>

            <AddProductDialog
              open={isAddProductDialogOpen}
              onOpenChange={(isOpen) => { if (!isOpen) closeDialogs() }}
              onSave={async (data) => {
                  if (editingProduct) await handleUpdateProduct(editingProduct.id, data);
                  else await handleAddProduct(data);
                  closeDialogs();
              }}
              editingProduct={editingProduct}
              categories={initialCategories}
            >
              <Button 
                  className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50 disabled:bg-muted disabled:cursor-not-allowed"
                  onClick={() => openAddProductDialog(null)}
                  disabled={productLists.length === 0}
                  title={productLists.length === 0 ? "Crie uma lista primeiro" : "Adicionar produto"}
              >
                <Plus className="h-8 w-8" />
              </Button>
            </AddProductDialog>

            <ManageListDialog
              open={isManageListDialogOpen}
              onOpenChange={(isOpen) => { if (!isOpen) closeDialogs() }}
              onSave={async (name, icon) => {
                  if (editingList) await handleListUpdate(editingList.id, name, icon);
                  else await handleListCreate(name, icon);
                  closeDialogs();
              }}
              editingList={editingList}
            />
            
            {isMultiSelectMode && (
              <MultiSelectBar
                selectedCount={selectedProductIds.size}
                productLists={productLists}
                activeListId={activeListId!}
                onMove={async (targetListId) => {
                  await handleMoveMultipleProducts(Array.from(selectedProductIds), targetListId);
                  resetSelection();
                }}
                onDelete={async () => {
                  await handleDeleteMultipleProducts(Array.from(selectedProductIds));
                  resetSelection();
                }}
                onReset={resetSelection}
              />
            )}
        </main>
    </div>
  );
}
