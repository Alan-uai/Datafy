
"use client";

import React from 'react';
import { DashboardActions } from './DashboardActions';

interface DashboardHeaderProps {
  isEditingWidgets: boolean;
  onWidgetEditToggle: () => void;
  columnVisibility: Record<string, boolean>;
  onColumnVisibilityChange: (key: string, value: boolean) => void;
}

export function DashboardHeader({ isEditingWidgets, onWidgetEditToggle, columnVisibility, onColumnVisibilityChange }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <DashboardActions
        isEditingWidgets={isEditingWidgets}
        onWidgetEditToggle={onWidgetEditToggle}
        columnVisibility={columnVisibility}
        onColumnVisibilityChange={onColumnVisibilityChange}
      />
    </header>
  );
}
