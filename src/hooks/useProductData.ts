
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  getProductLists,
  getProductsByList,
  addProductList,
  updateProductList,
  deleteProductList,
  addProduct,
  updateProduct,
  deleteProduct,
  deleteMultipleProducts,
  moveMultipleProducts,
} from '@/services/productService';
import type { Product, ProductList, UserProfile } from '@/lib/types';
import type { User } from 'firebase/auth';

export function useProductData(
  userProfile: UserProfile | null,
  savePreferences: (prefs: Partial<UserProfile['preferences']>) => void
) {
  const { toast } = useToast();
  const currentUser = userProfile ? { uid: userProfile.uid } as User : null;

  const [products, setProducts] = useState<Product[]>([]);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadInitialData = useCallback(async () => {
    if (!currentUser?.uid || !userProfile) return;
    setIsLoading(true);
    try {
      const lists = await getProductLists(currentUser.uid);
      setProductLists(lists);
      
      if (lists.length > 0) {
        const lastListId = userProfile.preferences?.lastActiveListId;
        const listToLoad = lists.find(l => l.id === lastListId) || lists[0];
        setActiveListId(listToLoad.id);
        const fetchedProducts = await getProductsByList(currentUser.uid, listToLoad.id);
        setProducts(fetchedProducts);
      } else {
        setProducts([]);
        setActiveListId(null);
      }
    } catch (error) {
      console.error("Failed to load initial data", error);
      toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível buscar suas listas e produtos."});
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.uid, userProfile, toast]);

  useEffect(() => {
    if (userProfile) {
      loadInitialData();
    }
  }, [userProfile, loadInitialData]);

  // List Handlers
  const handleListChange = async (listId: string) => {
    if (!currentUser || listId === activeListId) return;
    setActiveListId(listId);
    setIsLoading(true);
    try {
      const fetchedProducts = await getProductsByList(currentUser.uid, listId);
      setProducts(fetchedProducts);
      savePreferences({ lastActiveListId: listId });
    } catch (error) {
      console.error(`Failed to fetch products for list ${listId}`, error);
      toast({ variant: "destructive", title: "Erro ao carregar lista" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleListCreate = async (name: string, icon: string) => {
    if (!currentUser) return;
    try {
      const newListId = await addProductList(currentUser.uid, name, icon);
      const newList: ProductList = { id: newListId, name, icon, userId: currentUser.uid, createdAt: new Date() };
      setProductLists(prev => [...prev, newList]);
      setActiveListId(newListId);
      setProducts([]);
      toast({ title: "Lista criada!" });
    } catch (error) {
      console.error("Failed to create list", error);
      toast({ variant: "destructive", title: "Erro ao criar lista." });
    }
  };

  const handleListUpdate = async (listId: string, name: string, icon: string) => {
    try {
      const updatedData = { name, icon };
      await updateProductList(listId, updatedData);
      setProductLists(prev => prev.map(l => l.id === listId ? { ...l, ...updatedData } : l));
      toast({ title: "Lista atualizada!" });
    } catch (error) {
      console.error("Failed to update list", error);
      toast({ variant: "destructive", title: "Erro ao atualizar lista." });
    }
  };

  const handleListDelete = async (listId: string) => {
    if (!currentUser) return;
    try {
      await deleteProductList(currentUser, listId);
      const newLists = productLists.filter(l => l.id !== listId);
      setProductLists(newLists);
      if (activeListId === listId) {
        const nextListId = newLists.length > 0 ? newLists[0].id : null;
        if (nextListId) {
          await handleListChange(nextListId);
        } else {
          setActiveListId(null);
          setProducts([]);
        }
      }
      toast({ title: "Lista excluída!" });
    } catch (error) {
       toast({ variant: "destructive", title: "Erro ao excluir a lista." });
    }
  };

  // Product Handlers
  const handleAddProduct = async (productData: Omit<Product, "id" | "listId">) => {
    if (!currentUser || !activeListId) return;
    try {
      const newProductId = await addProduct(currentUser.uid, activeListId, productData);
      const newProduct = { ...productData, id: newProductId, listId: activeListId };
      setProducts(prev => [...prev, newProduct]);
      toast({ title: "Produto adicionado!" });
    } catch (error) {
       toast({ variant: "destructive", title: "Erro ao adicionar produto" });
    }
  };

  const handleUpdateProduct = async (productId: string, productData: Omit<Product, "id" | "listId">) => {
    try {
      await updateProduct(productId, productData);
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...productData, id: productId, listId: activeListId! } : p));
      toast({ title: "Produto atualizado!" });
    } catch (error) {
       toast({ variant: "destructive", title: "Erro ao atualizar produto" });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast({ title: "Produto excluído!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir produto" });
    }
  };

  const handleDeleteMultipleProducts = async (productIds: string[]) => {
     if (!currentUser || productIds.length === 0) return;
    try {
      await deleteMultipleProducts(productIds);
      setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
      toast({ title: `${productIds.length} produto(s) excluído(s)!` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir produtos" });
    }
  };
  
  const handleMoveMultipleProducts = async (productIds: string[], targetListId: string) => {
    if (!currentUser || productIds.length === 0) return;
    try {
      await moveMultipleProducts(productIds, targetListId);
      setProducts(prev => prev.filter(p => !productIds.includes(p.id)));
      toast({ title: `${productIds.length} produto(s) movido(s)!` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao mover produtos" });
    }
  };

  return {
    productLists,
    products,
    activeListId,
    isLoading,
    handleListChange,
    handleListCreate,
    handleListUpdate,
    handleListDelete,
    handleAddProduct,
    handleUpdateProduct,
    handleDeleteProduct,
    handleDeleteMultipleProducts,
    handleMoveMultipleProducts
  };
}
