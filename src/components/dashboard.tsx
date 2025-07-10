
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
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
import { products as initialProducts, categories as initialCategories } from "@/lib/data";
import type { Product, Category } from "@/lib/types";
import { format } from "date-fns";
import { Plus, Settings, Trash2, Edit, Search, Filter, ArrowUp, Grid3x3, X } from "lucide-react";
import { ExpiryAttentionReportCard } from './dashboard/ExpiryAttentionReportCard';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile, updateUserProfile } from "@/services/userService";
import type { UserProfile } from "@/services/userService";
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { WIDGET_MAP, type AllWidgetType } from './dashboard/widgets/widget-map';

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
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative">
            {isEditing && (
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 z-10 rounded-full"
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories] = useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(initialColumns);
  const [isEditingWidgets, setIsEditingWidgets] = useState(false);

  const activeWidgets = useMemo(() => userProfile?.preferences?.activeWidgets || [], [userProfile]);
  const availableWidgets = useMemo(() => {
    const allWidgetKeys = Object.keys(WIDGET_MAP) as AllWidgetType[];
    return allWidgetKeys.filter(key => !activeWidgets.includes(key));
  }, [activeWidgets]);

  const loadProfile = useCallback(async () => {
    if (currentUser) {
        const profile = await getUserProfile(currentUser.uid);
        setUserProfile(profile);
        if (profile?.preferences?.columnVisibility) {
            const mergedVisibility = { ...initialColumns, ...profile.preferences.columnVisibility };
            setColumnVisibility(mergedVisibility);
        }
    }
  }, [currentUser]);

  useEffect(() => {
    setIsClient(true);
    setProducts(initialProducts);
    loadProfile();
  }, [currentUser, loadProfile]);

  const productsForAI = useMemo(() => {
    if (!isClient) return [];
    return products.map(p => ({
      ...p,
      validade: p.expiryDate.toISOString(),
      produto: p.name,
    }));
  }, [products, isClient]);

  const handleColumnVisibilityChange = (key: string, value: boolean) => {
    const newVisibility = { ...columnVisibility, [key]: value };
    setColumnVisibility(newVisibility);
    if (currentUser) {
        updateUserProfile(currentUser.uid, {
            preferences: {
                ...(userProfile?.preferences ?? {}),
                columnVisibility: newVisibility,
            },
        });
    }
  };

  const handleAddProduct = (newProduct: Omit<Product, "id">) => {
    setProducts((prev) => [
      ...prev,
      { ...newProduct, id: new Date().getTime().toString() },
    ]);
  };

  const handleWidgetEditing = () => {
      if (isEditingWidgets) {
          // Save changes
          if (currentUser && userProfile) {
              updateUserProfile(currentUser.uid, {
                  preferences: {
                      ...userProfile.preferences,
                      activeWidgets: activeWidgets
                  }
              });
          }
      }
      setIsEditingWidgets(!isEditingWidgets);
  };

  const addWidget = (widgetId: AllWidgetType) => {
    if (!userProfile) return;
    const newActiveWidgets = [...activeWidgets, widgetId];
    setUserProfile({
        ...userProfile,
        preferences: {
            ...userProfile.preferences,
            activeWidgets: newActiveWidgets,
        }
    });
  };

  const removeWidget = (widgetId: AllWidgetType) => {
    if (!userProfile) return;
    const newActiveWidgets = activeWidgets.filter(id => id !== widgetId);
    setUserProfile({
        ...userProfile,
        preferences: {
            ...userProfile.preferences,
            activeWidgets: newActiveWidgets,
        }
    });
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && userProfile) {
      const oldIndex = activeWidgets.indexOf(active.id as AllWidgetType);
      const newIndex = activeWidgets.indexOf(over!.id as AllWidgetType);
      const newOrder = arrayMove(activeWidgets, oldIndex, newIndex);
      setUserProfile({
        ...userProfile,
        preferences: {
            ...userProfile.preferences,
            activeWidgets: newOrder,
        }
    });
    }
  };
  
  if (!isClient || !userProfile) {
      return (
        <div className="flex items-center justify-center h-screen">
            <p>Carregando...</p>
        </div>
      );
  }

  const widgetDataProps = { products, categories };

  return (
    <div className="flex flex-col h-full bg-background relative">
        <div className="p-4 md:p-6 space-y-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Grid3x3 className="h-7 w-7"/>
                    <h1 className="text-2xl font-bold">Dashboard Personalizado</h1>
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
                               onCheckedChange={(value) =>
                                 handleColumnVisibilityChange(key, !!value)
                               }
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
                <Card className="p-4">
                    <h3 className="mb-4 text-lg font-semibold">Adicionar Widgets</h3>
                    <Carousel opts={{ align: "start", dragFree: true }}>
                        <CarouselContent>
                            {availableWidgets.map(widgetId => {
                                const widget = WIDGET_MAP[widgetId];
                                return (
                                    <CarouselItem key={widgetId} className="basis-1/3 md:basis-1/4 lg:basis-1/5">
                                        <Button
                                            variant="outline"
                                            className="h-24 w-full flex flex-col items-center justify-center gap-2 p-2"
                                            onClick={() => addWidget(widgetId)}
                                        >
                                            <widget.Icon className="h-6 w-6" />
                                            <span className="text-xs text-center">{widget.title}</span>
                                        </Button>
                                    </CarouselItem>
                                );
                            })}
                        </CarouselContent>
                    </Carousel>
                </Card>
            )}

            <DndContext
                sensors={[]}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={activeWidgets} strategy={verticalListSortingStrategy}>
                    <div className="space-y-6">
                        {activeWidgets.map(widgetId => {
                            const WidgetComponent = WIDGET_MAP[widgetId]?.component;
                            if (!WidgetComponent) return null;
                            return (
                                <SortableWidget key={widgetId} id={widgetId} isEditing={isEditingWidgets} onRemove={removeWidget}>
                                    <WidgetComponent {...widgetDataProps} />
                                </SortableWidget>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>
            
            <ExpiryAttentionReportCard listProducts={productsForAI} />

            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                         {categories.slice(0, 2).map((cat, index) => {
                            const Icon = cat.icon;
                            return (
                                <Button key={cat.id} variant={index === 0 ? "secondary" : "ghost"} className={`gap-2 ${index === 0 ? 'bg-primary/20 text-primary' : ''}`}>
                                    <Icon className="h-4 w-4"/>
                                    {cat.name}
                                    <Edit className="h-3 w-3" />
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )
                        })}
                    </div>
                    <Button variant="outline"><Plus className="mr-2 h-4 w-4"/>Lista</Button>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input placeholder="Buscar produtos..." className="pl-10"/>
                    </div>
                    <Button variant="outline"><Filter className="mr-2 h-4 w-4"/>Filtro</Button>
                </div>
            </div>

            <div className="overflow-x-auto">
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
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {products.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                    Nenhum produto encontrado.
                </div>
            )}
        </div>
        <AddProductDialog categories={categories} onAddProduct={handleAddProduct} open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
                <Plus className="h-8 w-8" />
            </Button>
        </AddProductDialog>
    </div>
  );
}
