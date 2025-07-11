
"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
import { Label } from "@/components/ui/label";
import { AddProductDialog } from "@/components/add-product-dialog";
import { categories as initialCategories } from "@/lib/data";
import type { Product, Category, ProductList } from "@/lib/types";
import { format, isToday, isPast, addDays, isSameDay, startOfDay } from "date-fns";
import { Plus, Search, Filter, ArrowUp, ArrowDown, X, Loader2, Settings, Edit, Trash2, RefreshCw, LayoutGrid, Crown, Lock, Move, XCircle } from "lucide-react";
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
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { checkPremiumStatus, getUserProfile } from "@/services/userService";
import { getProductLists, getProductsByList, addProductList, addProduct, updateProduct, updateProductList, deleteProductList, deleteProduct, deleteMultipleProducts, moveMultipleProducts } from "@/services/productService";
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WIDGET_MAP, type AllWidgetType } from '@/components/dashboard/widgets/widget-map';
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { suggestListIcon } from "@/ai/flows/suggest-list-icon-flow";
import { debounce } from 'lodash';
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const columnNames: Record<string, string> = {
    'produto': 'Produto',
    'marca': 'Marca',
    'qtde': 'Qtde',
    'validade': 'Validade',
    'preco': 'Preço',
    'categoria': 'Categoria',
    'status': 'Status',
};

type ColumnVisibility = Record<string, boolean>;
type SortDirection = 'asc' | 'desc';
type SortKey = keyof Product | '';

const filterOptions = ['all', 'today', 'expired', 'next7'] as const;
type FilterType = typeof filterOptions[number];
const filterLabels: Record<FilterType, string> = {
    all: "Filtro: Todos",
    today: "Filtro: Vence Hoje",
    expired: "Filtro: Vencidos",
    next7: "Filtro: Próximos 7 dias",
};


const SortableWidget = ({ id, isEditing, onRemove, children }: { id: AllWidgetType, isEditing: boolean, onRemove: (id: AllWidgetType) => void, children: React.ReactNode }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group/widget">
            {isEditing && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 z-10 rounded-full bg-transparent hover:bg-destructive/20 text-destructive opacity-0 group-hover/widget:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
            {children}
        </div>
    );
};

