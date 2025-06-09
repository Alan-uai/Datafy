
"use client";

import { useEffect, useState, useCallback } from 'react';
import { ProductSearchTable } from '@/components/dashboard/ProductSearchTable';
import { Button } from '@/components/ui/button';
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


  const fetchLists = useCallback(async () => {
    if (currentUser?.uid) {
      setIsLoadingLists(true);
      try {
        const lists = await getProductLists(currentUser.uid);
        setProductLists(lists);
        if (lists.length > 0 && !activeListId) {
          setActiveListId(lists[0].id);
        } else if (lists.length === 0) {
          // Create a default list if none exist
          const defaultList = await addProductList(currentUser.uid, { name: "Meus Produtos", icon: "List" });
          setProductLists([defaultList]);
          setActiveListId(defaultList.id);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Erro ao buscar listas", description: "Não foi possível carregar suas listas de produtos." });
      } finally {
        setIsLoadingLists(false);
      }
    }
  }, [currentUser, toast, activeListId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleAddList = async () => {
    if (!newListName.trim() || !currentUser?.uid) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da lista não pode estar vazio." });
      return;
    }
    try {
      // For now, use a default icon
      const newList = await addProductList(currentUser.uid, { name: newListName, icon: "ListPlus" });
      setProductLists(prev => [...prev, newList]);
      setActiveListId(newList.id);
      setNewListName('');
      setIsAddListDialogOpen(false);
      toast({ title: "Lista Adicionada", description: `A lista "${newList.name}" foi criada.` });
    } catch (error: any) {
      console.error("Detailed error adding list:", error);
      const errorMessage = error.message || "Não foi possível criar a nova lista. Verifique o console para mais detalhes.";
      toast({ variant: "destructive", title: "Erro ao adicionar lista", description: errorMessage });
    }
  };

  const handleRenameList = async () => {
    if (!listToRename || !renamedListName.trim() || !currentUser?.uid) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da lista não pode estar vazio." });
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
      setProductLists(prev => prev.filter(l => l.id !== listToDelete.id));
      if (activeListId === listToDelete.id) {
        setActiveListId(productLists.length > 1 ? productLists.find(l => l.id !== listToDelete.id)!.id : null);
        if (productLists.length <=1) { // if it was the last list
          fetchLists(); // This will create a default list
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

  if (isLoadingLists && !activeListId) {
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
              <Button
                key={list.id}
                variant={activeListId === list.id ? 'default' : 'outline'}
                onClick={() => setActiveListId(list.id)}
                className="relative group pr-10 shrink-0" // Make space for edit/delete buttons
                size="sm"
              >
                <DynamicIcon name={list.icon} className="mr-2 h-4 w-4" />
                {list.name}
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity">
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openRenameDialog(list);}}>
                     <Edit3 className="h-3 w-3" />
                   </Button>
                   {productLists.length > 1 && ( // Prevent deleting the last list this way
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); openDeleteConfirmDialog(list);}}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                   )}
                </div>
              </Button>
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
                    <p className="text-muted-foreground mb-2">Nenhuma lista selecionada ou criada.</p>
                    <p className="text-sm text-muted-foreground mb-4">Crie sua primeira lista para começar a adicionar produtos.</p>
                    <Button onClick={() => setIsAddListDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Nova Lista
                    </Button>
                </>
            )}
        </div>
      )}

      {/* Add List Dialog */}
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

      {/* Rename List Dialog */}
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

      {/* Delete List Confirmation Dialog */}
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
