"use client";

import { ProductSearchTable } from '@/components/dashboard/ProductSearchTable';

export default function DashboardPage() {
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8 font-headline text-center px-4 md:px-6">
        Busca de Produtos
      </h1>
      <ProductSearchTable />
    </div>
  );
}
