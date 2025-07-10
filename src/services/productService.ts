
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, ProductList } from '@/lib/types';
import { products as initialProducts } from '@/lib/data'; // for seeding

// ====== ProductList Functions ======

export const getProductLists = async (userId: string): Promise<ProductList[]> => {
  const listsQuery = query(collection(db, 'productLists'), where('userId', '==', userId));
  const querySnapshot = await getDocs(listsQuery);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductList));
};

export const addProductList = async (userId: string, name: string): Promise<string> => {
  const newListRef = await addDoc(collection(db, 'productLists'), {
    userId,
    name,
    createdAt: serverTimestamp(),
  });
  return newListRef.id;
};

// ====== Product Functions ======

const parseProductDoc = (doc: any): Product => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        // Firebase timestamps need to be converted to JS Date objects
        expiryDate: data.expiryDate?.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate),
    } as Product;
}

export const getProductsByList = async (userId: string, listId: string): Promise<Product[]> => {
  // If listId is default, use local data
  if (listId === 'default') {
    return initialProducts.map(p => ({ ...p, listId: 'default' }));
  }
  const productsQuery = query(
    collection(db, 'products'),
    where('userId', '==', userId),
    where('listId', '==', listId)
  );
  const querySnapshot = await getDocs(productsQuery);
  return querySnapshot.docs.map(parseProductDoc);
};

export const getProductsByUser = async (userId: string): Promise<Product[]> => {
  // This could be heavy, use with caution. Consider pagination for real apps.
  const productsQuery = query(
    collection(db, 'products'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(productsQuery);
  return querySnapshot.docs.map(parseProductDoc);
}


export const addProduct = async (userId: string, listId: string, productData: Omit<Product, 'id' | 'listId'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'products'), {
    userId,
    listId,
    ...productData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateProduct = async (productId: string, updates: Partial<Product>): Promise<void> => {
  const productRef = doc(db, 'products', productId);
  await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp()
  });
};

export const deleteProduct = async (productId: string): Promise<void> => {
  const productRef = doc(db, 'products', productId);
  await deleteDoc(productRef);
};
