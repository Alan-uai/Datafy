import React from 'react';
import { PackageSearch, PlusCircle } from 'lucide-react'; // Import PlusCircle
import { Button } from '@/components/ui/button';

export const NoListSelectedMessage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-[calc(100vh-var(--header-height,4rem)-var(--list-tabs-height,5rem)-10rem)] text-center p-4">
    <PackageSearch className="h-16 w-16 text-primary/70 mb-4" />
    <h3 className="text-xl font-semibold mb-2 text-foreground">Nenhuma lista selecionada</h3>
    <p className="text-muted-foreground mb-6 max-w-md">
      Por favor, crie ou selecione uma lista acima para começar a organizar seus produtos.
    </p>
    <Button >
      <PlusCircle className="mr-2 h-4 w-4" />
      Criar Nova Lista
    </Button>
  </div>
);
