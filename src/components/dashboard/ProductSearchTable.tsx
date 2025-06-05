
"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent, useRef, type PointerEvent, type TouchEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Pencil, Trash2, XCircle, PlusCircle, ArrowUpAZ, ArrowDownZA } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  isValid,
  format,
} from 'date-fns';
import { useToast } from "@/hooks/use-toast";


const mockProducts: Product[] = [
  { id: '1', produto: 'Leite Integral UHT', marca: 'Tirol', unidade: '24', validade: '2024-12-15' },
  { id: '2', produto: 'Pão de Forma Tradicional', marca: 'Seven Boys', unidade: '10', validade: '2024-07-20' },
  { id: '3', produto: 'Café Torrado e Moído', marca: '3 Corações', unidade: '15', validade: '2025-03-10' },
  { id: '4', produto: 'Arroz Branco Tipo 1', marca: 'Camil', unidade: '5', validade: '2025-08-01' },
  { id: '5', produto: 'Feijão Carioca Tipo 1', marca: 'Kicaldo', unidade: '8', validade: '2025-06-22' },
  { id: '6', produto: 'Óleo de Soja Refinado', marca: 'Soya', unidade: '20', validade: '2024-11-05' },
  { id: '7', produto: 'Refrigerante Guaraná', marca: 'Antarctica', unidade: '48', validade: '2024-10-30' },
  { id: '8', produto: 'Biscoito Cream Cracker', marca: 'Vitarella', unidade: '30', validade: '2024-09-01' },
  { id: '9', produto: 'Macarrão Espaguete', marca: 'Barilla', unidade: '25', validade: '2026-01-15' },
  { id: '10', produto: 'Açúcar Refinado', marca: 'União', unidade: '18', validade: '2025-12-31' },
  { id: '11', produto: 'Leite Condensado', marca: 'Moça', unidade: '36', validade: '2025-02-20' },
  { id: '12', produto: 'Creme de Leite UHT', marca: 'Piracanjuba', unidade: '40', validade: '2024-11-25' },
  { id: '13', produto: 'Iogurte Natural', marca: 'Batavo', unidade: '12', validade: new Date().toISOString().split('T')[0] }, 
  { id: '14', produto: 'Queijo Minas Frescal', marca: 'Polenghi', unidade: '6', validade: subDays(new Date(), 1).toISOString().split('T')[0] }, 
  { id: '15', produto: 'Suco de Laranja Integral', marca: 'Del Valle', unidade: '9', validade: addDays(new Date(), 1).toISOString().split('T')[0] }, 
  { id: '16', produto: 'Manteiga com Sal', marca: 'Aviação', unidade: '3', validade: '2023-01-01' }, 
  { id: '17', produto: 'Requeijão Cremoso', marca: 'Vigor', unidade: '7', validade: addDays(new Date(), 3).toISOString().split('T')[0] }, 
  { id: '18', produto: 'Doce de Leite', marca: 'Itambé', unidade: '4', validade: subDays(new Date(), 5).toISOString().split('T')[0] }, 
];

const normalizeString = (str: string) => {
  if (typeof str !== 'string') return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const dateFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'tomorrow', label: 'Amanhã' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'next7', label: 'Próximos 7 dias' },
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'next14', label: 'Próximos 14 dias' },
  { value: 'last14', label: 'Últimos 14 dias' },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'nextMonth', label: 'Próximo mês' },
];

const getRowStyling = (validade: string, isSelected: boolean, isSelectionModeActive: boolean): string => {
  const productDate = parseISO(validade);
  let baseStyle = 'transition-colors duration-150 ease-in-out';

  if (isSelectionModeActive) {
    baseStyle += isSelected ? ' bg-primary/20 dark:bg-primary/30' : ' hover:bg-muted/50 cursor-pointer';
  } else {
    baseStyle += ' hover:bg-muted/50 cursor-pointer';
  }
  
  if (!isValid(productDate)) return baseStyle;

  const productDateStartOfDay = startOfDay(productDate);
  const today = startOfDay(new Date());

  if (isPast(productDateStartOfDay) && !isToday(productDateStartOfDay)) {
    return `${baseStyle} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200/70 dark:hover:bg-red-800/40`;
  }
  if (isToday(productDateStartOfDay) || isTomorrow(productDateStartOfDay)) {
    return `${baseStyle} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200/70 dark:hover:bg-orange-800/40`;
  }
  return baseStyle;
};

const resequenceProducts = (products: Product[]): Product[] => {
  return products.map((product, index) => ({
    ...product,
    id: (index + 1).toString(),
  }));
};

