
"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent, useRef, type PointerEvent, type TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Table, TableBody as ShadTableBody, TableCell, TableHead, TableRow as ShadTableRow } from '@/components/ui/table';
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
  { produto: 'Leite Condensado', marca: 'Moça', unidade: '36', validade: '2025-02-20' },
  { produto: 'Creme de Leite UHT', marca: 'Piracanjuba', unidade: '40', validade: '2024-11-25' },
  { produto: 'Iogurte Natural', marca: 'Batavo', unidade: '12', validade: new Date().toISOString().split('T')[0] },
  { produto: 'Queijo Minas Frescal', marca: 'Polenghi', unidade: '6', validade: subDays(new Date(), 1).toISOString().split('T')[0] },
  { produto: 'Suco de Laranja Integral', marca: 'Del Valle', unidade: '9', validade: addDays(new Date(), 1).toISOString().split('T')[0] },
  { produto: 'Manteiga com Sal', marca: 'Aviação', unidade: '3', validade: '2023-01-01' },
  { produto: 'Requeijão Cremoso', marca: 'Vigor', unidade: '7', validade: addDays(new Date(), 3).toISOString().split('T')[0] },
  { produto: 'Doce de Leite', marca: 'Itambé', unidade: '4', validade: subDays(new Date(), 5).toISOString().split('T')[0] },
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
  let particleColorClass = 'bg-white'; // Default to white particles for normal exploding rows

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
        particleColorClass = 'bg-white'; // Normal valid items get white particles
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
    return { styleString: baseStyle, particleColorClass: 'bg-muted' }; // Default particle color for invalid date non-exploding
  }

  const productDateStartOfDay = startOfDay(parseISO(validade));

  if (isPast(productDateStartOfDay) && !isToday(productDateStartOfDay)) {
    return { styleString: `${baseStyle} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200/70 dark:hover:bg-red-800/40`, particleColorClass: 'bg-red-500 dark:bg-red-600' };
  }
  if (isToday(productDateStartOfDay) || isTomorrow(productDateStartOfDay)) {
    return { styleString: `${baseStyle} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200/70 dark:hover:bg-orange-800/40`, particleColorClass: 'bg-orange-400 dark:bg-orange-500' };
  }
  // For normal rows, when not exploding, the particleColorClass is not strictly needed but kept consistent.
  return { styleString: baseStyle, particleColorClass };
};


