import type { Product, Category } from './types';
import { Beer, Refrigerator, Snowflake, Weight } from 'lucide-react';

export const categories: Category[] = [
  { id: 'bebidas', name: 'Bebidas', icon: Beer },
  { id: 'geladeira', name: 'Geladeira', icon: Refrigerator },
  { id: 'congelados', name: 'Congelados', icon: Snowflake },
  { id: 'pesado', name: 'Pesado', icon: Weight },
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Leite Integral',
    brand: 'Leitissimo',
    quantity: 2,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 5)),
    price: 4.50,
    category: 'geladeira',
  },
  {
    id: '2',
    name: 'Pão de Forma',
    brand: 'Pão Bão',
    quantity: 1,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 2)),
    price: 7.00,
    category: 'geladeira',
  },
  {
    id: '3',
    name: 'Maçã Fuji',
    brand: 'Hortifruti',
    quantity: 5,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 10)),
    price: 1.20,
    category: 'geladeira',
  },
  {
    id: '4',
    name: 'Suco de Laranja',
    brand: 'Sucão',
    quantity: 1,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 20)),
    price: 8.99,
    category: 'bebidas',
  },
  {
    id: '5',
    name: 'Pizza Congelada',
    brand: 'Pizza Já',
    quantity: 1,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 90)),
    price: 25.00,
    category: 'congelados',
  },
  {
    id: '6',
    name: 'Cerveja Pilsen',
    brand: 'Cevada Pura',
    quantity: 6,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 150)),
    price: 3.50,
    category: 'bebidas',
  },
  {
    id: '101',
    name: 'Arroz',
    brand: 'Pileco',
    quantity: 78,
    expiryDate: new Date('2025-07-27T00:00:00'),
    price: 24.90,
    category: 'pesado',
  },
];
