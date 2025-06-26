import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { deleteProductList, type ProductList } from '@/services/productService';

interface DeleteListConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  listToDelete: ProductList | null;
  onListDeleted: (deletedListId: string) => void;
  userId: string | undefined;
}

export const DeleteListConfirmDialog: React.FC<DeleteListConfirmDialogProps> = ({
  isOpen,
  onOpenChange,
  listToDelete,
  onListDeleted,
  userId,
}) => {
  const { toast } = useToast();

  const handleDeleteList = async () => {
    if (!listToDelete || !userId) {
      // Should ideally not happen if the dialog is only opened when listToDelete is set and user is logged in
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a lista. Informações faltando." });
      return;
    }
    try {
      await deleteProductList(userId, listToDelete.id);
      toast({ title: "Lista Excluída", description: `A lista "${listToDelete.name}" e todos os seus produtos foram excluídos.` });
      onListDeleted(listToDelete.id); // Notify parent with the ID of the deleted list
      onOpenChange(false); // Close dialog
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao excluir lista", description: error.message || "Não foi possível excluir a lista." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão da Lista</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a lista "{listToDelete?.name}"? Todos os produtos dentro desta lista também serão excluídos. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button variant="destructive" onClick={handleDeleteList}>Excluir Lista</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
