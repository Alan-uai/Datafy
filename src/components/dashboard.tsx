
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
import { format } from "date-fns";
import { Plus, Search, Filter, ArrowUp, ArrowDown, X, Loader2, Settings, Edit, Trash2, RefreshCw } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateUserProfile, type UserProfile } from "@/services/userService";
import { getProductLists, getProductsByList, addProductList, addProduct, updateProductList, deleteProductList } from "@/services/productService";
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { suggestListIcon } from "@/ai/flows/suggest-list-icon-flow";
import { debounce } from 'lodash';

const columnNames = {
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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState<boolean>(false);
  const [isManageListDialogOpen, setIsManageListDialogOpen] = useState<boolean>(false);
  const [editingList, setEditingList] = useState<ProductList | null>(null);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [newListIcon, setNewListIcon] = useState<string>("List");
  const [isSuggestingIcon, setIsSuggestingIcon] = useState<boolean>(false);
  const newListNameRef = useRef<HTMLInputElement>(null);

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
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);

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
  
  useEffect(() => {
    let tempProducts = [...products];
    // Filtering
    if (searchQuery) {
        tempProducts = tempProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeFilter === 'today') {
        tempProducts = tempProducts.filter(p => new Date(p.expiryDate).setHours(0,0,0,0) === today.getTime());
    } else if (activeFilter === 'expired') {
        tempProducts = tempProducts.filter(p => new Date(p.expiryDate) < today);
    } else if (activeFilter === 'next7') {
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        tempProducts = tempProducts.filter(p => new Date(p.expiryDate) > today && new Date(p.expiryDate) <= nextWeek);
    }

    // Sorting
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
  const { isEditingWidgets, columnVisibility } = userProfile.preferences;

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4 ml-2" /> : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
        <div className="p-4 md:p-6">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                 <h1 className="text-2xl font-bold">Dashboard</h1>
                 <div className="flex items-center gap-2 self-end sm:self-auto">
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
                          <span>{isEditingWidgets ? "Finalizar Edição" : "Editar Widgets"}</span>
                      </Button>
                </div>
            </header>
            
            <DndContext sensors={[]} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={activeWidgets} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
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
        
        <div className="flex-1 flex flex-col">
            <div className="px-4 md:px-6 py-4 border-t">
                 <Tabs value={activeListId || ""} onValueChange={handleListChange} className="w-full">
                     <TabsList className="p-0 bg-transparent h-auto flex flex-wrap items-center gap-1">
                        {productLists.map(list => (
                            <div key={list.id} className="flex items-center group/tab relative">
                                <TabsTrigger 
                                    value={list.id} 
                                    className="h-auto p-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                                >
                                    <div className="flex items-center gap-2">
                                        <DynamicIcon name={list.icon || 'List'} />
                                        <span>{list.name}</span>
                                    </div>
                                </TabsTrigger>
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
                         <Button variant="ghost" onClick={() => openManageListDialog(null)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Lista
                        </Button>
                    </TabsList>
                </Tabs>
                 {productLists.length === 0 && !isLoading && (
                    <div className="text-center py-10">
                        <h3 className="text-lg font-medium">Crie sua primeira lista</h3>
                        <p className="text-muted-foreground">Comece a organizar seus produtos criando uma lista.</p>
                        <Button className="mt-4" onClick={() => openManageListDialog(null)}>Criar Lista</Button>
                    </div>
                )}
            </div>
            
            {activeListId && (
            <div className="flex-1 flex flex-col">
                 <div className="flex flex-col sm:flex-row items-center gap-4 p-4 md:px-6">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Buscar produtos..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                              <Filter className="mr-2 h-4 w-4"/>
                              Filtro
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                            <DropdownMenuLabel>Filtrar por validade</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={activeFilter} onValueChange={setActiveFilter}>
                            <DropdownMenuRadioItem value="all">Todos</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="today">Vence Hoje</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="expired">Vencidos</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="next7">Próximos 7 dias</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                 <div className="flex-1 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b hover:bg-transparent">
                                <TableHead><Button variant="ghost" onClick={() => handleSort('name')}>Produto {renderSortIcon('name')}</Button></TableHead>
                                {columnVisibility['marca'] && <TableHead><Button variant="ghost" onClick={() => handleSort('brand')}>Marca {renderSortIcon('brand')}</Button></TableHead>}
                                {columnVisibility['qtde'] && <TableHead><Button variant="ghost" onClick={() => handleSort('quantity')}>Qtde {renderSortIcon('quantity')}</Button></TableHead>}
                                {columnVisibility['validade'] && <TableHead><Button variant="ghost" onClick={() => handleSort('expiryDate')}>Validade {renderSortIcon('expiryDate')}</Button></TableHead>}
                                {columnVisibility['preco'] && <TableHead><Button variant="ghost" onClick={() => handleSort('price')}>Preço {renderSortIcon('price')}</Button></TableHead>}
                                {columnVisibility['categoria'] && <TableHead><Button variant="ghost" onClick={() => handleSort('category')}>Categoria {renderSortIcon('category')}</Button></TableHead>}
                                {columnVisibility['status'] && <TableHead>Status</TableHead>}
                                <TableHead className="w-[100px] text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                {columnVisibility['marca'] && <TableCell>{product.brand}</TableCell>}
                                {columnVisibility['qtde'] && <TableCell>{product.quantity}</TableCell>}
                                {columnVisibility['validade'] && <TableCell>{format(product.expiryDate, 'dd/MM/yyyy')}</TableCell>}
                                {columnVisibility['preco'] && <TableCell>{product.price.toFixed(2).replace('.', ',')}</TableCell>}
                                {columnVisibility['categoria'] && <TableCell>{categories.find(c => c.id === product.category)?.name || product.category}</TableCell>}
                                {columnVisibility['status'] && <TableCell><Badge className="bg-green-500/80 hover:bg-green-500/90 text-white">OK</Badge></TableCell>}
                                <TableCell className="text-right">
                                  {/* Action buttons here */}
                                </TableCell>
                            </TableRow>
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
    </div>
  );
}