const LONG_PRESS_DURATION = 1000; 
const DRAG_THRESHOLD = 10; 

const initialNewProductFormData: Omit<Product, 'id'> = {
  produto: '',
  marca: '',
  unidade: '',
  validade: '',
};

type SortableKey = keyof Product;

export function ProductSearchTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [clientSideProducts, setClientSideProducts] = useState<Product[]>(resequenceProducts(mockProducts));
  
  const [sortBy, setSortBy] = useState<SortableKey | 'none'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Product, 'id'>>({ ...initialNewProductFormData });
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [activePopoverProductId, setActivePopoverProductId] = useState<string | null>(null);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProductFormData, setNewProductFormData] = useState<Omit<Product, 'id'>>({ ...initialNewProductFormData });


  const handleRowInteractionStart = (productId: string, clientX: number, clientY: number) => {
    pointerDownPositionRef.current = { x: clientX, y: clientY };

    if (isSelectionModeActive) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return; 
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      if (pointerDownPositionRef.current) { 
        setIsSelectionModeActive(true);
        setSelectedProductIds((prevSelected) =>
          prevSelected.includes(productId) ? prevSelected : [...prevSelected, productId]
        );
        setActivePopoverProductId(null); 
        pointerDownPositionRef.current = null; 
      }
      longPressTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  };
  
  const handleRowInteractionEnd = (product: Product, clientX: number, clientY: number, target: EventTarget | null) => {
    const isClickOnCheckboxCell = target instanceof HTMLElement && !!target.closest('[data-is-checkbox-cell="true"]');
  
    if (longPressTimerRef.current) { 
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      if (isSelectionModeActive && !isClickOnCheckboxCell && pointerDownPositionRef.current) {
         const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
         const dy = Math.abs(clientY - pointerDownPositionRef.current.y);
         if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            handleToggleSelectProduct(product.id);
         }
      }
    } else if (isSelectionModeActive && pointerDownPositionRef.current) {
      const dx = Math.abs(clientX - (pointerDownPositionRef.current?.x ?? clientX));
      const dy = Math.abs(clientY - (pointerDownPositionRef.current?.y ?? clientY));
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) { 
        if (!isClickOnCheckboxCell) {
          handleToggleSelectProduct(product.id);
        }
      }
    } else if (isSelectionModeActive && !pointerDownPositionRef.current && !isClickOnCheckboxCell) {
      handleToggleSelectProduct(product.id);
    }
    
    if (pointerDownPositionRef.current) {
        pointerDownPositionRef.current = null;
    }
  };
  
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!pointerDownPositionRef.current) return;

    if (longPressTimerRef.current) {
        const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
        const dy = Math.abs(clientY - pointerDownPositionRef.current.y);

        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
          pointerDownPositionRef.current = null; 
        }
    }
  };


  const handleEdit = () => {
    if (selectedProduct) {
      setEditingProduct(selectedProduct);
      setEditFormData({
        produto: selectedProduct.produto,
        marca: selectedProduct.marca,
        unidade: selectedProduct.unidade,
        validade: selectedProduct.validade,
      });
      setIsEditDialogOpen(true);
      setActivePopoverProductId(null); 
    }
  };

  const confirmDeleteSingleProduct = () => {
    if (selectedProduct) {
      setIsDeleteDialogOpen(true);
      setActivePopoverProductId(null);
    }
  };

  const handleDeleteSingleProduct = () => {
    if (selectedProduct) {
      let updatedProducts = clientSideProducts.filter(p => p.id !== selectedProduct.id);
      updatedProducts = resequenceProducts(updatedProducts);
      setClientSideProducts(updatedProducts);
      toast({ title: "Produto excluído", description: `${selectedProduct.produto} foi removido.` });
      setIsDeleteDialogOpen(false);
      if (isSelectionModeActive && selectedProductIds.includes(selectedProduct.id)) {
        setSelectedProductIds(ids => ids.filter(id => id !== selectedProduct.id));
      }
      setSelectedProduct(null);
    }
  };
  
  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      let updatedProducts = clientSideProducts.map(p =>
        p.id === editingProduct.id ? { ...editingProduct, ...editFormData } : p
      );
      setClientSideProducts(updatedProducts);
      toast({ title: "Produto atualizado", description: `${editFormData.produto} foi atualizado com sucesso.` });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    let productsToFilter = clientSideProducts;

    if (normalizedSearch) {
      productsToFilter = productsToFilter.filter(product =>
        Object.values(product).some(value =>
          normalizeString(String(value)).includes(normalizedSearch)
        )
      );
    }

    if (selectedDateFilter !== 'all') {
      const today = startOfDay(new Date());
      productsToFilter = productsToFilter.filter(product => {
        const productDate = parseISO(product.validade);
        if (!isValid(productDate)) return false;
        const productDateStartOfDay = startOfDay(productDate);

        switch (selectedDateFilter) {
          case 'today': return isToday(productDateStartOfDay);
          case 'yesterday': return isYesterday(productDateStartOfDay);
          case 'tomorrow': return isTomorrow(productDateStartOfDay);
          case 'expired': return isPast(productDateStartOfDay) && !isToday(productDateStartOfDay);
          case 'next7': return isWithinInterval(productDateStartOfDay, { start: today, end: endOfDay(addDays(today, 6)) });
          case 'last7': return isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(today, 6)), end: endOfDay(today) });
          case 'next14': return isWithinInterval(productDateStartOfDay, { start: today, end: endOfDay(addDays(today, 13)) });
          case 'last14': return isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(today, 13)), end: endOfDay(today) });
          case 'thisMonth': return isWithinInterval(productDateStartOfDay, { start: startOfMonth(today), end: endOfMonth(today) });
          case 'nextMonth': return isWithinInterval(productDateStartOfDay, { start: startOfMonth(addMonths(today, 1)), end: endOfMonth(addMonths(today, 1)) });
          default: return true;
        }
      });
    }

    if (sortBy && sortBy !== 'none') {
      productsToFilter.sort((a, b) => {
        const valA = a[sortBy];
        const valB = b[sortBy];
        let comparison = 0;

        if (sortBy === 'validade') {
          const dateA = parseISO(valA as string);
          const dateB = parseISO(valB as string);
          if (isValid(dateA) && isValid(dateB)) {
            comparison = dateA.getTime() - dateB.getTime();
          } else if (isValid(dateA)) {
            comparison = -1;
          } else if (isValid(dateB)) {
            comparison = 1;
          }
        } else if (sortBy === 'id' || sortBy === 'unidade') { 
          const numA = parseInt(valA as string, 10);
          const numB = parseInt(valB as string, 10);
          if (!isNaN(numA) && !isNaN(numB)) {
            comparison = numA - numB;
          } else {
            comparison = normalizeString(valA as string).localeCompare(normalizeString(valB as string));
          }
        } else {
          comparison = normalizeString(valA as string).localeCompare(normalizeString(valB as string));
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    return productsToFilter;
  }, [searchTerm, clientSideProducts, selectedDateFilter, sortBy, sortDirection]);

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId]
    );
  };

  const handleSelectAll = (isChecked: boolean | 'indeterminate') => {
    if (isChecked === true) {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };
  
  const [isDeleteSelectedConfirmOpen, setIsDeleteSelectedConfirmOpen] = useState(false);

  const confirmDeleteSelected = () => {
    if (selectedProductIds.length > 0) {
      setIsDeleteSelectedConfirmOpen(true);
    }
  };

  const handleDeleteSelected = () => {
    let remainingProducts = clientSideProducts.filter((p) => !selectedProductIds.includes(p.id));
    remainingProducts = resequenceProducts(remainingProducts);
    setClientSideProducts(remainingProducts);
    toast({ title: `${selectedProductIds.length} produto(s) excluído(s)`, description: "Os produtos selecionados foram removidos." });
    setSelectedProductIds([]);
    setIsDeleteSelectedConfirmOpen(false);
    setIsSelectionModeActive(false); 
  };
  
  const cancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedProductIds([]);
  };

  const handleNewProductFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddNewProduct = () => {
    if (!newProductFormData.produto || !newProductFormData.validade) {
      toast({
        title: "Erro",
        description: "Produto e Validade são campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    const newProduct: Omit<Product, 'id'> = { ...newProductFormData };
    let updatedProducts = [...clientSideProducts, { ...newProduct, id: '' }]; 
    updatedProducts = resequenceProducts(updatedProducts);
    setClientSideProducts(updatedProducts);
    toast({ title: "Produto Adicionado", description: `${newProduct.produto} foi adicionado com sucesso.` });
    setIsAddProductDialogOpen(false);
    setNewProductFormData({ ...initialNewProductFormData });
  };

  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.includes(p.id));
  const someFilteredSelected = selectedProductIds.length > 0 && selectedProductIds.some(id => filteredProducts.find(p => p.id === id));
  const selectAllCheckedState = allFilteredSelected ? true : (someFilteredSelected ? "indeterminate" : false);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);


  return (
    <>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Produtos</CardTitle>
          <div className="mt-4 flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por validade..." />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortableKey | 'none')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">ID</SelectItem>
                  <SelectItem value="produto">Produto</SelectItem>
                  <SelectItem value="marca">Marca</SelectItem>
                  <SelectItem value="unidade">Quantidade</SelectItem>
                  <SelectItem value="validade">Validade</SelectItem>
                  <SelectItem value="none">Não Ordenar</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')} 
                className="w-full"
                disabled={sortBy === 'none'}
              >
                {sortDirection === 'asc' ? <ArrowUpAZ className="mr-2 h-4 w-4" /> : <ArrowDownZA className="mr-2 h-4 w-4" />}
                {sortDirection === 'asc' ? 'A-Z' : 'Z-A'}
              </Button>
            </div>
          </div>
          {isSelectionModeActive && (
            <div className="mt-4 flex items-center justify-between">
               <p className="text-sm text-muted-foreground">
                {selectedProductIds.length} item(s) selecionado(s)
              </p>
              <div className="flex space-x-2">
                <Button variant="ghost" onClick={cancelSelectionMode} size="sm">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                {selectedProductIds.length > 0 && (
                  <Button variant="destructive" onClick={confirmDeleteSelected} size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-1 pb-1 pt-0">
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {isSelectionModeActive && (
                    <TableHead className="w-[50px] px-2 py-3">
                       <Checkbox
                          id="selectAll"
                          aria-label="Selecionar todas as linhas visíveis"
                          checked={selectAllCheckedState}
                          onCheckedChange={handleSelectAll}
                        />
                    </TableHead>
                  )}
                  <TableHead className={`w-[60px] py-3 ${isSelectionModeActive ? 'pl-2 pr-2' : 'pl-4 pr-2'}`}>ID</TableHead>
                  <TableHead className="px-2 md:px-4 py-3">Produto</TableHead>
                  <TableHead className="px-2 md:px-4 py-3 hidden sm:table-cell">Marca</TableHead>
                  <TableHead className="px-2 md:px-4 py-3 text-center">Quantidade</TableHead>
                  <TableHead className="min-w-[130px] text-right px-2 md:px-4 py-3">
                    <div className="flex items-center justify-end">
                      Validade
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="ml-4 h-6 w-6"
                        onClick={() => setIsAddProductDialogOpen(true)}
                        aria-label="Adicionar novo produto"
                      >
                        <PlusCircle className="h-4 w-4 text-primary" />
                      </Button>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Popover
                      key={product.id}
                      open={activePopoverProductId === product.id && !isSelectionModeActive} 
                      onOpenChange={(isOpen) => {
                        if (isSelectionModeActive) return; 
                        if (isOpen) {
                          setSelectedProduct(product);
                          setActivePopoverProductId(product.id);
                        } else {
                          if (activePopoverProductId === product.id) {
                            setActivePopoverProductId(null);
                          }
                        }
                      }}
                    >
                      <PopoverTrigger asChild disabled={isSelectionModeActive}>
                        <TableRow 
                          className={getRowStyling(product.validade, selectedProductIds.includes(product.id), isSelectionModeActive)}
                          data-state={selectedProductIds.includes(product.id) ? "selected" : ""}
                          onPointerDown={(e: PointerEvent<HTMLTableRowElement>) => {
                             handleRowInteractionStart(product.id, e.clientX, e.clientY);
                          }}
                          onPointerUp={(e: PointerEvent<HTMLTableRowElement>) => {
                            handleRowInteractionEnd(product, e.clientX, e.clientY, e.target);
                          }}
                          onPointerLeave={() => { 
                            if (longPressTimerRef.current) {
                              clearTimeout(longPressTimerRef.current);
                              longPressTimerRef.current = null;
                            }
                          }}
                          onPointerMove={(e: PointerEvent<HTMLTableRowElement>) => {
                            handlePointerMove(e.clientX, e.clientY);
                          }}
                          onTouchStart={(e: TouchEvent<HTMLTableRowElement>) => {
                            if (e.touches.length === 1) { 
                                handleRowInteractionStart(product.id, e.touches[0].clientX, e.touches[0].clientY);
                            }
                          }}
                          onTouchEnd={(e: TouchEvent<HTMLTableRowElement>) => {
                            if (e.changedTouches.length === 1) {
                               handleRowInteractionEnd(product, e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target);
                            }
                          }}
                          onTouchMove={(e: TouchEvent<HTMLTableRowElement>) => {
                             if (e.touches.length === 1) {
                                handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                             }
                          }}
                          onTouchCancel={() => { 
                             if (longPressTimerRef.current) {
                              clearTimeout(longPressTimerRef.current);
                              longPressTimerRef.current = null;
                            }
                            pointerDownPositionRef.current = null;
                          }}
                        >
                          {isSelectionModeActive && (
                            <TableCell data-is-checkbox-cell="true" className="py-0 px-2" onClick={(e) => e.stopPropagation()}>
                               <Checkbox
                                  aria-label={`Selecionar produto ${product.produto}`}
                                  checked={selectedProductIds.includes(product.id)}
                                  onCheckedChange={() => handleToggleSelectProduct(product.id)}
                                />
                            </TableCell>
                          )}
                          <TableCell className={`font-medium py-3 ${isSelectionModeActive ? 'pl-2 pr-2' : 'pl-4 pr-2'}`}>{product.id}</TableCell>
                          <TableCell className="px-2 md:px-4 py-3">{product.produto}</TableCell>
                          <TableCell className="px-2 md:px-4 py-3 hidden sm:table-cell">{product.marca}</TableCell>
                          <TableCell className="px-2 md:px-4 py-3 text-center">{product.unidade}</TableCell>
                          <TableCell className="text-right px-2 md:px-4 py-3">
                            {isValid(parseISO(product.validade))
                              ? format(parseISO(product.validade), 'dd/MM/yyyy')
                              : 'Data inválida'}
                          </TableCell>
                        </TableRow>
                      </PopoverTrigger>
                       {!isSelectionModeActive && (
                        <PopoverContent side="top" align="end" className="w-auto p-1 z-50" 
                          onOpenAutoFocus={(e) => e.preventDefault()} 
                          onCloseAutoFocus={(e) => e.preventDefault()} 
                        >
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Editar Produto">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={confirmDeleteSingleProduct} aria-label="Excluir Produto" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </PopoverContent>
                       )}
                    </Popover>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="text-center h-24 px-2 md:px-4 py-3">
                      Nenhum produto encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(isOpen) => {
          setIsDeleteDialogOpen(isOpen);
          if (!isOpen) setSelectedProduct(null); 
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{selectedProduct?.produto}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingleProduct} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteSelectedConfirmOpen} onOpenChange={setIsDeleteSelectedConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão de Múltiplos Itens</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir os {selectedProductIds.length} produtos selecionados? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive hover:bg-destructive/90">
              Excluir Selecionados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editingProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) {
            setEditingProduct(null);
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Produto: {editingProduct.produto}</DialogTitle>
              <DialogDescription>
                Modifique os detalhes do produto abaixo. Clique em salvar para aplicar as mudanças.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-produto" className="text-right">
                  Produto
                </Label>
                <Input
                  id="edit-produto"
                  name="produto"
                  value={editFormData.produto}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-marca" className="text-right">
                  Marca
                </Label>
                <Input
                  id="edit-marca"
                  name="marca"
                  value={editFormData.marca}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-unidade" className="text-right">
                  Quantidade
                </Label>
                <Input
                  id="edit-unidade"
                  name="unidade"
                  value={editFormData.unidade}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                  type="number"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-validade" className="text-right">
                  Validade
                </Label>
                <Input
                  id="edit-validade"
                  name="validade"
                  type="date"
                  value={editFormData.validade}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="button" onClick={handleSaveEdit}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={isAddProductDialogOpen} onOpenChange={(isOpen) => {
        setIsAddProductDialogOpen(isOpen);
        if (!isOpen) setNewProductFormData({ ...initialNewProductFormData });
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Produto</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do novo produto abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-produto" className="text-right">
                Produto
              </Label>
              <Input
                id="new-produto"
                name="produto"
                value={newProductFormData.produto}
                onChange={handleNewProductFormChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-marca" className="text-right">
                Marca
              </Label>
              <Input
                id="new-marca"
                name="marca"
                value={newProductFormData.marca}
                onChange={handleNewProductFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-unidade" className="text-right">
                Quantidade
              </Label>
              <Input
                id="new-unidade"
                name="unidade"
                value={newProductFormData.unidade}
                onChange={handleNewProductFormChange}
                className="col-span-3"
                type="number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-validade" className="text-right">
                Validade
              </Label>
              <Input
                id="new-validade"
                name="validade"
                type="date"
                value={newProductFormData.validade}
                onChange={handleNewProductFormChange}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleAddNewProduct}>Salvar Produto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
