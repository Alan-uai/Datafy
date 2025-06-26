"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming cn is used for classnames
import { Loader2 } from 'lucide-react';

interface AttentionHorizonSelectProps {
  currentHorizon: number;
  onHorizonChange: (horizon: number) => void;
  isLoading?: boolean; // Optional prop to indicate loading state
}

const AttentionHorizonSelect: React.FC<AttentionHorizonSelectProps> = ({
  currentHorizon,
  onHorizonChange,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelectHorizon = (horizon: number) => {
    onHorizonChange(horizon);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <span
          className={cn(
            "text-xs text-muted-foreground uppercase tracking-wider cursor-pointer",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:underline"
          )}
          aria-label={`Mudar horizonte de atenção, atual: ${currentHorizon} dias`}
          // Disable pointer events when loading
          style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
        >
          Vencendo ({currentHorizon} dias) {isLoading && <Loader2 className="h-3 w-3 inline-block animate-spin ml-1" />}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1">
        <div className="grid gap-1">
          <Button
            variant={currentHorizon === 7 ? "secondary" : "ghost"}
            onClick={() => handleSelectHorizon(7)}
            size="sm"
            className="w-full justify-start"
          >
            Próximos 7 dias
          </Button>
          <Button
            variant={currentHorizon === 15 ? "secondary" : "ghost"}
            onClick={() => handleSelectHorizon(15)}
            size="sm"
             className="w-full justify-start"
          >
            Próximos 15 dias
          </Button>
          <Button
            variant={currentHorizon === 30 ? "secondary" : "ghost"}
            onClick={() => handleSelectHorizon(30)}
            size="sm"
             className="w-full justify-start"
          >
            Próximos 30 dias
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AttentionHorizonSelect;