const resequenceProducts = (products: Product[]): Product[] => {
  return products.map((product, index) => ({
    ...product,
    id: (index + 1).toString(), // Update display ID
    // originalId and isExploding remain unchanged
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
  id: string; // This will be the originalId of the product
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
      className="absolute inset-0 pointer-events-none overflow-hidden" // Added overflow-hidden
    >
      {dimensions.width > 0 && Array.from({ length: numParticles }).map((_, i) => {
        const initialX = Math.random() * dimensions.width;
        const initialY = Math.random() * dimensions.height;

        // More pronounced upward and outward diagonal movement
        const travelDistanceXBase = dimensions.width * (0.2 + Math.random() * 0.6); // Spread more horizontally
        const travelDistanceYBase = dimensions.height * (1.0 + Math.random() * 0.8); // Stronger upward push

        const travelXSign = Math.random() < 0.5 ? -1 : 1; // Randomly left or right from initial X

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
              x: initialX + travelXSign * travelDistanceXBase, // Diagonal spread
              y: initialY - travelDistanceYBase, // Stronger upward
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
        id: (index + 1).toString(), // Display ID
        originalId: p.produto + p.marca + index + Math.random().toString(36).substring(2,11), // Stable unique key
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


 useEffect(() => {
    if (shockwaveTargets.length > 0) {
      const timer = setTimeout(() => {
        setShockwaveTargets([]);
      }, SHOCKWAVE_DURATION + 100); // Add a small buffer
      return () => clearTimeout(timer);
    }
  }, [shockwaveTargets]);


  const finalizeDeleteProduct = (productOriginalId: string) => {
    setClientSideProducts(prevProducts => {
        const productsAfterExplosion = prevProducts.filter(p => p.originalId !== productOriginalId);
        const resequenced = resequenceProducts(productsAfterExplosion);

        const currentSelectedIds = selectedProductIds.filter(id => id !== productOriginalId);
        // setSelectedProductIds(currentSelectedIds); // Delay this until after checking mode

        const stillExplodingCount = resequenced.filter(p => p.isExploding).length;
        const activeSelectionsExist = currentSelectedIds.some(id =>
            resequenced.find(p => p.originalId === id && !p.isExploding)
        );
        
        if (stillExplodingCount === 0 && !activeSelectionsExist) {
            setIsSelectionModeActive(false);
            setSelectedProductIds([]); // Clear all if no explosions and no active selections remain
        } else {
            setSelectedProductIds(currentSelectedIds); // Update if mode continues
        }
        return resequenced;
    });
  };


  const handleRowInteractionStart = (productOriginalId: string, clientX: number, clientY: number) => {
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
      if (pointerDownPositionRef.current) { // Check if pointer is still down
        setIsSelectionModeActive(true);
        setSelectedProductIds((prevSelected) =>
          prevSelected.includes(productOriginalId) ? prevSelected : [...prevSelected, productOriginalId]
        );
        setActivePopoverProductId(null); // Close popover when entering selection mode
        pointerDownPositionRef.current = null; // Reset after initiating long press
      }
      longPressTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  };

  const handleRowInteractionEnd = (product: Product, clientX: number, clientY: number, target: EventTarget | null) => {
    const isClickOnCheckboxCell = target instanceof HTMLElement && !!target.closest('[data-is-checkbox-cell="true"]');

    if (longPressTimerRef.current) { // If timer is still running, it means it was a short tap
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      // This is where the single tap (short press) logic for opening popover goes
      // if not in selection mode and not clicking checkbox
      if (!isSelectionModeActive && !isClickOnCheckboxCell && product.originalId) {
         if (activePopoverProductId === product.originalId) {
            setActivePopoverProductId(null); // Toggle off if already open
         } else {
            setSelectedProduct(product);
            setActivePopoverProductId(product.originalId);
         }
      } else if (isSelectionModeActive && !isClickOnCheckboxCell && pointerDownPositionRef.current) {
         // If in selection mode, a short tap (after a long press was initiated but pointer moved less than threshold)
         const dx = Math.abs(clientX - pointerDownPositionRef.current.x);
         const dy = Math.abs(clientY - pointerDownPositionRef.current.y);
         if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
            if (product.originalId) handleToggleSelectProduct(product.originalId);
         }
      }
    } else if (isSelectionModeActive && pointerDownPositionRef.current) {
      // If timer already fired (long press occurred) OR timer was cleared by movement > threshold
      const dx = Math.abs(clientX - (pointerDownPositionRef.current?.x ?? clientX));
      const dy = Math.abs(clientY - (pointerDownPositionRef.current?.y ?? clientY));
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) { // Treat as a tap within selection mode
        if (!isClickOnCheckboxCell && product.originalId) {
          handleToggleSelectProduct(product.originalId);
        }
      }
    } else if (isSelectionModeActive && !pointerDownPositionRef.current && !isClickOnCheckboxCell) {
      // Fallback for selection mode tap if pointerDownPositionRef was already cleared (e.g. by long press)
      if (product.originalId) handleToggleSelectProduct(product.originalId);
    }


    if (pointerDownPositionRef.current) { // Always clear this at the end if it wasn't
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
      pointerDownPositionRef.current = null; // Clear position ref as well if drag detected
    }
  };

  const handleHeaderPointerDown = (clientX: number, clientY: number) => {
    if (isSelectionModeActive) return;
    headerPointerDownPositionRef.current = { x: clientX, y: clientY };

    if (longPressHeaderTimerRef.current) {
      clearTimeout(longPressHeaderTimerRef.current);
    }
    longPressHeaderTimerRef.current = setTimeout(() => {
      if (headerPointerDownPositionRef.current) { // Check if still pressed
        setIsAddActionPopoverOpen(true);
        headerPointerDownPositionRef.current = null; // Reset after initiating
      }
      longPressHeaderTimerRef.current = null;
    }, LONG_PRESS_DURATION);
  };

  const handleHeaderPointerUp = (column: SortableKey) => {
    if (longPressHeaderTimerRef.current) { // If timer is running, it's a short tap
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
      if (headerPointerDownPositionRef.current) { // Check if it was a real tap (not cleared by move)
        handleHeaderClick(column);
      }
    } else if (headerPointerDownPositionRef.current) {
        // Timer already fired or cleared by move, but if position still set, it was a short move then up
        handleHeaderClick(column);
    } else if (!isAddActionPopoverOpen) { // Fallback if popover was already open by long press
        handleHeaderClick(column);
    }
    // Ensure popover isn't immediately closed by the click that might have opened it via long press
    // if (isAddActionPopoverOpen && column === 'validade') {} else { setIsAddActionPopoverOpen(false);}


    headerPointerDownPositionRef.current = null; // Always reset
  };

  const handleHeaderPointerMove = (clientX: number, clientY: number) => {
    if (!headerPointerDownPositionRef.current || !longPressHeaderTimerRef.current) return;

    const dx = Math.abs(clientX - headerPointerDownPositionRef.current.x);
    const dy = Math.abs(clientY - headerPointerDownPositionRef.current.y);

    if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
      clearTimeout(longPressHeaderTimerRef.current);
      longPressHeaderTimerRef.current = null;
      headerPointerDownPositionRef.current = null; // Reset if moved
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
    const currentVisibleProducts = filteredProducts; // Use the currently rendered list
    const newShockwaveTargetsMap = new Map<string, ShockwaveTarget>();

    deletedOriginalIds.forEach(deletedId => {
        const deletedProductVisualIndex = currentVisibleProducts.findIndex(p => p.originalId === deletedId);
        if (deletedProductVisualIndex === -1) return; // Should not happen if called correctly

        // Propagate shockwave upwards
        for (let distance = 1; ; distance++) {
            const calculatedStrength = BASE_SHOCKWAVE_STRENGTH_PX - (distance - 1) * SHOCKWAVE_STRENGTH_DECREMENT_PER_STEP;
            if (calculatedStrength <= 0) break;

            const neighborIndex = deletedProductVisualIndex - distance;
            if (neighborIndex < 0) break; // Reached the top

            const neighbor = currentVisibleProducts[neighborIndex];
            if (neighbor && !neighbor.isExploding && !deletedOriginalIds.includes(neighbor.originalId!)) {
                const existingTarget = newShockwaveTargetsMap.get(neighbor.originalId!);
                // If this neighbor is already a target, only update if the new shock is stronger (from a closer explosion)
                if (!existingTarget || calculatedStrength > existingTarget.strength) {
                    newShockwaveTargetsMap.set(neighbor.originalId!, {
                        id: neighbor.originalId!,
                        distance: distance,
                        direction: 'up',
                        strength: calculatedStrength,
                    });
                }
            }
        }

        // Propagate shockwave downwards
        for (let distance = 1; ; distance++) {
            const calculatedStrength = BASE_SHOCKWAVE_STRENGTH_PX - (distance - 1) * SHOCKWAVE_STRENGTH_DECREMENT_PER_STEP;
            if (calculatedStrength <= 0) break;

            const neighborIndex = deletedProductVisualIndex + distance;
            if (neighborIndex >= currentVisibleProducts.length) break; // Reached the bottom

            const neighbor = currentVisibleProducts[neighborIndex];
            if (neighbor && !neighbor.isExploding && !deletedOriginalIds.includes(neighbor.originalId!)) {
                 const existingTarget = newShockwaveTargetsMap.get(neighbor.originalId!);
                 if (!existingTarget || calculatedStrength > existingTarget.strength) {
                    newShockwaveTargetsMap.set(neighbor.originalId!, {
                        id: neighbor.originalId!,
                        distance: distance,
                        direction: 'down',
                        strength: calculatedStrength,
                    });
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
      setSelectedProduct(null); // Important: clear selected product after marking for deletion
    }
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (editingProduct && editingProduct.originalId) {
      setClientSideProducts(prevProducts =>
        resequenceProducts( // Resequence after edit to reflect potential ID change if product name changes ID logic
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

    // Apply sorting first, so visual neighbors for shockwave are based on sorted list
    if (sortBy && sortBy !== 'none') {
        productsToFilter.sort((a, b) => {
            // Skip sorting if one of the items is exploding, keep them in place for animation
            if (a.isExploding || b.isExploding) {
                 if (a.isExploding && !b.isExploding) return -1; // Exploding items first for now to avoid issues with layout
                 if (!a.isExploding && b.isExploding) return 1;
                 return 0;
            }

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
              } else if (aIsValid && !bIsValid) { comparison = sortDirection === 'asc' ? -1 : 1; } // Valid dates first
              else if (!aIsValid && bIsValid) { comparison = sortDirection === 'asc' ? 1 : -1; } // Invalid dates last
              else { // Both invalid, sort by originalId to maintain some order
                const originalIdA = a.originalId || '';
                const originalIdB = b.originalId || '';
                comparison = originalIdA.localeCompare(originalIdB);
              }
            } else if (sortBy === 'id' || sortBy === 'unidade') {
              const numA = parseInt(valA as string, 10);
              const numB = parseInt(valB as string, 10);
              if (!isNaN(numA) && !isNaN(numB)) {
                comparison = numA - numB;
              } else if (!isNaN(numA)) { comparison = -1; } // Numbers first
              else if (!isNaN(numB)) { comparison = 1; }
              else { comparison = normalizeString(String(valA)).localeCompare(normalizeString(String(valB)));} // Fallback to string compare
            } else { // Default to string comparison
              comparison = normalizeString(String(valA)).localeCompare(normalizeString(String(valB)));
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }


    // Then apply filters, but keep exploding items regardless of filters
    let displayableProducts = productsToFilter.filter(product => {
        if (product.isExploding) return true; // Always show exploding items

        const normalizedSearch = normalizeString(searchTerm);
        if (normalizedSearch) {
            if (!Object.values(product).some(value => normalizeString(String(value)).includes(normalizedSearch))) {
                return false;
            }
        }
        if (selectedDateFilter !== 'all') {
            const productDate = parseISO(product.validade);
            if (!isValid(productDate)) { // If date is invalid, it only matches 'all' or if no date filter is applied
                 return selectedDateFilter === 'all'; // Or handle as 'no date filter'
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
                // 'all' case is handled by default
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
    // Only select/deselect products that are currently visible and not exploding
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
    triggerShockwave([...selectedProductIds]); // Pass a copy
    setClientSideProducts(prevProducts =>
      prevProducts.map(p =>
        selectedProductIds.includes(p.originalId!) ? { ...p, isExploding: true } : p
      )
    );
    toast({ title: `${selectedProductIds.length} produto(s) marcado(s) para exclusão.` });
    setIsDeleteSelectedConfirmOpen(false);
    // SelectedProductIds will be cleared or updated via finalizeDeleteProduct logic
  };

  const cancelSelectionMode = () => {
    setIsSelectionModeActive(false);
    setSelectedProductIds([]);
    setActivePopoverProductId(null); // Also ensure popover is closed
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
        id: '', // Will be set by resequenceProducts
        originalId: newOriginalId,
        isExploding: false
    };
    setClientSideProducts(prevProducts =>
        resequenceProducts([...prevProducts, newProductData]) // Add and then resequence
    );

    toast({ title: "Produto Adicionado", description: `${newProductFormData.produto} foi adicionado com sucesso.` });
    setIsAddProductDialogOpen(false);
    setNewProductFormData({ ...initialNewProductFormData }); // Reset form
  };

  // For checkbox state, consider only non-exploding visible products
  const productsForDisplay = useMemo(() => filteredProducts.filter(p => !p.isExploding), [filteredProducts]);
  const allFilteredSelected = productsForDisplay.length > 0 && productsForDisplay.every(p => p.originalId && selectedProductIds.includes(p.originalId));
  const someFilteredSelected = productsForDisplay.length > 0 && selectedProductIds.some(id => productsForDisplay.find(p => p.originalId === id));


  const selectAllCheckedState = allFilteredSelected ? true : (someFilteredSelected ? "indeterminate" : false);


  const handleHeaderClick = (column: SortableKey) => {
    if (isSelectionModeActive) return; // Don't sort in selection mode

    if (sortBy === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
     setIsAddActionPopoverOpen(false); // Close popover on sort click
  };


  // Effect to clear timers on unmount
  useEffect(() => {
    // Update selection mode if no selected items remain after deletions
    if (isSelectionModeActive) {
        const activeSelectionsStillPresent = selectedProductIds.some(id =>
            clientSideProducts.find(p => p.originalId === id && !p.isExploding) // Check against current clientSideProducts
        );
        const anyProductIsCurrentlyExploding = clientSideProducts.some(p => p.isExploding);

        if (!activeSelectionsStillPresent && !anyProductIsCurrentlyExploding) {
            // If no active selections (non-exploding) are left AND no items are currently exploding,
            // then it's safe to turn off selection mode and clear selected IDs.
            setIsSelectionModeActive(false);
            setSelectedProductIds([]);
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
  }, [clientSideProducts, selectedProductIds, isSelectionModeActive]); // Add clientSideProducts to deps

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
        onPointerLeave={() => { // Clear timer if pointer leaves
          if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
          headerPointerDownPositionRef.current = null; // Reset position too
        }}
        onPointerMove={(e: PointerEvent<HTMLTableCellElement>) => handleHeaderPointerMove(e.clientX, e.clientY)}
        onTouchStart={(e: TouchEvent<HTMLTableCellElement>) => { // For touch devices
          if (e.touches.length === 1) handleHeaderPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={() => handleHeaderPointerUp(column)} // No clientX/Y needed for up
        onTouchCancel={() => { // If touch is interrupted
           if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
           headerPointerDownPositionRef.current = null;
        }}
        onTouchMove={(e: TouchEvent<HTMLTableCellElement>) => { // For touch devices
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
            <div className="flex flex-col sm:flex-row gap-4 items-end"> {/* items-end to align select with button if it were there */}
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
              {/* Potential Add Product Button here if not using popover on header */}
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
        <CardContent className="px-1 pb-1 pt-0"> {/* Reduced padding */}
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <thead>
                <ShadTableRow>
                  {isSelectionModeActive && (
                    <TableHead className="w-[50px] px-2 py-3"> {/* px-2 for checkbox */}
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
                    // Pointer event handlers for Validade header (long press for add product)
                     onPointerDown={(e: PointerEvent<HTMLTableCellElement>) => { e.stopPropagation(); handleHeaderPointerDown(e.clientX, e.clientY);}}
                     onPointerUp={(e) => { e.stopPropagation(); handleHeaderPointerUp('validade');}}
                     onPointerLeave={(e) => { // Clear timer if pointer leaves
                       e.stopPropagation();
                       if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                       headerPointerDownPositionRef.current = null; // Reset position too
                     }}
                     onPointerMove={(e: PointerEvent<HTMLTableCellElement>) => {e.stopPropagation(); handleHeaderPointerMove(e.clientX, e.clientY);}}
                     onTouchStart={(e: TouchEvent<HTMLTableCellElement>) => { // For touch devices
                       e.stopPropagation();
                       if (e.touches.length === 1) handleHeaderPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                     }}
                     onTouchEnd={(e) => { e.stopPropagation(); handleHeaderPointerUp('validade');}} // No clientX/Y needed for up
                     onTouchCancel={(e) => { // If touch is interrupted
                        e.stopPropagation();
                        if (longPressHeaderTimerRef.current) clearTimeout(longPressHeaderTimerRef.current);
                        headerPointerDownPositionRef.current = null;
                     }}
                     onTouchMove={(e: TouchEvent<HTMLTableCellElement>) => { // For touch devices
                       e.stopPropagation();
                       if (e.touches.length === 1) handleHeaderPointerMove(e.touches[0].clientX, e.touches[0].clientY);
                     }}
                  >
                    Validade
                    {sortBy === 'validade' && sortBy !== 'none' && !isSelectionModeActive && (sortDirection === 'asc' ? <ArrowUpAZ className="inline-block ml-1 h-3 w-3" /> : <ArrowDownZA className="inline-block ml-1 h-3 w-3" />)}
                    <Popover open={isAddActionPopoverOpen && !isSelectionModeActive} onOpenChange={setIsAddActionPopoverOpen}>
                       <PopoverTrigger asChild>
                         {/* This span acts as an invisible trigger area over the header content */}
                         {/* Ensure it does not steal clicks meant for sorting by only activating on long press conceptually */}
                         <span className="absolute inset-0" />
                       </PopoverTrigger>
                       <PopoverContent side="top" align="end" className="w-auto p-1 z-[60]" // Ensure high z-index
                         // anchorRef={validadeHeaderRef} // Use if needed for specific positioning
                         onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
                         onClick={(e) => e.stopPropagation()} // Prevent click on content from closing due to header click
                       >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent header click logic
                            setIsAddProductDialogOpen(true);
                            setIsAddActionPopoverOpen(false); // Close this popover
                          }}
                          aria-label="Adicionar novo produto"
                        >
                          <PlusCircle className="h-4 w-4 text-primary" />
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </TableHead>
                </ShadTableRow>
              </thead>
              <MotionTableBody layout>
                <AnimatePresence initial={false} mode="popLayout">
                  {filteredProducts.map((product) => {
                    const { styleString, particleColorClass } = getRowStyling(product.validade, product.originalId ? selectedProductIds.includes(product.originalId) : false, isSelectionModeActive, product.isExploding);
                    const currentProductKey = product.originalId!; // Use stable originalId as key

                    let shockwaveAnimProps: any = {};
                    const shockwaveTargetInfo = !product.isExploding ? shockwaveTargets.find(st => st.id === currentProductKey) : undefined;

                    if (shockwaveTargetInfo) {
                        const { strength, direction, distance } = shockwaveTargetInfo;
                        const displacementFactor = direction === 'up' ? -1 : 1;

                        // More pronounced "bounce" effect
                        const ySequence = [0, displacementFactor * strength, displacementFactor * strength * 0.4, displacementFactor * strength * -0.2, 0];

                        // Scale effect that diminishes with distance
                        const baseScaleMagnitude = 0.05; // Max scale change (e.g., 5%)
                        let currentScaleMagnitude = 0;
                        if (strength > 0) { // Only apply scale if there's strength
                           // Make scale proportional to remaining strength relative to max possible strength (BASE_PX)
                           const maxPossibleStrengthForDistance1 = BASE_SHOCKWAVE_STRENGTH_PX; // Should be BASE_SHOCKWAVE_STRENGTH_PX
                           const strengthRatio = strength / maxPossibleStrengthForDistance1; // How much of max strength is left
                           currentScaleMagnitude = baseScaleMagnitude * strengthRatio;
                        }
                        currentScaleMagnitude = Math.max(0, currentScaleMagnitude); // Ensure no negative scale

                        const scaleSequence = [1, 1 + currentScaleMagnitude, 1 - currentScaleMagnitude * 0.6, 1 + currentScaleMagnitude * 0.2, 1];


                        shockwaveAnimProps = {
                            y: ySequence,
                            scale: scaleSequence, // Apply scale for "pop"
                            transition: { duration: SHOCKWAVE_DURATION / 1000, ease: "easeInOut" }
                        };
                    }


                    return (
                      <Popover
                        key={currentProductKey} // Crucial: Use stable originalId
                        open={activePopoverProductId === currentProductKey && !isSelectionModeActive && !product.isExploding}
                        onOpenChange={(isOpen) => {
                          if (isSelectionModeActive || product.isExploding) return; // Don't open if in selection or exploding
                          if (isOpen) {
                            setSelectedProduct(product);
                            setActivePopoverProductId(currentProductKey);
                          } else {
                            // Only clear active popover if this one was active
                            if (activePopoverProductId === currentProductKey) {
                              setActivePopoverProductId(null);
                            }
                          }
                        }}
                      >
                        <PopoverTrigger asChild disabled={isSelectionModeActive || product.isExploding}>
                          <MotionTableRow
                            layoutId={currentProductKey} // Use originalId for layout animations
                            initial={{ opacity: 1 }}
                            animate={shockwaveAnimProps} // Apply shockwave animation here
                            exit={{ opacity: 0, height: 0, transition: {duration: 0.3, type: "tween" } }} // Standard exit for non-exploding items if list changes
                            transition={{ type: "spring", stiffness: 300, damping: 25  }} // Default spring for layout changes
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
                            onPointerLeave={() => { // Clear long press timer if pointer leaves row
                              if (product.isExploding) return;
                              if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                              // pointerDownPositionRef.current = null; // Don't clear here, breaks drag detection
                            }}
                            onPointerMove={(e: PointerEvent<HTMLTableRowElement>) => { // For drag detection
                              if (product.isExploding) return;
                              handlePointerMove(e.clientX, e.clientY);
                            }}
                            onTouchStart={(e: TouchEvent<HTMLTableRowElement>) => { // For touch devices
                              if (product.isExploding || !product.originalId) return;
                              if (e.touches.length === 1) { // Ensure single touch
                                  handleRowInteractionStart(product.originalId, e.touches[0].clientX, e.touches[0].clientY);
                              }
                            }}
                            onTouchEnd={(e: TouchEvent<HTMLTableRowElement>) => { // For touch devices
                              if (product.isExploding || !product.originalId) return;
                              if (e.changedTouches.length === 1) { // Ensure single touch end
                                 handleRowInteractionEnd(product, e.changedTouches[0].clientX, e.changedTouches[0].clientY, e.target);
                              }
                            }}
                            onTouchMove={(e: TouchEvent<HTMLTableRowElement>) => { // For touch devices
                               if (product.isExploding) return;
                               if (e.touches.length === 1) { // Ensure single touch
                                  handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
                               }
                            }}
                            onTouchCancel={() => { // If touch is interrupted
                               if (product.isExploding) return;
                               if (longPressTimerRef.current) {
                                clearTimeout(longPressTimerRef.current);
                                longPressTimerRef.current = null;
                              }
                              pointerDownPositionRef.current = null; // Reset position
                            }}
                          >
                            {product.isExploding ? (
                              <TableCell colSpan={isSelectionModeActive ? 6 : 5} className="p-0 relative h-[57px]"> {/* Adjust height to match normal row */}
                                <Particle
                                  onComplete={() => finalizeDeleteProduct(currentProductKey)}
                                  particleColorClass={particleColorClass}
                                />
                              </TableCell>
                            ) : (
                              <>
                                {isSelectionModeActive && (
                                  <TableCell data-is-checkbox-cell="true" className="py-0 px-2" onClick={(e) => e.stopPropagation()}> {/* Prevent row popover on checkbox click */}
                                    <Checkbox
                                        aria-label={`Selecionar produto ${product.produto}`}
                                        checked={product.originalId ? selectedProductIds.includes(product.originalId) : false}
                                        onCheckedChange={() => product.originalId && handleToggleSelectProduct(product.originalId)}
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
                         {!isSelectionModeActive && !product.isExploding && ( // Only show popover if not in selection mode and not exploding
                          <PopoverContent side="top" align="end" className="w-auto p-1 z-50" // High z-index for popover
                            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
                            onCloseAutoFocus={(e) => e.preventDefault()} // Prevent focus changes on close
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
                   {filteredProducts.filter(p => !p.isExploding).length === 0 && !clientSideProducts.some(p => p.isExploding) && ( // Only show if no non-exploding items and no items are currently exploding
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

      {/* Delete Confirmation Dialog (Single Product) */}
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

      {/* Delete Confirmation Dialog (Multiple Products) */}
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

      {/* Edit Product Dialog */}
      {editingProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) {
            setEditingProduct(null); // Clear editing product when dialog closes
            // setEditFormData({ ...initialNewProductFormData }); // Optionally reset form, or keep values
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

      {/* Add New Product Dialog */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={(isOpen) => {
        setIsAddProductDialogOpen(isOpen);
        if (!isOpen) setNewProductFormData({ ...initialNewProductFormData }); // Reset form on close
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

