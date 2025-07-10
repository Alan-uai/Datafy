import { collection, query, where, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product, ProductList } from '@/lib/types';
import type { User } from 'firebase/auth';

// ====== ProductList Functions ======

export const getProductLists = async (userId: string): Promise<ProductList[]> => {
  try {
    const listsQuery = query(collection(db, 'productLists'), where('userId', '==', userId));
    const querySnapshot = await getDocs(listsQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductList));
  } catch (error) {
    console.error("Error fetching product lists:", error);
    return [];
  }
};

export const addProductList = async (userId: string, name: string, icon?: string): Promise<string> => {
  const newListRef = await addDoc(collection(db, 'productLists'), {
    userId,
    name,
    icon: icon || 'List',
    createdAt: serverTimestamp(),
  });
  return newListRef.id;
};

export const updateProductList = async (listId: string, updates: Partial<ProductList>): Promise<void> => {
    const listRef = doc(db, 'productLists', listId);
    await updateDoc(listRef, {
        ...updates,
        updatedAt: serverTimestamp()
    });
};

export const deleteProductList = async (user: User, listId: string): Promise<void> => {
    const batch = writeBatch(db);

    // 1. Delete the list itself
    const listRef = doc(db, 'productLists', listId);
    batch.delete(listRef);

    // 2. Find and delete all products in that list
    const productsQuery = query(collection(db, 'products'), where('userId', '==', user.uid), where('listId', '==', listId));
    const productsSnapshot = await getDocs(productsQuery);
    productsSnapshot.forEach(productDoc => {
        batch.delete(productDoc.ref);
    });

    // 3. Update user preferences if this was the last active list
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data().preferences?.lastActiveListId === listId) {
       batch.update(userRef, { "preferences.lastActiveListId": "" });
    }
    
    // Commit the batch
    await batch.commit();
};


// ====== Product Functions ======

const parseProductDoc = (doc: any): Product => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        expiryDate: data.expiryDate?.toDate ? data.expiryDate.toDate() : new Date(data.expiryDate || new Date()),
    } as Product;
}

export const getProductsByList = async (userId: string, listId: string): Promise<Product[]> => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', userId),
      where('listId', '==', listId)
    );
    const querySnapshot = await getDocs(productsQuery);
    return querySnapshot.docs.map(parseProductDoc);
  } catch (error) {
    console.error(`Error fetching products for list ${listId}:`, error);
    return [];
  }
};

export const getProductsByUser = async (userId: string): Promise<Product[]> => {
  try {
    const productsQuery = query(
      collection(db, 'products'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(productsQuery);
    return querySnapshot.docs.map(parseProductDoc);
  } catch (error) {
     console.error(`Error fetching products for user ${userId}:`, error);
     return [];
  }
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

    