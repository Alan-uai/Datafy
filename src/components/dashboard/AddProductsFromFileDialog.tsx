
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Product } from '@/types';

interface AddProductsFromFileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProductsAdded: (products: Product[]) => void;
  listId: string;
  userId?: string;
}

export function AddProductsFromFileDialog({
  isOpen,
  onOpenChange,
  onProductsAdded,
  listId,
  userId
}: AddProductsFromFileDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/csv'
      ];
      
      if (validTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast({
          variant: "destructive",
          title: "Tipo de arquivo não suportado",
          description: "Selecione um arquivo Excel (.xlsx, .xls), PDF, Word (.docx, .doc) ou CSV."
        });
      }
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile || !userId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um arquivo válido."
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('listId', listId);
      formData.append('userId', userId);

      const response = await fetch('/api/extract-products-from-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao processar arquivo');
      }

      const result = await response.json();
      
      if (result.products && result.products.length > 0) {
        onProductsAdded(result.products);
        toast({
          title: "Produtos Importados",
          description: `${result.products.length} produto(s) foram extraídos do arquivo.`
        });
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Nenhum produto encontrado",
          description: "Não foi possível encontrar produtos válidos no arquivo."
        });
      }
    } catch (error: any) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Processar Arquivo",
        description: error?.message || "Não foi possível processar o arquivo. Verifique o formato e tente novamente."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsProcessing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-w-xs lg:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Produtos de Arquivo
          </DialogTitle>
          <DialogDescription>
            Importe produtos de arquivos Excel, PDF, Word ou CSV. O sistema tentará extrair informações de produtos automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formatos suportados:</strong> Excel (.xlsx, .xls), PDF, Word (.docx, .doc), CSV
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Selecionar arquivo</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.pdf,.docx,.doc,.csv"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />
          </div>

          {selectedFile && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Tamanho: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button 
            onClick={handleProcessFile} 
            disabled={!selectedFile || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Processar Arquivo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
