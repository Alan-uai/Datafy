
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  formatValue?: (value: number) => string;
}

export const CustomNumberInput: React.FC<CustomNumberInputProps> = ({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  className,
  formatValue
}) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const formattedValue = formatValue ? formatValue(value) : value.toString();

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
        <span className="sr-only">Diminuir</span>
      </Button>

      <div className="flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background md:text-sm">
        <span className="font-medium">{formattedValue}</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-10 w-10 shrink-0"
        onClick={handleIncrement}
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Aumentar</span>
      </Button>
    </div>
  );
};