export default function Dashboard() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { userProfile, setUserProfile, savePreferences } = useUserProfile();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [categories] = useState<Category[]>(initialCategories);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isManageListDialogOpen, setIsManageListDialogOpen] = useState<boolean>(false);
  const [editingList, setEditingList] = useState<ProductList | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [newListIcon, setNewListIcon] = useState<string>("List");
  const [isSuggestingIcon, setIsSuggestingIcon] = useState<boolean>(false);
  const newListNameRef = useRef<HTMLInputElement>(null);

  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const pressTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const dashboardScale = useMemo(() => userProfile?.preferences?.dashboardScale || 'normal', [userProfile]);

  const handleCycleFilter = () => {
    const currentIndex = filterOptions.indexOf(activeFilter);
    const nextIndex = (currentIndex + 1) % filterOptions.length;
    setActiveFilter(filterOptions[nextIndex]);
  };


  const debouncedIconSuggestion = useCallback(
    debounce(async (name: string) => {
      if (name.length < 3) return;
      setIsSuggestingIcon(true);
      try {
        const { iconName } = await suggestListIcon({ listName: name });
        setNewListIcon(iconName || 'List');
      } catch (error) {
        console.error("Icon suggestion failed:", error);
        setNewListIcon('List'); // fallback
      } finally {
        setIsSuggestingIcon(false);
      }
    }, 800),
    []
  );

  const handleNewListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedIconSuggestion(event.target.value);
  };
  
  const handleRegenerateIcon = async () => {
    const listName = newListNameRef.current?.value;
    if (!listName) return;
    setIsSuggestingIcon(true);
    try {
        const { iconName } = await suggestListIcon({ listName });
        setNewListIcon(iconName || 'List');
    } catch (error) {
        console.error("Icon suggestion failed:", error);
    } finally {
        setIsSuggestingIcon(false);
    }
  };

  const productsForAI = useMemo(() => {
    if (!products) return [];
    return products.map(p => ({
      ...p,
      validade: p.expiryDate.toISOString(),
      produto: p.name,
    }));
  }, [products]);

  const activeWidgets = useMemo(() => userProfile?.preferences?.activeWidgets || [], [userProfile]);
  
  const availableWidgets = useMemo(() => {
    const allWidgetKeys = Object.keys(WIDGET_MAP) as AllWidgetType[];
    return allWidgetKeys.filter(key => !activeWidgets.includes(key));
  }, [activeWidgets]);

  const loadInitialData = useCallback(async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
        const premiumStatus = await checkPremiumStatus(currentUser.uid);
        setIsPremium(premiumStatus);

        const profileData = await getUserProfile(currentUser.uid);
        setUserProfile(profileData);

        const lists = await getProductLists(currentUser.uid);
        setProductLists(lists);
        
        if (lists.length > 0) {
            const lastListId = profileData?.preferences?.lastActiveListId;
            const listToLoad = lists.find(l => l.id === lastListId) || lists[0];
            setActiveListId(listToLoad.id);
            const fetchedProducts = await getProductsByList(currentUser.uid, listToLoad.id);
            setProducts(fetchedProducts);
        } else {
            setProducts([]);
        }
    } catch (error) {
        console.error("Failed to load initial data", error);
        toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Não foi possível buscar suas listas e produtos."});
    } finally {
        setIsLoading(false);
    }
  }, [currentUser, toast, setUserProfile]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  useEffect(() => {
    let tempProducts = [...products];
    if (searchQuery) {
        tempProducts = tempProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    const today = startOfDay(new Date());

    if (activeFilter === 'today') {
        tempProducts = tempProducts.filter(p => isSameDay(startOfDay(p.expiryDate), today));
    } else if (activeFilter === 'expired') {
        tempProducts = tempProducts.filter(p => isPast(p.expiryDate) && !isToday(startOfDay(p.expiryDate)));
    } else if (activeFilter === 'next7') {
        const nextWeek = addDays(today, 8); // To include the 7th day
        tempProducts = tempProducts.filter(p => p.expiryDate > today && p.expiryDate < nextWeek);
    }

    if (sortKey) {
        tempProducts.sort((a, b) => {
            const valA = a[sortKey as keyof Product];
            const valB = b[sortKey as keyof Product];

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    setFilteredProducts(tempProducts);
  }, [products, searchQuery, activeFilter, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('asc');
    }
  };
  
  const handleListChange = async (listId: string) => {
    if (!currentUser || listId === activeListId) return;
    setActiveListId(listId);
    setIsLoading(true);
    resetSelection();
    try {
        const fetchedProducts = await getProductsByList(currentUser.uid, listId);
        setProducts(fetchedProducts);
        if (userProfile) {
            savePreferences({ lastActiveListId: listId });
        }
    } catch (error) {
        console.error(`Failed to fetch products for list ${listId}`, error);
        toast({ variant: "destructive", title: "Erro ao carregar lista" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleAddOrUpdateProduct = async (productData: Omit<Product, "id" | "listId">) => {
    if (!currentUser || !activeListId) return;
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
        toast({ title: "Produto atualizado!", description: `${productData.name} foi atualizado.` });
      } else {
        const newProductId = await addProduct(currentUser.uid, activeListId, productData);
        const newProduct = { ...productData, id: newProductId, listId: activeListId };
        setProducts(prev => [...prev, newProduct]);
        toast({ title: "Produto adicionado!", description: `${productData.name} foi salvo.` });
      }
      setEditingProduct(null);
      setIsAddProductDialogOpen(false);
    } catch (error) {
       console.error("Failed to save product", error);
       toast({ variant: "destructive", title: "Erro ao salvar produto" });
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddProductDialogOpen(true);
  };
  
  const handleDeleteProduct = async (productId: string) => {
    if (!currentUser) return;
    try {
        await deleteProduct(productId);
        setProducts(prev => prev.filter(p => p.id !== productId));
        toast({ title: "Produto excluído!" });
    } catch (error) {
        console.error("Failed to delete product", error);
        toast({ variant: "destructive", title: "Erro ao excluir produto" });
    }
  };

  const handleManageList = async () => {
    const listName = newListNameRef.current?.value;
    if (!currentUser || !listName || !listName.trim()) {
        toast({ variant: "destructive", title: "Nome inválido", description: "Por favor, insira um nome para a lista." });
        return;
    }

    try {
        if (editingList) {
            const updatedData = { name: listName.trim(), icon: newListIcon };
            await updateProductList(editingList.id, updatedData);
            setProductLists(prev => prev.map(l => l.id === editingList.id ? { ...l, ...updatedData } : l));
            toast({ title: "Lista atualizada!", description: `A lista "${listName.trim()}" foi atualizada.` });
        } else { 
            const newListId = await addProductList(currentUser.uid, listName.trim(), newListIcon);
            const newList: ProductList = { id: newListId, name: listName.trim(), icon: newListIcon, userId: currentUser.uid, createdAt: new Date() };
            setProductLists(prev => [...prev, newList]);
            setActiveListId(newListId);
            setProducts([]);
            toast({ title: "Lista criada!", description: `A lista "${listName.trim()}" foi criada com sucesso.` });
        }
        setIsManageListDialogOpen(false);
        setEditingList(null);
    } catch (error) {
        console.error("Failed to manage list", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar a lista." });
    }
  };

  const openManageListDialog = (list: ProductList | null) => {
    setEditingList(list);
    setNewListIcon(list?.icon || 'List');
    setIsManageListDialogOpen(true);
    setTimeout(() => {
        if (newListNameRef.current) {
            newListNameRef.current.value = list?.name || '';
            if (!list) {
               debouncedIconSuggestion(newListNameRef.current.value);
            }
        }
    }, 100);
  };

  const handleDeleteList = async (listId: string) => {
    if (!currentUser) return;
    try {
      await deleteProductList(currentUser, listId);
      const newLists = productLists.filter(l => l.id !== listId);
      setProductLists(newLists);
      
      if (activeListId === listId) {
        if (newLists.length > 0) {
          handleListChange(newLists[0].id);
        } else {
          setActiveListId(null);
          setProducts([]);
        }
      }
      toast({ title: "Lista excluída!" });
    } catch (error) {
       console.error("Failed to delete list", error);
       toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a lista." });
    }
  }

  const updateWidgets = (newActiveWidgets: AllWidgetType[]) => {
      savePreferences({ activeWidgets: newActiveWidgets });
  }

  const addWidget = (widgetId: AllWidgetType) => {
    const widgetInfo = WIDGET_MAP[widgetId];
    if (widgetInfo.premium && !isPremium) {
      toast({
        variant: "destructive",
        title: "Recurso Premium",
        description: `O widget '${widgetInfo.title}' requer uma assinatura Premium.`
      });
      return;
    }
    updateWidgets([...activeWidgets, widgetId])
  };

  const removeWidget = (widgetId: AllWidgetType) => updateWidgets(activeWidgets.filter(id => id !== widgetId));
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = activeWidgets.indexOf(active.id as AllWidgetType);
      const newIndex = activeWidgets.indexOf(over.id as AllWidgetType);
      updateWidgets(arrayMove(activeWidgets, oldIndex, newIndex));
    }
  };

  const handleColumnVisibilityChange = (key: string, value: boolean) => {
    if (!userProfile) return;
    const newVisibility = { ...userProfile.preferences.columnVisibility, [key]: value };
    savePreferences({ columnVisibility: newVisibility });
  };
  
  const handleWidgetEditing = () => {
      if (!userProfile) return;
      const isEditing = !userProfile.preferences.isEditingWidgets;
      savePreferences({ isEditingWidgets: isEditing });
  };

  const resetSelection = () => {
    setIsMultiSelectMode(false);
    setSelectedProductIds(new Set());
  };

  const handleProductPointerDown = (productId: string) => {
    pressTimeoutRef.current = setTimeout(() => {
      setIsMultiSelectMode(true);
      setSelectedProductIds(prev => new Set(prev).add(productId));
    }, 500);
  };

  const handleProductPointerUp = () => {
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
  };

  const handleProductClick = (product: Product) => {
    if (isMultiSelectMode) {
      setSelectedProductIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(product.id)) {
          newSet.delete(product.id);
        } else {
          newSet.add(product.id);
        }
        if (newSet.size === 0) {
            setIsMultiSelectMode(false);
        }
        return newSet;
      });
    }
  };

  const handleMoveSelected = async (targetListId: string) => {
    if (!currentUser || selectedProductIds.size === 0) return;
    try {
      const productIdsToMove = Array.from(selectedProductIds);
      await moveMultipleProducts(productIdsToMove, targetListId);
      setProducts(prev => prev.filter(p => !productIdsToMove.includes(p.id)));
      toast({ title: `${productIdsToMove.length} produto(s) movido(s)!` });
      resetSelection();
    } catch (error) {
      console.error("Failed to move products", error);
      toast({ variant: "destructive", title: "Erro ao mover produtos" });
    }
  };

  const handleDeleteSelected = async () => {
    if (!currentUser || selectedProductIds.size === 0) return;
    try {
      const productIdsToDelete = Array.from(selectedProductIds);
      await deleteMultipleProducts(productIdsToDelete);
      setProducts(prev => prev.filter(p => !productIdsToDelete.includes(p.id)));
      toast({ title: `${productIdsToDelete.length} produto(s) excluído(s)!` });
      resetSelection();
    } catch (error) {
      console.error("Failed to delete selected products", error);
      toast({ variant: "destructive", title: "Erro ao excluir produtos" });
    }
  };
  
  const getRowClass = (product: Product): string => {
    const today = startOfDay(new Date());
    const expiry = startOfDay(product.expiryDate);

    if (isPast(expiry) || isSameDay(expiry, today)) {
        return 'bg-red-500/20';
    }
    
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);

    if (isSameDay(expiry, tomorrow) || isSameDay(expiry, dayAfterTomorrow)) {
        return 'bg-orange-500/20';
    }

    return '';
  };


  if (isLoading || !userProfile) {
      return (
        <div className="flex items-center justify-center h-screen">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  const widgetDataProps = { products, categories, savePreferences, preferences: userProfile.preferences };
  const { isEditingWidgets, columnVisibility } = userProfile.preferences;

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    const iconClass = dashboardScale === 'compact' ? 'h-3 w-3 ml-1' : 'h-4 w-4 ml-2';
    return sortDirection === 'asc' ? <ArrowUp className={iconClass} /> : <ArrowDown className={iconClass} />;
  };

  const AvailableWidgetCard = ({ widgetId, onAdd }: { widgetId: AllWidgetType; onAdd: (id: AllWidgetType) => void }) => {
    const widgetInfo = WIDGET_MAP[widgetId];
    const Icon = widgetInfo.Icon;
    const isLocked = widgetInfo.premium && !isPremium;

    return (
      <button
        onClick={() => onAdd(widgetId)}
        disabled={isLocked}
        className={cn(
          "relative flex flex-col items-center justify-center text-center p-4 border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors h-full w-40 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
           dashboardScale === 'compact' && 'w-auto p-2 flex-grow basis-0'
        )}
      >
        {isLocked && <div className="absolute inset-0 bg-black/30 rounded-lg z-10 flex items-center justify-center"><Lock className="w-6 h-6 text-yellow-400" /></div>}
        <Icon className="h-6 w-6 mb-2" />
        <span className="text-sm font-medium">{widgetInfo.title}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
        <div className="p-4 md:p-6">
             <header className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold">Dashboard</h1>
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
                        {Object.entries(columnNames).map(([key, name]) => (
                           <DropdownMenuCheckboxItem
                             key={key}
                             className="capitalize"
                             checked={columnVisibility[key] ?? true}
                             onCheckedChange={(value) => handleColumnVisibilityChange(key, !!value)}
                             onSelect={(e) => e.preventDefault()}
                           >
                             {name}
                           </DropdownMenuCheckboxItem>
                         ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Button variant="outline" size="sm" onClick={handleWidgetEditing}>
                        <Settings className="h-4 w-4 mr-2" />
                        <span>{isEditingWidgets ? "Finalizar" : "Widgets"}</span>
                    </Button>
                </div>
            </header>
            
            {isEditingWidgets && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Adicionar Widgets</h3>
                <ScrollArea className={cn("w-full whitespace-nowrap", dashboardScale === 'compact' && "sm:whitespace-normal")}>
                  <div className={cn("flex gap-4 pb-4", dashboardScale === 'compact' && "sm:flex-wrap")}>
                    {availableWidgets.map(widgetId => (
                      <AvailableWidgetCard key={widgetId} widgetId={widgetId} onAdd={addWidget} />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className={cn(dashboardScale === 'compact' && "sm:hidden")} />
                </ScrollArea>
              </div>
            )}

            <DndContext sensors={[]} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeWidgets} strategy={verticalListSortingStrategy}>
                    <div className={cn(
                      "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6",
                      dashboardScale === 'compact' && 'grid-cols-2 md:grid-cols-2'
                    )}>
                        {activeWidgets.map(widgetId => {
                            const widgetInfo = WIDGET_MAP[widgetId];
                            if (!widgetInfo) return null;
                            if (widgetInfo.premium && !isPremium) return null;
                            
                            const WidgetComponent = widgetInfo.component;
                            const widgetProps = widgetInfo.id === 'expiryAttention' 
                                ? { listProducts: productsForAI, savePreferences, preferences: userProfile.preferences } 
                                : widgetDataProps;

                            return (
                                <SortableWidget key={widgetId} id={widgetId} isEditing={isEditingWidgets} onRemove={removeWidget}>
                                    <WidgetComponent {...widgetProps as any} />
                                </SortableWidget>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
        
        <div className="flex-1 flex flex-col">
            <div className="px-4 md:px-6 py-4 border-t">
                 <div className="w-full">
                     <ScrollArea className={cn("w-full", dashboardScale === 'compact' && 'sm:overflow-x-hidden')}>
                        <div className={cn("flex items-center gap-1 pb-2", dashboardScale === 'compact' && 'sm:flex-wrap')}>
                          {productLists.map(list => (
                              <div key={list.id} className="flex items-center group/tab shrink-0">
                                  <Button 
                                      variant="ghost"
                                      onClick={() => handleListChange(list.id)}
                                      className={cn(
                                        "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                                        dashboardScale === 'compact' ? 'h-8 p-2 text-sm' : 'h-auto p-2'
                                      )}
                                      data-active={activeListId === list.id}
                                  >
                                      <div className="flex items-center gap-2">
                                          <DynamicIcon name={list.icon || 'List'} className={dashboardScale === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                                          <span>{list.name}</span>
                                      </div>
                                  </Button>
                                  <div className="flex items-center gap-1 ml-1 opacity-100 sm:opacity-0 group-hover/tab:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openManageListDialog(list); }}>
                                          <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={e => e.stopPropagation()}>
                                              <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a lista "{list.name}" e todos os produtos contidos nela.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteList(list.id)}>Excluir</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                              </div>
                          ))}
                          <Button variant="ghost" onClick={() => openManageListDialog(null)} className={dashboardScale === 'compact' ? 'h-8 p-2 text-sm' : 'h-auto p-2'}>
                              <Plus className={dashboardScale === 'compact' ? 'h-4 w-4 mr-1' : 'h-4 w-4 mr-2'} />
                              Lista
                          </Button>
                        </div>
                        <ScrollBar orientation="horizontal" className={cn(dashboardScale === 'compact' && 'sm:hidden')} />
                     </ScrollArea>
                 </div>
                 {productLists.length === 0 && !isLoading && (
                    <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
                        <h3 className="text-lg font-medium">Crie sua primeira lista</h3>
                        <p className="text-muted-foreground">Comece a organizar seus produtos criando uma lista.</p>
                        <Button className="mt-4" onClick={() => openManageListDialog(null)}>Criar Lista</Button>
                    </div>
                )}
            </div>
            
            {activeListId && (
            <div className="flex-1 flex flex-col">
                 <div className="flex flex-row items-center gap-4 p-4 md:px-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Buscar produtos..." className={cn('pl-10 w-full', dashboardScale === 'compact' ? 'h-9 text-sm' : 'h-10')} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <Button variant="outline" onClick={handleCycleFilter} className={cn('shrink-0', dashboardScale === 'compact' ? 'h-9 px-3 text-xs' : 'h-10')}>
                      <Filter className="mr-2 h-4 w-4"/>
                      {filterLabels[activeFilter]}
                    </Button>
                </div>

                 <div className={cn("flex-1", dashboardScale === 'compact' ? 'overflow-hidden' : 'overflow-x-auto')}>
                    <Table className={cn(dashboardScale === 'compact' ? 'text-sm table-fixed w-full' : '')}>
                        <TableHeader>
                            <TableRow className="border-b hover:bg-transparent">
                                <TableHead><Button variant="ghost" onClick={() => handleSort('name')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Produto {renderSortIcon('name')}</Button></TableHead>
                                {columnVisibility['marca'] && <TableHead><Button variant="ghost" onClick={() => handleSort('brand')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Marca {renderSortIcon('brand')}</Button></TableHead>}
                                {columnVisibility['qtde'] && <TableHead><Button variant="ghost" onClick={() => handleSort('quantity')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Qtde {renderSortIcon('quantity')}</Button></TableHead>}
                                {columnVisibility['validade'] && <TableHead><Button variant="ghost" onClick={() => handleSort('expiryDate')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Validade {renderSortIcon('expiryDate')}</Button></TableHead>}
                                {columnVisibility['preco'] && <TableHead><Button variant="ghost" onClick={() => handleSort('price')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Preço {renderSortIcon('price')}</Button></TableHead>}
                                {columnVisibility['categoria'] && <TableHead><Button variant="ghost" onClick={() => handleSort('category')} className={cn('p-1', dashboardScale === 'compact' ? 'text-xs px-1' : '')}>Categoria {renderSortIcon('category')}</Button></TableHead>}
                                {columnVisibility['status'] && <TableHead>Status</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                             <Popover key={product.id}>
                                <PopoverTrigger asChild>
                                    <TableRow
                                        data-state={selectedProductIds.has(product.id) ? 'selected' : 'unselected'}
                                        className={cn(
                                            'cursor-pointer',
                                            dashboardScale === 'compact' ? 'h-10' : '', 
                                            getRowClass(product),
                                            'data-[state=selected]:bg-primary/20'
                                        )}
                                        onPointerDown={() => handleProductPointerDown(product.id)}
                                        onPointerUp={handleProductPointerUp}
                                        onClick={() => handleProductClick(product)}
                                    >
                                        <TableCell className={cn('font-medium truncate', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{product.name}</TableCell>
                                        {columnVisibility['marca'] && <TableCell className={cn('truncate', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{product.brand}</TableCell>}
                                        {columnVisibility['qtde'] && <TableCell className={dashboardScale === 'compact' ? 'p-2' : 'p-4'}>{product.quantity}</TableCell>}
                                        {columnVisibility['validade'] && <TableCell className={dashboardScale === 'compact' ? 'p-2' : 'p-4'}>{format(product.expiryDate, 'dd/MM/yy')}</TableCell>}
                                        {columnVisibility['preco'] && <TableCell className={dashboardScale === 'compact' ? 'p-2' : 'p-4'}>{product.price.toFixed(2).replace('.', ',')}</TableCell>}
                                        {columnVisibility['categoria'] && <TableCell className={cn('truncate', dashboardScale === 'compact' ? 'p-2' : 'p-4')}>{categories.find(c => c.id === product.category)?.name || product.category}</TableCell>}
                                        {columnVisibility['status'] && <TableCell className={dashboardScale === 'compact' ? 'p-2' : 'p-4'}><Badge className="bg-green-500/80 hover:bg-green-500/90 text-white">OK</Badge></TableCell>}
                                    </TableRow>
                                </PopoverTrigger>
                                <PopoverContent className="w-40 p-2">
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleEditProduct(product)}>
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
                                                    <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </PopoverContent>
                            </Popover>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredProducts.length === 0 && !isLoading && (
                        <div className="text-center p-8 text-muted-foreground flex-1 flex items-center justify-center">
                            Nenhum produto encontrado.
                        </div>
                    )}
                </div>
            </div>
            )}
        </div>


        <AddProductDialog 
            categories={categories} 
            onAddProduct={handleAddOrUpdateProduct}
            open={isAddProductDialogOpen} 
            onOpenChange={(isOpen) => {
                setIsAddProductDialogOpen(isOpen);
                if (!isOpen) setEditingProduct(null);
            }}
            editingProduct={editingProduct}
        >
            <Button onClick={() => setIsAddProductDialogOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
                <Plus className="h-8 w-8" />
            </Button>
        </AddProductDialog>

        <AlertDialog open={isManageListDialogOpen} onOpenChange={setIsManageListDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{editingList ? 'Editar Lista' : 'Criar Nova Lista'}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {editingList ? 'Altere o nome e o ícone da sua lista.' : 'Digite o nome da sua lista e a IA sugerirá um ícone.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-4">
                    <Input ref={newListNameRef} placeholder="Ex: Compras da Semana" onChange={handleNewListNameChange} defaultValue={editingList?.name || ''}/>
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Ícone Sugerido</Label>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-2 p-2 border rounded-md w-full">
                             {isSuggestingIcon ? <Loader2 className="h-5 w-5 animate-spin" /> : <DynamicIcon name={newListIcon} className="h-5 w-5"/>}
                             <span className="flex-1">{newListIcon}</span>
                           </div>
                           <Button variant="outline" size="icon" onClick={handleRegenerateIcon} disabled={isSuggestingIcon}>
                             <RefreshCw className={`h-4 w-4 ${isSuggestingIcon ? 'animate-spin' : ''}`} />
                           </Button>
                        </div>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setEditingList(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleManageList}>{editingList ? 'Salvar Alterações' : 'Criar'}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AnimatePresence>
            {isMultiSelectMode && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    className="fixed bottom-4 left-1/2 -translate-x-1/2 w-auto bg-background border rounded-lg shadow-2xl flex items-center gap-2 p-2 z-50"
                >
                    <Button variant="ghost" size="icon" onClick={resetSelection}>
                        <XCircle className="h-5 w-5"/>
                    </Button>
                    <span className="font-medium text-sm pr-2 border-r">{selectedProductIds.size} selecionado(s)</span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost">
                                <Move className="mr-2 h-4 w-4" /> Mover
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>Mover para a lista</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {productLists.filter(l => l.id !== activeListId).map(list => (
                                <DropdownMenuItem key={list.id} onSelect={() => handleMoveSelected(list.id)}>
                                    <DynamicIcon name={list.icon} className="mr-2 h-4 w-4" /> {list.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="text-destructive hover:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                            </Button>
                        </AlertDialogTrigger>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir {selectedProductIds.size} produtos?</AlertDialogTitle>
                                <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteSelected}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
