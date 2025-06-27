"use client";

import type { Product, ProductList } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent, useRef, type PointerEvent, type TouchEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody as ShadTableBody,
  TableCell,
  TableHead as ShadTableHeaderComponent,
  TableRow as ShadTableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // CardTitle removed as header content is more custom now
import { Search, Pencil, Trash2, XCircle, FolderSymlink, CalendarCog, FilterX, Camera } from 'lucide-react';
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

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
import { ArrowUpAZ, ArrowDownAZ } from 'lucide-react'; // Import from lucide-react
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, updateProduct, deleteProduct, deleteMultipleProducts, moveProductsToList, updateMultipleProductExpirations } from '@/services/productService';
import { ProductList as ProductListType } from '@/types'; // Import ProductList type
import { cn } from '@/lib/utils';
import { ArrowUp01, ArrowDown01 } from 'lucide-react'; // Import numerical sort icons


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

const getRowStyling = (validade: string, isSelected: boolean, isSelectionModeActive: boolean, isExploding?: boolean): { styleString: string; particleColorClass: string } => {
  let baseStyle = 'transition-colors duration-150 ease-in-out relative';
  let particleColorClass = 'bg-white dark:bg-slate-800';

  if (isExploding) {
     if (!validade || !isValid(parseISO(validade))) {
      particleColorClass = 'bg-muted';
    } else {
      const productDateStartOfDay = startOfDay(parseISO(validade));
      if (isPast(productDateStartOfDay) && !isToday(productDateStartOfDay)) {
        particleColorClass = 'bg-red-500 dark:bg-red-600';
      } else if (isToday(productDateStartOfDay) || isTomorrow(productDateStartOfDay)) {
        particleColorClass = 'bg-orange-400 dark:bg-orange-500';
      } else {
         particleColorClass = 'bg-green-500 dark:bg-green-600';
      }
    }
    return { styleString: `${baseStyle} bg-transparent`, particleColorClass };
  }

  if (isSelectionModeActive) {
    baseStyle += isSelected ? ' bg-primary/20 dark:bg-primary/30' : ' hover:bg-muted/50 cursor-pointer';
  } else {
    baseStyle += ' hover:bg-muted/50 cursor-pointer';
  }

  if (!validade || !isValid(parseISO(validade))) {
    return { styleString: cn('border-b', `${baseStyle} text-muted-foreground`), particleColorClass: 'bg-muted' };
  }

  const productDateStartOfDay = startOfDay(parseISO(validade));

  if (isPast(productDateStartOfDay) && !isToday(productDateStartOfDay)) {
    return { styleString: cn('border-b', `${baseStyle} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200/70 dark:hover:bg-red-800/40`), particleColorClass: 'bg-red-500 dark:bg-red-600' };
  }
  if (isToday(productDateStartOfDay) || isTomorrow(productDateStartOfDay)) {
    return { styleString: cn('border-b', `${baseStyle} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200/70 dark:hover:bg-orange-800/40`), particleColorClass: 'bg-orange-400 dark:bg-orange-500' };
  }
  return { styleString: cn('border-b', baseStyle), particleColorClass: 'bg-green-500 dark:bg-green-600' };
};


const resequenceProducts = (products: Product[]): Product[] => {
  return products.map((product, index) => ({
    ...product,
    id: (index + 1).toString(),
  }));
};

const LONG_PRESS_DURATION = 500;
const DRAG_THRESHOLD = 10;
const SHOCKWAVE_DURATION = 700;
const BASE_SHOCKWAVE_STRENGTH_PX = 15;
const SHOCKWAVE_STRENGTH_DECREMENT_PER_STEP = 1.5;
const SEARCH_DEBOUNCE_DELAY = 300;


const initialEditProductFormData: Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'> = {
  produto: '',
  marca: '',
  unidade: '1',
  validade: '',
};

type SortableKey = Exclude<keyof Product, 'isExploding' | 'originalId' | 'listId'>;

interface ShockwaveTarget {
  id: string;
  distance: number;
  direction: 'up' | 'down';
  strength: number;
}

