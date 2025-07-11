
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FilterType } from '@/app/dashboard/page';

const filterOptions = ['all', 'today', 'expired', 'next7', 'next14', 'thisMonth', 'nextMonth'] as const;
const filterLabels: Record<FilterType, string> = {
    all: "Todos",
    today: "Vence Hoje",
    expired: "Vencidos",
    next7: "Próximos 7 dias",
    next14: "Próximos 14 dias",
    thisMonth: "Este Mês",
    nextMonth: "Próximo Mês",
};

interface ProductTableControlsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeFilter: FilterType;
  onFilterChange: (value: string) => void;
  dashboardScale: 'normal' | 'compact';
}

export function ProductTableControls({ searchQuery, onSearchChange, activeFilter, onFilterChange, dashboardScale }: ProductTableControlsProps) {
  return (
    <div className="flex flex-row items-center gap-4 p-4 md:px-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produtos..." className={cn('pl-10 w-full', dashboardScale === 'compact' ? 'h-9 text-sm' : 'h-10')} value={searchQuery} onChange={onSearchChange} />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={cn('shrink-0', dashboardScale === 'compact' ? 'h-9 px-3 text-xs' : 'h-10')}>
            <Filter className="mr-2 h-4 w-4" />
            {filterLabels[activeFilter]}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={activeFilter} onValueChange={onFilterChange}>
            {filterOptions.map(opt => (
              <DropdownMenuRadioItem key={opt} value={opt}>
                {filterLabels[opt]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
