
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings } from 'lucide-react';

interface DashboardActionsProps {
  isEditingWidgets: boolean;
  onWidgetEditToggle: () => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (key: string, value: boolean) => void;
}

const COLUMN_NAMES: Record<string, string> = {
  'id': '#',
  'produto': 'Produto',
  'marca': 'Marca',
  'qtde': 'Qtde',
  'validade': 'Validade',
  'preco': 'Preço',
  'categoria': 'Categoria',
  'status': 'Status',
};

export function DashboardActions({ isEditingWidgets, onWidgetEditToggle, columnVisibility, onColumnVisibilityChange }: DashboardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            <span>Colunas</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Alternar Colunas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {Object.entries(COLUMN_NAMES).map(([key, name]) => (
            <DropdownMenuCheckboxItem
              key={key}
              className="capitalize"
              checked={columnVisibility[key] ?? true}
              onCheckedChange={(value) => onColumnVisibilityChange(key, !!value)}
              onSelect={(e) => e.preventDefault()} // Prevent closing menu on item click
            >
              {name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={onWidgetEditToggle}>
        <Settings className="h-4 w-4 mr-2" />
        <span>{isEditingWidgets ? "Finalizar Edição" : "Editar Widgets"}</span>
      </Button>
    </div>
  );
}
