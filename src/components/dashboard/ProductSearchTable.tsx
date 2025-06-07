
"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent, useRef, type PointerEvent, type TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Table, TableBody as ShadTableBody, TableCell, TableHead, TableHeader as ShadTableHeader, TableRow as ShadTableRow } from '@/components/ui/table';
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


const mockProducts: Omit<Product, 'id' | 'originalId' | 'isExploding'>[] = [
  { produto: 'Leite Integral UHT', marca: 'Tirol', unidade: '24', validade: '2024-12-15' },
  { produto: 'Pão de Forma Tradicional', marca: 'Seven Boys', unidade: '10', validade: '2024-07-20' },
  { produto: 'Café Torrado e Moído', marca: '3 Corações', unidade: '15', validade: '2025-03-10' },
  { produto: 'Arroz Branco Tipo 1', marca: 'Camil', unidade: '5', validade: '2025-08-01' },
  { produto: 'Feijão Carioca Tipo 1', marca: 'Kicaldo', unidade: '8', validade: '2025-06-22' },
  { produto: 'Óleo de Soja Refinado', marca: 'Soya', unidade: '20', validade: '2024-11-05' },
  { produto: 'Refrigerante Guaraná', marca: 'Antarctica', unidade: '48', validade: '2024-10-30' },
  { produto: 'Biscoito Cream Cracker', marca: 'Vitarella', unidade: '30', validade: '2024-09-01' },
  { produto: 'Macarrão Espaguete', marca: 'Barilla', unidade: '25', validade: '2026-01-15' },
  { produto: 'Açúcar Refinado', marca: 'União', unidade: '18', validade: '2025-12-31' },
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

const getRowStyling = (validade: string, isSelected: boolean, isSelectionModeActive: boolean, isExploding?: boolean): { styleString: string; particleColorClass: string } => {
  let baseStyle = 'transition-colors duration-150 ease-in-out relative';
  let particleColorClass = 'bg-white'; 

  if (isExploding) {
     if (!isValid(parseISO(validade))) {
      particleColorClass = 'bg-muted';
    } else {
      const productDateStartOfDay = startOfDay(parseISO(validade));
      if (isPast(productDateStartOfDay) && !isToday(productDateStartOfDay)) {
        particleColorClass = 'bg-red-500 dark:bg-red-600';
      } else if (isToday(productDateStartOfDay) || isTomorrow(productDateStartOfDay)) {
        particleColorClass = 'bg-orange-400 dark:bg-orange-500';
      } else {
        particleColorClass = 'bg-white';
      }
    }
    return { styleString: `${baseStyle} bg-transparent`, particleColorClass };
  }

  if (isSelectionModeActive) {
    baseStyle += isSelected ? ' bg-primary/20 dark:bg-primary/30' : ' hover:bg-muted/50 cursor-pointer';
  } else {
    baseStyle += ' hover:bg-muted/50 cursor-pointer';
  }

  if (!isValid(parseISO(validade))) {
    return { styleString: baseStyle, particleColorClass: 'bg-muted' };
  }

  const productDateStartOfDay = startOfDay(parseISO(validade));

  if (isPast(productDateStartOfDay) && !isToday(productDateStartOfDay)) {
    return { styleString: `${baseStyle} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200/70 dark:hover:bg-red-800/40`, particleColorClass: 'bg-red-500 dark:bg-red-600' };
  }
  if (isToday(productDateStartOfDay) || isTomorrow(productDateStartOfDay)) {
    return { styleString: `${baseStyle} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200/70 dark:hover:bg-orange-800/40`, particleColorClass: 'bg-orange-400 dark:bg-orange-500' };
  }
  return { styleString: baseStyle, particleColorClass };
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


const initialNewProductFormData: Omit<Product, 'id' | 'isExploding' | 'originalId'> = {
  produto: '',
  marca: '',
  unidade: '',
  validade: '',
};

type SortableKey = Exclude<keyof Product, 'isExploding' | 'originalId'>;

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
      className="absolute inset-0 pointer-events-none overflow-hidden"
    >
      {dimensions.width > 0 && Array.from({ length: numParticles }).map((_, i) => {
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


export function ProductSearchTable() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');

  const [clientSideProducts, setClientSideProducts] = useState<Product[]>(() =>
    mockProducts.map((p, index) => ({
        ...p,
        id: (index + 1).toString(),
        originalId: p.produto + p.marca + index + Math.random().toString(36).substring(2,11),
        isExploding: false
    }))
  );


  const [sortBy, setSortBy] = useState<SortableKey | 'none'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Product, 'id' | 'isExploding' | 'originalId'>>({ ...initialNewProductFormData });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSelectionModeActive, setIsSelectionModeActive] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [activePopoverProductId, setActivePopoverProductId] = useState<string | null>(null);

  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [newProductFormData, setNewProductFormData] = useState<Omit<Product, 'id' | 'isExploding' | 'originalId'>>({ ...initialNewProductFormData });

  const [isAddActionPopoverOpen, setIsAddActionPopoverOpen] = useState(false);
  const longPressHeaderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const headerPointerDownPositionRef = useRef<{ x: number; y: number } | null>(null);
  const validadeHeaderRef = useRef<HTMLTableCellElement>(null);

  const [shockwaveTargets, setShockwaveTargets] = useState<ShockwaveTarget[]>([]);
  const longPressInitiatedSelectionRef = useRef(false);


 useEffect(() => {
    if (shockwaveTargets.length > 0) {
      const timer = setTimeout(() => {
        setShockwaveTargets([]);
      }, SHOCKWAVE_DURATION + 100); 
      return () => clearTimeout(timer);
    }
  }, [shockwaveTargets]);


  const finalizeDeleteProduct = (productOriginalId: string) => {
    setClientSideProducts(prevProducts => {
        const productsAfterExplosion = prevProducts.filter(p => p.originalId !== productOriginalId);
        const resequenced = resequenceProducts(productsAfterExplosion);

        const currentSelectedIds = selectedProductIds.filter(id => {
            // Check if the product still exists in the resequenced list
            return resequenced.some(p => p.originalId === id);
        });
        
        const stillExplodingCount = resequenced.filter(p => p.isExploding).length;
        const activeSelectionsExist = currentSelectedIds.length > 0;
        
        if (stillExplodingCount === 0 && !activeSelectionsExist) {
            setIsSelectionModeActive(false);
            setSelectedProductIds([]);
        } else {
            setSelectedProductIds(currentSelectedIds);
        }
        return resequenced;
    });
  };


  const handleRowInteractionStart = (productOriginalId: string, clientX: number, clientY: number) => {
    pointerDownPositionRef.current = { x: clientX, y: clientY };
    longPressInitiatedSelectionRef.current = false; // Reset for this interaction

    if (isSelectionModeActive) {
      if (longPressTimerRef.current) { // If a timer is running from a previous incomplete interaction
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return; // In selection mode, taps are handled by pointerup, long press doesn't re-initiate
    }

    // Not in selection mode, set up a long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
    longPressTimerRef.current = setTimeout(() => {
      if (pointerDownPositionRef.current) { // Check if pointer is still down (not dragged off)
        setIsSelectionModeActive(true);
        setSelectedProductIds((prevSelected) =>
          prevSelected.includes(productOriginalId) ? prevSelected : [...prevSelected, productOriginalId]
        );
        setActivePopoverProductId(null); 
        longPressInitiatedSelectionRef.current = true; 
      }
      longPressTimerRef.current = null;
      pointerDownPositionRef.current = null; // Clear after long press action
    }, LONG_PRESS_DURATION);
  };

  const handleRowInteractionEnd = (product: Product, clientX: number, clientY: number, target: EventTarget | null) => {
    if (longPressInitiatedSelectionRef.current) {
        longPressInitiatedSelectionRef.current = false; // Reset flag
        // Long press already handled selection and cleared its timer/position.
        // This pointerup is just the end of that gesture.
        return; 
    }

    // Clear any active long press timer if it hasn't fired (i.e., it was a short tap or drag)
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const isClickOnCheckboxCell = target instanceof HTMLElement && !!target.closest('[data-is-checkbox-cell="true"]');
    
    if (isSelectionModeActive && !isClickOnCheckboxCell && product.originalId && pointerDownPositionRef.current) {
        // This is a tap/short interaction while in selection mode
        const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
        const dy = Math.abs(clientY - pointerDownPositionRef.current.y);
        if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            handleToggleSelectProduct(product.originalId);
        }
    }
    // For popover: Radix Popover's onOpenChange will handle opening/closing on tap.
    // No explicit popover logic here for short taps.
    
    pointerDownPositionRef.current = null; // Always clear position ref after interaction
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!pointerDownPositionRef.current || !longPressTimerRef.current) return; // Only act if a long press is pending

    const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - pointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) { // If dragged too far
      clearTimeout(longPressTimerRef.current); // Cancel long press
      longPressTimerRef.current = null;
      // Don't nullify pointerDownPositionRef here, handleRowInteractionEnd might need it for drag-tap decision
    }
  };


  const handleHeaderPointerDown = (clientX: number, clientY: number) => {
    if (isSelectionModeActive) return; // No header actions in selection mode
    headerPointerDownPositionRef.current = { x: clientX, y: clientY };

    if (longPressHeaderTimerRef.current) {
      clearTimeout(longPressHeaderTimerRef.current);
    }
    longPressHeaderTimerRef.current = setTimeout(() => {
      if (headerPointerDownPositionRef.current) { // Check if not dragged off
        setIsAddActionPopoverOpen(true); // Open popover
        // Don't nullify headerPointerDownPositionRef here, let onPointerUp handle it
      }
      longPressHeaderTimerRef.current = null; // Timer has fired or been cancelled
    }, LONG_PRESS_DURATION);
  };


const handleHeaderPointerUp = (column: SortableKey, event: PointerEvent<HTMLTableCellElement> | TouchEvent<HTMLTableCellElement>) => {
    const wasLongPressTimerActive = !!longPressHeaderTimerRef.current;

    if (longPressHeaderTimerRef.current) {
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
    }

    let dragged = false;
    const initialDownPos = headerPointerDownPositionRef.current; // Capture before nullifying
    headerPointerDownPositionRef.current = null; // Nullify for next interaction

    if (initialDownPos) {
      let currentX, currentY;
      if ('changedTouches' in event) { // TouchEvent
        currentX = (event as TouchEvent<HTMLTableCellElement>).changedTouches[0].clientX;
        currentY = (event as TouchEvent<HTMLTableCellElement>).changedTouches[0].clientY;
      } else { // PointerEvent
        currentX = (event as PointerEvent<HTMLTableCellElement>).clientX;
        currentY = (event as PointerEvent<HTMLTableCellElement>).clientY;
      }
      const dx = Math.abs(currentX - initialDownPos.x);
      const dy = Math.abs(currentY - initialDownPos.y);
      if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
        dragged = true;
      }
    }

    if (isSelectionModeActive) return;

    // If timer was running (or just cleared by us) AND it wasn't a drag, it was a short click.
    if (wasLongPressTimerActive && !dragged) {
      handleHeaderClick(column);
      // Popover is controlled by isAddActionPopoverOpen, which is only set by the timer.
      // A short click should not open it. If it was already open, Radix handles toggle.
    } else if (dragged) { // If it was a drag that cancelled the timer
      handleHeaderClick(column);
    }
    // If long press timer fired: wasLongPressTimerActive is false. isAddActionPopoverOpen is true. Don't sort from this 'up' event.
    // A subsequent tap on the header will be a new short click interaction.
  };


  const handleHeaderPointerMove = (clientX: number, clientY: number) => {
    if (!headerPointerDownPositionRef.current || !longPressHeaderTimerRef.current) return;

    const dx = Math.abs(clientX - headerPointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - headerPointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
      // Don't nullify headerPointerDownPositionRef.current, let onPointerUp handle based on drag
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

 const triggerShockwave = (deletedOriginalIds: string[]) => {
    const currentVisibleProducts = filteredProducts; 
    const newShockwaveTargetsMap = new Map<string, ShockwaveTarget>();

    deletedOriginalIds.forEach(deletedId => {
        const deletedProductVisualIndex = currentVisibleProducts.findIndex(p => p.originalId === deletedId);
        if (deletedProductVisualIndex === -1) return;

        for (let direction of [-1, 1]) { // -1 for up, 1 for down
            for (let distance = 1; ; distance++) { 
                const calculatedStrength = BASE_SHOCKWAVE_STRENGTH_PX - (distance - 1) * SHOCKWAVE_STRENGTH_DECREMENT_PER_STEP;
                if (calculatedStrength <= 0) break;

                const neighborIndex = deletedProductVisualIndex + (distance * direction);
                if (neighborIndex < 0 || neighborIndex >= currentVisibleProducts.length) break;
                
                const neighbor = currentVisibleProducts[neighborIndex];
                if (neighbor && !neighbor.isExploding && !deletedOriginalIds.includes(neighbor.originalId!)) {
                    const existingTarget = newShockwaveTargetsMap.get(neighbor.originalId!);
                    if (!existingTarget || calculatedStrength > existingTarget.strength) { // Prioritize stronger shock if multiple deletions affect same neighbor
                         newShockwaveTargetsMap.set(neighbor.originalId!, {
                            id: neighbor.originalId!,
                            distance: distance, // Store actual distance for potential scaling effects
                            direction: direction === -1 ? 'up' : 'down',
                            strength: calculatedStrength,
                        });
                    }
                }
            }
        }
    });
    setShockwaveTargets(Array.from(newShockwaveTargetsMap.values()));
};


  const handleDeleteSingleProduct = () => {
    if (selectedProduct && selectedProduct.originalId) {
      triggerShockwave([selectedProduct.originalId]);
      setClientSideProducts(prevProducts =>
        prevProducts.map(p =>
          p.originalId === selectedProduct.originalId ? { ...p, isExploding: true } : p
        )
      );
      toast({ title: "Produto excluído", description: `${selectedProduct.produto} será removido.` });
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (editingProduct && editingProduct.originalId) {
      setClientSideProducts(prevProducts =>
        resequenceProducts(
            prevProducts.map(p =>
            p.originalId === editingProduct.originalId ? { ...editingProduct, ...editFormData, isExploding: p.isExploding, id: p.id, originalId: p.originalId } : p
            )
        )
      );
      toast({ title: "Produto atualizado", description: `${editFormData.produto} foi atualizado com sucesso.` });
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    }
  };

 const filteredProducts = useMemo(() => {
    let productsToFilter = [...clientSideProducts];

    if (sortBy && sortBy !== 'none') {
        productsToFilter.sort((a, b) => {
            const valA = a[sortBy];
            const valB = b[sortBy];
            let comparison = 0;

            if (sortBy === 'validade') {
              const dateA = parseISO(valA as string);
              const dateB = parseISO(valB as string);
              const aIsValid = isValid(dateA);
              const bIsValid = isValid(dateB);

              if (aIsValid && bIsValid) {
                comparison = dateA.getTime() - dateB.getTime();
              } else if (aIsValid && !bIsValid) { comparison = -1; } // Valid dates before invalid
              else if (!aIsValid && bIsValid) { comparison = 1;  } // Invalid dates after valid
              else { // Both invalid, tie-break by originalId or id
                const originalIdA = a.originalId || a.id || '';
                const originalIdB = b.originalId || b.id || '';
                comparison = originalIdA.localeCompare(originalIdB);
              }
            } else if (sortBy === 'id' || sortBy === 'unidade') {
              const numA = parseInt(valA as string, 10);
              const numB = parseInt(valB as string, 10);
              const aIsNum = !isNaN(numA);
              const bIsNum = !isNaN(numB);

              if (aIsNum && bIsNum) {
                comparison = numA - numB;
              } else if (aIsNum && !bIsNum) { comparison = -1; } // Numbers before non-numbers
              else if (!aIsNum && bIsNum) { comparison = 1;  } // Non-numbers after numbers
              else { // Both non-numbers (or failed parse), fallback to string compare
                comparison = normalizeString(String(valA)).localeCompare(normalizeString(String(valB)));
              }
            } else { // Default to string comparison for 'produto', 'marca'
              comparison = normalizeString(String(valA)).localeCompare(normalizeString(String(valB)));
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }


    let displayableProducts = productsToFilter.filter(product => {
        if (product.isExploding) return true; // Keep exploding products for animation

        const normalizedSearch = normalizeString(searchTerm);
        if (normalizedSearch) {
            if (!Object.values(product).some(value => normalizeString(String(value)).includes(normalizedSearch))) {
                return false;
            }
        }
        if (selectedDateFilter !== 'all') {
            const productDate = parseISO(product.validade);
            if (!isValid(productDate)) {
                 return selectedDateFilter === 'all'; // Or specific handling for invalid dates if needed
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
    const visibleProductsNotExploding = filteredProducts.filter(p => !p.isExploding);
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

  const handleDeleteSelected = () => {
    const idsToDelete = selectedProductIds.filter(id => clientSideProducts.find(p => p.originalId === id && !p.isExploding));
    if (idsToDelete.length > 0) {
        triggerShockwave([...idsToDelete]);
        setClientSideProducts(prevProducts =>
          prevProducts.map(p =>
            idsToDelete.includes(p.originalId!) ? { ...p, isExploding: true } : p
          )
        );
        toast({ title: `${idsToDelete.length} produto(s) marcado(s) para exclusão.` });
    }
    setIsDeleteSelectedConfirmOpen(false);
    // Don't clear selectedProductIds here, let finalizeDeleteProduct handle it after explosions
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

  const handleAddNewProduct = () => {
    if (!newProductFormData.produto || !newProductFormData.validade || !newProductFormData.unidade) {
      toast({
        title: "Erro",
        description: "Produto, Quantidade e Validade são campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    const newOriginalId = newProductFormData.produto + newProductFormData.marca + Date.now() + Math.random().toString(36).substring(2,11);
    const newProductData: Product = {
        ...newProductFormData,
        id: '', 
        originalId: newOriginalId,
        isExploding: false
    };
    setClientSideProducts(prevProducts =>
        resequenceProducts([...prevProducts, newProductData])
    );

    toast({ title: "Produto Adicionado", description: `${newProductFormData.produto} foi adicionado com sucesso.` });
    setIsAddProductDialogOpen(false);
    setNewProductFormData({ ...initialNewProductFormData });
  };

  const productsForDisplay = useMemo(() => filteredProducts.filter(p => !p.isExploding), [filteredProducts]);
  const allFilteredSelected = productsForDisplay.length > 0 && productsForDisplay.every(p => p.originalId && selectedProductIds.includes(p.originalId));
  const someFilteredSelected = productsForDisplay.length > 0 && selectedProductIds.some(id => productsForDisplay.find(p => p.originalId === id));


  const selectAllCheckedState = allFilteredSelected ? true : (someFilteredSelected ? "indeterminate" : false);


  const handleHeaderClick = (column: SortableKey) => {
    // Sorting is disabled in selection mode or if the add action popover is open for that column (Validade)
    if (isSelectionModeActive || (column === 'validade' && isAddActionPopoverOpen)) return;

    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };


  useEffect(() => {
    // Deselect items that are no longer in clientSideProducts or are exploding
    if (selectedProductIds.length > 0) {
        setSelectedProductIds(prevIds => prevIds.filter(id => 
            clientSideProducts.some(p => p.originalId === id && !p.isExploding)
        ));
    }

    // Logic to exit selection mode if no items are selected and nothing is exploding
    if (isSelectionModeActive) {
        const activeSelectionsStillPresent = selectedProductIds.some(id =>
            clientSideProducts.find(p => p.originalId === id && !p.isExploding)
        );
        const anyProductIsCurrentlyExploding = clientSideProducts.some(p => p.isExploding);

        if (!activeSelectionsStillPresent && !anyProductIsCurrentlyExploding) {
            setIsSelectionModeActive(false);
            // selectedProductIds should already be empty if activeSelectionsStillPresent is false
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
  }, [clientSideProducts, isSelectionModeActive]); // Removed selectedProductIds from deps to avoid loops

  const renderHeaderCell = (column: SortableKey, label: string, classNameExt: string = "") => {
    const baseClasses = `py-3 ${isSelectionModeActive ? 'pl-2 pr-2' : 'px-2 md:px-4'} ${!isSelectionModeActive && !(column === 'validade' && isAddActionPopoverOpen) ? 'cursor-pointer hover:bg-muted/50' : ''}`;
    const icon = sortBy === column && sortBy !== 'none' && !isSelectionModeActive && !(column === 'validade' && isAddActionPopoverOpen)
      ? (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownZA className="inline-block ml-1 h-3 w-3" />)
      : null;

    return (
      <ShadTableHeader
        className={`${baseClasses} ${classNameExt}`}
        onPointerDown={(e: PointerEvent<HTMLTableCellElement>) => handleHeaderPointerDown(e.clientX, e.clientY)}
        onPointerUp={(e) => handleHeaderPointerUp(column, e)}
        onPointerLeave={(e: PointerEvent<HTMLTableCellElement>) => { 
          if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
           // Do not clear headerPointerDownPositionRef here, pointerUp needs it for drag check
        }}
        onPointerMove={(e: PointerEvent<HTMLTableCellElement>) => handleHeaderPointerMove(e.clientX, e.clientY)}
        onTouchStart={(e: TouchEvent<HTMLTableCellElement>) => {
          if (e.touches.length === 1) handleHeaderPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={(e) => handleHeaderPointerUp(column, e)}
        onTouchCancel={() => { 
           if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
           headerPointerDownPositionRef.current = null;
        }}
        onTouchMove={(e: TouchEvent<HTMLTableCellElement>) => {
          if (e.touches.length === 1) handleHeaderPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }}
      >
        {label} {icon}
      </ShadTableHeader>
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
                {selectedProductIds.filter(id => clientSideProducts.find(p => p.originalId === id && !p.isExploding)).length} item(s) selecionado(s)
              </p>
              <div className="flex space-x-2">
                <Button variant="ghost" onClick={cancelSelectionMode} size="sm">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                {selectedProductIds.filter(id => clientSideProducts.find(p => p.originalId === id && !p.isExploding)).length > 0 && (
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
              <ShadTableHeader>
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
                  {renderHeaderCell('marca', 'Marca')}
                  {renderHeaderCell('unidade', 'Qtde', 'text-center')}

                  <ShadTableHeader
                    ref={validadeHeaderRef}
                    className={`min-w-[130px] text-right px-2 md:px-4 py-3 relative ${!isSelectionModeActive && !isAddActionPopoverOpen ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                     onPointerDown={(e: PointerEvent<HTMLTableCellElement>) => { e.stopPropagation(); handleHeaderPointerDown(e.clientX, e.clientY);}}
                     onPointerUp={(e) => { e.stopPropagation(); handleHeaderPointerUp('validade', e);}}
                     onPointerLeave={(e: PointerEvent<HTMLTableCellElement>) => {
                       e.stopPropagation();
                       if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                     }}
                     onPointerMove={(e: PointerEvent<HTMLTableCellElement>) => {e.stopPropagation(); handleHeaderPointerMove(e.clientX, e.clientY);}}
                     onTouchStart={(e: TouchEvent<HTMLTableCellElement>) => {
                       e.stopPropagation();
                       if (e.touches.length === 1) handleHeaderPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                     }}
                     onTouchEnd={(e) => { e.stopPropagation(); handleHeaderPointerUp('validade', e);}}
                     onTouchCancel={(e) => {
                        e.stopPropagation();
                        if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                        headerPointerDownPositionRef.current = null;
                     }}
                     onTouchMove={(e: TouchEvent<HTMLTableCellElement>) => {
                       e.stopPropagation();
                       if (e.touches.length === 1) handleHeaderPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                     }}
                  >
                    Validade
                    {sortBy === 'validade' && sortBy !== 'none' && !isSelectionModeActive && !isAddActionPopoverOpen && (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownZA className="inline-block ml-1 h-3 w-3" />)}
                    <Popover open={isAddActionPopoverOpen && !isSelectionModeActive} onOpenChange={setIsAddActionPopoverOpen}>
                       <PopoverTrigger asChild>
                         <span className="absolute inset-0" />
                       </PopoverTrigger>
                       <PopoverContent side="top" align="end" className="w-auto p-1 z-[60]" 
                         onOpenAutoFocus={(e) => e.preventDefault()} 
                         onClick={(e) => e.stopPropagation()} 
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
                  </ShadTableHeader>
                </ShadTableRow>
              </ShadTableHeader>
              <MotionTableBody layout>
                <AnimatePresence initial={false}>
                  {filteredProducts.map((product) => {
                    const { styleString, particleColorClass } = getRowStyling(product.validade, product.originalId ? selectedProductIds.includes(product.originalId) : false, isSelectionModeActive, product.isExploding);
                    const currentProductKey = product.originalId!;

                    let shockwaveAnimProps: any = {};
                    const shockwaveTargetInfo = !product.isExploding ? shockwaveTargets.find(st => st.id === currentProductKey) : undefined;

                    if (shockwaveTargetInfo) {
                        const { strength, direction, distance } = shockwaveTargetInfo;
                        const displacementFactor = direction === 'up' ? -1 : 1;
                        const ySequence = [0, displacementFactor * strength, displacementFactor * strength * 0.4, displacementFactor * strength * -0.2, 0];
                        
                        const baseScaleMagnitude = 0.05; 
                        let currentScaleMagnitude = 0;
                        if (strength > 0) {
                           const maxPossibleStrengthForDistance1 = BASE_SHOCKWAVE_STRENGTH_PX; 
                           const strengthRatio = Math.max(0, strength / maxPossibleStrengthForDistance1); // ensure non-negative ratio
                           currentScaleMagnitude = baseScaleMagnitude * strengthRatio;
                        }
                        const scaleSequence = [1, 1 + currentScaleMagnitude, 1 - currentScaleMagnitude * 0.6, 1 + currentScaleMagnitude * 0.2, 1];

                        shockwaveAnimProps = {
                            y: ySequence,
                            scale: scaleSequence,
                            transition: { duration: SHOCKWAVE_DURATION / 1000, ease: "easeInOut" }
                        };
                    }


                    return (
                      <Popover
                        key={currentProductKey}
                        open={activePopoverProductId === currentProductKey && !isSelectionModeActive && !product.isExploding}
                        onOpenChange={(isOpen) => {
                           if (isSelectionModeActive || product.isExploding) { // Prevent popover in selection or if exploding
                               if (activePopoverProductId === currentProductKey) setActivePopoverProductId(null);
                               return;
                           }
                           if (isOpen) {
                             setSelectedProduct(product);
                             setActivePopoverProductId(currentProductKey);
                           } else {
                             if (activePopoverProductId === currentProductKey) setActivePopoverProductId(null);
                           }
                        }}
                      >
                        <PopoverTrigger asChild disabled={isSelectionModeActive || product.isExploding}>
                          <MotionTableRow
                            layoutId={currentProductKey}
                            initial={{ opacity: 1 }}
                            animate={shockwaveAnimProps}
                            exit={{ opacity: 0, height: 0, transition: {duration: 0.3, type: "tween" } }}
                            transition={{ type: "spring", stiffness: 300, damping: 25  }}
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
                              <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="p-0 relative h-[57px]">
                                <Particle
                                  onComplete={() => finalizeDeleteProduct(currentProductKey)}
                                  particleColorClass={particleColorClass}
                                />
                              </TableCell>
                            ) : (
                              <>
                                {isSelectionModeActive && (
                                  <TableCell data-is-checkbox-cell="true" className="py-0 px-2" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        aria-label={`Selecionar produto ${product.produto}`}
                                        checked={product.originalId ? selectedProductIds.includes(product.originalId) : false}
                                        onCheckedChange={() => product.originalId && handleToggleSelectProduct(product.originalId)}
                                      />
                                  </TableCell>
                                )}
                                <TableCell className={`font-medium py-3 px-2 md:px-4 ${isSelectionModeActive ? 'pl-1 pr-1' : ''}`}>{product.id}</TableCell>
                                <TableCell className="py-3 px-2 md:px-4">{product.produto}</TableCell>
                                <TableCell className="py-3 px-2 md:px-4">{product.marca}</TableCell>
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
                    );
                  })}
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
              Tem certeza que deseja excluir os {selectedProductIds.filter(id => clientSideProducts.find(p => p.originalId === id && !p.isExploding)).length} produtos selecionados? Esta ação não pode ser desfeita.
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
