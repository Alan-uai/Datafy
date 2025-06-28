"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { ProductSearchTable } from '@/components/dashboard/ProductSearchTable';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getProductLists, addProductList, updateProductListName, deleteProductList, type ProductList, getProducts, addProduct, type Product } from '@/services/productService';
import { suggestProductName } from '@/ai/flows/suggest-product-name-flow';
import { useToast } from '@/hooks/use-toast';
import { PackageSearch, Plus, Camera, Minus, CalendarDays, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner';
import { AttentionHorizonSelect } from "@/components/dashboard/AttentionHorizonSelect";

// Import the new components
import { AddListDialog } from '@/components/dashboard/AddListDialog';
import { RenameListDialog } from '@/components/dashboard/RenameListDialog';
import { DeleteListConfirmDialog } from '@/components/dashboard/DeleteListConfirmDialog';
import { ProductListTabs } from '@/components/dashboard/ProductListTabs';
import { ExpiryAttentionReportCard } from '@/components/dashboard/ExpiryAttentionReportCard';
import { AddProductDialog } from '@/components/dashboard/AddProductDialog';
import { AddProductFAB } from '@/components/dashboard/AddProductFAB';
import { NoListSelectedMessage } from '@/components/dashboard/NoListSelectedMessage';
import { MessageDisplay } from '@/components/shared/MessageDisplay';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import { formatDaysRemainingText } from '@/utils/dateUtils';
import ProductSkeleton from '@/components/dashboard/ProductSkeleton';
import { AddMultipleProductsDialog } from '@/components/dashboard/AddMultipleProductsDialog';
import { AddProductsFromImageDialog } from '@/components/dashboard/AddProductsFromImageDialog';
import { AddProductsFromFileDialog } from '@/components/dashboard/AddProductsFromFileDialog';

import {
  isToday,
  isPast,
  isWithinInterval,
  addDays,
  startOfDay,
  parseISO,
  isValid,
  format,
  differenceInHours,
  differenceInMinutes,
  endOfDay,
} from 'date-fns';
import type { Product } from '@/types';

const initialNewProductFormData: Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'> = {
  produto: '',
  marca: '',
  unidade: '1',
  validade: '',
};

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);

  // State for dialogs
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false);
  const [isRenameListDialogOpen, setIsRenameListDialogOpen] = useState(false);
  const [listToRename, setListToRename] = useState<ProductList | null>(null);
  const [isDeleteListConfirmOpen, setIsDeleteListConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState<ProductList | null>(null);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProductFormData, setNewProductFormData] = useState<Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'>>({ ...initialNewProductFormData });
  const [isSuggestingProductNameInDialog, setIsSuggestingProductNameInDialog] = useState(false);
  const newProductNameInputRefDialog = useRef<HTMLInputElement>(null);
  const [isScannerActiveInDialog, setIsScannerActiveInDialog] = useState(false);
  const [isCalendarOpenInDialog, setIsCalendarOpenInDialog] = useState(false);
  const [isAddMultipleProductsDialogOpen, setIsAddMultipleProductsDialogOpen] = useState(false);
  const [isAddProductsFromImageDialogOpen, setIsAddProductsFromImageDialogOpen] = useState(false);
  const [isAddProductsFromFileDialogOpen, setIsAddProductsFromFileDialogOpen] = useState(false);

  const [listProducts, setListProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const initialFetchDone = useRef(false);

  // State for messages
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((message: string, variant: Message['variant']) => {
    const newMessage = { id: crypto.randomUUID(), message, variant };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const dismissMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  }, []);

  const fetchLists = useCallback(async () => {
    if (currentUser?.uid) {
      setIsLoadingLists(true);
      try {
        const lists = await getProductLists(currentUser.uid);
        setProductLists(lists);
        if (lists.length > 0) {
          setActiveListId(lists[0].id);
        }
      } catch (error: any) {
        addMessage("Ocorreu um erro ao carregar as listas.", "error");
        console.error("Error fetching lists:", error);
        setProductLists([]);
        setActiveListId(null);
      } finally {
        setIsLoadingLists(false);
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
        }
      }
    } else {
      setProductLists([]);
      setActiveListId(null);
      setIsLoadingLists(false);
      initialFetchDone.current = true;
    }
  }, [currentUser?.uid, addMessage]);

  useEffect(() => {
    if (currentUser?.uid && !initialFetchDone.current) {
      fetchLists();
    } else if (!currentUser?.uid) {
      setProductLists([]);
      setActiveListId(null);
      setIsLoadingLists(false);
      initialFetchDone.current = false;
    }
  }, [currentUser?.uid, fetchLists]);

  const fetchProductsForCurrentList = useCallback(async (userId: string, listIdParam: string) => {
    setIsLoadingProducts(true);
    try {
      console.log('fetchProductsForCurrentList called with userId:', userId, 'and listIdParam:', listIdParam);
      const products = await getProducts(userId, listIdParam);
      setListProducts(products);
      console.log('Fetched products:', products);
    } catch (error) {
      console.error("Error fetching products for list:", error);
      addMessage("Ocorreu um erro ao carregar os produtos.", "error");
      setListProducts([]);
    }
 finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.uid && activeListId) {
      fetchProductsForCurrentList(currentUser.uid, activeListId);
    } else {
      setListProducts([]);
    }
  }, [activeListId, currentUser?.uid, fetchProductsForCurrentList]);

  // Callbacks for list dialogs
  const handleListAdded = useCallback((newList: ProductList) => {
    setProductLists(prev => [...prev, newList]);
    setActiveListId(newList.id);
  }, []);

  const handleListRenamed = useCallback((updatedList: ProductList) => {
    setProductLists(prev => prev.map(list => list.id === updatedList.id ? updatedList : list));
    setListToRename(null);
    setIsRenameListDialogOpen(false);
  }, []);

  const handleListDeleted = useCallback((deletedListId: string) => {
    const remainingLists = productLists.filter(list => list.id !== deletedListId);
    setProductLists(remainingLists);
    if (activeListId === deletedListId && remainingLists.length > 0) {
      setActiveListId(remainingLists[0].id);
    } else if (activeListId === deletedListId && remainingLists.length === 0) {
      setActiveListId(null);
    }
    setListToDelete(null);
    setIsDeleteListConfirmOpen(false);
  }, [productLists, activeListId]);

  // Handlers to open dialogs
  const handleOpenAddListDialog = useCallback(() => setIsAddListDialogOpen(true), []);
  const handleOpenRenameListDialog = useCallback((list: ProductList) => {
    setListToRename(list);
    setIsRenameListDialogOpen(true);
  }, []);
  const handleOpenDeleteListDialog = useCallback((list: ProductList) => {
    setListToDelete(list);
    setIsDeleteListConfirmOpen(true);
  }, []);
  const handleOpenAddSingleProductDialog = useCallback(() => setIsAddProductDialogOpen(true), []);
  const handleOpenAddMultipleProductsDialog = useCallback(() => setIsAddMultipleProductsDialogOpen(true), []);
  const handleOpenAddProductsFromImageDialog = useCallback(() => setIsAddProductsFromImageDialogOpen(true), []);
  const handleOpenAddProductsFromFileDialog = useCallback(() => setIsAddProductsFromFileDialogOpen(true), []);

  const handleProductsChangedInTable = useCallback(() => {
    if (currentUser?.uid && activeListId) {
      fetchProductsForCurrentList(currentUser.uid, activeListId);
    }
  }, [currentUser?.uid, activeListId, fetchProductsForCurrentList]);

  const handleProductAdded = useCallback((newProduct: Product) => {
    fetchProductsForCurrentList(currentUser?.uid || "", activeListId || "");
  }, [fetchProductsForCurrentList, currentUser?.uid, activeListId]);

  const handleMultipleProductsAdded = useCallback(async (newProducts: Product[]) => {
    console.log('handleMultipleProductsAdded called', { userId: currentUser?.uid, listId: activeListId });
    await new Promise(resolve => setTimeout(resolve, 500)); // Add a small delay
    fetchProductsForCurrentList(currentUser?.uid || "", activeListId || "");
  }, [fetchProductsForCurrentList, currentUser?.uid, activeListId]);

  const activeListName = productLists.find(list => list.id === activeListId)?.name || "Visão Geral";

  // Effect to fetch products when selectedListId changes
  useEffect(() => {
    if (currentUser?.uid && activeListId) {
      fetchProductsForCurrentList(currentUser.uid, activeListId);
    } else {
      setListProducts([]);
    }
  }, [currentUser?.uid, activeListId, fetchProductsForCurrentList]);

  // Listen for voice commands
  useEffect(() => {
    const handleVoiceProductAdd = async (event: CustomEvent) => {
      if (!currentUser?.uid || !activeListId) return;

      try {
        const productData = event.detail;
        const newProduct = await addProduct(currentUser.uid, activeListId, productData);
        handleProductAdded(newProduct);
        toast({ 
          title: "Produto Adicionado por Voz", 
          description: `${newProduct.produto} foi adicionado com sucesso.` 
        });
      } catch (error: any) {
        toast({ 
          variant: "destructive", 
          title: "Erro ao adicionar produto por voz", 
          description: error.message || "Não foi possível adicionar o produto." 
        });
      }
    };

    window.addEventListener('addProductFromVoice', handleVoiceProductAdd as EventListener);

    return () => {
      window.removeEventListener('addProductFromVoice', handleVoiceProductAdd as EventListener);
    };
  }, [currentUser?.uid, activeListId, toast, handleProductAdded]);


  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8 relative">
      <ProductListTabs
        productLists={productLists}
        activeListId={activeListId}
        setActiveListId={setActiveListId}
        isLoadingLists={isLoadingLists}
        onAddListClick={handleOpenAddListDialog}
        onRenameListClick={handleOpenRenameListDialog}
        onDeleteListClick={handleOpenDeleteListDialog}
      />

      {activeListId ? (
        <>
          <ExpiryAttentionReportCard listProducts={listProducts} />
          {isLoadingProducts ? (
            <ProductSkeleton />
          ) : (
            <ProductSearchTable listId={activeListId} products={listProducts} isLoadingProducts={isLoadingProducts} onProductsChanged={handleProductsChangedInTable} setProducts={setListProducts} />          )

        }

        </>
      ) : (
        <NoListSelectedMessage />
      )}

      <AddProductFAB
        onAddSingleProduct={handleOpenAddSingleProductDialog}
        onAddMultipleProducts={handleOpenAddMultipleProductsDialog}
        onAddProductsFromImage={handleOpenAddProductsFromImageDialog}
        onAddProductsFromFile={handleOpenAddProductsFromFileDialog}
      />

      <AddListDialog isOpen={isAddListDialogOpen} onOpenChange={setIsAddListDialogOpen} onListAdded={handleListAdded} userId={currentUser?.uid} />
      <RenameListDialog isOpen={isRenameListDialogOpen} onOpenChange={setIsRenameListDialogOpen} listToRename={listToRename} onListRenamed={handleListRenamed} userId={currentUser?.uid} />
      <DeleteListConfirmDialog isOpen={isDeleteListConfirmOpen} onOpenChange={setIsDeleteListConfirmOpen} listToDelete={listToDelete} onListDeleted={handleListDeleted} userId={currentUser?.uid} />
      <AddProductDialog isOpen={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen} onProductAdded={handleProductAdded} listId={activeListId || ""} userId={currentUser?.uid} />
      <AddMultipleProductsDialog
        isOpen={isAddMultipleProductsDialogOpen}
        onOpenChange={setIsAddMultipleProductsDialogOpen}
        onProductsAdded={handleMultipleProductsAdded}
        listId={activeListId || ""}
        userId={currentUser?.uid}
      />
      <AddProductsFromImageDialog
        isOpen={isAddProductsFromImageDialogOpen}
        onOpenChange={setIsAddProductsFromImageDialogOpen}
        onProductsAdded={handleMultipleProductsAdded}
        listId={activeListId || ""}
        userId={currentUser?.uid}
      />
      <AddProductsFromFileDialog
        isOpen={isAddProductsFromFileDialogOpen}
        onOpenChange={setIsAddProductsFromFileDialogOpen}
        onProductsAdded={handleMultipleProductsAdded}
        listId={activeListId || ""}
        userId={currentUser?.uid}
      />
      <MessageDisplay messages={messages} onDismiss={dismissMessage} />
    </div>
  );
}

interface Message {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
}