
"use client";

import React, { useMemo } from "react";
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
import { DashboardModals } from "@/components/dashboard/DashboardModals";
import { MultiSelectBar } from "@/components/dashboard/MultiSelectBar";
import type { AllWidgetType } from "@/components/dashboard/widgets/widget-map";
import { Header } from "@/components/shared/Header";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

function DashboardComponent() {
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
      return products.map(p => ({ ...p, validade: p.expiryDate.toISOString(), produto: p.name }))
  }, [products]);


  const {
    selectedProductIds,
    isMultiSelectMode,
    handleProductClick,
    handleProductPointerDown,
    handleProductPointerUp,
    resetSelection,
  } = useMultiSelect();

  const {
    isAddProductDialogOpen,
    isManageListDialogOpen,
    editingProduct,
    editingList,
    openAddProductDialog,
    openManageListDialog,
    closeDialogs
  } = useDialogs();
  
  const isLoading = isProfileLoading || isProductDataLoading;

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

  if (isLoading || !userProfile) {
    return <LoadingSpinner />;
  }
  
  const { preferences, premium } = userProfile;
  const widgetDataProps = { products, categories: initialCategories, preferences, savePreferences };

  return (
    <div className="flex flex-col h-full relative">
        <div className="p-4 md:p-6">
            <WidgetManager
                isEditingWidgets={preferences.isEditingWidgets}
                hasPremium={!!premium}
                activeWidgets={preferences.activeWidgets}
                widgetDataProps={{ ...widgetDataProps, listProducts: productsForAI }}
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
              preferences={preferences}
              onOpenManageListDialog={() => openManageListDialog(null)}
            />
        </div>

        <DashboardModals
          isAddProductDialogOpen={isAddProductDialogOpen}
          isManageListDialogOpen={isManageListDialogOpen}
          editingProduct={editingProduct}
          editingList={editingList}
          categories={initialCategories}
          onAddOrUpdateProduct={async (data) => {
            if (editingProduct) await handleUpdateProduct(editingProduct.id, data);
            else await handleAddProduct(data);
            closeDialogs();
          }}
          onManageList={async (name, icon) => {
            if (editingList) await handleListUpdate(editingList.id, name, icon);
            else await handleListCreate(name, icon);
            closeDialogs();
          }}
          onOpenChange={(type, open) => {
            if (!open) closeDialogs();
          }}
          onOpenAddProductDialog={() => openAddProductDialog(null)}
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
    </div>
  );
}


export default function Dashboard() {
    return (
        <ProtectedRoute>
            <div className="relative min-h-screen flex flex-col bg-transparent">
                <Header />
                <main className="flex-1">
                    <DashboardComponent />
                </main>
            </div>
        </ProtectedRoute>
    )
}