import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
 size?: 'small' | 'medium' | 'large'; // Define tamanhos comuns se aplicável
 className?: string;
}

export function LoadingSpinner({ size = 'medium', className }: LoadingSpinnerProps) {
 let sizeClass = 'h-4 w-4';
  switch (size) {
    case 'small':
      sizeClass = 'h-3 w-3';
      break;
    case 'medium':
      sizeClass = 'h-4 w-4';
      break;
    case 'large':
      sizeClass = 'h-6 w-6';
      break;
    // Adicione outros tamanhos conforme necessário
  }

  return (
    <Loader2 className={cn('animate-spin', sizeClass, className)} />
  );
}