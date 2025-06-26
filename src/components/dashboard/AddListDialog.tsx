import React, { useState, useRef } from 'react';
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
import { PlusCircle, Loader2, Wand2, RefreshCw } from 'lucide-react';
import { DynamicIcon, iconNames } from '@/components/shared/DynamicIcon';
import { addProductList, type productList } from '@/services/productService';
import { suggestListIcon } from '@/ai/flows/suggest-list-icon-flow';
import { useToast } from "@/hooks/use-toast";

interface AddListDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onListAdded: (newList: productList) => void;
  userId: string | undefined;
}

export const AddListDialog: React.FC<AddListDialogProps> = ({
  isOpen,
  onOpenChange,
  onListAdded,
  userId,
}) => {
  const { toast } = useToast();
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('PlusCircle'); // Changed from 'ListPlus' to 'PlusCircle'
  const [isSuggestingIcon, setIsSuggestingIcon] = useState(false);
  const newListInputRef = useRef<HTMLInputElement>(null);

  const handleSuggestIcon = async () => {
    if (!newListName.trim()) {
      toast({ title: "Nome da Lista Vazio", description: "Por favor, digite um nome para a lista antes de sugerir um ícone.", variant: "default" });
      return;
    }
    setIsSuggestingIcon(true);
    try {
      const result = await suggestListIcon({ listName: newListName, currentIconName: newListIcon });
      // Validate suggested icon name against available icon names
      if (result.iconName && iconNames.includes(result.iconName)) {
        setNewListIcon(result.iconName);
        toast({ title: "Ícone Sugerido!", description: `Ícone "${result.iconName}" aplicado.` });
      } else {
        // Fallback to a default icon if suggestion is invalid
        setNewListIcon('PlusCircle'); // Ensure a valid icon is set even if suggestion fails
        toast({ title: "Sugestão Inválida", description: "O ícone sugerido não é válido, mantendo o atual ou definindo um padrão.", variant: "default" });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Não foi possível obter uma sugestão.";
      toast({ variant: "destructive", title: "Erro ao Sugerir Ícone", description: errorMessage });
      // Ensure a valid icon is set even on error
      setNewListIcon('PlusCircle');
    } finally {
      setIsSuggestingIcon(false);
    }
  };

  const handleAddListSubmit = async () => {
    if (!newListName.trim()) {
      toast({ variant: "destructive", title: "Erro", description: "O nome da lista não pode estar vazio." });
      return;
    }
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado para criar lista." });
      return;
    }

    try {
      const newList = await addProductList(userId, { name: newListName, icon: newListIcon || "ListChecks" });
      onListAdded(newList); // Notify parent
      setNewListName('');
      setNewListIcon('PlusCircle'); // Also reset to a valid icon
      onOpenChange(false); // Close dialog
      toast({ title: "Lista Adicionada", description: `A lista "${newList.name}" foi criada.` });
    } catch (error: any) {
      const errorMessage = error.message || "Não foi possível criar a nova lista.";
      toast({ variant: "destructive", title: "Erro ao adicionar lista", description: errorMessage });
    }
  };

  // Effect to focus input when dialog opens
  React.useEffect(() => {
    if (isOpen && newListInputRef.current) {
      newListInputRef.current.focus();
    }
  }, [isOpen]);


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
          <Button type="button" onClick={handleAddListSubmit} disabled={!newListName.trim() || !newListIcon.trim()}>Criar Lista</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
