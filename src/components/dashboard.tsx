
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
import { AddProductDialog } from "@/components/add-product-dialog";
import { categories as initialCategories } from "@/lib/data";
import type { Product, Category, ProductList } from "@/lib/types";
import { format } from "date-fns";
import { Plus, Search, Filter, ArrowUp, X, Loader2, ListPlus, Settings, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/services/userService";
import { getProductLists, getProductsByList, addProductList, addProduct, updateProductList, deleteProductList } from "@/services/productService";
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { WIDGET_MAP, type AllWidgetType } from './dashboard/widgets/widget-map';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const columnNames = {
    'produto': 'Produto',
    'marca': 'Marca',
    'qtde': 'Qtde',
    'validade': 'Validade',
    'preco': 'Preço (R$)',
    'categoria': 'Categoria',
    'status': 'Status',
};

type ColumnVisibility = Record<string, boolean>;

const initialColumns: ColumnVisibility = {
    'produto': true,
    'marca': true,
    'qtde': true,
    'validade': true,
    'preco': true,
    'categoria': true,
    'status': true,
};

const availableListIcons = ["Beer", "Refrigerator", "Snowflake", "Weight", "ShoppingCart", "Apple", "Carrot", "Milk", "Package"];


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

export function Dashboard() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { userProfile, setUserProfile, savePreferences } = useUserProfile();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories] = useState<Category[]>(initialCategories);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isManageListDialogOpen, setIsManageListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ProductList | null>(null);

  const newListNameRef = useRef<HTMLInputElement>(null);
  const [newListIcon, setNewListIcon] = useState<string>(availableListIcons[0]);

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
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile ?? userProfile);

        const lists = await getProductLists(currentUser.uid);
        setProductLists(lists);
        
        if (lists.length > 0) {
            const lastListId = profile?.preferences?.lastActiveListId;
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
  
  const handleListChange = async (listId: string) => {
    if (!currentUser || listId === activeListId) return;
    setActiveListId(listId);
    setIsLoading(true);
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

  const handleAddProduct = async (productData: Omit<Product, "id" | "listId">) => {
    if (!currentUser || !activeListId) return;
    try {
      const newProductId = await addProduct(currentUser.uid, activeListId, productData);
      const newProduct = { ...productData, id: newProductId, listId: activeListId };
      setProducts((prev) => [...prev, newProduct]);
      toast({ title: "Produto adicionado!", description: `${productData.name} foi salvo.` });
    } catch (error) {
       console.error("Failed to add product", error);
       toast({ variant: "destructive", title: "Erro ao adicionar produto" });
    }
  };
  
  const handleManageList = async () => {
    const listName = newListNameRef.current?.value;
    if (!currentUser || !listName || !listName.trim()) {
        toast({ variant: "destructive", title: "Nome inválido", description: "Por favor, insira um nome para a lista." });
        return;
    }

    try {
        if (editingList) { // Update existing list
            const updatedData = { name: listName.trim(), icon: newListIcon };
            await updateProductList(editingList.id, updatedData);
            setProductLists(prev => prev.map(l => l.id === editingList.id ? { ...l, ...updatedData } : l));
            toast({ title: "Lista atualizada!", description: `A lista "${listName.trim()}" foi atualizada.` });
        } else { // Create new list
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
    setNewListIcon(list?.icon || availableListIcons[0]);
    setIsManageListDialogOpen(true);
    // Use timeout to focus after dialog is rendered
    setTimeout(() => {
        if (newListNameRef.current) {
            newListNameRef.current.value = list?.name || '';
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

  const addWidget = (widgetId: AllWidgetType) => updateWidgets([...activeWidgets, widgetId]);
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
  
  if (isLoading || !userProfile) {
      return (
        <div className="flex items-center justify-center h-screen">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  const widgetDataProps = { products, categories };
  const { isEditingWidgets } = userProfile.preferences;

  return (
    <div className="flex flex-col h-full bg-background relative">
        <div className="p-4 md:p-6 space-y-6">
            <header className="flex items-center justify-between">
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
                               checked={userProfile.preferences.columnVisibility[key] ?? true}
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
            
            <Card>
                <CardContent className="p-4">
                    <Tabs value={activeListId || ""} onValueChange={handleListChange} className="w-full">
                         <div className="flex items-center gap-2 flex-wrap">
                            <TabsList className="p-0 bg-transparent h-auto">
                                {productLists.map(list => (
                                <TabsTrigger 
                                    key={list.id} 
                                    value={list.id} 
                                    className="h-auto p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground group/tab"
                                >
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name={list.icon || 'List'} />
                                        <span>{list.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover/tab:opacity-100 transition-opacity">
                                       <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openManageListDialog(list); }}>
                                            <Edit className="h-4 w-4" />
                                       </Button>
                                       <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}>
                                            <Trash2 className="h-4 w-4" />
                                       </Button>
                                    </div>
                                </TabsTrigger>
                                ))}
                            </TabsList>
                             <Button variant="outline" onClick={() => openManageListDialog(null)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Lista
                            </Button>
                        </div>
                        
                        {productLists.map(list => (
                           <TabsContent key={list.id} value={list.id} className="mt-4">
                             <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input placeholder="Buscar produtos..." className="pl-10"/>
                                </div>
                                <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filtro</Button>
                            </div>

                             <div className="overflow-x-auto mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {(userProfile.preferences.columnVisibility.produto ?? true) && <TableHead><div className="flex items-center gap-1">Produto <ArrowUp className="h-4 w-4"/></div></TableHead>}
                                            {(userProfile.preferences.columnVisibility.marca ?? true) && <TableHead>Marca</TableHead>}
                                            {(userProfile.preferences.columnVisibility.qtde ?? true) && <TableHead>Qtde</TableHead>}
                                            {(userProfile.preferences.columnVisibility.validade ?? true) && <TableHead>Validade</TableHead>}
                                            {(userProfile.preferences.columnVisibility.preco ?? true) && <TableHead><div>Preço<div className="font-normal text-muted-foreground">(R$)</div></div></TableHead>}
                                            {(userProfile.preferences.columnVisibility.categoria ?? true) && <TableHead>Categoria</TableHead>}
                                            {(userProfile.preferences.columnVisibility.status ?? true) && <TableHead>Status</TableHead>}
                                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products?.map((product) => (
                                        <TableRow key={product.id}>
                                            {(userProfile.preferences.columnVisibility.produto ?? true) && <TableCell className="font-medium">{product.name}</TableCell>}
                                            {(userProfile.preferences.columnVisibility.marca ?? true) && <TableCell>{product.brand}</TableCell>}
                                            {(userProfile.preferences.columnVisibility.qtde ?? true) && <TableCell>{product.quantity}</TableCell>}
                                            {(userProfile.preferences.columnVisibility.validade ?? true) && <TableCell>{format(product.expiryDate, 'dd/MM/yyyy')}</TableCell>}
                                            {(userProfile.preferences.columnVisibility.preco ?? true) && <TableCell>R$ {product.price.toFixed(2).replace('.', ',')}</TableCell>}
                                            {(userProfile.preferences.columnVisibility.categoria ?? true) && <TableCell>{categories.find(c => c.id === product.category)?.name || product.category}</TableCell>}
                                            {(userProfile.preferences.columnVisibility.status ?? true) && <TableCell><Badge className="bg-green-500/80 hover:bg-green-500/90 text-white">OK</Badge></TableCell>}
                                            <TableCell className="text-right">
                                              {/* Action buttons here */}
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {products?.length === 0 && !isLoading && (
                                    <div className="text-center p-8 text-muted-foreground">
                                        Nenhum produto encontrado nesta lista.
                                    </div>
                                )}
                            </div>
                           </TabsContent>
                        ))}
                    </Tabs>
                     {productLists.length === 0 && !isLoading && (
                        <div className="text-center p-16">
                            <h3 className="text-lg font-medium">Crie sua primeira lista</h3>
                            <p className="text-muted-foreground">Comece a organizar seus produtos criando uma lista.</p>
                            <Button className="mt-4" onClick={() => openManageListDialog(null)}>Criar Lista</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DndContext sensors={[]} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeWidgets} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                        {activeWidgets.map(widgetId => {
                            const widgetInfo = WIDGET_MAP[widgetId];
                            if (!widgetInfo) return null;
                            const WidgetComponent = widgetInfo.component;
                            const widgetProps = widgetInfo.id === 'expiryAttention' 
                                ? { listProducts: productsForAI } 
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

        <AddProductDialog categories={categories} onAddProduct={handleAddProduct} open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
            <Button onClick={() => setIsAddProductDialogOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
                <Plus className="h-8 w-8" />
            </Button>
        </AddProductDialog>

        <AlertDialog open={isManageListDialogOpen} onOpenChange={setIsManageListDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{editingList ? 'Editar Lista' : 'Criar Nova Lista'}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {editingList ? 'Altere o nome e o ícone da sua lista.' : 'Escolha um nome e um ícone para sua nova lista.'}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-4">
                    <Input ref={newListNameRef} placeholder="Ex: Compras da Semana" />
                    <div>
                        <label className="text-sm font-medium mb-2 block">Ícone</label>
                        <Select value={newListIcon} onValueChange={setNewListIcon}>
                             <SelectTrigger>
                                <SelectValue placeholder="Selecione um ícone" />
                             </SelectTrigger>
                             <SelectContent>
                                {availableListIcons.map(iconName => (
                                    <SelectItem key={iconName} value={iconName}>
                                       <div className="flex items-center gap-2">
                                         <DynamicIcon name={iconName} />
                                         <span>{iconName}</span>
                                       </div>
                                    </SelectItem>
                                ))}
                             </SelectContent>
                        </Select>
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setEditingList(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleManageList}>{editingList ? 'Salvar Alterações' : 'Criar'}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    