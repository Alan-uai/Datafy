
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState(formatValue ? formatValue(value) : value.toString());

  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(formatValue ? formatValue(value) : value.toString());
    } else {
      // For price, show a clean number for editing
      if (formatValue && formatValue(value).includes('R$')) {
        setDisplayValue(value.toFixed(2).replace('.', ','));
      } else {
        setDisplayValue(value.toString());
      }
    }
  }, [value, isEditing, formatValue]);


  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleBlur = () => {
    setIsEditing(false);
    let rawValue = displayValue.replace(/[R$\s]/g, '').replace(',', '.');
    let parsedValue = step === 1 ? parseInt(rawValue, 10) : parseFloat(rawValue);
    
    if (isNaN(parsedValue)) {
      parsedValue = min;
    }

    const clampedValue = Math.max(min, Math.min(max, parsedValue));
    onChange(clampedValue);
  };

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

      <Input
        type="text"
        className="h-10 w-full text-center text-base md:text-sm font-medium"
        value={displayValue}
        onChange={handleInputChange}
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
      />

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
