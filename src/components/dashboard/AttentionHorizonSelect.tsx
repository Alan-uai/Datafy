"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AttentionHorizonSelectProps {
  currentHorizon: number;
  onHorizonChange: (value: number) => void;
  isLoading?: boolean;
}

const AttentionHorizonSelect: React.FC<AttentionHorizonSelectProps> = ({
  currentHorizon,
  onHorizonChange,
  isLoading,
}) => {
  const horizonOptions = [3, 7, 14, 30];

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">VENCENDO EM</p>
      <Select
        value={currentHorizon.toString()}
        onValueChange={(value) => onHorizonChange(parseInt(value, 10))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-auto border-none focus:ring-0 text-xl sm:text-2xl font-bold h-auto p-0 bg-transparent">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          {horizonOptions.map(option => (
            <SelectItem key={option} value={option.toString()}>
              {option} dias
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AttentionHorizonSelect;
