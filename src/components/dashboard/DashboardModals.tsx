
"use client";

import React, { useRef, useCallback } from 'react';
import { debounce } from 'lodash';
import { suggestListIcon } from "@/ai/flows/suggest-list-icon-flow";
import { useToast } from "@/hooks/use-toast";
import { AddProductDialog } from "@/components/dialogs/AddProductDialog";
import { ManageListDialog } from "@/components/dialogs/ManageListDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Product, ProductList, Category } from "@/lib/types";

interface DashboardModalsProps {
  isAddProductDialogOpen: boolean;
  isManageListDialogOpen: boolean;
  editingProduct: Product | null;
  editingList: ProductList | null;
  categories: Category[];
  onAddOrUpdateProduct: (data: Omit<Product, 'id' | 'listId'>) => void;
  onManageList: (name: string, icon: string) => void;
  onOpenChange: (type: 'addProduct' | 'manageList', open: boolean) => void;
  onOpenAddProductDialog: () => void;
  hasLists: boolean;
}

export function DashboardModals({
  isAddProductDialogOpen,
  isManageListDialogOpen,
  editingProduct,
  editingList,
  categories,
  onAddOrUpdateProduct,
  onManageList,
  onOpenChange,
  onOpenAddProductDialog,
  hasLists,
}: DashboardModalsProps) {
  const { toast } = useToast();
  const newListNameRef = useRef<HTMLInputElement>(null);
  const [newListIcon, setNewListIcon] = React.useState('List');
  const [isSuggestingIcon, setIsSuggestingIcon] = React.useState(false);

  const debouncedIconSuggestion = useCallback(debounce(async (name: string) => {
    if (name.length < 3) return;
    setIsSuggestingIcon(true);
    try {
      const { iconName } = await suggestListIcon({ listName: name });
      setNewListIcon(iconName || 'List');
    } catch (error) {
        console.error("Failed to suggest icon", error);
        toast({ variant: "destructive", title: "Erro na Sugestão de Ícone" });
    } finally {
      setIsSuggestingIcon(false);
    }
  }, 800), [toast]);

  const handleNewListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedIconSuggestion(event.target.value);
  };
  
  const handleRegenerateIcon = async () => {
    const listName = newListNameRef.current?.value;
    if (!listName) return;
    debouncedIconSuggestion(listName);
  };

  const handleSaveList = () => {
    const listName = newListNameRef.current?.value;
    if (!listName || !listName.trim()) {
      toast({ variant: "destructive", title: "Nome inválido" });
      return;
    }
    onManageList(listName.trim(), newListIcon);
  };
  
  // Effect to reset icon when dialog opens for a new list
  React.useEffect(() => {
    if (isManageListDialogOpen) {
      setNewListIcon(editingList?.icon || 'List');
      if (newListNameRef.current) {
        newListNameRef.current.value = editingList?.name || '';
      }
    }
  }, [isManageListDialogOpen, editingList]);

  return (
    <>
      <AddProductDialog
        open={isAddProductDialogOpen}
        onOpenChange={(isOpen) => onOpenChange('addProduct', isOpen)}
        onSave={onAddOrUpdateProduct}
        editingProduct={editingProduct}
        categories={categories}
      >
        <Button 
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-50 disabled:bg-muted disabled:cursor-not-allowed"
            onClick={onOpenAddProductDialog}
            disabled={!hasLists}
            title={!hasLists ? "Crie uma lista primeiro" : "Adicionar produto"}
        >
          <Plus className="h-8 w-8" />
        </Button>
      </AddProductDialog>

      <ManageListDialog
        open={isManageListDialogOpen}
        onOpenChange={(isOpen) => onOpenChange('manageList', isOpen)}
        onSave={handleSaveList}
        editingList={editingList}
        newListNameRef={newListNameRef}
        onNewListNameChange={handleNewListNameChange}
        newListIcon={newListIcon}
        isSuggestingIcon={isSuggestingIcon}
        onRegenerateIcon={handleRegenerateIcon}
        onCancel={() => onOpenChange('manageList', false)}
      />
    </>
  );
}
