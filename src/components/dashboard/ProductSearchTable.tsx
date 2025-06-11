
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
  TableRow as ShadTableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Pencil, Trash2, XCircle, PlusCircle, ArrowUpAZ, ArrowDownZA, Camera, Loader2, Minus, Plus, FolderSymlink, CalendarCog, Wand2, CalendarDays, FilterX } from 'lucide-react';
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
import { Calendar } from "@/components/ui/calendar";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner';
import { useAuth } from '@/contexts/AuthContext';
import { getProducts, addProduct, updateProduct, deleteProduct, deleteMultipleProducts, moveProductsToList, updateMultipleProductExpirations } from '@/services/productService';
import { suggestProductName } from '@/ai/flows/suggest-product-name-flow';
import { cn } from '@/lib/utils';


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


const initialNewProductFormData: Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'> = {
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
  productLists: ProductList[];
  onProductsChanged?: () => void;
}

export function ProductSearchTable({ listId, productLists, onProductsChanged }: ProductSearchTableProps) {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchInputText, setSearchInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');

  const [clientSideProducts, setClientSideProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);


  const [sortBy, setSortBy] = useState<SortableKey | 'none'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'>>({ ...initialNewProductFormData });
  const editProductNameInputRef = useRef<HTMLInputElement>(null);


  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [activePopoverProductId, setActivePopoverProductId] = useState<string | null>(null);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProductFormData, setNewProductFormData] = useState<Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'>>({ ...initialNewProductFormData });
  const [isSuggestingName, setIsSuggestingName] = useState(false);
  const newProductNameInputRef = useRef<HTMLInputElement>(null);


  const [isAddActionPopoverOpen, setIsAddActionPopoverOpen] = useState(false);
  const longPressHeaderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const headerPointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);

  const [shockwaveTargets, setShockwaveTargets] = useState<ShockwaveTarget[]>([]);
  const longPressInitiatedSelectionRef = useRef(false);

  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditCalendarOpen, setIsEditCalendarOpen] = useState(false);


  const [isMoveProductsDialogOpen, setIsMoveProductsDialogOpen] = useState(false);
  const [targetMoveListId, setTargetMoveListId] = useState<string>('');

  const [isBatchEditExpiryDialogOpen, setIsBatchEditExpiryDialogOpen] = useState(false);
  const [batchNewExpiryDate, setBatchNewExpiryDate] = useState<string>('');
  const [newlyAddedProductId, setNewlyAddedProductId] = useState<string | null>(null);


  useEffect(() => {
    if (currentUser?.uid && listId) {
      setIsLoadingProducts(true);
      getProducts(currentUser.uid, listId)
        .then((productsFromDb) => {
          setClientSideProducts(resequenceProducts(productsFromDb));
          onProductsChanged?.();
        })
        .catch((error) => {
          console.error("Failed to fetch products:", error);
          toast({ variant: "destructive", title: "Erro ao buscar produtos", description: "Não foi possível carregar os produtos desta lista." });
        })
        .finally(() => {
          setIsLoadingProducts(false);
        });
    } else if (!listId) {
      setClientSideProducts([]);
      setIsLoadingProducts(false);
      onProductsChanged?.();
    }
  }, [currentUser, listId, toast, onProductsChanged]);


  useEffect(() => {
    const timerCleanup = () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
    };
    return timerCleanup;
  }, []);

 useEffect(() => {
    const currentSelectedIds = selectedProductIds;
    const validSelectedIds = currentSelectedIds.filter(id =>
      clientSideProducts.some(p => p.originalId === id && !p.isExploding)
    );

    if (JSON.stringify(validSelectedIds) !== JSON.stringify(currentSelectedIds)) {
      setSelectedProductIds(validSelectedIds);
    }

    const newIsSelectionModeActiveTarget = validSelectedIds.length > 0;
    const isAnyProductExploding = clientSideProducts.some(p => p.isExploding);

    if (isSelectionModeActive && !newIsSelectionModeActiveTarget && isAnyProductExploding) {
    } else if (isSelectionModeActive !== newIsSelectionModeActiveTarget) {
      setIsSelectionModeActive(newIsSelectionModeActiveTarget);
    }
  }, [clientSideProducts, selectedProductIds, isSelectionModeActive]);


 useEffect(() => {
    const isAnyProductExploding = clientSideProducts.some(p => p.isExploding);
    if (!isAnyProductExploding) {
      const anyProductSelected = selectedProductIds.filter(id => clientSideProducts.some(p => p.originalId === id && !p.isExploding)).length > 0;
      if (isSelectionModeActive !== anyProductSelected) {
        setIsSelectionModeActive(anyProductSelected);
      }
    }
  }, [clientSideProducts, selectedProductIds, isSelectionModeActive, setIsSelectionModeActive]);


 useEffect(() => {
    if (shockwaveTargets.length > 0) {
      const timer = setTimeout(() => {
        setShockwaveTargets([]);
      }, SHOCKWAVE_DURATION + 100);
      return () => clearTimeout(timer);
    }
  }, [shockwaveTargets]);

  useEffect(() => {
    if (isAddProductDialogOpen && !isScannerActive && newProductNameInputRef.current) {
        newProductNameInputRef.current.focus();
    }
    if (isEditDialogOpen && editProductNameInputRef.current) {
        editProductNameInputRef.current.focus();
    }
  }, [isAddProductDialogOpen, isScannerActive, isEditDialogOpen]);

  useEffect(() => {
    if (newlyAddedProductId) {
      const timer = setTimeout(() => {
        setNewlyAddedProductId(null);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [newlyAddedProductId]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchInputText);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInputText]);


  const finalizeDeleteProduct = (productOriginalId: string) => {
    setClientSideProducts(prevProducts => {
        const productsAfterExplosion = prevProducts.filter(p => p.originalId !== productOriginalId);
        const resequenced = resequenceProducts(productsAfterExplosion);
        onProductsChanged?.();
        return resequenced;
    });
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


  const handleHeaderRowPointerDown = (clientX: number, clientY: number) => {
    if (isSelectionModeActive) return;
    headerPointerDownPositionRef.current = { x: clientX, y: clientY };

    if (longPressHeaderTimerRef.current) {
      clearTimeout(longPressHeaderTimerRef.current);
    }
    longPressHeaderTimerRef.current = setTimeout(() => {
      if (headerPointerDownPositionRef.current) {
        setIsAddActionPopoverOpen(true);
      }
      longPressHeaderTimerRef.current = null;
      headerPointerDownPositionRef.current = null;
    }, LONG_PRESS_DURATION);
  };

  const handleHeaderRowPointerUp = () => {
    if (longPressHeaderTimerRef.current) {
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
    }
  };

  const handleHeaderRowPointerMove = (clientX: number, clientY: number) => {
    if (!headerPointerDownPositionRef.current || !longPressHeaderTimerRef.current) return;

    const dx = Math.abs(clientX - headerPointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - headerPointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
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
        setClientSideProducts(prevProducts =>
          prevProducts.map(p =>
            p.originalId === selectedProduct.originalId ? { ...p, isExploding: true } : p
          )
        );
        await deleteProduct(currentUser.uid, selectedProduct.originalId);
        toast({ title: "Produto excluído", description: `${selectedProduct.produto} foi removido com sucesso.` });
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível excluir o produto." });
        setClientSideProducts(prev => prev.map(p => p.originalId === selectedProduct.originalId ? {...p, isExploding: false} : p));
      } finally {
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
        onProductsChanged?.();
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
        setClientSideProducts(prevProducts =>
          resequenceProducts(
              prevProducts.map(p =>
              p.originalId === editingProduct.originalId ? { ...editingProduct, ...productDataToSave, isExploding: p.isExploding, id: p.id, listId: editingProduct.listId } : p
              )
          )
        );
        toast({ title: "Produto atualizado", description: `${productDataToSave.produto} foi atualizado com sucesso.` });
        onProductsChanged?.();
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao atualizar", description: "Não foi possível atualizar o produto." });
      } finally {
        setIsEditDialogOpen(false);
        setEditingProduct(null);
      }
    }
  };

 const filteredProducts = useMemo(() => {
    let productsToFilter = [...clientSideProducts];

    if (sortBy && sortBy !== 'none') {
        productsToFilter.sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            let comparison = 0;

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


    let displayableProducts = productsToFilter.filter(product => {
        if (product.isExploding) return true;

        const normalizedSearch = normalizeString(searchTerm);
        if (normalizedSearch) {
            if (!Object.values(product).some(value => normalizeString(String(value)).includes(normalizedSearch))) {
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

    return displayableProducts;
  }, [searchTerm, clientSideProducts, selectedDateFilter, sortBy, sortDirection]);


  const handleToggleSelectProduct = (productOriginalId: string) => {
    setSelectedProductIds((prevSelected) =>
      prevSelected.includes(productOriginalId)
        ? prevSelected.filter((id) => id !== productOriginalId)
        : [...prevSelected, productOriginalId]
    );
  };

  const handleSelectAll = (isChecked: boolean | 'indeterminate') => {
    const visibleProductsNotExploding = filteredProducts.filter(p => !p.isExploding && p.originalId);
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
    const idsToDelete = selectedProductIds.filter(id => clientSideProducts.find(p => p.originalId === id && !p.isExploding));
    if (idsToDelete.length > 0 && currentUser?.uid) {
        try {
            triggerShockwave([...idsToDelete]);
            setClientSideProducts(prevProducts =>
            prevProducts.map(p =>
                idsToDelete.includes(p.originalId!) ? { ...p, isExploding: true } : p
            )
            );
            await deleteMultipleProducts(currentUser.uid, idsToDelete);
            toast({ title: `${idsToDelete.length} produto(s) excluído(s) com sucesso.` });
            setSelectedProductIds([]);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir selecionados", description: "Não foi possível excluir os produtos." });
            setClientSideProducts(prev => prev.map(p => idsToDelete.includes(p.originalId!) ? {...p, isExploding: false} : p ));
        } finally {
            setIsDeleteSelectedConfirmOpen(false);
             onProductsChanged?.();
        }
    } else if (idsToDelete.length === 0) {
        toast({variant: "default", title: "Nenhum item para excluir."});
        setIsDeleteSelectedConfirmOpen(false);
    }
  };

  const cancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedProductIds([]);
    setActivePopoverProductId(null);
  };

  const handleNewProductFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewQuantityChange = (amount: number) => {
    setNewProductFormData(prev => {
      const currentQuantity = parseInt(prev.unidade, 10) || 0;
      const newQuantity = Math.max(1, currentQuantity + amount);
      return { ...prev, unidade: newQuantity.toString() };
    });
  };

 const handleSuggestProductName = async () => {
    if (!newProductFormData.produto.trim()) {
      toast({ title: "Entrada Vazia", description: "Digite algo no campo 'Produto' para obter uma sugestão.", variant: "default" });
      return;
    }
    setIsSuggestingName(true);
    try {
      const result = await suggestProductName({
        currentInput: newProductFormData.produto,
        currentBrand: newProductFormData.marca,
      });
      if (result.suggestedName) {
        setNewProductFormData(prev => ({
          ...prev,
          produto: result.suggestedName,
          marca: result.suggestedBrand || prev.marca,
        }));
        toast({ title: "Nome Sugerido!", description: `Sugestão aplicada: ${result.suggestedName}` });
      } else {
        toast({ title: "Sem Sugestão", description: "Não foi possível gerar uma sugestão clara.", variant: "default" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Sugerir Nome", description: error.message || "Não foi possível obter uma sugestão de nome." });
    } finally {
      setIsSuggestingName(false);
    }
  };


  const handleAddNewProduct = async (closeDialogAfterSave: boolean = true) => {
    const quantity = parseInt(newProductFormData.unidade, 10);
    if (!newProductFormData.produto || !newProductFormData.validade || !(quantity > 0) ) {
      toast({
        title: "Campos Obrigatórios",
        description: "Produto, Quantidade (maior que 0) e Validade são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }
    if (!listId) {
      toast({ variant: "destructive", title: "Erro", description: "Nenhuma lista selecionada para adicionar o produto." });
      return;
    }

    try {
      const productDataToSave = {
        ...newProductFormData,
        unidade: quantity.toString(),
      };
      const addedProduct = await addProduct(currentUser.uid, listId, productDataToSave);
      setClientSideProducts(prevProducts =>
          resequenceProducts([...prevProducts, addedProduct])
      );
      if (addedProduct.originalId) {
        setNewlyAddedProductId(addedProduct.originalId);
      }
      toast({ title: "Produto Adicionado", description: `${addedProduct.produto} foi adicionado com sucesso.` });

      setNewProductFormData({ ...initialNewProductFormData });
      setIsScannerActive(false);
      if (closeDialogAfterSave) {
        setIsAddProductDialogOpen(false);
      } else {
        if (newProductNameInputRef.current) newProductNameInputRef.current.focus();
      }
      onProductsChanged?.();
    } catch (error: any) {
       toast({ variant: "destructive", title: "Erro ao adicionar produto", description: error.message || "Não foi possível adicionar o produto." });
    }
  };

  const handleScanSuccess = useCallback((data: string) => {
    setNewProductFormData(prev => ({ ...prev, produto: data, marca: prev.marca || '', unidade: prev.unidade || '1', validade: prev.validade || '' }));
    toast({ title: "Código de Barras Escaneado", description: `Produto preenchido com: ${data}` });
    setIsScannerActive(false);
    setTimeout(() => {
        if (newProductNameInputRef.current) {
            newProductNameInputRef.current.focus();
        }
    }, 0);
  }, [toast]);

  const handleScanError = useCallback((message: string) => {
    toast({ variant: "destructive", title: "Erro no Scanner", description: message });
  }, [toast]);


  const productsForDisplay = useMemo(() => filteredProducts.filter(p => !p.isExploding), [filteredProducts]);
  const allFilteredSelected = productsForDisplay.length > 0 && productsForDisplay.every(p => p.originalId && selectedProductIds.includes(p.originalId));
  const someFilteredSelected = productsForDisplay.length > 0 && selectedProductIds.some(id => productsForDisplay.find(p => p.originalId === id));


  const selectAllCheckedState = allFilteredSelected ? true : (someFilteredSelected ? "indeterminate" : false);


  const handleHeaderClick = (column: SortableKey) => {
    if (isSelectionModeActive) return;
    if (isAddActionPopoverOpen) setIsAddActionPopoverOpen(false);


    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
    headerPointerDownPositionRef.current = null;
  };


  const renderHeaderCell = (column: SortableKey, label: string, tooltipText: string, classNameExt: string = "", isSortable: boolean = true) => {
    const isActiveSortColumn = sortBy === column && sortBy !== 'none' && !isSelectionModeActive && isSortable;
    const baseClasses = `py-3 ${isSelectionModeActive ? 'pl-2 pr-2' : 'px-2 md:px-4'} ${(!isSelectionModeActive && isSortable) ? 'cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30' : ''}`;
    const activeSortClasses = isActiveSortColumn ? 'bg-primary/10 dark:bg-primary/20 text-primary font-semibold' : '';

    const icon = sortBy === column && sortBy !== 'none' && !isSelectionModeActive && isSortable
      ? (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownZA className="inline-block ml-1 h-3 w-3" />)
      : null;

    return (
      <ShadTableHeaderComponent
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
                <span className="flex items-center">
                    {label} {icon}
                </span>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
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
      toast({ title: "Produtos Movidos", description: `${selectedProductIds.length} produto(s) movido(s) com sucesso.` });
      setClientSideProducts(prev => resequenceProducts(prev.filter(p => !selectedProductIds.includes(p.originalId!))));
      setSelectedProductIds([]);
      setIsMoveProductsDialogOpen(false);
      onProductsChanged?.();
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
      toast({ title: "Validades Atualizadas", description: `Validade de ${selectedProductIds.length} produto(s) atualizada.` });
      setClientSideProducts(prev =>
        resequenceProducts(
          prev.map(p =>
            selectedProductIds.includes(p.originalId!) ? { ...p, validade: batchNewExpiryDate } : p
          )
        )
      );
      setSelectedProductIds([]);
      setIsBatchEditExpiryDialogOpen(false);
      onProductsChanged?.();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Atualizar Validades", description: error.message || "Não foi possível atualizar as validades." });
    }
  };

  const isAnyFilterActive = searchInputText.trim() !== '' || selectedDateFilter !== 'all';


  if (!listId && !isLoadingProducts) {
    return (
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Produtos</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">Por favor, selecione ou crie uma lista para ver os produtos.</p>
        </CardContent>
      </Card>
    );
  }

  const nonExplodingClientProductsCount = clientSideProducts.filter(p => !p.isExploding).length;
  const nonExplodingFilteredProductsCount = filteredProducts.filter(p => !p.isExploding).length;
  const currentlySelectedProductsCount = selectedProductIds.filter(id => clientSideProducts.some(p => p.originalId === id && !p.isExploding)).length;

  const getNoProductsMessage = () => {
    if (nonExplodingClientProductsCount === 0) {
      return "Nenhum produto nesta lista. Que tal adicionar um novo?";
    }
    if (searchTerm) {
      return `Nenhum produto encontrado para "${searchTerm}". Tente um termo diferente.`;
    }
    if (selectedDateFilter !== 'all') {
      const filterLabel = dateFilterOptions.find(opt => opt.value === selectedDateFilter)?.label || selectedDateFilter;
      return `Nenhum produto encontrado com o filtro de data: "${filterLabel}".`;
    }
    return "Nenhum produto encontrado com os filtros atuais. Tente refinar sua busca ou filtros.";
  };

  return (
    <>
      <Card className="shadow-xl">
        <CardHeader>
           <div className="mt-4 flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar produtos nesta lista..."
                value={searchInputText}
                onChange={(e) => setSearchInputText(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
                  <ShadTableRow
                    onPointerDown={(e: PointerEvent<HTMLTableRowElement>) => handleHeaderRowPointerDown(e.clientX, e.clientY)}
                    onPointerUp={handleHeaderRowPointerUp}
                    onPointerLeave={() => {
                      if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                       headerPointerDownPositionRef.current = null;
                    }}
                    onPointerMove={(e: PointerEvent<HTMLTableRowElement>) => handleHeaderRowPointerMove(e.clientX, e.clientY)}
                    onTouchStart={(e: TouchEvent<HTMLTableRowElement>) => {
                      if (e.touches.length === 1) handleHeaderRowPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    onTouchEnd={handleHeaderRowPointerUp}
                    onTouchCancel={() => {
                       if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                       headerPointerDownPositionRef.current = null;
                    }}
                    onTouchMove={(e: TouchEvent<HTMLTableRowElement>) => {
                      if (e.touches.length === 1) handleHeaderRowPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                    }}
                    className="relative"
                  >
                    {isSelectionModeActive ? (
                      <ShadTableHeaderComponent className="w-[50px] px-2 py-3">
                         <Checkbox
                            id="selectAll"
                            aria-label="Selecionar todas as linhas visíveis"
                            checked={selectAllCheckedState}
                            onCheckedChange={handleSelectAll}
                          />
                      </ShadTableHeaderComponent>
                    ) : null }
                    {renderHeaderCell('id', 'ID', 'ID sequencial do produto. Clique para ordenar.', `w-[60px] ${isSelectionModeActive ? 'px-2 text-center' : 'pl-2 pr-1 text-left'}`)}
                    {renderHeaderCell('produto', 'Produto', 'Nome do produto. Clique para ordenar.')}
                    {renderHeaderCell('marca', 'Marca', 'Marca do produto. Clique para ordenar.')}
                    {renderHeaderCell('unidade', 'Qtde', 'Quantidade do produto. Clique para ordenar.', 'text-center')}
                    <ShadTableHeaderComponent
                      className={cn(
                          `min-w-[130px] text-right px-2 md:px-4 py-3 relative ${!isSelectionModeActive ? 'cursor-pointer hover:bg-muted/50 dark:hover:bg-muted/30' : ''}`,
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
                                <span className="flex items-center justify-end">
                                    Validade
                                    {sortBy === 'validade' && sortBy !== 'none' && !isSelectionModeActive && (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownZA className="inline-block ml-1 h-3 w-3" />)}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Data de validade. Clique para ordenar.</p>
                            </TooltipContent>
                        </Tooltip>
                      <Popover
                          open={isAddActionPopoverOpen && !isSelectionModeActive}
                           onOpenChange={(isOpen) => {
                             if (!isOpen && isAddActionPopoverOpen) {
                               setIsAddActionPopoverOpen(false);
                             }
                          }}
                      >
                         <PopoverTrigger asChild>
                           <span className="absolute right-0 top-0 h-full w-full" data-popover-anchor-for="add-action" />
                         </PopoverTrigger>
                         <PopoverContent
                           side="top"
                           align="end"
                           className="w-auto p-1 z-[60]"
                           onOpenAutoFocus={(e) => e.preventDefault()}
                           onClick={(e) => e.stopPropagation()}
                         >
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsAddProductDialogOpen(true);
                              setNewProductFormData({ ...initialNewProductFormData });
                              setIsAddActionPopoverOpen(false);
                              setIsScannerActive(false);
                            }}
                            aria-label="Adicionar novo produto"
                          >
                            <PlusCircle className="h-4 w-4 text-primary" />
                          </Button>
                        </PopoverContent>
                      </Popover>
                    </ShadTableHeaderComponent>
                  </ShadTableRow>
                </TableHeader>
                <motion.tbody layout className="[&_tr:last-child]:border-0">
                  <AnimatePresence>
                    {isLoadingProducts && (
                      <motion.tr key="loading-row" className="border-b">
                        <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="text-center h-24 px-2 md:px-4 py-3">
                          <div className="flex items-center justify-center">
                             <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando produtos...
                          </div>
                        </TableCell>
                      </motion.tr>
                    )}
                    {!isLoadingProducts && filteredProducts.map((product) => {
                      const { styleString, particleColorClass } = getRowStyling(product.validade, product.originalId ? selectedProductIds.includes(product.originalId) : false, isSelectionModeActive, product.isExploding);
                      const currentProductKey = product.originalId!;
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
                          open={activePopoverProductId === currentProductKey && !isSelectionModeActive && !product.isExploding}
                          onOpenChange={(isOpen) => {
                             if (isSelectionModeActive || product.isExploding) {
                                 if (activePopoverProductId === currentProductKey) setActivePopoverProductId(null);
                                 return;
                             }
                             if (isOpen) {
                               setSelectedProduct(product);
                               setActivePopoverProductId(currentProductKey);
                             } else {
                               if (activePopoverProductId === currentProductKey) {
                                 setActivePopoverProductId(null);
                               }
                             }
                          }}
                        >
                          <PopoverTrigger asChild disabled={isSelectionModeActive || product.isExploding}>
                            <motion.tr
                              layout
                              layoutId={currentProductKey}
                              initial={{ opacity: 1 }}
                              animate={finalAnimateProps}
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
                                if (product.isExploding) return;
                                if (longPressTimerRef.current) {
                                  clearTimeout(longPressTimerRef.current);
                                  longPressTimerRef.current = null;
                                }
                                 pointerDownPositionRef.current = null;
                              }}
                              onPointerMove={(e: PointerEvent<HTMLTableRowElement>) => {
                                if (product.isExploding) return;
                                handlePointerMove(e.clientX, e.clientY);
                              }}
                              onTouchStart={(e: TouchEvent<HTMLTableRowElement>) => {
                                if (product.isExploding || !product.originalId) return;
                                if (e.touches.length === 1) {
                                    handleRowInteractionStart(product.originalId, e.touches[0].clientX, e.touches[0].clientY);
                                }
                              }}
                              onTouchEnd={(e: TouchEvent<HTMLTableRowElement>) => {
                                if (product.isExploding || !product.originalId) return;
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
                                          aria-label={`Selecionar produto ${product.produto}`}
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
                           {!isSelectionModeActive && !product.isExploding && (
                            <PopoverContent side="top" align="end" className="w-auto p-0.5 z-50"
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

      {editingProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) {
            setEditingProduct(null);
            setIsEditCalendarOpen(false);
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
                  Produto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-produto"
                  name="produto"
                  ref={editProductNameInputRef}
                  value={editFormData.produto}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                  required
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
                  Qtde <span className="text-destructive">*</span>
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditQuantityChange(-1)} disabled={(parseInt(editFormData.unidade, 10) || 1) <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="edit-unidade"
                    name="unidade"
                    value={editFormData.unidade}
                    onChange={handleEditFormChange}
                    className="w-16 text-center"
                    type="number"
                    min="1"
                    step="1"
                    required
                  />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditQuantityChange(1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                 <Label htmlFor="edit-validade-btn" className="text-right">
                    Validade <span className="text-destructive">*</span>
                </Label>
                <Popover open={isEditCalendarOpen} onOpenChange={setIsEditCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="edit-validade-btn"
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !editFormData.validade && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {editFormData.validade && isValid(parseISO(editFormData.validade)) ? format(parseISO(editFormData.validade), "dd/MM/yyyy") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editFormData.validade ? parseISO(editFormData.validade) : undefined}
                      onSelect={(date) => {
                        setEditFormData(prev => ({ ...prev, validade: date ? format(date, "yyyy-MM-dd") : '' }));
                        setIsEditCalendarOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => date < startOfDay(new Date()) && !isToday(date) }
                    />
                  </PopoverContent>
                </Popover>
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
        if (!isOpen) {
            setNewProductFormData({ ...initialNewProductFormData });
            setIsScannerActive(false);
            setIsSuggestingName(false);
            setIsCalendarOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isScannerActive ? "Escanear Código de Barras" : "Adicionar Novo Produto"}</DialogTitle>
            <DialogDescription>
              {isScannerActive
                ? "Posicione o código de barras do produto em frente à câmera."
                : "Preencha os detalhes abaixo ou escaneie um código de barras."}
            </DialogDescription>
          </DialogHeader>

          {isScannerActive ? (
            <div className="py-4 space-y-4">
              <BarcodeScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                isScanning={isScannerActive}
                setIsScanning={setIsScannerActive}
              />
            </div>
          ) : (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-produto" className="text-right">
                  Produto <span className="text-destructive">*</span>
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input
                    id="new-produto"
                    name="produto"
                    ref={newProductNameInputRef}
                    value={newProductFormData.produto}
                    onChange={handleNewProductFormChange}
                    className="flex-1"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleSuggestProductName}
                    disabled={isSuggestingName || !newProductFormData.produto.trim()}
                    aria-label="Sugerir Nome do Produto"
                  >
                    {isSuggestingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  </Button>
                </div>
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
                  Qtde <span className="text-destructive">*</span>
                </Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleNewQuantityChange(-1)} disabled={(parseInt(newProductFormData.unidade, 10) || 1) <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="new-unidade"
                    name="unidade"
                    value={newProductFormData.unidade}
                    onChange={handleNewProductFormChange}
                    className="w-16 text-center"
                    type="number"
                    min="1"
                    step="1"
                    required
                  />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleNewQuantityChange(1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-validade-btn" className="text-right">
                  Validade <span className="text-destructive">*</span>
                </Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="new-validade-btn"
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal",
                        !newProductFormData.validade && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {newProductFormData.validade ? format(parseISO(newProductFormData.validade), "dd/MM/yyyy") : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newProductFormData.validade ? parseISO(newProductFormData.validade) : undefined}
                      onSelect={(date) => {
                        setNewProductFormData(prev => ({ ...prev, validade: date ? format(date, "yyyy-MM-dd") : '' }));
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => date < startOfDay(new Date()) && !isToday(date) }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-between sm:items-center">
            {isScannerActive ? (
                <Button variant="outline" className="w-full sm:ml-auto" onClick={() => {
                    setIsScannerActive(false);
                    setTimeout(() => newProductNameInputRef.current?.focus(), 0);
                }}>
                   Digitar Manualmente
                </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsScannerActive(true)}
                  className="w-full sm:w-auto"
                >
                  <Camera className="mr-2 h-4 w-4" /> Escanear Código
                </Button>
                <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:justify-end sm:space-x-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                  </DialogClose>
                  <Button type="button" variant="outline" onClick={() => handleAddNewProduct(false)} className="w-full sm:w-auto">
                    Salvar & Novo
                  </Button>
                  <Button type="button" onClick={() => handleAddNewProduct(true)} className="w-full sm:w-auto">
                    Salvar Produto
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveProductsDialogOpen} onOpenChange={setIsMoveProductsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover Produtos Selecionados</DialogTitle>
            <DialogDescription>
              Selecione a lista de destino para os {currentlySelectedProductsCount} produto(s) selecionado(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="target-list-select">Mover para: <span className="text-destructive">*</span></Label>
            <Select onValueChange={setTargetMoveListId} defaultValue={targetMoveListId}>
              <SelectTrigger id="target-list-select">
                <SelectValue placeholder="Selecione uma lista de destino" />
              </SelectTrigger>
              <SelectContent>
                {productLists
                  .filter(pList => pList.id !== listId)
                  .map(pList => (
                    <SelectItem key={pList.id} value={pList.id}>
                      {pList.name}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleMoveProducts} disabled={!targetMoveListId}>
              Mover Produtos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBatchEditExpiryDialogOpen} onOpenChange={setIsBatchEditExpiryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Validade em Lote</DialogTitle>
            <DialogDescription>
              Defina uma nova data de validade para os {currentlySelectedProductsCount} produto(s) selecionado(s).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="batch-expiry-date">Nova Data de Validade: <span className="text-destructive">*</span></Label>
            <Input
              id="batch-expiry-date"
              type="date"
              value={batchNewExpiryDate}
              onChange={(e) => setBatchNewExpiryDate(e.target.value)}
              className="col-span-3"
              min={format(new Date(), "yyyy-MM-dd")}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleBatchUpdateExpiry} disabled={!batchNewExpiryDate}>
              Atualizar Validades
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
