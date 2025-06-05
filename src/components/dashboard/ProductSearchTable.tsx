
"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect, type ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  isValid,
  format,
} from 'date-fns';

const mockProducts: Product[] = [
  { id: '1', produto: 'Leite Integral UHT', marca: 'Tirol', unidade: 'Litro', validade: '2024-12-15' },
  { id: '2', produto: 'Pão de Forma Tradicional', marca: 'Seven Boys', unidade: 'Pacote 400g', validade: '2024-07-20' },
  { id: '3', produto: 'Café Torrado e Moído', marca: '3 Corações', unidade: 'Pacote 500g', validade: '2025-03-10' },
  { id: '4', produto: 'Arroz Branco Tipo 1', marca: 'Camil', unidade: 'Pacote 5kg', validade: '2025-08-01' },
  { id: '5', produto: 'Feijão Carioca Tipo 1', marca: 'Kicaldo', unidade: 'Pacote 1kg', validade: '2025-06-22' },
  { id: '6', produto: 'Óleo de Soja Refinado', marca: 'Soya', unidade: 'Garrafa 900ml', validade: '2024-11-05' },
  { id: '7', produto: 'Refrigerante Guaraná', marca: 'Antarctica', unidade: 'Lata 350ml', validade: '2024-10-30' },
  { id: '8', produto: 'Biscoito Cream Cracker', marca: 'Vitarella', unidade: 'Pacote 350g', validade: '2024-09-01' },
  { id: '9', produto: 'Macarrão Espaguete', marca: 'Barilla', unidade: 'Pacote 500g', validade: '2026-01-15' },
  { id: '10', produto: 'Açúcar Refinado', marca: 'União', unidade: 'Pacote 1kg', validade: '2025-12-31' },
  { id: '11', produto: 'Leite Condensado', marca: 'Moça', unidade: 'Lata 395g', validade: '2025-02-20' },
  { id: '12', produto: 'Creme de Leite UHT', marca: 'Piracanjuba', unidade: 'Caixa 200g', validade: '2024-11-25' },
  { id: '13', produto: 'Iogurte Natural', marca: 'Batavo', unidade: 'Copo 170g', validade: new Date().toISOString().split('T')[0] }, // Today
  { id: '14', produto: 'Queijo Minas Frescal', marca: 'Polenghi', unidade: 'Peça 250g', validade: subDays(new Date(), 1).toISOString().split('T')[0] }, // Yesterday
  { id: '15', produto: 'Suco de Laranja Integral', marca: 'Del Valle', unidade: 'Caixa 1L', validade: addDays(new Date(), 1).toISOString().split('T')[0] }, // Tomorrow
  { id: '16', produto: 'Manteiga com Sal', marca: 'Aviação', unidade: 'Tablete 200g', validade: '2023-01-01' }, // Expired
  { id: '17', produto: 'Requeijão Cremoso', marca: 'Vigor', unidade: 'Copo 200g', validade: addDays(new Date(), 3).toISOString().split('T')[0] }, // Next 7 days
  { id: '18', produto: 'Doce de Leite', marca: 'Itambé', unidade: 'Pote 400g', validade: subDays(new Date(), 5).toISOString().split('T')[0] }, // Last 7 days
];

const normalizeString = (str: string) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

const dateFilterOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'tomorrow', label: 'Amanhã' },
  { value: 'expired', label: 'Vencidos' },
  { value: 'next7', label: 'Próximos 7 dias' },
  { value: 'last7', label: 'Últimos 7 dias' },
  { value: 'next14', label: 'Próximos 14 dias' },
  { value: 'last14', label: 'Últimos 14 dias' },
  { value: 'thisMonth', label: 'Este mês' },
  { value: 'nextMonth', label: 'Próximo mês' },
];

const getRowStyling = (validade: string): string => {
  const productDate = parseISO(validade);
  if (!isValid(productDate)) return '';

  const productDateStartOfDay = startOfDay(productDate);
  const today = startOfDay(new Date());

  if (isPast(productDateStartOfDay) && !isToday(productDateStartOfDay)) {
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200/70 dark:hover:bg-red-800/40 cursor-pointer'; // Expired
  }
  if (isToday(productDateStartOfDay) || isTomorrow(productDateStartOfDay)) {
    return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 hover:bg-orange-200/70 dark:hover:bg-orange-800/40 cursor-pointer'; // Expiring today or tomorrow
  }
  return 'hover:bg-muted/50 cursor-pointer'; // Default hover
};


