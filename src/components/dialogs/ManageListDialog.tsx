
"use client";

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { debounce } from 'lodash';
import { suggestListIcon } from "@/ai/flows/suggest-list-icon-flow";
import { useToast } from "@/hooks/use-toast";
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import { Loader2, RefreshCw } from 'lucide-react';
import type { ProductList } from '@/lib/types';

interface ManageListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, icon: string) => void;
  editingList: ProductList | null;
}

export function ManageListDialog({
  open,
  onOpenChange,
  onSave,
  editingList,
}: ManageListDialogProps) {
  const { toast } = useToast();
  const listNameRef = useRef<HTMLInputElement>(null);
  const [listIcon, setListIcon] = useState('List');
  const [isSuggestingIcon, setIsSuggestingIcon] = useState(false);

  useEffect(() => {
    if (open) {
      setListIcon(editingList?.icon || 'List');
      if (listNameRef.current) {
        listNameRef.current.value = editingList?.name || '';
      }
    }
  }, [open, editingList]);

  const debouncedIconSuggestion = useCallback(debounce(async (name: string) => {
    if (name.length < 3) return;
    setIsSuggestingIcon(true);
    try {
      const { iconName } = await suggestListIcon({ listName: name });
      setListIcon(iconName || 'List');
    } catch (error) {
        console.error("Failed to suggest icon", error);
        toast({ variant: "destructive", title: "Erro na Sugestão de Ícone" });
    } finally {
      setIsSuggestingIcon(false);
    }
  }, 800), [toast]);

  const handleListNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedIconSuggestion(event.target.value);
  };
  
  const handleRegenerateIcon = async () => {
    const listName = listNameRef.current?.value;
    if (!listName) return;
    debouncedIconSuggestion(listName);
  };

  const handleSave = () => {
    const listName = listNameRef.current?.value;
    if (!listName || !listName.trim()) {
      toast({ variant: "destructive", title: "Nome inválido" });
      return;
    }
    onSave(listName.trim(), listIcon);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{editingList ? 'Editar Lista' : 'Criar Nova Lista'}</AlertDialogTitle>
          <AlertDialogDescription>
            {editingList ? 'Altere o nome e o ícone da sua lista.' : 'Digite o nome da sua lista e a IA sugerirá um ícone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-4">
          <Input 
            ref={listNameRef} 
            placeholder="Ex: Compras da Semana" 
            onChange={handleListNameChange} 
            defaultValue={editingList?.name || ''} 
          />
          <div>
            <Label className="text-sm font-medium mb-2 block">Ícone Sugerido</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 p-2 border rounded-md w-full">
                {isSuggestingIcon ? <Loader2 className="h-5 w-5 animate-spin" /> : <DynamicIcon name={listIcon} className="h-5 w-5" />}
                <span className="flex-1">{listIcon}</span>
              </div>
              <Button variant="outline" size="icon" onClick={handleRegenerateIcon} disabled={isSuggestingIcon}>
                <RefreshCw className={`h-4 w-4 ${isSuggestingIcon ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSave}>{editingList ? 'Salvar Alterações' : 'Criar'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
