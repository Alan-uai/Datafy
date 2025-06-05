
"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent, useRef, type PointerEvent, type TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Table, TableBody as ShadTableBody, TableCell, TableHeader, TableRow as ShadTableRow } from '@/components/ui/table';
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

const MotionTableBody = motion(ShadTableBody);
const MotionTableRow = motion(ShadTableRow);

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

const getRowStyling = (validade: string, isSelected: boolean, isSelectionModeActive: boolean, isExploding?: boolean): string => {
  let baseStyle = 'transition-colors duration-150 ease-in-out relative';

  if (isExploding) {
    return `${baseStyle} bg-transparent`; 
  }

  if (isSelectionModeActive) {
    baseStyle += isSelected ? ' bg-primary/20 dark:bg-primary/30' : ' hover:bg-muted/50 cursor-pointer';
  } else {
    baseStyle += ' hover:bg-muted/50 cursor-pointer';
  }
  
  if (!isValid(parseISO(validade))) return baseStyle;

  const productDateStartOfDay = startOfDay(parseISO(validade));
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
    isExploding: product.isExploding 
  }));
};

const LONG_PRESS_DURATION = 500; 
const DRAG_THRESHOLD = 10; 

const initialNewProductFormData: Omit<Product, 'id' | 'isExploding'> = {
  produto: '',
  marca: '',
  unidade: '',
  validade: '',
};

type SortableKey = keyof Omit<Product, 'isExploding'>;

