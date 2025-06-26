import React, { useState, useRef, useEffect } from 'react';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { updateProductListName, type ProductList } from '@/services/productService';

interface RenameListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  listToRename: ProductList | null;
  onListRenamed: (updatedList: ProductList) => void;
  userId: string | undefined;
}

export const RenameListDialog: React.FC<RenameListDialogProps> = ({
  isOpen,
  onOpenChange,
  listToRename,
  onListRenamed,
  userId,
}) => {
  const { toast } = useToast();
  const [renamedListName, setRenamedListName] = useState(listToRename?.name || '');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Update internal state when listToRename prop changes
  useEffect(() => {
    setRenamedListName(listToRename?.name || '');
  }, [listToRename]);

  // Effect to focus input when dialog opens
  useEffect(() => {
    if (isOpen && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isOpen]);

  const handleRenameList = async () => {
    if (!listToRename || !renamedListName.trim() || !userId) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da lista não pode estar vazio ou usuário não autenticado." });
      return;
    }
    try {
      // Assuming updateProductListName returns the updated list or we construct it
      await updateProductListName(userId, listToRename.id, renamedListName);
      const updatedList = { ...listToRename, name: renamedListName }; // Construct the updated list
      onListRenamed(updatedList);
      onOpenChange(false); // Close dialog
      toast({ title: "Lista Renomeada", description: `A lista foi renomeada para "${renamedListName}".` });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao renomear lista", description: "Não foi possível renomear a lista." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button type="button" onClick={handleRenameList} disabled={!renamedListName.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
