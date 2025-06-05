
export interface Product {
  id: string; // This will be the display ID, can be re-sequenced
  originalId?: string; // This will be the stable, unique key for React/Framer Motion
  produto: string;
  marca: string;
  unidade: string;
  validade: string;
  isExploding?: boolean;
}

