
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, className, children }) => {
  return (
    <div className={cn("text-center py-10 flex flex-col items-center justify-center", className)}>
      {icon && React.cloneElement(icon as React.ReactElement, { className: "mx-auto h-12 w-12 text-muted-foreground"})}
      <h3 className="mt-4 text-lg font-medium">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {description}
      </p>
      {children}
    </div>
  );
};
