
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import { XCircle, Move, Trash2 } from 'lucide-react';
import type { ProductList } from '@/lib/types';

interface MultiSelectBarProps {
  selectedCount: number;
  productLists: ProductList[];
  activeListId: string;
  onMove: (targetListId: string) => void;
  onDelete: () => void;
  onReset: () => void;
}

export function MultiSelectBar({ selectedCount, productLists, activeListId, onMove, onDelete, onReset }: MultiSelectBarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-auto bg-background border rounded-lg shadow-2xl flex items-center gap-2 p-2 z-50"
    >
      <Button variant="ghost" size="icon" onClick={onReset}>
        <XCircle className="h-5 w-5" />
      </Button>
      <span className="font-medium text-sm pr-2 border-r">{selectedCount} selecionado(s)</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <Move className="mr-2 h-4 w-4" /> Mover
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Mover para a lista</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {productLists.filter(l => l.id !== activeListId).map(list => (
            <DropdownMenuItem key={list.id} onSelect={() => onMove(list.id)}>
              <DynamicIcon name={list.icon} className="mr-2 h-4 w-4" /> {list.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {selectedCount} produtos?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
