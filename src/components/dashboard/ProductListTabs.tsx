import React, { useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PlusCircle, Edit3, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicIcon } from '@/components/shared/DynamicIcon';
import type { ProductList } from '@/services/productService';

interface ProductListTabsProps {
  productLists: ProductList[];
  activeListId: string | null;
  setActiveListId: (listId: string | null) => void;
  isLoadingLists: boolean;
  onAddListClick: () => void;
  onRenameListClick: (list: ProductList) => void;
  onDeleteListClick: (list: ProductList) => void;
}

export const ProductListTabs: React.FC<ProductListTabsProps> = ({
  productLists,
  activeListId,
  setActiveListId,
  isLoadingLists,
  onAddListClick,
  onRenameListClick,
  onDeleteListClick,
}) => {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, productLists.length);
  }, [productLists.length]);

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
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
        setTimeout(() => {
          tabRefs.current[nextIndex]?.focus();
        }, 0);
      }
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setActiveListId(productLists[currentIndex].id);
    }
  };

  // Skeleton loader for initial empty state
  if (isLoadingLists && productLists.length === 0) {
    return (
      <div className="sticky top-[var(--header-height,4rem)] z-40 bg-background py-3 shadow-sm mb-6">
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex items-center p-2 space-x-2" role="tablist" aria-label="Listas de Produtos">
            <div className="h-9 w-24 bg-muted rounded animate-pulse" role="tab" aria-busy="true"></div>
            <div className="h-9 w-32 bg-muted rounded animate-pulse" role="tab" aria-busy="true"></div>
            <div className="h-9 w-28 bg-muted rounded animate-pulse" role="tab" aria-busy="true"></div>
            <div className="h-9 w-[120px] bg-muted/50 rounded animate-pulse ml-auto"></div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="sticky top-[calc(var(--header-height,4rem)_-_1px)] z-30 bg-background py-3 shadow-sm mb-6">
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex items-center p-2 space-x-2" role="tablist" aria-label="Listas de Produtos">
          {productLists.map((list, index) => (
            <button
              key={list.id}
              id={`list-tab-${list.id}`}
              ref={el => tabRefs.current[index] = el}
              role="tab"
              tabIndex={activeListId === list.id ? 0 : -1}
              aria-selected={activeListId === list.id}
              aria-controls="product-table-section"
              onClick={() => setActiveListId(list.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={cn(
                buttonVariants({ variant: activeListId === list.id ? 'default' : 'outline', size: 'sm' }),
                'px-3 py-1.5 h-auto min-h-[2.25rem]',
                "group shrink-0 cursor-pointer flex items-center justify-center text-center",
                activeListId === list.id && 'font-semibold shadow-md'
              )}
            >
              <DynamicIcon name={list.icon} className="flex-shrink-0 h-4 w-4 mr-2" />
              <span className="block truncate">
                {list.name}
              </span>
              <div className="flex items-center gap-0 opacity-0 w-0 group-hover:opacity-100 group-hover:w-auto group-focus-within:opacity-100 group-focus-within:w-auto transition-all duration-150 ease-in-out ml-1">
                 <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); onRenameListClick(list); }}
                    aria-label={`Renomear lista ${list.name}`}
                 >
                   <Edit3 className="h-3.5 w-3.5" />
                 </Button>
                 {productLists.length > 1 && (
                  <Button
                     variant="ghost"
                     size="icon"
                     className="h-6 w-6 text-destructive hover:text-destructive"
                     onClick={(e) => { e.stopPropagation(); onDeleteListClick(list); }}
                     aria-label={`Excluir lista ${list.name}`}
                  >
                      <Trash2 className="h-3.5 w-3.5"/>
                  </Button>
                 )}
              </div>
            </button>
          ))}
          <Button variant="outline" onClick={onAddListClick} size="sm" className="shrink-0 ml-auto h-9">
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Lista
          </Button>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
