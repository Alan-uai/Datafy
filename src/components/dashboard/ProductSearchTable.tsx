"use client";

import type { Product } from '@/types';
import { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

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
];

// Helper function to normalize strings (remove accents and convert to lowercase)
const normalizeString = (str: string) => {
  return str
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase(); // Convert to lowercase
};

export function ProductSearchTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSideProducts, setClientSideProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Simulate fetching or loading data on mount for client-side hydration consistency
    setClientSideProducts(mockProducts);
  }, []);


  const filteredProducts = useMemo(() => {
    const normalizedSearchTerm = normalizeString(searchTerm);
    if (!normalizedSearchTerm) {
      return clientSideProducts;
    }
    return clientSideProducts.filter(product =>
      normalizeString(product.id).includes(normalizedSearchTerm) ||
      normalizeString(product.produto).includes(normalizedSearchTerm) ||
      normalizeString(product.marca).includes(normalizedSearchTerm) ||
      normalizeString(product.unidade).includes(normalizedSearchTerm) ||
      normalizeString(product.validade).includes(normalizedSearchTerm)
    );
  }, [searchTerm, clientSideProducts]);

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl font-headline">Lista de Produtos</CardTitle>
         <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por ID, Produto, Marca, Unidade ou Validade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
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
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.id}</TableCell>
                    <TableCell>{product.produto}</TableCell>
                    <TableCell>{product.marca}</TableCell>
                    <TableCell>{product.unidade}</TableCell>
                    <TableCell>{new Date(product.validade + 'T00:00:00').toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
