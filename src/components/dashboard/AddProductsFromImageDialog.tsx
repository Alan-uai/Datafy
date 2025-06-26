import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image, Loader2, ListPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/types';
import { addProduct } from '@/services/productService';

interface AddProductsFromImageDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProductsAdded: (newProducts: Product[]) => void;
  listId: string;
  userId: string | undefined;
}

interface ExtractedProductDisplay extends Omit<Product, 'id' | 'originalId' | 'isExploding' | 'listId'> {
  tempId: string; // Temporary ID for managing in the UI before saving
}

export const AddProductsFromImageDialog: React.FC<AddProductsFromImageDialogProps> = ({
  isOpen,
  onOpenChange,
  onProductsAdded,
  listId,
  userId,
}) => {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProductDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setExtractedProducts([]); // Clear previous results
    }
  }, []);

  const handleExtractProducts = useCallback(async () => {
    if (!selectedImage) {
      toast({ title: "Nenhuma Imagem", description: "Por favor, selecione uma imagem primeiro.", variant: "default" });
      return;
    }

    setIsLoading(true);
    setExtractedProducts([]);

    const reader = new FileReader();
    reader.readAsDataURL(selectedImage);

    reader.onloadend = async () => {
      try {
        const base64Image = (reader.result as string).split(',')[1]; // Get base64 content
        if (!base64Image) {
            throw new Error("Falha ao converter imagem para Base64.");
        }

        toast({ title: "Processando Imagem", description: "Aguarde enquanto extraímos os produtos da imagem..." });

        const response = await fetch('/api/extract-product-from-image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ base64Image }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Falha na extração de produtos.');
        }

        if (result && result.extractedProducts && result.extractedProducts.length > 0) {
          const productsWithTempIds: ExtractedProductDisplay[] = result.extractedProducts.map((p: any) => ({ // Added type any for mapping
            ...p,
            unidade: p.unidade || '1', // Default to '1' if unit is not extracted
          }));
          setExtractedProducts(productsWithTempIds);
          toast({ title: "Produtos Encontrados!", description: `${result.extractedProducts.length} produto(s) extraído(s). Revise e adicione.` });
        } else {
          toast({ title: "Nenhum Produto Encontrado", description: "Não foi possível extrair produtos claros da imagem.", variant: "default" });
        }
      } catch (error: any) {
        console.error("Error extracting products from image:", error);
        toast({ variant: "destructive", title: "Erro na Extração", description: error.message || "Ocorreu um erro ao processar a imagem." });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = () => {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Erro de Leitura", description: "Não foi possível ler o arquivo de imagem." });
    };
  }, [selectedImage, toast]);

  const handleAddAllExtractedProducts = useCallback(async () => {
    if (!userId || !listId) {
      toast({ variant: "destructive", title: "Erro", description: "Usuário ou Lista não selecionados." });
      return;
    }
    if (extractedProducts.length === 0) {
      toast({ title: "Nenhum Produto", description: "Não há produtos para adicionar.", variant: "default" });
      return;
    }

    setIsLoading(true);
    const addedProducts: Product[] = [];
    const errors: string[] = [];

    for (const p of extractedProducts) {
      try {
        // Basic validation before adding
        if (!p.produto || !p.validade || parseInt(p.unidade || '0') <= 0) {
          errors.push(`Produto inválido (nome, validade ou quantidade ausente): ${p.produto || 'Desconhecido'}`);
          continue;
        }

        const newProduct = await addProduct(userId, listId, {
          produto: p.produto,
          marca: p.marca || '',
          unidade: p.unidade || '1',
          validade: p.validade,
        });
        addedProducts.push(newProduct);
      } catch (error: any) {
        errors.push(`Falha ao adicionar ${p.produto || 'produto desconhecido'}: ${error.message || 'Erro desconhecido'}`);
      }
    }

    setIsLoading(false);

    if (addedProducts.length > 0) {
      onProductsAdded(addedProducts);
      toast({ title: "Produtos Adicionados", description: `${addedProducts.length} produto(s) adicionado(s) com sucesso.` });
      setSelectedImage(null);
      setPreviewImage(null);
      setExtractedProducts([]);
      onOpenChange(false);
    }
    if (errors.length > 0) {
      errors.forEach(msg => toast({ variant: "destructive", title: "Erro Parcial", description: msg }));
    } else if (addedProducts.length === 0) {
      toast({ title: "Nenhum Produto Adicionado", description: "Nenhum produto pôde ser adicionado devido a erros ou falta de dados válidos.", variant: "destructive" });
    }

  }, [extractedProducts, userId, listId, onProductsAdded, onOpenChange, toast]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Produtos por Foto</DialogTitle>
          <DialogDescription>
            Carregue uma foto (ex: nota fiscal, lista de compras) para extrair os produtos.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label htmlFor="image-upload" className="mb-2 block">Selecione uma Imagem:</Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="cursor-pointer"
              disabled={isLoading}
            />
          </div>

          {previewImage && (
            <div className="mt-4">
              <Label>Pré-visualização da Imagem:</Label>
              <img src={previewImage} alt="Pré-visualização" className="max-w-full h-auto rounded-md border mt-2" />
            </div>
          )}

          {selectedImage && !extractedProducts.length && !isLoading && (
            <Button onClick={handleExtractProducts} disabled={isLoading} className="w-full">
              <Image className="h-4 w-4 mr-2" />
              Extrair Produtos da Imagem
            </Button>
          )}

          {isLoading && (
            <div className="flex items-center justify-center text-sm text-muted-foreground mt-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Extraindo produtos...
            </div>
          )}

          {extractedProducts.length > 0 && !isLoading && (
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold">Produtos Extraídos:</h3>
              {extractedProducts.map((p, index) => (
                <div key={p.tempId} className="border rounded-md p-3 text-sm">
                  <p><strong>Produto:</strong> {p.produto}</p>
                  {p.marca && <p><strong>Marca:</strong> {p.marca}</p>}
                  {p.unidade && <p><strong>Quantidade:</strong> {p.unidade}</p>}
                  {p.validade && <p><strong>Validade:</strong> {p.validade}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleAddAllExtractedProducts}
            disabled={isLoading || extractedProducts.length === 0}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ListPlus className="h-4 w-4 mr-2" />
            )}
            Adicionar Todos os Produtos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
