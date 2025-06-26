import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Minus, Camera, CalendarDays, Wand2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { startOfDay, parseISO, isValid, isToday } from 'date-fns';
import { suggestProductName } from '@/ai/flows/suggest-product-name-flow';
import { useToast } from '@/hooks/use-toast';
import { addProduct, fetchProductDetailsFromBarcode, type Product } from '@/services/productService'; // Added fetchProductDetailsFromBarcode
import { BarcodeScanner } from '@/components/barcode/BarcodeScanner'; // Import BarcodeScanner

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProductAdded: (newProduct: Product) => void;
  listId: string;
  userId: string | undefined;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({
  isOpen,
  onOpenChange,
  onProductAdded,
  listId,
  userId,
}) => {
  const { toast } = useToast();
  const [newProductFormData, setNewProductFormData] = useState<Omit<Product, 'id' | 'isExploding' | 'originalId' | 'listId'>>({
    produto: '',
    marca: '',
    unidade: '1',
    validade: '',
  });
  const [isSuggestingProductName, setIsSuggestingProductName] = useState(false);
  const newProductNameInputRef = useRef<HTMLInputElement>(null);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFetchingBarcodeDetails, setIsFetchingBarcodeDetails] = useState(false); // New state for loading barcode details

  const handleNewProductFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewProductFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewQuantityChange = (amount: number) => {
    setNewProductFormData(prev => {
      const currentQuantity = parseInt(prev.unidade, 10) || 0;
      const newQuantity = Math.max(1, currentQuantity + amount);
      return { ...prev, unidade: newQuantity.toString() };
    });
  };

  const handleSuggestProductName = async () => {
    if (!newProductFormData.produto.trim()) {
      toast({ title: "Entrada Vazia", description: "Digite algo no campo 'Produto' para obter uma sugestão.", variant: "default" });
      return;
    }
    setIsSuggestingProductName(true);
    try {
      const result = await suggestProductName({
        currentInput: newProductFormData.produto,
        currentBrand: newProductFormData.marca,
      });
      if (result.suggestedName) {
        setNewProductFormData(prev => ({
          ...prev,
          produto: result.suggestedName,
          marca: result.suggestedBrand || prev.marca,
        }));
        toast({ title: "Nome Sugerido!", description: `Sugestão aplicada: ${result.suggestedName}` });
      } else {
        toast({ title: "Sem Sugestão", description: "Não foi possível gerar uma sugestão clara.", variant: "default" });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao Sugerir Nome", description: error.message || "Não foi possível obter uma sugestão de nome." });
    } finally {
      setIsSuggestingProductName(false);
    }
  };

  const handleAddNewProduct = async () => {
    const quantity = parseInt(newProductFormData.unidade, 10);
    if (!newProductFormData.produto || !newProductFormData.validade || !(quantity > 0)) {
      toast({
        title: "Campos Obrigatórios",
        description: "Produto, Quantidade (maior que 0) e Validade são obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    if (!userId) {
      toast({ variant: "destructive", title: "Erro de Autenticação", description: "Usuário não autenticado." });
      return;
    }

    try {
      const productDataToSave = {
        ...newProductFormData,
        listId: listId,
        unidade: quantity.toString(),
      };
      const newProduct = await addProduct(userId, listId, productDataToSave);
      onProductAdded(newProduct);
      setNewProductFormData({
        produto: '',
        marca: '',
        unidade: '1',
        validade: '',
      });
      onOpenChange(false);
      toast({ title: "Produto Adicionado", description: `${newProduct.produto} foi adicionado com sucesso.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao adicionar produto", description: error.message || "Não foi possível adicionar o produto." });
    }
  };

  const handleScanSuccess = useCallback(async (barcode: string) => { // Made async
    setIsFetchingBarcodeDetails(true); // Start loading
    toast({ title: "Código de Barras Escaneado", description: `Buscando detalhes para: ${barcode}` });
    try {
      const productDetails = await fetchProductDetailsFromBarcode(barcode);
      if (productDetails) {
        setNewProductFormData(prev => ({
          ...prev,
          produto: productDetails.name || prev.produto,
          marca: productDetails.brand || prev.marca,
          // category: productDetails.category || prev.category, // Uncomment if you add category to form
          // imageUrl: productDetails.imageUrl || prev.imageUrl, // Uncomment if you add imageUrl to form
        }));
        toast({ title: "Detalhes do Produto Encontrados!", description: `Produto: ${productDetails.name}, Marca: ${productDetails.brand || 'N/A'}` });
      } else {
        toast({ title: "Produto Não Encontrado", description: "Nenhum detalhe encontrado para este código de barras. Por favor, preencha manualmente.", variant: "default" });
      }
    } catch (error: any) {
      console.error("Error fetching product details from barcode:", error);
      toast({ variant: "destructive", title: "Erro na Busca de Produto", description: error.message || "Ocorreu um erro ao buscar detalhes do produto." });
    } finally {
      setIsFetchingBarcodeDetails(false); // Stop loading
      setIsScannerActive(false); // Deactivate scanner after processing
      newProductNameInputRef.current?.focus(); // Focus on product name input
    }
  }, [toast]);

  const handleScanError = useCallback((message: string) => {
    toast({ variant: "destructive", title: "Erro no Scanner", description: message });
    setIsScannerActive(false);
    setIsFetchingBarcodeDetails(false); // Ensure loading is off on error
  }, [toast]);

  useEffect(() => {
    if (isOpen && newProductNameInputRef.current && !isScannerActive) {
      newProductNameInputRef.current.focus();
    }
  }, [isOpen, isScannerActive]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isScannerActive ? "Escanear Código de Barras" : "Adicionar Novo Produto"}</DialogTitle>
          <DialogDescription>
            {isScannerActive
              ? "Posicione o código de barras do produto em frente à câmera." // Updated description
              : "Preencha os detalhes abaixo ou escaneie um código de barras."}
          </DialogDescription>
        </DialogHeader>
        {isScannerActive ? (
          <div className="py-4 space-y-4">
            <BarcodeScanner
              onScanSuccess={handleScanSuccess}
              onScanError={handleScanError}
              isScanning={isScannerActive}
              setIsScanning={setIsScannerActive}
            />
             {isFetchingBarcodeDetails && (
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando detalhes do produto...
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 py-4 grid-cols-1">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-product-name" className="text-right">
                Produto <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="new-product-name"
                  ref={newProductNameInputRef}
                  name="produto"
                  value={newProductFormData.produto}
                  onChange={handleNewProductFormChange}
                  className="flex-1 max-w-full"
                  required
                  disabled={isFetchingBarcodeDetails} // Disable while fetching
                />
                <Button type="button" variant="outline" size="icon" onClick={handleSuggestProductName} disabled={isSuggestingProductName || !newProductFormData.produto.trim() || isFetchingBarcodeDetails}> {isSuggestingProductName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />} </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-product-brand" className="text-right">
                Marca
              </Label>
              <Input
                id="new-product-brand"
                name="marca"
                value={newProductFormData.marca}
                onChange={handleNewProductFormChange}
                className="col-span-3 max-w-full"
                disabled={isFetchingBarcodeDetails} // Disable while fetching
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-product-quantity" className="text-right">
                Qtde <span className="text-destructive">*</span>
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleNewQuantityChange(-1)} disabled={(parseInt(newProductFormData.unidade, 10) || 1) <= 1 || isFetchingBarcodeDetails}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="new-product-quantity"
                  name="unidade"
                  value={newProductFormData.unidade}
                  onChange={handleNewProductFormChange}
                  className="w-16 text-center max-w-full"
                  type="number"
                  min="1"
                  step="1"
                  required
                  disabled={isFetchingBarcodeDetails} // Disable while fetching
                />
                <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => handleNewQuantityChange(1)} disabled={isFetchingBarcodeDetails}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-product-expiry-btn" className="text-right">
                Validade <span className="text-destructive">*</span>
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button id="new-product-expiry-btn" variant={"outline"} className={cn("col-span-3 justify-start text-left font-normal", !newProductFormData.validade && "text-muted-foreground")}
                    disabled={isFetchingBarcodeDetails} // Disable while fetching
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {newProductFormData.validade && isValid(parseISO(newProductFormData.validade)) ? format(parseISO(newProductFormData.validade), "dd/MM/yyyy") : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={newProductFormData.validade ? parseISO(newProductFormData.validade) : undefined} onSelect={(date) => {
                    setNewProductFormData(prev => ({ ...prev, validade: date ? format(date, "yyyy-MM-dd") : '' }));
                    setIsCalendarOpen(false);
                  }} initialFocus disabled={(date) => date < startOfDay(new Date()) && !isToday(date)} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}
        <DialogFooter className="flex flex-col-reverse gap-2 pt-4">
          {isScannerActive ? (
            <Button variant="outline" className="w-full" onClick={() => {
              setIsScannerActive(false);
              newProductNameInputRef.current?.focus();
            }} disabled={isFetchingBarcodeDetails}>
              {isFetchingBarcodeDetails ? "Buscando..." : "Digitar Manualmente"}
            </Button>
          ) : (
            <div>
              <Button type="button" variant="outline" onClick={() => setIsScannerActive(true)} className="w-full" disabled={isFetchingBarcodeDetails}>
                <Camera className="mr-2 h-4 w-4" /> Escanear Código
              </Button>
              <div className="flex w-full flex-col-reverse gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="w-full" disabled={isFetchingBarcodeDetails}>Cancelar</Button>
                </DialogClose>
                {/* Removed 'Salvar & Novo' button as it's not present in the current component structure in page.tsx */}
                <Button type="button" onClick={handleAddNewProduct} className="w-full" disabled={isFetchingBarcodeDetails}>
                  Salvar Produto
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};