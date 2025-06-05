
"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent, useRef, type PointerEvent, type TouchEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Pencil, Trash2, XCircle } from 'lucide-react';
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
  { id: '1', produto: 'Leite Integral UHT', marca: 'Tirol', unidade: 'Litro', validade: '2024-12-15' },
  { id: '2', produto: 'Pão de Forma Tradicional', marca: 'Seven Boys', unidade: 'Pacote 400g', validade: '2024-07-20' },
  { id: '3', produto: 'Café Torrado e Moído', marca: '3 Corações', unidade: 'Pacote 500g', validade: '2025-03-10' },
  { id: '4', produto: 'Arroz Branco Tipo 1', marca: 'Camil', unidade: 'Pacote 5kg', validade: '2025-08-01' },
  { id: '5', produto: 'Feijão Carioca Tipo 1', marca: 'Kicaldo', unidade: 'Pacote 1kg', validade: '2025-06-22' },
  { id: '6', produto: 'Óleo de Soja Refinado', marca: 'Soya', unidade: 'Garrafa 900ml', validade: '2024-11-05' },
  { id: '7', produto: 'Refrigerante Guaraná', marca: 'Antarctica', unidade: 'Lata 350ml', validade: '2024-10-30' },
  { id: '8', produto: 'Biscoito Cream Cracker', marca: 'Vitarella', unidade: 'Pacote 350g', validade: '2024-09-01' },
  { id: '9', produto: 'Macarrão Espaguete', marca: 'Barilla', unidade: 'Pacote 500g', validade: '2026-01-15' },
  { id: '10', produto: 'Açúcar Refinado', marca: 'União', unidade: 'Pacote 1kg', validade: '2025-12-31' },
  { id: '11', produto: 'Leite Condensado', marca: 'Moça', unidade: 'Lata 395g', validade: '2025-02-20' },
  { id: '12', produto: 'Creme de Leite UHT', marca: 'Piracanjuba', unidade: 'Caixa 200g', validade: '2024-11-25' },
  { id: '13', produto: 'Iogurte Natural', marca: 'Batavo', unidade: 'Copo 170g', validade: new Date().toISOString().split('T')[0] }, // Today
  { id: '14', produto: 'Queijo Minas Frescal', marca: 'Polenghi', unidade: 'Peça 250g', validade: subDays(new Date(), 1).toISOString().split('T')[0] }, // Yesterday
  { id: '15', produto: 'Suco de Laranja Integral', marca: 'Del Valle', unidade: 'Caixa 1L', validade: addDays(new Date(), 1).toISOString().split('T')[0] }, // Tomorrow
  { id: '16', produto: 'Manteiga com Sal', marca: 'Aviação', unidade: 'Tablete 200g', validade: '2023-01-01' }, // Expired
  { id: '17', produto: 'Requeijão Cremoso', marca: 'Vigor', unidade: 'Copo 200g', validade: addDays(new Date(), 3).toISOString().split('T')[0] }, // Next 7 days
  { id: '18', produto: 'Doce de Leite', marca: 'Itambé', unidade: 'Pote 400g', validade: subDays(new Date(), 5).toISOString().split('T')[0] }, // Last 7 days
];

