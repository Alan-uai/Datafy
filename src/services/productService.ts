
import { db } from '@/lib/firebase';
import type { Product, ProductList } from '@/types';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  Timestamp,
  orderBy,
  getDoc,
} from 'firebase/firestore';

const PRODUCTS_COLLECTION = 'products';
const PRODUCT_LISTS_COLLECTION = 'productLists';

interface ProductDocumentData extends Omit<Product, 'id' | 'originalId' | 'validade' | 'isExploding' | 'listId'> {
  userId: string;
  listId: string;
  validade: Timestamp | string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface ProductListDocumentData extends Omit<ProductList, 'id' | 'createdAt'> {
  userId: string;
  name: string;
  icon: string;
  createdAt: Timestamp;
}

const formatTimestampToDateString = (timestamp?: Timestamp | string | Date): string => {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') return timestamp.split('T')[0]; // Assuming ISO string
  if (timestamp instanceof Date) return timestamp.toISOString().split('T')[0];
  if (timestamp instanceof Timestamp) return timestamp.toDate().toISOString().split('T')[0];
  return '';
};

const parseDateStringToTimestamp = (dateString: string): Timestamp | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
};

// ProductList Service Functions
export const getProductLists = async (userId: string): Promise<ProductList[]> => {
  if (!userId) {
    console.error("User ID is required to fetch product lists.");
    return [];
  }
  try {
    const listsRef = collection(db, PRODUCT_LISTS_COLLECTION);
    const q = query(listsRef, where('userId', '==', userId), orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    const lists: ProductList[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as ProductListDocumentData;
      lists.push({
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt.toDate().toISOString(), // Convert to ISO string for consistency
      });
    });
    return lists;
  } catch (error) {
    console.error("Error fetching product lists:", error);
    throw error;
  }
};

export const addProductList = async (userId: string, listData: { name: string; icon: string }): Promise<ProductList> => {
  if (!userId) {
    throw new Error("User ID is required to add a product list.");
  }
  try {
    const docData: ProductListDocumentData = {
      ...listData,
      userId,
      createdAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, PRODUCT_LISTS_COLLECTION), docData);
    return {
      id: docRef.id,
      userId,
      name: listData.name,
      icon: listData.icon,
      createdAt: (docData.createdAt as Timestamp).toDate().toISOString(),
    };
  } catch (error) {
    console.error("Error adding product list:", error);
    throw error;
  }
};

export const updateProductListName = async (userId: string, listId: string, name: string): Promise<void> => {
  if (!userId || !listId) {
    throw new Error("User ID and List ID are required to update list name.");
  }
  try {
    const listRef = doc(db, PRODUCT_LISTS_COLLECTION, listId);
    // Optional: Check ownership
    await updateDoc(listRef, { name });
  } catch (error) {
    console.error("Error updating product list name:", error);
    throw error;
  }
};

export const deleteProductList = async (userId: string, listId: string): Promise<void> => {
  if (!userId || !listId) {
    throw new Error("User ID and List ID are required to delete a list.");
  }
  try {
    const batch = writeBatch(db);
    const listRef = doc(db, PRODUCT_LISTS_COLLECTION, listId);
    batch.delete(listRef);

    // Delete all products associated with this list
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('userId', '==', userId), where('listId', '==', listId));
    const productsSnapshot = await getDocs(q);
    productsSnapshot.forEach((productDoc) => {
      batch.delete(productDoc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error("Error deleting product list and its products:", error);
    throw error;
  }
};


// Product Service Functions (modified for listId)
export const getProducts = async (userId: string, listId: string): Promise<Product[]> => {
  if (!userId) {
    console.error("User ID is required to fetch products.");
    return [];
  }
  if (!listId) {
    console.error("List ID is required to fetch products.");
    return [];
  }
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('userId', '==', userId), where('listId', '==', listId));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as ProductDocumentData;
      products.push({
        ...data,
        id: docSnap.id,
        originalId: docSnap.id,
        validade: formatTimestampToDateString(data.validade),
        listId: data.listId,
        isExploding: false,
      });
    });
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const addProduct = async (userId: string, listId: string, productData: Omit<Product, 'id' | 'originalId' | 'isExploding' | 'listId'>): Promise<Product> => {
  if (!userId || !listId) {
    throw new Error("User ID and List ID are required to add a product.");
  }
  try {
    const validadeTimestamp = parseDateStringToTimestamp(productData.validade);
    if (!validadeTimestamp && productData.validade) {
        throw new Error("Invalid date format for 'validade'. Please use YYYY-MM-DD.");
    }

    const docData: ProductDocumentData = {
      ...productData,
      userId,
      listId,
      validade: validadeTimestamp || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), docData);
    return {
      ...productData,
      id: docRef.id,
      originalId: docRef.id,
      listId,
      isExploding: false,
    };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (userId: string, productId: string, productData: Omit<Product, 'id' | 'originalId' | 'isExploding' | 'listId'>): Promise<void> => {
  if (!userId || !productId) {
    throw new Error("User ID and Product ID are required to update a product.");
  }
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists() || productSnap.data()?.userId !== userId) {
        throw new Error("Product not found or access denied.");
    }
    
    const validadeTimestamp = parseDateStringToTimestamp(productData.validade);
     if (!validadeTimestamp && productData.validade) {
        throw new Error("Invalid date format for 'validade'. Please use YYYY-MM-DD.");
    }

    const updateData: Partial<ProductDocumentData> = {
      ...productData,
      validade: validadeTimestamp || '',
      updatedAt: Timestamp.now(),
    };
    // listId should not change during an update of product details
    // It's part of its identity of belonging to a list
    // If you need to move a product to another list, it's a different operation (delete and add, or a specific "move" function)

    await updateDoc(productRef, updateData);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (userId: string, productId: string): Promise<void> => {
   if (!userId || !productId) {
    throw new Error("User ID and Product ID are required to delete a product.");
  }
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists() || productSnap.data()?.userId !== userId) {
        throw new Error("Product not found or access denied.");
    }
    await deleteDoc(productRef);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

export const deleteMultipleProducts = async (userId: string, productIds: string[]): Promise<void> => {
  if (!userId) {
    throw new Error("User ID is required to delete products.");
  }
  if (!productIds || productIds.length === 0) {
    console.warn("No product IDs provided for deletion.");
    return;
  }
  try {
    const batch = writeBatch(db);
    // It's good practice to verify ownership for each product before batch deleting,
    // but this can be slow. Firestore rules should be the primary enforcer.
    // For simplicity here, we assume IDs are valid and belong to user.
    productIds.forEach((id) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      // TODO: Add an ownership check here in a real app if rules aren't tight enough
      // or if you want to provide specific feedback for each item.
      batch.delete(productRef);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error deleting multiple products:", error);
    throw error;
  }
};