const Particle = ({ onComplete, particleColorClass }: { onComplete: () => void; particleColorClass: string; }) => {
  const numParticles = 30;
  const animationDuration = 1.5;
  const onCompleteCalledRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight,
      });
    }
  }, []);


  const handleAnimationComplete = () => {
    if (!onCompleteCalledRef.current) {
      onCompleteCalledRef.current = true;
      onComplete();
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden w-full h-full"
    >
      {dimensions.width > 0 && dimensions.height > 0 && Array.from({ length: numParticles }).map((_, i) => {
        const initialX = Math.random() * dimensions.width;
        const initialY = Math.random() * dimensions.height;

        const travelDistanceXBase = dimensions.width * (0.2 + Math.random() * 0.6);
        const travelDistanceYBase = dimensions.height * (1.0 + Math.random() * 0.8);

        const travelXSign = Math.random() < 0.5 ? -1 : 1;

        return (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full ${particleColorClass}`}
            style={{
              top: `${initialY}px`,
              left: `${initialX}px`,
             }}
            initial={{ opacity: 1, scale: Math.random() * 0.5 + 0.5 }}
            animate={{
              x: initialX + travelXSign * travelDistanceXBase,
              y: initialY - travelDistanceYBase,
              scale: 0,
              opacity: 0,
            }}
            transition={{
              duration: animationDuration * (0.7 + Math.random() * 0.6),
              delay: Math.random() * 0.2,
              ease: "circOut",
            }}
            onAnimationComplete={i === numParticles - 1 ? handleAnimationComplete : undefined}
          />
        );
      })}
    </div>
  );
};

interface ProductSearchTableProps {
  listId: string;
  onProductsChanged?: () => void;
 products: Product[]; // Add this prop
  isLoadingProducts: boolean;
  setProducts: (products: Product[]) => void; // Add setProducts prop
}

export function ProductSearchTable({ listId, products, isLoadingProducts, onProductsChanged }: ProductSearchTableProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchInputText, setSearchInputText] = useState('');
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);


  const [sortBy, setSortBy] = useState<SortableKey | 'none'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'>>({ ...initialEditProductFormData });
  const editProductNameInputRef = useRef<HTMLInputElement>(null);
  const [explodingProductOriginalIds, setExplodingProductOriginalIds] = useState<string[]>([]);


  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [activePopoverProductId, setActivePopoverProductId] = useState<string | null>(null);

  const longPressInitiatedSelectionRef = useRef(false);

  const [isSearchScannerActive, setIsSearchScannerActive] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);


  const [isMoveProductsDialogOpen, setIsMoveProductsDialogOpen] = useState(false);
  const [targetMoveListId, setTargetMoveListId] = useState<string>('');

  const [isBatchEditExpiryDialogOpen, setIsBatchEditExpiryDialogOpen] = useState(false);
  const [batchNewExpiryDate, setBatchNewExpiryDate] = useState<string>('');
  const [newlyAddedProductId, setNewlyAddedProductId] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');

  // Shockwave state remains as it's for delete animation within the table

  const [shockwaveTargets, setShockwaveTargets] = useState<ShockwaveTarget[]>([]);



 useEffect(() => {
    const isAnyProductExploding = products.some(p => p.isExploding);
    if (!isAnyProductExploding) {
      const anyProductSelected = selectedProductIds.filter(id => products.some(p => p.originalId === id && !explodingProductOriginalIds.includes(id))).length > 0;
      if (isSelectionModeActive && !anyProductSelected) {
        setIsSelectionModeActive(anyProductSelected);
      }
    }
  }, [products, selectedProductIds, isSelectionModeActive, setIsSelectionModeActive, explodingProductOriginalIds]);


  useEffect(() => {
    if (isSelectionModeActive) {
      setActivePopoverProductId(null); // Force close popovers when selection mode starts
    }
  }, [isSelectionModeActive]);


 useEffect(() => {
    if (shockwaveTargets.length > 0) {
      const timer = setTimeout(() => {
        setShockwaveTargets([]);
      }, SHOCKWAVE_DURATION + 100);
      return () => clearTimeout(timer);
    }
  }, [shockwaveTargets]);

  useEffect(() => {
    if (isEditDialogOpen && editProductNameInputRef.current) {
        editProductNameInputRef.current.focus();
    }
  }, [isEditDialogOpen]);

  useEffect(() => {
    if (newlyAddedProductId) {
      const timer = setTimeout(() => {
        setNewlyAddedProductId(null);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [newlyAddedProductId]);

  useEffect(() => {
    console.log("useEffect products change", { products, explodingProductOriginalIds });

    // Generate visual IDs when the products prop changes
    const productsWithVisualIds = products.map((product, index) => ({
      ...product,
      id: (index + 1).toString(), // Assign visual ID starting from 1
    }));
    setDisplayProducts(productsWithVisualIds);
 console.log("useEffect setting displayProducts:", productsWithVisualIds);
  }, [products]); // Depend on the products prop
 // Note: Adding explodingProductOriginalIds to dependency array here could cause issues if products are filtered out too early by the effect. Let's keep it simple for now based on the original issue description. Adding `products` ensures the effect runs when the products list itself changes.



  const finalizeDeleteProduct = (productOriginalId: string) => {
    setExplodingProductOriginalIds(prev => prev.filter(id => id !== productOriginalId));
 // onProductsChanged?.(); // No longer needed with local state update
  };
 const handleRowInteractionStart = (productOriginalId: string, clientX: number, clientY: number) => {
    pointerDownPositionRef.current = { x: clientX, y: clientY };
    longPressInitiatedSelectionRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      if (pointerDownPositionRef.current) {
        setIsSelectionModeActive(true);
        setSelectedProductIds((prevSelected) =>
          prevSelected.includes(productOriginalId) ? prevSelected : [...prevSelected, productOriginalId]
        );
        setActivePopoverProductId(null);
        longPressInitiatedSelectionRef.current = true;
      }
      longPressTimerRef.current = null;
      pointerDownPositionRef.current = null;
    }, LONG_PRESS_DURATION);
  };

 const handleRowInteractionEnd = (product: Product, clientX: number, clientY: number, target: EventTarget | null) => {
    if (longPressInitiatedSelectionRef.current) {
      longPressInitiatedSelectionRef.current = false;
      pointerDownPositionRef.current = null;
      return;
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const isClickOnCheckboxCell = target instanceof HTMLElement && !!target.closest('[data-is-checkbox-cell="true"]');

    if (pointerDownPositionRef.current) {
      const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
      const dy = Math.abs(clientY - pointerDownPositionRef.current.y);

      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        if (isSelectionModeActive) {
          if (!isClickOnCheckboxCell && product.originalId) {
            handleToggleSelectProduct(product.originalId);
          }
        } else {
            if (!product.isExploding && product.originalId) {
                // Don't set state here, let the popover handle its own opening
                setSelectedProduct(product);
            }
        }
      }
    }
    pointerDownPositionRef.current = null;
  };


  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!pointerDownPositionRef.current || !longPressTimerRef.current) return;

    const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - pointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };


  const handleEdit = () => {
    if (selectedProduct) {
      setEditingProduct(selectedProduct);
      setEditFormData({
        produto: selectedProduct.produto,
        marca: selectedProduct.marca,
        unidade: selectedProduct.unidade.toString(),
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

 const triggerShockwave = (deletedOriginalIds: string[]) => {
    const currentVisibleProducts = filteredProducts;
    const newShockwaveTargetsMap = new Map<string, ShockwaveTarget>();

    deletedOriginalIds.forEach(deletedId => {
        const deletedProductVisualIndex = currentVisibleProducts.findIndex(p => p.originalId === deletedId);
        if (deletedProductVisualIndex === -1) return;

        for (let direction of [-1, 1]) {
            let currentDistance = 1;
            while(true) {
                let calculatedStrength = BASE_SHOCKWAVE_STRENGTH_PX - (currentDistance - 1) * SHOCKWAVE_STRENGTH_DECREMENT_PER_STEP;

                if (calculatedStrength <= 0) {
                     break;
                }

                const neighborIndex = deletedProductVisualIndex + (currentDistance * direction);
                if (neighborIndex < 0 || neighborIndex >= currentVisibleProducts.length) {
                     break;
                }

                const neighbor = currentVisibleProducts[neighborIndex];
                if (neighbor && neighbor.originalId && !neighbor.isExploding && !deletedOriginalIds.includes(neighbor.originalId)) {
                    const existingTarget = newShockwaveTargetsMap.get(neighbor.originalId);
                    if (!existingTarget || calculatedStrength > existingTarget.strength) {
                         newShockwaveTargetsMap.set(neighbor.originalId, {
                            id: neighbor.originalId,
                            distance: currentDistance,
                            direction: direction === -1 ? 'up' : 'down',
                            strength: calculatedStrength,
                        });
                    }
                }
                currentDistance++;
            }
        }
    });
    setShockwaveTargets(Array.from(newShockwaveTargetsMap.values()));
};


  const handleDeleteSingleProduct = async () => {
    if (selectedProduct && selectedProduct.originalId && currentUser?.uid) {
      try {
        triggerShockwave([selectedProduct.originalId]);
        setExplodingProductOriginalIds(prev => [...prev, selectedProduct.originalId!]);
        await deleteProduct(currentUser.uid, selectedProduct.originalId);
        toast({ title: "Produto excluído", description: `${selectedProduct.produto} foi removido com sucesso.` });
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível excluir o produto." });
      } finally {
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
      }
    }
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditQuantityChange = (amount: number) => {
    setEditFormData(prev => {
      const currentQuantity = parseInt(prev.unidade, 10) || 0;
      const newQuantity = Math.max(1, currentQuantity + amount);
      return { ...prev, unidade: newQuantity.toString() };
    });
  };

  const handleSaveEdit = async () => {
    if (editingProduct && editingProduct.originalId && currentUser?.uid) {
      try {
        const productDataToSave = {
          ...editFormData,
          unidade: parseInt(editFormData.unidade, 10) > 0 ? editFormData.unidade : "1",
        };
        await updateProduct(currentUser.uid, editingProduct.originalId, productDataToSave);
        toast({ title: "Produto atualizado", description: `${productDataToSave.produto} foi atualizado com sucesso.` });
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar", description: "Não foi possível atualizar o produto." });
      } finally {
        setIsEditDialogOpen(false);
        setEditingProduct(null);
      }
    }
  };

 const filteredProducts = useMemo(() => {
    let productsToFilter = [...displayProducts];
    console.log("useMemo filteredProducts: Starting with displayProducts", displayProducts);
    const normalizedSearchTerm = normalizeString(searchInputText.trim());

    if (sortBy && sortBy !== 'none') {
        productsToFilter.sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            let comparison = 0;
             // Handle 'none' case implicitly by not sorting if sortBy is 'none'
            if (sortBy === 'id') {
              const numA = parseInt(String(valA), 10);
              const numB = parseInt(String(valB), 10);
              if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA - numB;
              } else {
                comparison = normalizeString(String(valA)).localeCompare(normalizeString(String(valB)));
              }
            } else if (sortBy === 'validade') {
              const dateA = a.validade ? parseISO(a.validade) : null;
              const dateB = b.validade ? parseISO(b.validade) : null;
              const aIsValid = dateA && isValid(dateA);
              const bIsValid = dateB && isValid(dateB);

              if (aIsValid && bIsValid) {
                comparison = dateA!.getTime() - dateB!.getTime();
              } else if (aIsValid && !bIsValid) { comparison = -1; }
              else if (!aIsValid && bIsValid) { comparison = 1;  }
              else {
                comparison = (a.originalId || '').localeCompare(b.originalId || '');
              }
            } else if (sortBy === 'unidade') {
              const numA = parseInt(valA as string, 10);
              const numB = parseInt(valB as string, 10);
              const aIsNum = !isNaN(numA);
              const bIsNum = !isNaN(numB);

              if (aIsNum && bIsNum) {
                comparison = numA - numB;
              } else if (aIsNum && !bIsNum) { comparison = -1; }
              else if (!aIsNum && bIsNum) { comparison = 1;  }
              else {
                comparison = normalizeString(String(valA)).localeCompare(normalizeString(String(valB)));
              }
            } else if (sortBy === 'marca') {
                let sortValA = String(valA);
                let sortValB = String(valB);

                if (normalizeString(sortValA) === '3 coracoes') sortValA = 'tres coracoes';
                if (normalizeString(sortValB) === '3 coracoes') sortValB = 'tres coracoes';

                comparison = normalizeString(sortValA).localeCompare(normalizeString(sortValB));
            }
             else {
              comparison = normalizeString(String(valA)).localeCompare(normalizeString(String(valB)));
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }


    let displayableProducts = productsToFilter.filter(product => !explodingProductOriginalIds.includes(product.originalId!)).filter(product => {
        if (explodingProductOriginalIds.includes(product.originalId!)) return true;

        // Apply search filter if searchInputText is not empty after trim
        if (searchInputText.trim() !== '') {
            if (!Object.values(product).some(value => normalizeString(String(value)).includes(normalizedSearchTerm))) {
                return false;
           }
        }
        if (selectedDateFilter !== 'all') {
            if (!product.validade) return selectedDateFilter === 'all';
            const productDate = parseISO(product.validade);
            if (!isValid(productDate)) {
                 return selectedDateFilter === 'all';
            }
            const productDateStartOfDay = startOfDay(productDate);
            const todayDate = startOfDay(new Date());
            let matchesDateFilter = true;
            switch (selectedDateFilter) {
                case 'today': matchesDateFilter = isToday(productDateStartOfDay); break;
                case 'yesterday': matchesDateFilter = isYesterday(productDateStartOfDay); break;
                case 'tomorrow': matchesDateFilter = isTomorrow(productDateStartOfDay); break;
                case 'expired': matchesDateFilter = isPast(productDateStartOfDay) && !isToday(productDateStartOfDay); break;
                case 'next7': matchesDateFilter = isWithinInterval(productDateStartOfDay, { start: todayDate, end: endOfDay(addDays(todayDate, 6)) }); break;
                case 'last7': matchesDateFilter = isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(todayDate, 6)), end: endOfDay(todayDate) }); break;
                case 'next14': matchesDateFilter = isWithinInterval(productDateStartOfDay, { start: todayDate, end: endOfDay(addDays(todayDate, 13)) }); break;
                case 'last14': matchesDateFilter = isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(todayDate, 13)), end: endOfDay(todayDate) }); break;
                case 'thisMonth': matchesDateFilter = isWithinInterval(productDateStartOfDay, { start: startOfMonth(todayDate), end: endOfMonth(todayDate) }); break;
                case 'nextMonth': matchesDateFilter = isWithinInterval(productDateStartOfDay, { start: startOfMonth(addMonths(todayDate, 1)), end: endOfMonth(addMonths(todayDate, 1)) }); break;
            }
            if (!matchesDateFilter) return false;
        }
        return true;
    });

    console.log("useMemo filteredProducts: Final displayableProducts", displayableProducts);
 return displayableProducts; // The filter for exploding products is already applied above
  }, [searchInputText, displayProducts, selectedDateFilter, sortBy, sortDirection]);


  const handleToggleSelectProduct = (productOriginalId: string | undefined) => {
    if (!productOriginalId) return;
    setSelectedProductIds(prevSelected => {
      return prevSelected.includes(productOriginalId)
        ? prevSelected.filter((id) => id !== productOriginalId) // Use originalId for internal state
        : [...prevSelected, productOriginalId]; // Use originalId for internal state
    });

  };

  const handleSelectAll = (isChecked: boolean | 'indeterminate') => {
    const visibleProductsNotExploding = filteredProducts.filter(p => !explodingProductOriginalIds.includes(p.originalId!) && p.originalId); // Filter from filteredProducts
    if (isChecked === true) {
      setSelectedProductIds(visibleProductsNotExploding.map((p) => p.originalId!));
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

  const handleDeleteSelected = async () => {
    const nonExplodingSelectedIds = selectedProductIds.filter(id => products.some(p => p.originalId === id && !explodingProductOriginalIds.includes(id))); // Filter from products
    if (nonExplodingSelectedIds.length > 0 && currentUser?.uid) {
        try {
            triggerShockwave([...nonExplodingSelectedIds]);
            setExplodingProductOriginalIds(prev => [...prev, ...nonExplodingSelectedIds]);
            await deleteMultipleProducts(currentUser.uid, nonExplodingSelectedIds);
            toast({ title: `${nonExplodingSelectedIds.length} produto(s) excluído(s) com sucesso.` });
            setSelectedProductIds([]);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir selecionados", description: "Não foi possível excluir os produtos." });
        }
    } else if (nonExplodingSelectedIds.length === 0) {
        toast({variant: "default", title: "Nenhum item para excluir."});
        setIsDeleteSelectedConfirmOpen(false);
    }
  };

  const cancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedProductIds([]);
    setActivePopoverProductId(null);
  };


  const handleSearchScanSuccess = useCallback((data: string) => {
    setSearchInputText(data);
    toast({ title: "Código de Barras Escaneado", description: `Busca preenchida com: ${data}` });
    setIsSearchScannerActive(false);
  }, [toast]);

  const handleSearchScanError = useCallback((message: string) => {
    toast({ variant: "destructive", title: "Erro no Scanner da Busca", description: message });
    setIsSearchScannerActive(false);
  }, [toast]);

   // Use the products prop directly
  const productsForDisplay = useMemo(() => filteredProducts.filter(p => !explodingProductOriginalIds.includes(p.originalId!)), [filteredProducts, explodingProductOriginalIds]); // Use filteredProducts here
  const allFilteredSelected = productsForDisplay.length > 0 && productsForDisplay.every(p => p.originalId && selectedProductIds.includes(p.originalId!));
  const someFilteredSelected = productsForDisplay.length > 0 && selectedProductIds.some(id => productsForDisplay.find(p => p.originalId === id)); // Use id directly


  const selectAllCheckedState = allFilteredSelected ? true : (someFilteredSelected ? "indeterminate" : false);


  const handleHeaderClick = (column: SortableKey) => {
    if (isSelectionModeActive) return;

    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };


  const renderHeaderCell = (column: SortableKey, label: string, tooltipText: string, classNameExt: string = "", isSortable: boolean = true) => {
    const isActiveSortColumn = sortBy === column && sortBy !== 'none' && !isSelectionModeActive && isSortable;
    const baseClasses = `py-3 ${isSelectionModeActive ? 'pl-2 pr-2' : 'px-2 md:px-4'} ${(!isSelectionModeActive && isSortable) ? 'cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30' : ''} text-center`;
    const activeSortClasses = isActiveSortColumn ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold' : '';

    // Determine the sort icon based on sort direction
    const icon = sortBy === column && sortBy !== 'none' && !isSelectionModeActive && isSortable
      ? (sortDirection === 'asc'
        ? (column === 'id' || column === 'unidade' ? <ArrowUp01 className="inline-block ml-1 h-3 w-3" /> : <ArrowUpAZ className="inline-block ml-1 h-3 w-3" />)
        : (column === 'id' || column === 'unidade' ? <ArrowDown01 className="inline-block ml-1 h-3 w-3" /> : <ArrowDownAZ className="inline-block ml-1 h-3 w-3" />)
      )
      : null;

    return (
      <ShadTableHeaderComponent
 key={column}
        className={cn(baseClasses, activeSortClasses, classNameExt)}
        onClick={(e) => {
            if (!isSelectionModeActive && isSortable) {
              e.stopPropagation();
              handleHeaderClick(column);
            }
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center justify-center"> {/* Add justify-center here */}
                {label} {icon}
            </span>
          </TooltipTrigger>
          <TooltipContent>{tooltipText}</TooltipContent>
        </Tooltip>
      </ShadTableHeaderComponent>
    );
  };
  const handleMoveProducts = async () => {
    if (!currentUser?.uid || selectedProductIds.length === 0 || !targetMoveListId) {
      toast({ variant: "destructive", title: "Erro", description: "Informações incompletas para mover produtos." });
      return;
    }
    try {
      await moveProductsToList(currentUser.uid, selectedProductIds, targetMoveListId);
      setSelectedProductIds([]);
      setIsMoveProductsDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Mover Produtos", description: error.message || "Não foi possível mover os produtos." });
    }
  };

  const handleBatchUpdateExpiry = async () => {
    if (!currentUser?.uid || selectedProductIds.length === 0 || !batchNewExpiryDate) {
      toast({ variant: "destructive", title: "Erro", description: "Informações incompletas para atualizar validades." });
      return;
    }
    try {
      await updateMultipleProductExpirations(currentUser.uid, selectedProductIds, batchNewExpiryDate);
      toast({ title: "Validades Atualizadas", description: `Validade de ${selectedProductIds.length} produto(s) atualizada.`});
      setSelectedProductIds([]);
      setIsBatchEditExpiryDialogOpen(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Validades", description: error.message || "Não foi possível atualizar as validades." });
    }
  };

  const isAnyFilterActive = searchInputText.trim() !== '' || selectedDateFilter !== 'all';
 const nonExplodingClientProductsCount = products.filter(p => !explodingProductOriginalIds.includes(p.originalId!)).length; // Use products

  if (!listId && !isLoadingProducts && products.length === 0) {
    return (
      <Card className="shadow-xl min-h-[300px]">
        <CardHeader>
          <h2 className="text-xl font-headline">Lista de Produtos</h2>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">Por favor, selecione ou crie uma lista para ver os produtos.</p>
        </CardContent>
      </Card>
    );
  }

  const nonExplodingFilteredProductsCount = filteredProducts.filter(p => !explodingProductOriginalIds.includes(p.originalId!)).length;
  const currentlySelectedProductsCount = selectedProductIds.filter(id => // Keep this filtering logic, it's correct
    products.some(p => p.originalId === id && !explodingProductOriginalIds.includes(id))
  ).length;
 // Use products prop directly for currentlySelectedProductsCount
  const getNoProductsMessage = () => {
    if (nonExplodingClientProductsCount === 0 && !isLoadingProducts) {
      return "Nenhum produto nesta lista.";
    }
    if (searchInputText.trim() !== '' && nonExplodingFilteredProductsCount === 0) {
      return `Nenhum produto encontrado para "${searchInputText}". Tente um termo diferente.`;
    }
    if (selectedDateFilter !== 'all' && nonExplodingFilteredProductsCount === 0) {
      const filterLabel = dateFilterOptions.find(opt => opt.value === selectedDateFilter)?.label || selectedDateFilter; 
      return `Nenhum produto encontrado com o filtro de data: "${filterLabel}".`;
    }
    if(nonExplodingFilteredProductsCount === 0 && (searchInputText || selectedDateFilter !== 'all')) {
 return "Nenhum produto encontrado com os filtros atuais. Tente refinar sua busca ou filtros.";
    }
    if (isLoadingProducts) { 
      return ""; 
    }
    return "Algo deu errado ou esta lista está vazia.";
  };

  console.log("filteredProducts before return:", filteredProducts);

  return (
    <>
      <Card className="shadow-xl">
         <CardHeader className="sticky top-[calc(var(--header-height,4rem)_+_var(--list-tabs-height,4.75rem)_+_1px)] z-20 bg-card dark:bg-card py-4 border-b">
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-grow w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, nome, marca..."
                value={searchInputText}
                onChange={(e) => setSearchInputText(e.target.value)}
                className="pl-10 pr-10 w-full"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSearchScannerActive(true)}
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground hover:text-primary"
                aria-label="Escanear código de barras para busca"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full sm:w-auto">
              <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
                <SelectTrigger className="w-full sm:w-auto min-w-[180px]">
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
              {isAnyFilterActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchInputText('');
                    setSelectedDateFilter('all');
                  }}
                  className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                >
                  <FilterX className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
          {isSelectionModeActive && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
               <p className="text-sm text-muted-foreground">
                {currentlySelectedProductsCount} item(s) selecionado(s)
              </p>
              <div className="flex flex-wrap space-x-2">
                <Button variant="ghost" onClick={cancelSelectionMode} size="sm">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                {currentlySelectedProductsCount > 0 && (
                  <>
                    <Button variant="outline" onClick={() => setIsMoveProductsDialogOpen(true)} size="sm">
                      <FolderSymlink className="mr-2 h-4 w-4" />
                      Mover
                    </Button>
                    <Button variant="outline" onClick={() => setIsBatchEditExpiryDialogOpen(true)} size="sm">
                      <CalendarCog className="mr-2 h-4 w-4" />
                      Editar Validade
                    </Button>
                    <Button variant="destructive" onClick={confirmDeleteSelected} size="sm">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="px-1 pb-1 pt-0">
          <div className="overflow-x-auto rounded-md border">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <ShadTableRow>
                    {isSelectionModeActive ? (
                      <ShadTableHeaderComponent className="w-[50px] px-2 py-3">
                         <Checkbox
                            id="selectAll"
                            aria-label="Selecionar todos os produtos visíveis"
                            checked={selectAllCheckedState}
                            onCheckedChange={handleSelectAll}
                          />
                      </ShadTableHeaderComponent>
                    ) : null }
                    {renderHeaderCell('id', 'ID', 'ID sequencial do produto. Clique para ordenar.', `w-[60px] ${isSelectionModeActive ? 'px-2' : 'px-2'}`)}
                    {renderHeaderCell('produto', 'Produto', 'Nome do produto. Clique para ordenar.')}
                    {renderHeaderCell('marca', 'Marca', 'Marca do produto. Clique para ordenar.')}
                    {renderHeaderCell('unidade', 'Qtde', 'Quantidade do produto. Clique para ordenar.')}
 <ShadTableHeaderComponent
                      className={cn(
                          `min-w-[130px] text-center px-2 md:px-4 py-3 relative ${!isSelectionModeActive ? 'cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30' : ''}`,
 (sortBy === 'validade' && sortBy !== 'none' && !isSelectionModeActive) ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold' : ''
                      )}
                      onClick={(e) => {
                          if (!isSelectionModeActive) {
                              e.stopPropagation();
                              handleHeaderClick('validade');
                          }
                      }}

                    >
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="flex items-center justify-center">
                                    Validade
 {sortBy === 'validade' && sortBy !== 'none' && !isSelectionModeActive &&
 (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownAZ className="inline-block ml-1 h-3 w-3" />)
 }
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Data de validade. Clique para ordenar.</p>
                            </TooltipContent>
                        </Tooltip>
                    </ShadTableHeaderComponent>
                  </ShadTableRow>
                </TableHeader>
                <motion.tbody layout className="[&_tr:last-child]:border-0">
                  <AnimatePresence>
                    {isLoadingProducts && filteredProducts.length === 0 && ( // Only show loading skeleton if no filtered products are available yet
                       <motion.tr key="loading-row" layoutId="loading-row" className="border-b">
                        <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="text-center h-24">
                          <div className="flex items-center justify-center">
                             <Search className="mr-2 h-5 w-5 animate-spin" /> Carregando produtos...
                          </div>
                        </TableCell>
                      </motion.tr>
                    )} {/* Keep existing loading state */}
                    {filteredProducts.map((product) => { // Iterate over filteredProducts (which now uses displayProducts)
                       const { styleString, particleColorClass } = getRowStyling(product.validade, product.originalId ? selectedProductIds.includes(product.originalId) : false, isSelectionModeActive, explodingProductOriginalIds.includes(product.originalId!));
                       const currentProductKey = product.originalId;
                      const isNewlyAdded = newlyAddedProductId === currentProductKey;

                      let shockwaveAnimProps: any = {};
                      const shockwaveTargetInfo = !product.isExploding ? shockwaveTargets.find(st => st.id === currentProductKey) : undefined;

                      if (shockwaveTargetInfo) {
                          const { strength } = shockwaveTargetInfo;
                          const displacementFactor = shockwaveTargetInfo.direction === 'up' ? -1 : 1;
                          const ySequence = [0, displacementFactor * strength, displacementFactor * strength * 0.4, displacementFactor * strength * -0.2, 0];

                          const baseScaleMagnitude = 0.05;
                          let currentScaleMagnitude = 0;
                           if (strength > 0) {
                               const maxPossibleStrengthAtDistance1 = BASE_SHOCKWAVE_STRENGTH_PX - (1 - 1) * SHOCKWAVE_STRENGTH_DECREMENT_PER_STEP;
                               if (maxPossibleStrengthAtDistance1 > 0) {
                                   const strengthRatio = Math.max(0, strength / maxPossibleStrengthAtDistance1);
                                   currentScaleMagnitude = baseScaleMagnitude * strengthRatio;
                               }
                           }
                          const scaleSequence = [1, 1 + currentScaleMagnitude, 1 - currentScaleMagnitude * 0.6, 1 + currentScaleMagnitude * 0.2, 1];

                          shockwaveAnimProps = {
                              y: ySequence,
                              scale: scaleSequence,
                              transition: { duration: SHOCKWAVE_DURATION / 1000, ease: "easeInOut" }
                          };
                      }

                      let finalAnimateProps = { ...shockwaveAnimProps };
                      if (isNewlyAdded) {
                        finalAnimateProps.scale = [1, 1.02, 1];
                      }

                      let finalTransitionProps = shockwaveAnimProps.transition ? { ...shockwaveAnimProps.transition } : { duration: SHOCKWAVE_DURATION / 1000, ease: "easeInOut" };
                      if (isNewlyAdded) {
                        finalTransitionProps = { duration: 0.8, times: [0, 0.5, 1], ease: "circOut" };
                      }


                      return (
                        <Popover
                           key={currentProductKey}
                          open={activePopoverProductId === currentProductKey && !isSelectionModeActive && !explodingProductOriginalIds.includes(product.originalId)}
                          onOpenChange={(isOpen) => {
                             if (isSelectionModeActive || explodingProductOriginalIds.includes(product.originalId)) {
                                 setActivePopoverProductId(null);
                                return;
                            }
                             if (isOpen) {
                               setActivePopoverProductId(currentProductKey);
                             } else {
                               setActivePopoverProductId(null);
                               setSelectedProduct(null);
                             }
                          }}
                        >
                          <PopoverTrigger asChild disabled={isSelectionModeActive || product.isExploding}>
                            <motion.tr
                               layout // Apply layout animation to rows for explosion and sorting
                              layoutId={currentProductKey!}
                              initial={{ opacity: 1 }}
                             animate={product.isExploding ? { opacity: 0 } : finalAnimateProps} // Hide row entirely if exploding
                              transition={finalTransitionProps}
                              className={styleString}
                              data-state={product.originalId && selectedProductIds.includes(product.originalId) ? "selected" : ""}
                              onPointerDown={(e: PointerEvent<HTMLTableRowElement>) => {
                                if (product.isExploding || !product.originalId) return;
                                 handleRowInteractionStart(product.originalId, e.clientX, e.clientY);
                              }}
                              onPointerUp={(e: PointerEvent<HTMLTableRowElement>) => {
                                if (product.isExploding || !product.originalId) return;
                                handleRowInteractionEnd(product, e.clientX, e.clientY, e.target);
                              }}
                              onPointerLeave={() => {
                                 if (explodingProductOriginalIds.includes(product.originalId)) return;
                                if (longPressTimerRef.current) {
                                  clearTimeout(longPressTimerRef.current);
                                  longPressTimerRef.current = null;
                                }
                                 pointerDownPositionRef.current = null;
                              }}
                              onPointerMove={(e: PointerEvent<HTMLTableRowElement>) => {
                                if (explodingProductOriginalIds.includes(product.originalId!)) return;
                                 handlePointerMove(e.clientX, e.clientY);
                              }}
                              onTouchStart={(e: TouchEvent<HTMLTableRowElement>) => {
                                if (explodingProductOriginalIds.includes(product.originalId!) || !product.originalId) return;
                                if (e.touches.length === 1) {
                                    handleRowInteractionStart(product.originalId, e.touches[0].clientX, e.touches[0].clientY);
                                }
                              }}
                              onTouchEnd={(e: TouchEvent<HTMLTableRowElement>) => {
                                 if (explodingProductOriginalIds.includes(product.originalId!) || !product.originalId) return;
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
                              {explodingProductOriginalIds.includes(product.originalId) ? (
                                <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="p-0 relative py-3">
                                  <Particle
                                    onComplete={() => finalizeDeleteProduct(currentProductKey)}
                                    particleColorClass={particleColorClass}
                                  />
                                </TableCell>
                              ) : (
                                <>
                                  {isSelectionModeActive ? (
                                    <TableCell data-is-checkbox-cell="true" className="py-0 px-2" onClick={(e) => e.stopPropagation()}>
                                      <Checkbox
                                          aria-label={`Selecionar produto ${product.id} - ${product.produto}`} // Use visual ID for accessibility
                                          checked={product.originalId ? selectedProductIds.includes(product.originalId) : false}
                                          onCheckedChange={() => product.originalId && handleToggleSelectProduct(product.originalId)}
                                        />
                                    </TableCell>
                                  ): null }
                                  <TableCell className={`font-medium py-3 ${isSelectionModeActive ? 'px-1 text-center' : 'pl-2 pr-1 text-left'}`}>{product.id}</TableCell>
                                  <TableCell className="py-3 px-2 md:px-4">{product.produto}</TableCell>
                                  <TableCell className="py-3 px-2 md:px-4">{product.marca}</TableCell>
                                  <TableCell className="py-3 px-2 md:px-4 text-center">{product.unidade}</TableCell>
                                  <TableCell className="py-3 px-2 md:px-4 text-right">
                                    {product.validade && isValid(parseISO(product.validade))
                                      ? format(parseISO(product.validade), 'dd/MM/yyyy')
                                      : 'N/A'}
                                  </TableCell>
                                </>
                              )}
                            </motion.tr>
                          </PopoverTrigger>
                           {!isSelectionModeActive && !explodingProductOriginalIds.includes(product.originalId!) && (
                            <PopoverContent side="top" align="end" className="w-auto p-0.5 z-50" sideOffset={5}
                              onOpenAutoFocus={(e) => e.preventDefault()}
                              onCloseAutoFocus={(e) => e.preventDefault()}
                            >
                              <div className="flex space-x-0.5">
                                <Button variant="ghost" size="icon" onClick={handleEdit} aria-label="Editar Produto" className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={confirmDeleteSingleProduct} aria-label="Excluir Produto" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </PopoverContent>
                           )}
                        </Popover>
                      );
                    })}
                     {!isLoadingProducts && nonExplodingFilteredProductsCount === 0 && (
                       <motion.tr key="no-products-row" className="border-b">
                         <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="text-center h-24 px-2 md:px-4 py-3">
                           {getNoProductsMessage()}
                         </TableCell>
                       </motion.tr>
                     )}
                  </AnimatePresence>
                </motion.tbody>
              </Table>
            </TooltipProvider>
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
              Tem certeza que deseja excluir os {currentlySelectedProductsCount} produtos selecionados? Esta ação não pode ser desfeita.
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
    </>
  );
}