
"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent, useRef } from 'react';
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

const LONG_PRESS_DURATION = 700; // milliseconds
const DRAG_THRESHOLD = 10; // pixels

export function ProductSearchTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [clientSideProducts, setClientSideProducts] = useState<Product[]>(resequenceProducts(mockProducts));
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
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


  const handleRowInteractionStart = (productId: string, clientX: number, clientY: number) => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    pointerDownPositionRef.current = { x: clientX, y: clientY };
    longPressTimerRef.current = setTimeout(() => {
      setIsSelectionModeActive(true);
      setSelectedProductIds((prevSelected) =>
        prevSelected.includes(productId) ? prevSelected : [...prevSelected, productId]
      );
      longPressTimerRef.current = null;
      pointerDownPositionRef.current = null; 
    }, LONG_PRESS_DURATION);
  };

  const handleRowInteractionEnd = (product: Product, clientX: number, clientY: number) => {
    const wasLongPress = !longPressTimerRef.current && isSelectionModeActive; 
    
    if (longPressTimerRef.current) { 
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      
      if (!isSelectionModeActive) {
        setSelectedProductIds([]); 
        setSelectedProduct(product);
        setIsActionDialogOpen(true);
      } else {
        handleToggleSelectProduct(product.id);
      }
    } else if (isSelectionModeActive && !wasLongPress) {
        const dx = Math.abs(clientX - (pointerDownPositionRef.current?.x ?? 0));
        const dy = Math.abs(clientY - (pointerDownPositionRef.current?.y ?? 0));
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) { 
          handleToggleSelectProduct(product.id);
        }
    }
    pointerDownPositionRef.current = null;
  };
  
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!longPressTimerRef.current || !pointerDownPositionRef.current) return;

    const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - pointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      pointerDownPositionRef.current = null; 
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
      setIsActionDialogOpen(false); 
    }
  };

  const confirmDeleteSingleProduct = () => {
    if (selectedProduct) {
      setIsDeleteDialogOpen(true);
      setIsActionDialogOpen(false);
    }
  };

  const handleDeleteSingleProduct = () => {
    if (selectedProduct) {
      let updatedProducts = clientSideProducts.filter(p => p.id !== selectedProduct.id);
      updatedProducts = resequenceProducts(updatedProducts);
      setClientSideProducts(updatedProducts);
      toast({ title: "Produto excluído", description: `${selectedProduct.produto} foi removido.` });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      if (isSelectionModeActive && selectedProductIds.includes(selectedProduct.id)) {
        setSelectedProductIds(ids => ids.filter(id => id !== selectedProduct.id));
      }
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
          <div className="mt-4 flex justify-end space-x-2">
            {isSelectionModeActive && (
              <Button variant="ghost" onClick={cancelSelectionMode}>
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Seleção
              </Button>
            )}
            {isSelectionModeActive && selectedProductIds.length > 0 && (
              <Button variant="destructive" onClick={confirmDeleteSelected}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Selecionados ({selectedProductIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {isSelectionModeActive && (
                    <TableHead className="w-[50px]">
                       <Checkbox
                          id="selectAll"
                          aria-label="Selecionar todas as linhas visíveis"
                          checked={selectAllCheckedState}
                          onCheckedChange={handleSelectAll}
                        />
                    </TableHead>
                  )}
                  <TableHead className={`w-[80px] ${!isSelectionModeActive ? 'pl-4' : ''}`}>ID</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="w-[150px]">Validade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className={getRowStyling(product.validade, selectedProductIds.includes(product.id), isSelectionModeActive)}
                      data-state={selectedProductIds.includes(product.id) ? "selected" : ""}
                      onMouseDown={(e) => handleRowInteractionStart(product.id, e.clientX, e.clientY)}
                      onMouseUp={(e) => handleRowInteractionEnd(product, e.clientX, e.clientY)}
                      onMouseLeave={() => {
                        if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                        pointerDownPositionRef.current = null;
                      }}
                      onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
                      onTouchStart={(e) => handleRowInteractionStart(product.id, e.touches[0].clientX, e.touches[0].clientY)}
                      onTouchEnd={(e) => {
                        if (e.changedTouches.length > 0) {
                           handleRowInteractionEnd(product, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
                        }
                      }}
                      onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
                      onTouchCancel={() => {
                         if (longPressTimerRef.current) {
                          clearTimeout(longPressTimerRef.current);
                          longPressTimerRef.current = null;
                        }
                        pointerDownPositionRef.current = null;
                      }}

                    >
                      {isSelectionModeActive && (
                        <TableCell onClick={(e) => e.stopPropagation()} className="py-0">
                           <Checkbox
                              aria-label={`Selecionar produto ${product.produto}`}
                              checked={selectedProductIds.includes(product.id)}
                              onCheckedChange={() => handleToggleSelectProduct(product.id)}
                            />
                        </TableCell>
                      )}
                      <TableCell className={`font-medium ${!isSelectionModeActive ? 'pl-4' : ''}`}>{product.id}</TableCell>
                      <TableCell>{product.produto}</TableCell>
                      <TableCell>{product.marca}</TableCell>
                      <TableCell>{product.unidade}</TableCell>
                      <TableCell>
                        {isValid(parseISO(product.validade))
                          ? format(parseISO(product.validade), 'dd/MM/yyyy')
                          : 'Data inválida'}
                      </TableCell>
                    </TableRow>
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

      {selectedProduct && (
        <AlertDialog open={isActionDialogOpen} onOpenChange={(isOpen) => {
          setIsActionDialogOpen(isOpen);
          if (!isOpen) setSelectedProduct(null);
        }}>
          <AlertDialogContent className="sm:max-w-xs p-4">
            <AlertDialogHeader className="mb-2">
              <AlertDialogTitle className="text-base text-center">
                Ações: {selectedProduct.produto}
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex justify-center space-x-3 py-2">
              <Button variant="outline" size="icon" onClick={handleEdit} aria-label="Editar Produto">
                <Pencil className="h-5 w-5" />
              </Button>
              <Button variant="destructive" size="icon" onClick={confirmDeleteSingleProduct} aria-label="Excluir Produto">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
            <AlertDialogFooter className="mt-2 sm:justify-center">
              <AlertDialogCancel onClick={() => setSelectedProduct(null)} className="h-8 px-3">Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
          if (!isOpen) setEditingProduct(null);
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

