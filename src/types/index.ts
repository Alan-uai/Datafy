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
  displayName?: string;
  photoURL?: string;
}