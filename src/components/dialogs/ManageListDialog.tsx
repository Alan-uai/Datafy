
"use client";

import React from 'react';
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
  onSave: () => void;
  onCancel: () => void;
  editingList: ProductList | null;
  newListNameRef: React.RefObject<HTMLInputElement>;
  onNewListNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  newListIcon: string;
  isSuggestingIcon: boolean;
  onRegenerateIcon: () => void;
}

export function ManageListDialog({
  open,
  onOpenChange,
  onSave,
  onCancel,
  editingList,
  newListNameRef,
  onNewListNameChange,
  newListIcon,
  isSuggestingIcon,
  onRegenerateIcon,
}: ManageListDialogProps) {
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
          <Input ref={newListNameRef} placeholder="Ex: Compras da Semana" onChange={onNewListNameChange} defaultValue={editingList?.name || ''} />
          <div>
            <Label className="text-sm font-medium mb-2 block">Ícone Sugerido</Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 p-2 border rounded-md w-full">
                {isSuggestingIcon ? <Loader2 className="h-5 w-5 animate-spin" /> : <DynamicIcon name={newListIcon} className="h-5 w-5" />}
                <span className="flex-1">{newListIcon}</span>
              </div>
              <Button variant="outline" size="icon" onClick={onRegenerateIcon} disabled={isSuggestingIcon}>
                <RefreshCw className={`h-4 w-4 ${isSuggestingIcon ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onSave}>{editingList ? 'Salvar Alterações' : 'Criar'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
