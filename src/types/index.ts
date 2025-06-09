
import type { Timestamp } from 'firebase/firestore';

export interface ProductList {
  id: string; // Firestore document ID
  userId: string;
  name: string;
  icon: string; // lucide-react icon name
  createdAt: Timestamp | Date | string; // Allow for Firestore Timestamp, Date object, or ISO string
}

export interface Product {
  id: string; // This will be the display ID, can be re-sequenced
  originalId?: string; // This will be the stable, unique key for React/Framer Motion
  listId: string; // ID of the ProductList it belongs to
  produto: string;
  marca: string;
  unidade: string;
  validade: string;
  isExploding?: boolean;
}
