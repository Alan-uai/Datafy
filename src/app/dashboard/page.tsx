
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { getProductLists, addProductList, updateProductListName, deleteProductList, type ProductList } from '@/services/productService';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, List, Edit3, Trash2, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

const iconNames = Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'icons' && typeof LucideIcons[key as keyof typeof LucideIcons] === 'object');


const DynamicIcon = ({ name, ...props }: { name: string } & LucideIcons.LucideProps) => {
  const IconComponent = LucideIcons[name as keyof typeof LucideIcons] as LucideIcons.LucideIcon;
  if (!IconComponent) {
    return <LucideIcons.List {...props} />; // Fallback icon
  }
  return <IconComponent {...props} />;
};


export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [productLists, setProductLists] = useState<ProductList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isLoadingLists, setIsLoadingLists] = useState(true);
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isRenameListDialogOpen, setIsRenameListDialogOpen] = useState(false);
  const [listToRename, setListToRename] = useState<ProductList | null>(null);
  const [renamedListName, setRenamedListName] = useState('');
  const [listToDelete, setListToDelete] = useState<ProductList | null>(null);
  const [isDeleteListConfirmOpen, setIsDeleteListConfirmOpen] = useState(false);

  const initialFetchDone = useRef(false);

  const fetchLists = useCallback(async () => {
    if (currentUser?.uid) {
      console.log(`DashboardPage: fetchLists called for user: ${currentUser.uid}. Initial fetch done: ${initialFetchDone.current}`);
      setIsLoadingLists(true);
      try {
        const lists = await getProductLists(currentUser.uid);
        console.log(`DashboardPage: getProductLists for user ${currentUser.uid} returned:`, JSON.stringify(lists, null, 2));
        
        if (lists && Array.isArray(lists)) {
            setProductLists(lists);
            if (lists.length > 0) {
              const currentActiveListIsValid = lists.some(l => l.id === activeListId);
              if (activeListId && currentActiveListIsValid) {
                console.log(`DashboardPage: Active list ${activeListId} is still valid.`);
              } else {
                setActiveListId(lists[0].id);
                console.log(`DashboardPage: Setting activeListId to first list: ${lists[0].id}`);
              }
            } else {
              setActiveListId(null);
              console.log(`DashboardPage: No lists found for user ${currentUser.uid}. activeListId is now null. initialFetchDone: ${initialFetchDone.current}`);
              if (!initialFetchDone.current) {
                console.log("DashboardPage: Initial fetch, no lists found, creating default list for user:", currentUser.uid);
                try {
                    const defaultList = await addProductList(currentUser.uid, { name: "Meus Produtos", icon: "List" });
                    console.log("DashboardPage: Default list created by addProductList:", defaultList);
                    if (defaultList) {
                    setProductLists([defaultList]);
                    setActiveListId(defaultList.id);
                    console.log(`DashboardPage: Default list set as active: ${defaultList.id}`);
                    } else {
                    console.error("DashboardPage: Failed to create default list (addProductList returned null/undefined).");
                    toast({ variant: "destructive", title: "Erro ao criar lista padrão", description: "Não foi possível criar a lista de produtos inicial." });
                    }
                } catch (createError: any) {
                    console.error("DashboardPage: Error creating default list:", createError);
                    toast({ variant: "destructive", title: "Erro ao criar lista padrão automática", description: `Detalhes: ${createError.message}` });
                }
              }
            }
        } else {
            console.error(`DashboardPage: getProductLists for user ${currentUser.uid} did not return an array. Received:`, lists);
            toast({ variant: "destructive", title: "Erro ao carregar dados", description: "Formato de dados inesperado ao buscar listas." });
            setProductLists([]);
            setActiveListId(null);
        }
      } catch (error: any) {
        console.error(`DashboardPage: Error in fetchLists for user ${currentUser.uid}. Message: ${error.message}`, error);
        toast({ variant: "destructive", title: "Erro ao buscar listas", description: `Não foi possível carregar suas listas de produtos. Erro: ${error.message}` });
        setProductLists([]); 
        setActiveListId(null);
      } finally {
        setIsLoadingLists(false);
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
           console.log("DashboardPage: initialFetchDone set to true.");
        }
      }
    } else {
      console.log("DashboardPage: fetchLists - no currentUser or currentUser.uid. Clearing lists.");
      setProductLists([]);
      setActiveListId(null);
      setIsLoadingLists(false);
      if (!initialFetchDone.current) {
         initialFetchDone.current = true; 
         console.log("DashboardPage: initialFetchDone set to true (no user).");
      }
    }
  }, [currentUser?.uid, toast, activeListId]); 


  useEffect(() => {
    console.log("DashboardPage: currentUser effect triggered. UID:", currentUser?.uid);
    if (currentUser?.uid && !initialFetchDone.current) { // Adicionado !initialFetchDone.current para evitar múltiplas chamadas desnecessárias
        console.log("DashboardPage: currentUser.uid present, calling fetchLists. initialFetchDone current state:", initialFetchDone.current);
        fetchLists();
    } else if (!currentUser?.uid) {
        console.log("DashboardPage: No currentUser.uid. Clearing lists and setting loading to false.");
        setProductLists([]);
        setActiveListId(null);
        setIsLoadingLists(false);
        initialFetchDone.current = false; 
    }
  }, [currentUser?.uid, fetchLists]);


  const handleAddList = async () => {
    if (!newListName.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da lista não pode estar vazio." });
      return;
    }
    if (!currentUser?.uid) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado para criar lista." });
      console.error("DashboardPage: handleAddList - currentUser.uid is missing.");
      return;
    }

    console.log(`DashboardPage: handleAddList - Attempting to add list with name "${newListName}" for user ${currentUser.uid}`);

    try {
      const newList = await addProductList(currentUser.uid, { name: newListName, icon: "ListPlus" });
      console.log("DashboardPage: handleAddList - New list successfully added in service:", newList);
      
      setProductLists(prev => [...prev, newList]);
      setActiveListId(newList.id); 
      
      setNewListName('');
      setIsAddListDialogOpen(false);
      toast({ title: "Lista Adicionada", description: `A lista "${newList.name}" foi criada.` });
    } catch (error: any) {
      console.error("DashboardPage: Detailed error adding list:", error);
      const errorMessage = error.message || "Não foi possível criar a nova lista. Verifique o console para mais detalhes.";
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

  const activeListName = productLists.find(list => list.id === activeListId)?.name || "Busca de Produtos";

  if (isLoadingLists && (!initialFetchDone.current || productLists.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-4rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando suas listas...</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-6">
      <div className="mb-6">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border dark:border-slate-700">
          <div className="flex items-center p-2 space-x-2">
            {productLists.map((list) => (
              <div
                key={list.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveListId(list.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveListId(list.id); }}
                className={cn(
                  buttonVariants({ variant: activeListId === list.id ? 'default' : 'outline', size: 'sm' }),
                  'px-2 gap-0.5', 
                  "group shrink-0 cursor-pointer flex items-center" 
                )}
              >
                <DynamicIcon name={list.icon} className="h-4 w-4 flex-shrink-0" />
                <span className="block truncate min-w-0">
                  {list.name}
                </span>
                <div className="flex items-center gap-0.5 opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto">
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openRenameDialog(list);}}>
                     <Edit3 className="h-3 w-3" />
                   </Button>
                   {productLists.length > 1 && ( 
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteConfirmDialog(list);}}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                   )}
                </div>
              </div>
            ))}
            <Button variant="ghost" onClick={() => setIsAddListDialogOpen(true)} size="sm" className="shrink-0">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Lista
            </Button>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {activeListId ? (
        <>
          <h1 className="text-3xl font-bold mb-8 font-headline text-center">
            {activeListName}
          </h1>
          <ProductSearchTable listId={activeListId} key={activeListId} />
        </>
      ) : (
         <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-10rem)]">
            {isLoadingLists ? ( 
                <>
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground">Carregando listas...</p>
                </>
            ) : ( 
                 <>
                    <List className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">Nenhuma lista de produtos encontrada.</p>
                    <p className="text-sm text-muted-foreground mb-4">Crie sua primeira lista para começar a adicionar produtos.</p>
                    <Button onClick={() => setIsAddListDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Nova Lista
                    </Button>
                </>
            )}
        </div>
      )}

      <Dialog open={isAddListDialogOpen} onOpenChange={setIsAddListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Lista de Produtos</DialogTitle>
            <DialogDescription>
              Digite um nome para sua nova lista.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-list-name" className="text-right">
                Nome
              </Label>
              <Input
                id="new-list-name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="col-span-3"
                placeholder="Ex: Compras da Semana"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" onClick={handleAddList}>Criar Lista</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameListDialogOpen} onOpenChange={setIsRenameListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Lista: {listToRename?.name}</DialogTitle>
            <DialogDescription>
              Digite o novo nome para esta lista.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rename-list-name" className="text-right">
                Novo Nome
              </Label>
              <Input
                id="rename-list-name"
                value={renamedListName}
                onChange={(e) => setRenamedListName(e.target.value)}
                className="col-span-3"
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
                <DialogContent>
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

