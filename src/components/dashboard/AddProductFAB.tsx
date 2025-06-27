import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Upload, Camera } from 'lucide-react'; // Added Camera icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface AddProductFABProps {
  onAddSingleProduct: () => void;
  onAddMultipleProducts: () => void;
  onAddProductsFromImage: () => void;
  onAddProductsFromFile: () => void;
}

export const AddProductFAB: React.FC<AddProductFABProps> = ({
  onAddSingleProduct,
  onAddMultipleProducts,
  onAddProductsFromImage,
  onAddProductsFromFile,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-40"
          size="icon"
          aria-label="Adicionar Produto"
        >
          <Plus className="h-7 w-7" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" className="w-56">
        <DropdownMenuItem onClick={onAddSingleProduct}>
          <FileText className="mr-2 h-4 w-4" />
          Adicionar Produto Único
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddMultipleProducts}>
          <Upload className="mr-2 h-4 w-4" />
          Adicionar Múltiplos Produtos
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddProductsFromImage}>
          <Camera className="mr-2 h-4 w-4" />
          Adicionar por Foto
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddProductsFromFile}>
          <FileText className="mr-2 h-4 w-4" />
          Adicionar por Arquivo
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};