export function ProductSearchTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [clientSideProducts, setClientSideProducts] = useState<Product[]>(mockProducts);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState<Omit<Product, 'id'>>({
    produto: '',
    marca: '',
    unidade: '',
    validade: '',
  });

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setIsActionDialogOpen(true);
  };

  const handleEdit = () => {
    if (selectedProduct) {
      setEditingProduct(selectedProduct);
      setEditFormData({
        produto: selectedProduct.produto,
        marca: selectedProduct.marca,
        unidade: selectedProduct.unidade,
        validade: selectedProduct.validade,
      });
      setIsEditDialogOpen(true);
      setIsActionDialogOpen(false); 
    }
  };

  const handleDelete = () => {
    if (selectedProduct) {
      console.log('Delete product:', selectedProduct);
      setClientSideProducts(clientSideProducts.filter(p => p.id !== selectedProduct.id));
      setIsActionDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    if (editingProduct) {
      setClientSideProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === editingProduct.id ? { ...editingProduct, ...editFormData } : p
        )
      );
      setIsEditDialogOpen(false);
      setEditingProduct(null);
    }
  };

  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = normalizeString(searchTerm);
    let products = clientSideProducts;

    if (normalizedSearchTerm) {
      products = products.filter(product =>
        normalizeString(product.id).includes(normalizedSearchTerm) ||
        normalizeString(product.produto).includes(normalizedSearchTerm) ||
        normalizeString(product.marca).includes(normalizedSearchTerm) ||
        normalizeString(product.unidade).includes(normalizedSearchTerm) ||
        normalizeString(product.validade).includes(normalizedSearchTerm)
      );
    }

    if (selectedDateFilter === 'all') {
      return products;
    }

    const today = startOfDay(new Date());

    return products.filter(product => {
      const productDate = parseISO(product.validade);
      if (!isValid(productDate)) return false;

      const productDateStartOfDay = startOfDay(productDate);

      switch (selectedDateFilter) {
        case 'today':
          return isToday(productDateStartOfDay);
        case 'yesterday':
          return isYesterday(productDateStartOfDay);
        case 'tomorrow':
          return isTomorrow(productDateStartOfDay);
        case 'expired':
          return isPast(productDateStartOfDay) && !isToday(productDateStartOfDay);
        case 'next7':
          return isWithinInterval(productDateStartOfDay, { start: today, end: endOfDay(addDays(today, 6)) });
        case 'last7':
          return isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(today, 6)), end: endOfDay(today) });
        case 'next14':
          return isWithinInterval(productDateStartOfDay, { start: today, end: endOfDay(addDays(today, 13)) });
        case 'last14':
          return isWithinInterval(productDateStartOfDay, { start: startOfDay(subDays(today, 13)), end: endOfDay(today) });
        case 'thisMonth': {
          const start = startOfMonth(today);
          const end = endOfMonth(today);
          return isWithinInterval(productDateStartOfDay, { start, end });
        }
        case 'nextMonth': {
          const start = startOfMonth(addMonths(today, 1));
          const end = endOfMonth(addMonths(today, 1));
          return isWithinInterval(productDateStartOfDay, { start, end });
        }
        default:
          return true;
      }
    });
  }, [searchTerm, clientSideProducts, selectedDateFilter]);

  return (
    <>
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-headline">Lista de Produtos</CardTitle>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por ID, Produto, Marca, Unidade ou Validade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Select value={selectedDateFilter} onValueChange={setSelectedDateFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filtrar por validade..." />
              </SelectTrigger>
              <SelectContent>
                {dateFilterOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="w-[150px]">Validade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow 
                      key={product.id} 
                      className={getRowStyling(product.validade)}
                      onClick={() => handleRowClick(product)}
                    >
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell>{product.produto}</TableCell>
                      <TableCell>{product.marca}</TableCell>
                      <TableCell>{product.unidade}</TableCell>
                      <TableCell>
                        {isValid(parseISO(product.validade))
                          ? format(parseISO(product.validade), 'dd/MM/yyyy')
                          : 'Data inválida'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhum produto encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedProduct && (
        <AlertDialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ações para: {selectedProduct.produto}</AlertDialogTitle>
              <AlertDialogDescription>
                Escolha uma ação para o produto selecionado.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex justify-around py-4">
              <Button variant="outline" size="lg" onClick={handleEdit} aria-label="Editar Produto">
                <Pencil className="h-5 w-5 mr-2" /> Editar
              </Button>
              <Button variant="destructive" size="lg" onClick={handleDelete} aria-label="Excluir Produto">
                <Trash2 className="h-5 w-5 mr-2" /> Excluir
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedProduct(null)}>Cancelar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {editingProduct && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
          setIsEditDialogOpen(isOpen);
          if (!isOpen) setEditingProduct(null);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Produto: {editingProduct.produto}</DialogTitle>
              <DialogDescription>
                Modifique os detalhes do produto abaixo. Clique em salvar para aplicar as mudanças.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="produto" className="text-right">
                  Produto
                </Label>
                <Input
                  id="produto"
                  name="produto"
                  value={editFormData.produto}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="marca" className="text-right">
                  Marca
                </Label>
                <Input
                  id="marca"
                  name="marca"
                  value={editFormData.marca}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unidade" className="text-right">
                  Unidade
                </Label>
                <Input
                  id="unidade"
                  name="unidade"
                  value={editFormData.unidade}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="validade" className="text-right">
                  Validade
                </Label>
                <Input
                  id="validade"
                  name="validade"
                  type="date"
                  value={editFormData.validade}
                  onChange={handleEditFormChange}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="button" onClick={handleSaveEdit}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

    