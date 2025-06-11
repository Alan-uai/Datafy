
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { ProductSearchTable } from '@/components/dashboard/ProductSearchTable';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { getProductLists, addProductList, updateProductListName, deleteProductList, type ProductList, getProducts } from '@/services/productService';
import { suggestListIcon } from '@/ai/flows/suggest-list-icon-flow';
import { generateExpirySummaryText } from '@/ai/flows/generate-expiry-summary-text-flow';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, List, Edit3, Trash2, Loader2, Wand2, RefreshCw, Info, Inbox } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  isToday,
  isPast,
  isWithinInterval,
  addDays,
  startOfDay,
  parseISO,
  isValid,
} from 'date-fns';
import type { Product } from '@/types';


const iconNames = Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'icons' && typeof LucideIcons[key as keyof typeof LucideIcons] === 'object');


const DynamicIcon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  if (!IconComponent || typeof IconComponent !== 'function') {
    return <LucideIcons.ListChecks {...props} />; 
  }
  try {
    return <IconComponent {...props} />;
  } catch (e) {
    console.error(`Error rendering DynamicIcon with name: ${name}`, e);
    return <LucideIcons.ListChecks {...props} />;
  }
};


export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('ListPlus');
  const [isSuggestingIcon, setIsSuggestingIcon] = useState(false);

  const [isRenameListDialogOpen, setIsRenameListDialogOpen] = useState(false);
  const [listToRename, setListToRename] = useState<ProductList | null>(null);
  const [renamedListName, setRenamedListName] = useState('');
  const [listToDelete, setListToDelete] = useState<ProductList | null>(null);
  const [isDeleteListConfirmOpen, setIsDeleteListConfirmOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const newListInputRef = useRef<HTMLInputElement>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);

  const initialFetchDone = useRef(false);

  const [listStats, setListStats] = useState<{ total: number; expiringSoon: number; expired: number } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [expirySummary, setExpirySummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);


  const fetchLists = useCallback(async () => {
    if (currentUser?.uid) {
      setIsLoadingLists(true);
      try {
        const lists = await getProductLists(currentUser.uid);
        
        if (lists && Array.isArray(lists)) {
            setProductLists(lists);
            if (lists.length > 0) {
              const currentActiveListIsValid = lists.some(l => l.id === activeListId);
              if (!activeListId || !currentActiveListIsValid) {
                 setActiveListId(lists[0].id);
              }
            } else {
              setActiveListId(null);
              if (!initialFetchDone.current) {
                try {
                    const defaultList = await addProductList(currentUser.uid, { name: "Meus Produtos", icon: "ListChecks" });
                    if (defaultList) {
                      setProductLists([defaultList]);
                      setActiveListId(defaultList.id);
                      toast({ title: "Lista Padrão Criada", description: `A lista "${defaultList.name}" foi criada para você começar!` });
                    } else {
                      toast({ variant: "destructive", title: "Erro ao criar lista padrão", description: "Não foi possível criar a lista de produtos inicial." });
                    }
                } catch (createError: any) {
                    toast({ variant: "destructive", title: "Erro ao criar lista padrão automática", description: `Detalhes: ${createError.message}` });
                }
              }
            }
        } else {
            toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Formato de dados inesperado ao buscar listas." });
            setProductLists([]);
            setActiveListId(null);
        }
      } catch (error: any) {
        toast({ variant: "destructive", title: "Erro ao buscar listas", description: `Não foi possível carregar suas listas de produtos. Erro: ${error.message}` });
        setProductLists([]); 
        setActiveListId(null);
      } finally {
        setIsLoadingLists(false);
        if (!initialFetchDone.current) {
          initialFetchDone.current = true; 
        }
      }
    } else {
      setProductLists([]);
      setActiveListId(null);
      setIsLoadingLists(false);
      if (!initialFetchDone.current) {
         initialFetchDone.current = true; 
      }
    }
  }, [currentUser?.uid, toast, activeListId]); 


  useEffect(() => {
    if (currentUser?.uid && !initialFetchDone.current) {
        fetchLists();
    } else if (!currentUser?.uid) {
        setProductLists([]);
        setActiveListId(null);
        setIsLoadingLists(false);
        initialFetchDone.current = false; 
    }
  }, [currentUser?.uid, fetchLists]);
  
  const calculateStatsAndSummary = useCallback(async (userId: string, listIdParam: string, listNameParam: string) => {
    setIsLoadingStats(true);
    setIsLoadingSummary(true);
    setListStats(null);
    setExpirySummary(null);

    try {
      const products: Product[] = await getProducts(userId, listIdParam);
      const today = startOfDay(new Date());
      let totalCount = 0;
      let expiredCount = 0;
      let expiringSoonCount = 0;

      products.forEach(p => {
        if (p.isExploding) return;
        totalCount++;
        if (p.validade && isValid(parseISO(p.validade))) {
          const productDate = startOfDay(parseISO(p.validade));
          if (isPast(productDate) && !isToday(productDate)) {
            expiredCount++;
          } else if (
            !isToday(productDate) &&
            isWithinInterval(productDate, {
              start: addDays(today, 1),
              end: addDays(today, 7),
            })
          ) {
            expiringSoonCount++;
          }
        }
      });
      const currentStats = { total: totalCount, expiringSoon: expiringSoonCount, expired: expiredCount };
      setListStats(currentStats);
      
      try {
        const summaryResult = await generateExpirySummaryText({ listName: listNameParam, stats: currentStats });
        setExpirySummary(summaryResult.summaryText);
      } catch (summaryError: any) {
        console.error("Error generating expiry summary:", summaryError);
        setExpirySummary("Não foi possível gerar o resumo inteligente das validades.");
        toast({ variant: "default", title: "Erro no Resumo IA", description: "O resumo por IA das validades falhou. Estatísticas básicas ainda disponíveis." });
      }

    } catch (error) {
      console.error("Error calculating list stats:", error);
      toast({ variant: "destructive", title: "Erro ao calcular estatísticas", description: "Não foi possível carregar as estatísticas da lista." });
      setListStats(null);
      setExpirySummary(null);
    } finally {
      setIsLoadingStats(false);
      setIsLoadingSummary(false);
    }
  }, [toast]);

  useEffect(() => {
    if (currentUser?.uid && activeListId) {
      const activeListName = productLists.find(list => list.id === activeListId)?.name || "Lista Ativa";
      calculateStatsAndSummary(currentUser.uid, activeListId, activeListName);
    } else {
      setListStats(null);
      setExpirySummary(null);
    }
  }, [activeListId, currentUser?.uid, productLists, calculateStatsAndSummary]);

  useEffect(() => {
    if (isRenameListDialogOpen && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
    if (isAddListDialogOpen && newListInputRef.current) {
      newListInputRef.current.focus();
    }
  }, [isRenameListDialogOpen, isAddListDialogOpen]);

  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, productLists.length);
  }, [productLists.length]);


  const handleSuggestIcon = async () => {
    if (!newListName.trim()) {
      toast({ title: "Nome da Lista Vazio", description: "Por favor, digite um nome para a lista antes de sugerir um ícone.", variant: "default" });
      return;
    }
    setIsSuggestingIcon(true);
    try {
      const result = await suggestListIcon({ listName: newListName, currentIconName: newListIcon });
      if (result.iconName && iconNames.includes(result.iconName)) {
        setNewListIcon(result.iconName);
        toast({ title: "Ícone Sugerido!", description: `Ícone "${result.iconName}" aplicado.` });
      } else {
        toast({ title: "Sugestão Inválida", description: "O ícone sugerido não é válido, mantendo o atual.", variant: "default" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Sugerir Ícone", description: error.message || "Não foi possível obter uma sugestão." });
    } finally {
      setIsSuggestingIcon(false);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da lista não pode estar vazio." });
      return;
    }
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado para criar lista." });
      return;
    }

    try {
      const newList = await addProductList(currentUser.uid, { name: newListName, icon: newListIcon || "ListChecks" });
      setProductLists(prev => [...prev, newList]);
      setActiveListId(newList.id); 
      
      setNewListName('');
      setNewListIcon('ListPlus');
      setIsAddListDialogOpen(false);
      toast({ title: "Lista Adicionada", description: `A lista "${newList.name}" foi criada.` });
    } catch (error: any) {
      const errorMessage = error.message || "Não foi possível criar a nova lista.";
      toast({ variant: "destructive", title: "Erro ao adicionar lista", description: errorMessage });
    }
  };

  const handleRenameList = async () => {
    if (!listToRename || !renamedListName.trim() || !currentUser?.uid) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da lista não pode estar vazio ou usuário não autenticado." });
      return;
    }
    try {
      await updateProductListName(currentUser.uid, listToRename.id, renamedListName);
      setProductLists(prev => prev.map(list => list.id === listToRename.id ? { ...list, name: renamedListName } : list));
      setIsRenameListDialogOpen(false);
      setListToRename(null);
      setRenamedListName('');
      toast({ title: "Lista Renomeada", description: `A lista foi renomeada para "${renamedListName}".` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao renomear lista", description: "Não foi possível renomear a lista." });
    }
  };
  
  const openRenameDialog = (list: ProductList) => {
    setListToRename(list);
    setRenamedListName(list.name);
    setIsRenameListDialogOpen(true);
  };

  const openDeleteConfirmDialog = (list: ProductList) => {
    setListToDelete(list);
    setIsDeleteListConfirmOpen(true);
  };

  const handleDeleteList = async () => {
    if (!listToDelete || !currentUser?.uid) return;
    try {
      await deleteProductList(currentUser.uid, listToDelete.id);
      toast({ title: "Lista Excluída", description: `A lista "${listToDelete.name}" e todos os seus produtos foram excluídos.` });
      
      const remainingLists = productLists.filter(l => l.id !== listToDelete.id);
      setProductLists(remainingLists);
      
      if (activeListId === listToDelete.id) { 
        if (remainingLists.length > 0) {
          setActiveListId(remainingLists[0].id); 
        } else {
          initialFetchDone.current = false; 
          setActiveListId(null); 
          await fetchLists(); 
        }
      }
      
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir lista", description: "Não foi possível excluir a lista."});
    } finally {
      setIsDeleteListConfirmOpen(false);
      setListToDelete(null);
    }
  };

  const handleProductsChanged = useCallback(() => {
    if (currentUser?.uid && activeListId) {
      const activeListName = productLists.find(list => list.id === activeListId)?.name || "Lista Ativa";
      calculateStatsAndSummary(currentUser.uid, activeListId, activeListName);
    }
  }, [currentUser?.uid, activeListId, productLists, calculateStatsAndSummary]);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>, currentIndex: number) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const numTabs = productLists.length;
      if (numTabs === 0) return;

      let nextIndex;
      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % numTabs;
      } else {
        nextIndex = (currentIndex - 1 + numTabs) % numTabs;
      }
      
      const nextListId = productLists[nextIndex]?.id;
      if (nextListId) {
        setActiveListId(nextListId);
        // Focus the new tab after state updates and re-render
        setTimeout(() => {
          tabRefs.current[nextIndex]?.focus();
        }, 0);
      }
    }
  };

  const activeListName = productLists.find(list => list.id === activeListId)?.name || "Busca de Produtos";

  if (isLoadingLists && !initialFetchDone.current && productLists.length === 0) {
    return (
      <div className="py-8 px-4 md:px-6">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border dark:border-slate-700 mb-6">
            <div className="flex items-center p-2 space-x-2" role="tablist" aria-label="Listas de Produtos">
                <div className="h-9 w-24 bg-muted rounded animate-pulse"></div>
                <div className="h-9 w-32 bg-muted rounded animate-pulse"></div>
                <div className="h-9 w-28 bg-muted rounded animate-pulse"></div>
                 <div className="h-9 w-[120px] bg-muted/50 rounded animate-pulse ml-auto"></div>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-12rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando suas listas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-6">
      <div className="mb-6">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border dark:border-slate-700">
          <div className="flex items-center p-2 space-x-2" role="tablist" aria-label="Listas de Produtos">
            {isLoadingLists && productLists.length === 0 ? (
                <>
                    <div className="h-9 w-24 bg-muted rounded animate-pulse" role="tab" aria-busy="true"></div>
                    <div className="h-9 w-32 bg-muted rounded animate-pulse" role="tab" aria-busy="true"></div>
                    <div className="h-9 w-28 bg-muted rounded animate-pulse" role="tab" aria-busy="true"></div>
                </>
            ) : (
                productLists.map((list, index) => (
                  <div
                    key={list.id}
                    id={`list-tab-${list.id}`}
                    ref={el => tabRefs.current[index] = el}
                    role="tab"
                    tabIndex={0}
                    aria-selected={activeListId === list.id}
                    aria-controls="product-table-section" 
                    onClick={() => setActiveListId(list.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, index)}
                    className={cn(
                      buttonVariants({ variant: activeListId === list.id ? 'default' : 'outline', size: 'sm' }),
                      'p-0.5 gap-0.5', 
                      "group shrink-0 cursor-pointer flex items-center",
                      activeListId === list.id && 'font-semibold shadow-md'
                    )}
                  >
                    <DynamicIcon name={list.icon} className="flex-shrink-0 h-4 w-4" />
                    <span className="block truncate min-w-0">
                      {list.name}
                    </span>
                    <div className="flex items-center gap-0 opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto">
                       <Button variant="ghost" size="icon" className="h-[1.125rem] w-[1.125rem]" onClick={(e) => { e.stopPropagation(); openRenameDialog(list);}} aria-label={`Renomear lista ${list.name}`}>
                         <Edit3 className="h-4 w-4" />
                       </Button>
                       {productLists.length > 1 && ( 
                        <Button variant="ghost" size="icon" className="h-[1.125rem] w-[1.125rem] text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteConfirmDialog(list);}} aria-label={`Excluir lista ${list.name}`}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                       )}
                    </div>
                  </div>
                ))
            )}
            <Button variant="outline" onClick={() => { setIsAddListDialogOpen(true); setNewListIcon('ListPlus'); }} size="sm" className="shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Lista
            </Button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <section id="product-table-section" aria-labelledby={activeListId ? `list-tab-${activeListId}` : undefined}>
        {activeListId && (
          <>
          <Card className="mb-6 shadow-md">
            <CardHeader className="p-3 sm:p-4">
              <CardTitle className="text-md sm:text-lg font-semibold">Resumo da Lista: {activeListName}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              {isLoadingStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <div className="h-3 w-16 sm:w-20 mx-auto bg-muted rounded animate-pulse mb-1.5 sm:mb-2"></div>
                    <div className="h-7 w-10 sm:h-8 sm:w-12 mx-auto bg-muted rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 w-20 sm:w-24 mx-auto bg-muted rounded animate-pulse mb-1.5 sm:mb-2"></div>
                    <div className="h-7 w-10 sm:h-8 sm:w-12 mx-auto bg-muted rounded animate-pulse"></div>
                  </div>
                  <div>
                    <div className="h-3 w-12 sm:w-16 mx-auto bg-muted rounded animate-pulse mb-1.5 sm:mb-2"></div>
                    <div className="h-7 w-10 sm:h-8 sm:w-12 mx-auto bg-muted rounded animate-pulse"></div>
                  </div>
                </div>
              ) : listStats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total de Itens</p>
                    <p className="text-xl sm:text-2xl font-bold">{listStats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencendo (7 dias)</p>
                    <p className={`text-xl sm:text-2xl font-bold ${listStats.expiringSoon > 0 ? 'text-orange-500 dark:text-orange-400' : 'text-foreground'}`}>
                      {listStats.expiringSoon}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Vencidos</p>
                    <p className={`text-xl sm:text-2xl font-bold ${listStats.expired > 0 ? 'text-destructive' : 'text-foreground'}`}>
                      {listStats.expired}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center">Estatísticas não disponíveis ou lista vazia.</p>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6 shadow-md bg-accent/10 dark:bg-accent/20 border-accent">
              <CardHeader className="p-3 sm:p-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-md sm:text-lg font-semibold text-accent-foreground/90 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-accent" />
                      Dica da Dashify IA
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleProductsChanged} disabled={isLoadingSummary || isLoadingStats} className="h-7 w-7 text-accent hover:text-accent/80">
                     {isLoadingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                  {isLoadingSummary ? (
                      <div className="space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                      </div>
                  ) : expirySummary ? (
                      <p className="text-sm text-accent-foreground/80">{expirySummary}</p>
                  ) : (
                      <p className="text-sm text-muted-foreground">Resumo da IA não disponível no momento.</p>
                  )}
              </CardContent>
          </Card>
          </>
        )}

        {activeListId ? (
          <>
            <ProductSearchTable 
              listId={activeListId} 
              productLists={productLists}
              key={activeListId} 
              onProductsChanged={handleProductsChanged}
            />
          </>
        ) : (
           <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-10rem)] text-center">
              {isLoadingLists ? ( 
                  <>
                      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                      <p className="text-muted-foreground">Carregando suas listas...</p>
                  </>
              ) : ( 
                   <>
                      <Inbox className="h-16 w-16 text-primary/70 mb-4" />
                      <h3 className="text-xl font-semibold mb-2 text-foreground">Sua dashboard de produtos está pronta!</h3>
                      <p className="text-muted-foreground mb-6 max-w-md">
                          Crie sua primeira lista para começar a organizar seus itens, controlar validades e muito mais.
                      </p>
                      <Button onClick={() => { setIsAddListDialogOpen(true); setNewListIcon('ListPlus'); }}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Criar Nova Lista
                      </Button>
                  </>
              )}
          </div>
        )}
      </section>

      <Dialog open={isAddListDialogOpen} onOpenChange={(isOpen) => {
          setIsAddListDialogOpen(isOpen);
          if (!isOpen) {
            setNewListName('');
            setNewListIcon('ListPlus'); 
          }
        }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Lista de Produtos</DialogTitle>
            <DialogDescription>
              Digite um nome e escolha um ícone para sua nova lista.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-list-name" className="text-right">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-list-name"
                ref={newListInputRef}
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Compras da Semana"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-list-icon-name" className="text-right">
                Ícone
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                {isSuggestingIcon ? (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                    <DynamicIcon name={newListIcon} className="h-5 w-5 text-primary" />
                )}
                <Input
                  id="new-list-icon-name"
                  value={newListIcon}
                  onChange={(e) => setNewListIcon(e.target.value)}
                  className="flex-1"
                  placeholder="Ex: ShoppingCart"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleSuggestIcon}
                  disabled={isSuggestingIcon || !newListName.trim()}
                  aria-label="Sugerir Ícone"
                >
                  {isSuggestingIcon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
                 <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setNewListIcon(iconNames[Math.floor(Math.random() * iconNames.length)])}
                  aria-label="Ícone Aleatório"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
             <p className="text-xs text-muted-foreground col-span-4 text-center px-4">
                Digite um nome de ícone da biblioteca Lucide Icons (ex: Apple, Box, Coffee) ou use a sugestão.
             </p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleAddList} disabled={!newListName.trim() || !newListIcon.trim()}>Criar Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameListDialogOpen} onOpenChange={setIsRenameListDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear Lista: {listToRename?.name}</DialogTitle>
            <DialogDescription>
              Digite o novo nome para esta lista.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-list-name" className="text-right">
                Novo Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rename-list-name"
                ref={renameInputRef}
                value={renamedListName}
                onChange={(e) => setRenamedListName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleRenameList}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

        {listToDelete && (
            <Dialog open={isDeleteListConfirmOpen} onOpenChange={setIsDeleteListConfirmOpen}>
                <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Confirmar Exclusão da Lista</DialogTitle>
                    <DialogDescription>
                    Tem certeza que deseja excluir a lista "{listToDelete.name}"? Todos os produtos dentro desta lista também serão excluídos. Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button variant="destructive" onClick={handleDeleteList}>Excluir Lista</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
        )}
    </div>
  );
}

