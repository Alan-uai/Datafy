import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Product } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { addProduct } from '@/services/productService';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { parse, isValid, format } from 'date-fns';

interface AddMultipleProductsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProductsAdded: (products: Product[]) => void;
  listId: string;
  userId: string | undefined; // Add userId to props
}

export function AddMultipleProductsDialog({
  isOpen,
  onOpenChange,
  onProductsAdded,
  listId,
  userId, // Destructure userId from props
}: AddMultipleProductsDialogProps) {
  const [productData, setProductData] = useState(''); // Remove the useAuth call
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddProducts = useCallback(async () => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado.',
      });
      return;
    }

    if (!listId) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Nenhuma lista selecionada.',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate parsing and adding products
      const lines = productData.split('\n').filter(line => line.trim() !== ''); // Split by newline
      const addedProducts: Product[] = [];
      const errors: string[] = [];

      for (const line of lines) {
        const parts = line.split(',').map(s => s.trim());
        console.log('Parsed line parts:', parts);
        // Ensure there are at least 3 parts (produto, unidade, validade)
        if (parts.length < 3) {
            errors.push(`Linha inválida (formato incorreto): ${line}`);
            continue;
        }

        let produto: string | undefined;
        let marca: string | undefined;
        let unidade: string | undefined;
        let validadeStr: string | undefined;

        // Determine which part is marca, unidade, and validade based on number of parts
        if (parts.length === 3) {
            // Assuming format: Nome, Unidade, Validade
            [produto, unidade, validadeStr] = parts;
        } else {
            // Assuming format: Nome, Marca, Unidade, Validade
            [produto, marca, unidade, validadeStr] = parts;
        }
        console.log('Extracted product data:', { produto, marca, unidade, validadeStr });

        // Attempt to parse the date string
        let validade: string | undefined;
        const parsedDate = parseDate(validadeStr);
        validade = parsedDate;
        console.log('Parsed date result:', parsedDate);
        
        if (produto && validade && unidade) {
          try {
            const newProduct = await addProduct(userId, listId, {
              produto: produto!, // Use non-null assertion as we check for it
              marca: marca || '',
              unidade: unidade!, // Use non-null assertion
              validade: validade!, // Use non-null assertion
            });
 console.log('Attempting to add product:', { userId, listId, productDataToSave: { produto, marca: marca || '', unidade: unidade!, validade: validade! } });
            addedProducts.push(newProduct);
          } catch (error: any) {
            errors.push(`Falha ao adicionar ${produto || 'produto desconhecido'}: ${
 error.message || 'Erro desconhecido'}`
            );
 console.error('Error adding product for line:', line, error);
          }
        } else {
          errors.push(`Linha inválida (dados ausentes): ${line}`);
        }
      }

      onProductsAdded(addedProducts);
      onOpenChange(false);
      if (errors.length > 0) {
        toast({
          variant: 'destructive',
          title: 'Erros ao adicionar produtos', // Removed extra characters here
          description: errors.join('\n'), // Join errors with newline
          duration: 5000,
        });
      } else {
        toast({
          title: 'Produtos Adicionados',
          description: `Foram adicionados ${addedProducts.length} produtos.`,
        });
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao processar produtos',
        description: error.message || 'Erro desconhecido',
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, listId, productData, onProductsAdded, onOpenChange, toast]);

  // Helper function to parse dates
  const parseDate = useCallback((dateStr: string | undefined): string | undefined => {
    if (!dateStr) return undefined;

    // Attempt to parse YYYY-MM-DD
    let parsed = parse(dateStr, 'yyyy-MM-dd', new Date());
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');

    // Attempt to parse DD-MM-YY
    parsed = parse(dateStr, 'dd-MM-yy', new Date());
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');

    // Attempt to parse DD/MM/YY
    parsed = parse(dateStr, 'dd/MM/yy', new Date());
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');

    // Attempt to parse DD-MM (assume current year)
    parsed = parse(dateStr, 'dd-MM', new Date());
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');

    // Attempt to parse DD/MM (assume current year)
    parsed = parse(dateStr, 'dd/MM', new Date());
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');

    return undefined; // Date could not be parsed
  }, [userId, listId, productData, onProductsAdded, onOpenChange, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Múltiplos Produtos</DialogTitle>
          <DialogDescription>
            Insira os produtos, um por linha, no formato: Nome, Marca (opcional), Unidade, Validade (YYYY-MM-DD).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="productData">Dados dos Produtos</Label>
            <Textarea
              id="productData"
              placeholder="Ex: Arroz, Prato Fino, 5kg, 2024-12-31
Feijão, Camil, 1kg, 2025-06-15"
              value={productData}
              onChange={e => setProductData(e.target.value)}
              rows={10}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline" disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleAddProducts} disabled={isLoading}>
            {isLoading ? <LoadingSpinner /> : 'Adicionar Produtos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}