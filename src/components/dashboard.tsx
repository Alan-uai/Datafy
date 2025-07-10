
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
import { Plus, Settings, Search, Filter, ArrowUp, X, Loader2, ListPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { getProductLists, getProductsByList, addProductList, addProduct } from "@/services/productService";
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "@/components/ui/carousel";
import { WIDGET_MAP, type AllWidgetType } from './dashboard/widgets/widget-map';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppLogo } from "@/components/shared/AppLogo";

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

const columnNames: Record<keyof typeof initialColumns, string> = {
    'produto': 'Produto',
    'marca': 'Marca',
    'qtde': 'Qtde',
    'validade': 'Validade',
    'preco': 'Preço (R$)',
    'categoria': 'Categoria',
    'status': 'Status',
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
                    className="absolute top-2 right-2 h-6 w-6 z-10 rounded-full bg-transparent hover:bg-destructive/20 text-destructive-foreground opacity-0 group-hover/widget:opacity-100 transition-opacity"
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
  const [products, setProducts] = useState<Product[]>([]);
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories] = useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(initialColumns);
  const [isEditingWidgets, setIsEditingWidgets] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false);
  const newListNameRef = useRef<HTMLInputElement>(null);

  const productsForAI = useMemo(() => {
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
        if (profile?.preferences?.columnVisibility) {
            const mergedVisibility = { ...initialColumns, ...profile.preferences.columnVisibility };
            setColumnVisibility(mergedVisibility);
        }

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
  }, [currentUser, toast]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  useEffect(() => {
    if (!carouselApi || !activeListId) return;
    const activeListIndex = productLists.findIndex(l => l.id === activeListId);
    if (activeListIndex !== -1 && activeListIndex !== carouselApi.selectedScrollSnap()) {
      carouselApi.scrollTo(activeListIndex);
    }
  }, [activeListId, productLists, carouselApi]);


  const handleListChange = async (listId: string) => {
    if (!currentUser || listId === activeListId) return;
    setActiveListId(listId);
    setIsLoading(true);
    try {
        const fetchedProducts = await getProductsByList(currentUser.uid, listId);
        setProducts(fetchedProducts);
        if (currentUser && userProfile) {
            await updateUserProfile(currentUser.uid, {
                preferences: { ...userProfile.preferences, lastActiveListId: listId }
            });
        }
    } catch (error) {
        console.error(`Failed to fetch products for list ${listId}`, error);
        toast({ variant: "destructive", title: "Erro ao carregar lista" });
    } finally {
        setIsLoading(false);
    }
  };


  const handleColumnVisibilityChange = (key: string, value: boolean) => {
    const newVisibility = { ...columnVisibility, [key]: value };
    setColumnVisibility(newVisibility);
    if (currentUser && userProfile) {
        updateUserProfile(currentUser.uid, {
            preferences: {
                ...userProfile.preferences,
                columnVisibility: newVisibility,
            },
        });
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
  
  const handleCreateList = async () => {
    const newName = newListNameRef.current?.value;
    if (!currentUser || !newName || !newName.trim()) {
        toast({ variant: "destructive", title: "Nome inválido", description: "Por favor, insira um nome para a lista." });
        return;
    }
    try {
        const newListId = await addProductList(currentUser.uid, newName.trim());
        const newList: ProductList = { id: newListId, name: newName.trim(), userId: currentUser.uid, createdAt: new Date() };
        setProductLists(prev => [...prev, newList]);
        setActiveListId(newListId);
        setProducts([]);
        setIsAddListDialogOpen(false);
        toast({ title: "Lista criada!", description: `A lista "${newName.trim()}" foi criada com sucesso.` });
    } catch (error) {
        console.error("Failed to create list", error);
        toast({ variant: "destructive", title: "Erro", description: "Não foi possível criar a nova lista." });
    }
  };

  const handleWidgetEditing = () => {
      if (isEditingWidgets && currentUser && userProfile) {
          updateUserProfile(currentUser.uid, {
              preferences: { ...userProfile.preferences, activeWidgets }
          });
      }
      setIsEditingWidgets(!isEditingWidgets);
  };

  const updateWidgets = (newActiveWidgets: AllWidgetType[]) => {
      if (!userProfile) return;
      setUserProfile({
          ...userProfile,
          preferences: { ...(userProfile?.preferences ?? {}), activeWidgets: newActiveWidgets }
      });
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
  
  if (isLoading || !userProfile) {
      return (
        <div className="flex items-center justify-center h-screen">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }

  const widgetDataProps = { products, categories };

  return (
    <div className="flex flex-col h-full bg-background relative">
        <div className="p-4 md:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AppLogo />
                    <h1 className="text-2xl font-bold">Dashboard</h1>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Settings className="mr-2 h-4 w-4" />
                          Colunas
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.keys(initialColumns).map((key) => {
                           return (
                             <DropdownMenuCheckboxItem
                               key={key}
                               className="capitalize"
                               checked={columnVisibility[key]}
                               onCheckedChange={(value) => handleColumnVisibilityChange(key, !!value)}
                               onSelect={(e) => e.preventDefault()}
                             >
                               {columnNames[key as keyof typeof columnNames]}
                             </DropdownMenuCheckboxItem>
                           )
                         })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" onClick={handleWidgetEditing}>
                        <Settings className="mr-2 h-4 w-4" />
                        {isEditingWidgets ? "Finalizar" : "Widgets"}
                    </Button>
                </div>
            </header>

            {isEditingWidgets && (
                <Card className="p-4 bg-muted/50">
                    <h3 className="mb-4 text-lg font-semibold">Adicionar Widgets</h3>
                     {availableWidgets.length > 0 ? (
                        <Carousel opts={{ align: "start", dragFree: true }}>
                            <CarouselContent>
                                {availableWidgets.map(widgetId => {
                                    const widget = WIDGET_MAP[widgetId];
                                    return (
                                        <CarouselItem key={widgetId} className="basis-1/3 md:basis-1/4 lg:basis-1/5">
                                            <Button
                                                variant="outline"
                                                className="h-24 w-full flex flex-col items-center justify-center gap-2 p-2 bg-background hover:bg-accent"
                                                onClick={() => addWidget(widgetId)}
                                            >
                                                <widget.Icon className="h-6 w-6 text-primary" />
                                                <span className="text-xs text-center">{widget.title}</span>
                                            </Button>
                                        </CarouselItem>
                                    );
                                })}
                            </CarouselContent>
                            <CarouselPrevious />
                            <CarouselNext />
                        </Carousel>
                     ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Todos os widgets já foram adicionados.</p>
                     )}
                </Card>
            )}

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
            
            <Card>
                <CardContent className="p-4">
                    <Tabs value={activeListId || ""} onValueChange={handleListChange}>
                        <div className="relative">
                            <TabsList className="p-0 bg-transparent">
                                <Carousel setApi={setCarouselApi} className="w-full">
                                <CarouselContent className="-ml-1">
                                    {productLists.map(list => (
                                    <CarouselItem key={list.id} className="basis-auto pl-1">
                                        <TabsTrigger value={list.id}>{list.name}</TabsTrigger>
                                    </CarouselItem>
                                    ))}
                                    <CarouselItem className="basis-auto pl-1">
                                    <Button variant="ghost" onClick={() => setIsAddListDialogOpen(true)}>
                                        <ListPlus className="h-4 w-4 mr-2" />
                                        Nova Lista
                                    </Button>
                                    </CarouselItem>
                                </CarouselContent>
                                <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 hidden sm:flex"/>
                                <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 hidden sm:flex"/>
                                </Carousel>
                            </TabsList>
                        </div>
                        
                        {productLists.map(list => (
                           <TabsContent key={list.id} value={list.id} className="mt-4">
                             <div className="flex items-center gap-2">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <Input placeholder="Buscar produtos na lista..." className="pl-10"/>
                                </div>
                                <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filtro</Button>
                            </div>

                             <div className="overflow-x-auto mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            {columnVisibility.produto && <TableHead><div className="flex items-center gap-1">Produto <ArrowUp className="h-4 w-4"/></div></TableHead>}
                                            {columnVisibility.marca && <TableHead>Marca</TableHead>}
                                            {columnVisibility.qtde && <TableHead>Qtde</TableHead>}
                                            {columnVisibility.validade && <TableHead>Validade</TableHead>}
                                            {columnVisibility.preco && <TableHead>Preço (R$)</TableHead>}
                                            {columnVisibility.categoria && <TableHead>Categoria</TableHead>}
                                            {columnVisibility.status && <TableHead>Status</TableHead>}
                                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product) => (
                                        <TableRow key={product.id}>
                                            {columnVisibility.produto && <TableCell className="font-medium">{product.name}</TableCell>}
                                            {columnVisibility.marca && <TableCell>{product.brand}</TableCell>}
                                            {columnVisibility.qtde && <TableCell>{product.quantity}</TableCell>}
                                            {columnVisibility.validade && <TableCell>{format(product.expiryDate, 'dd/MM/yyyy')}</TableCell>}
                                            {columnVisibility.preco && <TableCell>R$ {product.price.toFixed(2).replace('.', ',')}</TableCell>}
                                            {columnVisibility.categoria && <TableCell>{categories.find(c => c.id === product.category)?.name || product.category}</TableCell>}
                                            {columnVisibility.status && <TableCell><Badge className="bg-green-500/80 hover:bg-green-500/90 text-white">OK</Badge></TableCell>}
                                            <TableCell className="text-right">
                                              {/* Action buttons here */}
                                            </TableCell>
                                        </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {products.length === 0 && !isLoading && (
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
                            <Button className="mt-4" onClick={() => setIsAddListDialogOpen(true)}>Criar Lista</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <AddProductDialog categories={categories} onAddProduct={handleAddProduct} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
                <Plus className="h-8 w-8" />
            </Button>
        </AddProductDialog>

        <AlertDialog open={isAddListDialogOpen} onOpenChange={setIsAddListDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Criar Nova Lista</AlertDialogTitle>
                    <AlertDialogDescription>
                        Digite o nome para sua nova lista de produtos.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Input ref={newListNameRef} placeholder="Ex: Compras da Semana" />
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateList}>Criar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    