const Particle = ({ onComplete }: { onComplete: () => void }) => {
  const numParticles = 20;
  const animationDuration = 0.7; 

  // Use a ref to track if onComplete has been called to prevent multiple calls
  const onCompleteCalledRef = useRef(false);

  const handleAnimationComplete = () => {
    if (!onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true;
      onComplete();
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
    >
      {Array.from({ length: numParticles }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-primary rounded-full"
          initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          animate={{
            x: (Math.random() - 0.5) * 200, 
            y: (Math.random() - 0.5) * 80,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            duration: animationDuration,
            delay: Math.random() * 0.2, 
            ease: "easeOut",
          }}
          onAnimationComplete={i === numParticles -1 ? handleAnimationComplete : undefined}
        />
      ))}
    </motion.div>
  );
};


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
  const [editFormData, setEditFormData] = useState<Omit<Product, 'id' | 'isExploding'>>({ ...initialNewProductFormData });
  
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [activePopoverProductId, setActivePopoverProductId] = useState<string | null>(null);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProductFormData, setNewProductFormData] = useState<Omit<Product, 'id' | 'isExploding'>>({ ...initialNewProductFormData });
  
  const [isAddActionPopoverOpen, setIsAddActionPopoverOpen] = useState(false);
  const longPressHeaderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const headerPointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const validadeHeaderRef = useRef<HTMLTableCellElement>(null);


  const finalizeDeleteProduct = (productId: string) => {
    setClientSideProducts(prevProducts =>
      resequenceProducts(prevProducts.filter(p => p.id !== productId))
    );
     // Check if this was the last exploding product among the initially selected ones
    const stillExploding = clientSideProducts.some(p => p.isExploding && p.id !== productId);
    if (!stillExploding && selectedProductIds.includes(productId)) {
        // If this product was part of a multi-selection and it's the last one to finish exploding
        // or if all selected products have been processed.
        const remainingSelected = selectedProductIds.filter(id => id !== productId);
        if (remainingSelected.length === 0 || !clientSideProducts.some(p => remainingSelected.includes(p.id) && p.isExploding)) {
           setSelectedProductIds([]);
           setIsSelectionModeActive(false);
        }
    }
  };


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
    if (!pointerDownPositionRef.current || !longPressTimerRef.current) return;

    const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - pointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      pointerDownPositionRef.current = null; 
    }
  };

  const handleHeaderPointerDown = (clientX: number, clientY: number) => {
    if (isSelectionModeActive) return;
    headerPointerDownPositionRef.current = { x: clientX, y: clientY };

    if (longPressHeaderTimerRef.current) {
      clearTimeout(longPressHeaderTimerRef.current);
    }
    longPressHeaderTimerRef.current = setTimeout(() => {
      if (headerPointerDownPositionRef.current) { 
        setIsAddActionPopoverOpen(true);
        headerPointerDownPositionRef.current = null; 
      }
      longPressHeaderTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  };

  const handleHeaderPointerUp = (column: SortableKey) => {
    if (longPressHeaderTimerRef.current) { 
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
      if (headerPointerDownPositionRef.current) { 
        handleHeaderClick(column);
      }
    } else if (headerPointerDownPositionRef.current) {
        handleHeaderClick(column); 
    } else if (!isAddActionPopoverOpen) { // If popover isn't opening, treat as click
        handleHeaderClick(column);
    }
    
    if (pointerDownPositionRef.current && isAddActionPopoverOpen) { 
        // Do nothing if long press led to popover
    }
    headerPointerDownPositionRef.current = null;
  };

  const handleHeaderPointerMove = (clientX: number, clientY: number) => {
    if (!headerPointerDownPositionRef.current || !longPressHeaderTimerRef.current) return;
    
    const dx = Math.abs(clientX - headerPointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - headerPointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
      headerPointerDownPositionRef.current = null;
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
      setClientSideProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === selectedProduct.id ? { ...p, isExploding: true } : p
        )
      );
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
        p.id === editingProduct.id ? { ...editingProduct, ...editFormData, isExploding: p.isExploding } : p
      );
      setClientSideProducts(updatedProducts);
      toast({ title: "Produto atualizado", description: `${editFormData.produto} foi atualizado com sucesso.` });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearch = normalizeString(searchTerm);
    let productsToFilter = [...clientSideProducts];


    if (normalizedSearch) {
      productsToFilter = productsToFilter.filter(product =>
        !product.isExploding && Object.values(product).some(value =>
          normalizeString(String(value)).includes(normalizedSearch)
        ) || product.isExploding 
      );
    }

    if (selectedDateFilter !== 'all') {
      const today = startOfDay(new Date());
      productsToFilter = productsToFilter.filter(product => {
        if (product.isExploding) return true; 
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
    
    const displayableProducts = productsToFilter.filter(p => !p.isExploding);
    const explodingProducts = productsToFilter.filter(p => p.isExploding);

    if (sortBy && sortBy !== 'none') {
      displayableProducts.sort((a, b) => {
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
    return [...displayableProducts, ...explodingProducts];
  }, [searchTerm, clientSideProducts, selectedDateFilter, sortBy, sortDirection]);

  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prevSelected) =>
      prevSelected.includes(productId)
        ? prevSelected.filter((id) => id !== productId)
        : [...prevSelected, productId]
    );
  };

  const handleSelectAll = (isChecked: boolean | 'indeterminate') => {
    const visibleProductsNotExploding = filteredProducts.filter(p => !p.isExploding);
    if (isChecked === true) {
      setSelectedProductIds(visibleProductsNotExploding.map((p) => p.id));
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
    setClientSideProducts(prevProducts =>
      prevProducts.map(p =>
        selectedProductIds.includes(p.id) ? { ...p, isExploding: true } : p
      )
    );
    toast({ title: `${selectedProductIds.length} produto(s) excluído(s)`, description: "Os produtos selecionados foram removidos." });
    setIsDeleteSelectedConfirmOpen(false);
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
    if (!newProductFormData.produto || !newProductFormData.validade || !newProductFormData.unidade) {
      toast({
        title: "Erro",
        description: "Produto, Quantidade e Validade são campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    const newProduct: Omit<Product, 'id' | 'isExploding'> = { ...newProductFormData };
    let updatedProducts = [...clientSideProducts, { ...newProduct, id: '', isExploding: false }]; 
    updatedProducts = resequenceProducts(updatedProducts);
    setClientSideProducts(updatedProducts);
    toast({ title: "Produto Adicionado", description: `${newProduct.produto} foi adicionado com sucesso.` });
    setIsAddProductDialogOpen(false);
    setNewProductFormData({ ...initialNewProductFormData });
  };

  const productsForDisplay = useMemo(() => filteredProducts.filter(p => !p.isExploding), [filteredProducts]);
  const allFilteredSelected = productsForDisplay.length > 0 && productsForDisplay.every(p => selectedProductIds.includes(p.id));
  const someFilteredSelected = productsForDisplay.length > 0 && selectedProductIds.some(id => productsForDisplay.find(p => p.id === id));

  const selectAllCheckedState = allFilteredSelected ? true : (someFilteredSelected ? "indeterminate" : false);


  const handleHeaderClick = (column: SortableKey) => {
    if (isSelectionModeActive) return; 

    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
     setIsAddActionPopoverOpen(false);
  };


  useEffect(() => {
    const explodingProductStillInList = clientSideProducts.some(p => p.isExploding);
    if (!explodingProductStillInList && selectedProductIds.length > 0) {
      // All explosion animations are done, check if any of the originally selected items are now gone
      const remainingSelectedStillInList = selectedProductIds.every(id => clientSideProducts.find(p => p.id === id && !p.isExploding));
      if (!remainingSelectedStillInList || selectedProductIds.length === 0) {
          // If some selected items were deleted and finished exploding, or if selection became empty
          // and no more items are exploding, then clear selection and mode.
          if (!clientSideProducts.some(p=> p.isExploding)) { // Ensure no other explosions are pending from single deletes
            setSelectedProductIds([]);
            setIsSelectionModeActive(false);
          }
      }
    }


    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (longPressHeaderTimerRef.current) {
        clearTimeout(longPressHeaderTimerRef.current);
      }
    };
  }, [clientSideProducts, selectedProductIds]);

  const renderHeaderCell = (column: SortableKey, label: string, classNameExt: string = "") => {
    const baseClasses = `py-3 ${isSelectionModeActive ? 'pl-2 pr-2' : 'px-2 md:px-4'} ${!isSelectionModeActive ? 'cursor-pointer hover:bg-muted/50' : ''}`;
    const icon = sortBy === column && sortBy !== 'none' && !isSelectionModeActive
      ? (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownZA className="inline-block ml-1 h-3 w-3" />)
      : null;

    return (
      <TableHead
        className={`${baseClasses} ${classNameExt}`}
        onPointerDown={(e: PointerEvent<HTMLTableCellElement>) => handleHeaderPointerDown(e.clientX, e.clientY)}
        onPointerUp={() => handleHeaderPointerUp(column)}
        onPointerLeave={() => {
          if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
          headerPointerDownPositionRef.current = null;
        }}
        onPointerMove={(e: PointerEvent<HTMLTableCellElement>) => handleHeaderPointerMove(e.clientX, e.clientY)}
        onTouchStart={(e: TouchEvent<HTMLTableCellElement>) => {
          if (e.touches.length === 1) handleHeaderPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={() => handleHeaderPointerUp(column)}
        onTouchCancel={() => {
           if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
           headerPointerDownPositionRef.current = null;
        }}
        onTouchMove={(e: TouchEvent<HTMLTableCellElement>) => {
          if (e.touches.length === 1) handleHeaderPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
      >
        {label} {icon}
      </TableHead>
    );
  };


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
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                <SelectTrigger className="w-full sm:w-auto">
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
                <ShadTableRow>
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
                  {renderHeaderCell('id', 'ID', 'w-[60px]')}
                  {renderHeaderCell('produto', 'Produto')}
                  {renderHeaderCell('marca', 'Marca', 'hidden sm:table-cell')}
                  {renderHeaderCell('unidade', 'Qtde', 'text-center')}
                  
                  <TableHead 
                    ref={validadeHeaderRef}
                    className={`min-w-[130px] text-right px-2 md:px-4 py-3 relative ${!isSelectionModeActive ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                     onPointerDown={(e: PointerEvent<HTMLTableCellElement>) => handleHeaderPointerDown(e.clientX, e.clientY)}
                     onPointerUp={() => handleHeaderPointerUp('validade')}
                     onPointerLeave={() => {
                       if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                       headerPointerDownPositionRef.current = null;
                     }}
                     onPointerMove={(e: PointerEvent<HTMLTableCellElement>) => handleHeaderPointerMove(e.clientX, e.clientY)}
                     onTouchStart={(e: TouchEvent<HTMLTableCellElement>) => {
                       if (e.touches.length === 1) handleHeaderPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                     }}
                     onTouchEnd={() => handleHeaderPointerUp('validade')}
                     onTouchCancel={() => {
                        if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                        headerPointerDownPositionRef.current = null;
                     }}
                     onTouchMove={(e: TouchEvent<HTMLTableCellElement>) => {
                       if (e.touches.length === 1) handleHeaderPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                     }}
                  >
                    Validade 
                    {sortBy === 'validade' && sortBy !== 'none' && !isSelectionModeActive && (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownZA className="inline-block ml-1 h-3 w-3" />)}
                    <Popover open={isAddActionPopoverOpen && !isSelectionModeActive} onOpenChange={setIsAddActionPopoverOpen}>
                       <PopoverTrigger asChild>
                         <span />
                       </PopoverTrigger>
                       <PopoverContent side="top" align="end" className="w-auto p-1 z-[60]" 
                         anchorRef={validadeHeaderRef}
                         onOpenAutoFocus={(e) => e.preventDefault()} 
                       >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            setIsAddProductDialogOpen(true);
                            setIsAddActionPopoverOpen(false);
                          }}
                          aria-label="Adicionar novo produto"
                        >
                          <PlusCircle className="h-4 w-4 text-primary" />
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                </ShadTableRow>
              </TableHeader>
              <MotionTableBody layout>
                <AnimatePresence initial={false}>
                  {filteredProducts.map((product) => (
                      <Popover
                        key={product.id} 
                        open={activePopoverProductId === product.id && !isSelectionModeActive && !product.isExploding} 
                        onOpenChange={(isOpen) => {
                          if (isSelectionModeActive || product.isExploding) return; 
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
                        <PopoverTrigger asChild disabled={isSelectionModeActive || product.isExploding}>
                          <MotionTableRow 
                            layout="position"
                            initial={{ opacity: 1, height: 'auto' }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }} // For non-exploding exit
                            className={getRowStyling(product.validade, selectedProductIds.includes(product.id), isSelectionModeActive, product.isExploding)}
                            data-state={selectedProductIds.includes(product.id) ? "selected" : ""}
                            onPointerDown={(e: PointerEvent<HTMLTableRowElement>) => {
                              if (product.isExploding) return;
                               handleRowInteractionStart(product.id, e.clientX, e.clientY);
                            }}
                            onPointerUp={(e: PointerEvent<HTMLTableRowElement>) => {
                              if (product.isExploding) return;
                              handleRowInteractionEnd(product, e.clientX, e.clientY, e.target);
                            }}
                            onPointerLeave={() => { 
                              if (product.isExploding) return;
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                            }}
                            onPointerMove={(e: PointerEvent<HTMLTableRowElement>) => {
                              if (product.isExploding) return;
                              handlePointerMove(e.clientX, e.clientY);
                            }}
                            onTouchStart={(e: TouchEvent<HTMLTableRowElement>) => {
                              if (product.isExploding) return;
                              if (e.touches.length === 1) { 
                                  handleRowInteractionStart(product.id, e.touches[0].clientX, e.touches[0].clientY);
                              }
                            }}
                            onTouchEnd={(e: TouchEvent<HTMLTableRowElement>) => {
                              if (product.isExploding) return;
                              if (e.changedTouches.length === 1) {
                                 handleRowInteractionEnd(product, e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target);
                              }
                            }}
                            onTouchMove={(e: TouchEvent<HTMLTableRowElement>) => {
                               if (product.isExploding) return;
                               if (e.touches.length === 1) {
                                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                               }
                            }}
                            onTouchCancel={() => { 
                               if (product.isExploding) return;
                               if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                              pointerDownPositionRef.current = null;
                            }}
                          >
                            {product.isExploding ? (
                              <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="p-0 h-[57px]"> 
                                <Particle onComplete={() => finalizeDeleteProduct(product.id)} />
                              </TableCell>
                            ) : (
                              <>
                                {isSelectionModeActive && (
                                  <TableCell data-is-checkbox-cell="true" className="py-0 px-2" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        aria-label={`Selecionar produto ${product.produto}`}
                                        checked={selectedProductIds.includes(product.id)}
                                        onCheckedChange={() => handleToggleSelectProduct(product.id)}
                                      />
                                  </TableCell>
                                )}
                                <TableCell className={`font-medium py-3 px-2 md:px-4 ${isSelectionModeActive ? 'pl-1 pr-1' : ''}`}>{product.id}</TableCell>
                                <TableCell className="py-3 px-2 md:px-4">{product.produto}</TableCell>
                                <TableCell className="py-3 px-2 md:px-4 hidden sm:table-cell">{product.marca}</TableCell>
                                <TableCell className="py-3 px-2 md:px-4 text-center">{product.unidade}</TableCell>
                                <TableCell className="py-3 px-2 md:px-4 text-right">
                                  {isValid(parseISO(product.validade))
                                    ? format(parseISO(product.validade), 'dd/MM/yyyy')
                                    : 'Data inválida'}
                                </TableCell>
                              </>
                            )}
                          </MotionTableRow>
                        </PopoverTrigger>
                         {!isSelectionModeActive && !product.isExploding && (
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
                  }
                   {filteredProducts.filter(p => !p.isExploding).length === 0 && !clientSideProducts.some(p => p.isExploding) && (
                     <MotionTableRow>
                       <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="text-center h-24 px-2 md:px-4 py-3">
                         Nenhum produto encontrado com os filtros aplicados.
                       </TableCell>
                     </MotionTableRow>
                   )}
                </AnimatePresence>
              </MotionTableBody>
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
                  Qtde
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
                Qtde
              </Label>
              <Input
                id="new-unidade"
                name="unidade"
                value={newProductFormData.unidade}
                onChange={handleNewProductFormChange}
                className="col-span-3"
                type="number"
                required
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
