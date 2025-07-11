
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import type { ProductList } from '@/lib/types';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import { Edit, Trash2, Plus } from 'lucide-react';
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

interface ProductListTabsProps {
  productLists: ProductList[];
  activeListId: string | null;
  onListChange: (listId: string) => void;
  onManageList: (list: ProductList | null) => void;
  onDeleteList: (listId: string) => void;
  dashboardScale: 'normal' | 'compact';
}

export function ProductListTabs({ productLists, activeListId, onListChange, onManageList, onDeleteList, dashboardScale }: ProductListTabsProps) {
  return (
    <div className="px-4 md:px-6 py-4">
      <ScrollArea className={cn("w-full", dashboardScale === 'compact' && 'sm:overflow-x-hidden')}>
        <div className={cn("flex items-center gap-1 pb-2", dashboardScale === 'compact' && 'sm:flex-wrap')}>
          {productLists.map(list => (
            <div key={list.id} className="flex items-center group/tab shrink-0">
              <Button
                variant="ghost"
                onClick={() => onListChange(list.id)}
                className={cn(
                  "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
                  dashboardScale === 'compact' ? 'h-8 p-2 text-sm' : 'h-auto p-2'
                )}
                data-active={activeListId === list.id}
              >
                <div className="flex items-center gap-2">
                  <DynamicIcon name={list.icon || 'List'} className={dashboardScale === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                  <span>{list.name}</span>
                </div>
              </Button>
              <div className="flex items-center gap-1 ml-1 opacity-100 sm:opacity-0 group-hover/tab:opacity-100 transition-opacity">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onManageList(list); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={e => e.stopPropagation()}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a lista "{list.name}" e todos os produtos contidos nela.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteList(list.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          <Button variant="ghost" onClick={() => onManageList(null)} className={dashboardScale === 'compact' ? 'h-8 p-2 text-sm' : 'h-auto p-2'}>
            <Plus className={dashboardScale === 'compact' ? 'h-4 w-4 mr-1' : 'h-4 w-4 mr-2'} />
            Lista
          </Button>
        </div>
        <ScrollBar orientation="horizontal" className={cn(dashboardScale === 'compact' && 'sm:hidden')} />
      </ScrollArea>
    </div>
  );
}
