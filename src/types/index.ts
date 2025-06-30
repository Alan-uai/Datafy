export interface ExtractedProduct {
  produto: string;
  marca: string;
  unidade: string;
  validade: string;
}

export interface Product {
  id: string;
  userId: string;
  listId: string;
  produto: string;
  marca: string;
  unidade: string;
  validade: string;
  createdAt: any;
  updatedAt: any;
  originalId?: string;
  isExploding?: boolean;
}

export interface ProductList {
  id: string;
  userId: string;
  name: string;
  iconName: string;
  createdAt: any;
  updatedAt: any;
}

export interface User {
  id: string;
  email: string;


export interface CustomColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'date' | 'barcode' | 'checkbox' | 'select';
  required?: boolean;
  options?: string[]; // Para select
  defaultValue?: any;
  order: number;
  visible: boolean;
}

export interface TableLayout {
  id: string;
  name: string;
  userId: string;
  isDefault: boolean;
  columns: CustomColumn[];
  createdAt: any;
  updatedAt: any;
}

export interface ExtendedProduct extends Product {
  customFields?: { [key: string]: any };
}

  displayName?: string;
  photoURL?: string;
}