const normalizeString = (str: string) => {
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

const LONG_PRESS_DURATION = 700; 
const DRAG_THRESHOLD = 10; 

export function ProductSearchTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [clientSideProducts, setClientSideProducts] = useState<Product[]>(resequenceProducts(mockProducts));
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Product, 'id'>>({
    produto: '',
    marca: '',
    unidade: '',
    validade: '',
  });
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [activePopoverProductId, setActivePopoverProductId] = useState<string | null>(null);


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
        pointerDownPositionRef.current = null; // Interaction handled by long press, prevent mouseUp toggle
      }
      longPressTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  };
  
  const handleRowInteractionEnd = (product: Product, clientX: number, clientY: number, target: EventTarget | null) => {
    const isClickOnCheckboxCell = target instanceof HTMLElement && !!target.closest('[data-is-checkbox-cell="true"]');
  
    if (longPressTimerRef.current) { // Timer was active, meaning it's a short click before long press triggered
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      // If short click & in selection mode & not on checkbox cell -> toggle selection
      // This case is less common as starting interaction while timer is running and in selection mode is tricky
      if (isSelectionModeActive && !isClickOnCheckboxCell && pointerDownPositionRef.current) {
         const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
         const dy = Math.abs(clientY - pointerDownPositionRef.current.y);
         if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            handleToggleSelectProduct(product.id);
         }
      }
      // If !isSelectionModeActive, short click opens Popover (handled by PopoverTrigger)
    } else if (isSelectionModeActive && pointerDownPositionRef.current) {
      // In selection mode, and timer was NOT active (either it fired, or we started interaction in selection mode)
      // AND pointerDownPositionRef is not null (meaning it wasn't a long press that just completed and handled it)
      const dx = Math.abs(clientX - (pointerDownPositionRef.current?.x ?? clientX));
      const dy = Math.abs(clientY - (pointerDownPositionRef.current?.y ?? clientY));
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) { // It was a click-like release
        if (!isClickOnCheckboxCell) {
          handleToggleSelectProduct(product.id);
        }
      }
    }
    // If pointerDownPositionRef.current is null here, it means either:
    // 1. A long press just completed and set it to null (handled).
    // 2. A drag occurred and handlePointerMove set it to null (handled).
    
    // Always clear pointerDownPositionRef if it wasn't cleared by long press timer
    if (pointerDownPositionRef.current) {
        pointerDownPositionRef.current = null;
    }
  };
  
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!pointerDownPositionRef.current) return;

    // If a long press timer is active, check for drag to cancel it
    if (longPressTimerRef.current) {
        const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
        const dy = Math.abs(clientY - pointerDownPositionRef.current.y);

        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
          pointerDownPositionRef.current = null; // Mark as drag
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
    const normalizedSearchTerm = normalizeString(searchTerm);
    let products = clientSideProducts;

    if (normalizedSearchTerm) {
      products = products.filter(product =>
        normalizeString(product.id).includes(normalizedSearchTerm) ||
        normalizeString(product.produto).includes(normalizedSearchTerm) ||
        normalizeString(product.marca).includes(normalizedSearchTerm) ||
        normalizeString(product.unidade).includes(normalizedSearchTerm) ||
        normalizeString(product.validade).includes(normalizedSearchTerm)
      );
    }

    if (selectedDateFilter === 'all') {
      return products;
    }

    const today = startOfDay(new Date());

    return products.filter(product => {
      const productDate = parseISO(product.validade);
      if (!isValid(productDate)) return false;

      const productDateStartOfDay = startOfDay(productDate);

      switch (selectedDateFilter) {
        case 'today':
          return isToday(productDateStartOfDay);
        case 'yesterday':
          return isYesterday(productDateStartOfDay);
        case 'tomorrow':
          return isTomorrow(productDateStartOfDay);
        case 'expired':
          return isPast(productDateStartOfDay) && !isToday(productDateStartOfDay);
        case 'next7':
          return isWithinInterval(productDateStartOfDay, { start: today, end: endOfDay(addDays(today, 6)) });
        case 'last7':
          return isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(today, 6)), end: endOfDay(today) });
        case 'next14':
          return isWithinInterval(productDateStartOfDay, { start: today, end: endOfDay(addDays(today, 13)) });
        case 'last14':
          return isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(today, 13)), end: endOfDay(today) });
        case 'thisMonth': {
          const start = startOfMonth(today);
          const end = endOfMonth(today);
          return isWithinInterval(productDateStartOfDay, { start, end });
        }
        case 'nextMonth': {
          const start = startOfMonth(addMonths(today, 1));
          const end = endOfMonth(addMonths(today, 1));
          return isWithinInterval(productDateStartOfDay, { start, end });
        }
        default:
          return true;
      }
    });
  }, [searchTerm, clientSideProducts, selectedDateFilter]);

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
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, Produto, Marca, Unidade ou Validade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
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
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {isSelectionModeActive && (
                    <TableHead className="w-[50px] px-2">
                       <Checkbox
                          id="selectAll"
                          aria-label="Selecionar todas as linhas visíveis"
                          checked={selectAllCheckedState}
                          onCheckedChange={handleSelectAll}
                        />
                    </TableHead>
                  )}
                  <TableHead className={`w-[80px] ${!isSelectionModeActive ? 'pl-4' : 'pl-2'}`}>ID</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="w-[150px]">Validade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <Popover
                      key={product.id}
                      open={activePopoverProductId === product.id && !isSelectionModeActive} // Only open if not in selection mode
                      onOpenChange={(isOpen) => {
                        if (isSelectionModeActive) return; 
                        if (isOpen) {
                          setSelectedProduct(product);
                          setActivePopoverProductId(product.id);
                        } else {
                          if (activePopoverProductId === product.id) {
                            setActivePopoverProductId(null);
                            //setSelectedProduct(null); // Keep selectedProduct if dialogs are open
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
                          onPointerLeave={() => { // Clear timer if pointer leaves row during press
                            if (longPressTimerRef.current) {
                              clearTimeout(longPressTimerRef.current);
                              longPressTimerRef.current = null;
                            }
                            // Don't clear pointerDownPositionRef here, move might handle it or up might need it
                          }}
                          onPointerMove={(e: PointerEvent<HTMLTableRowElement>) => {
                            handlePointerMove(e.clientX, e.clientY);
                          }}
                          onTouchStart={(e: TouchEvent<HTMLTableRowElement>) => {
                            if (e.touches.length === 1) { // Ensure single touch
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
                          onTouchCancel={() => { // Similar to pointer leave
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
                          <TableCell className={`font-medium ${!isSelectionModeActive ? 'pl-4' : 'pl-2'}`}>{product.id}</TableCell>
                          <TableCell>{product.produto}</TableCell>
                          <TableCell>{product.marca}</TableCell>
                          <TableCell>{product.unidade}</TableCell>
                          <TableCell>
                            {isValid(parseISO(product.validade))
                              ? format(parseISO(product.validade), 'dd/MM/yyyy')
                              : 'Data inválida'}
                          </TableCell>
                        </TableRow>
                      </PopoverTrigger>
                       {!isSelectionModeActive && (
                        <PopoverContent side="top" align="end" className="w-auto p-1 z-50" 
                          onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
                          onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
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
                    <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="text-center h-24">
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
          if (!isOpen) setSelectedProduct(null); // Clear selected product when dialog closes
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
            //setSelectedProduct(null); // Clear selectedProduct if edit is cancelled
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
                <Label htmlFor="produto" className="text-right">
                  Produto
                </Label>
                <Input
                  id="produto"
                  name="produto"
                  value={editFormData.produto}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="marca" className="text-right">
                  Marca
                </Label>
                <Input
                  id="marca"
                  name="marca"
                  value={editFormData.marca}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unidade" className="text-right">
                  Unidade
                </Label>
                <Input
                  id="unidade"
                  name="unidade"
                  value={editFormData.unidade}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validade" className="text-right">
                  Validade
                </Label>
                <Input
                  id="validade"
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
    </>
  );
}

