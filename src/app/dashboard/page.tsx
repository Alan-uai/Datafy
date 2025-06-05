"use client";

import { ProductSearchTable } from '@/components/dashboard/ProductSearchTable';

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-8 font-headline text-center">
        Busca de Produtos
      </h1>
      <ProductSearchTable />
    </div>
  );
}
