import type {LucideProps} from 'lucide-react';
import type {ForwardRefExoticComponent, RefAttributes} from 'react';

export type Category = {
  id: string;
  name: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>
  >;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  expiryDate: Date;
  price: number;
  category: string;
  listId: string;
  // AI fields
  originalId?: string;
  produto?: string;
  marca?: string;
  unidade?: string;
  validade?: string;
  isExploding?: boolean;
};

export type ProductList = {
    id: string;
    name: string;
    userId: string;
    createdAt: any; // Firestore Timestamp
};
