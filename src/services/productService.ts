
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

interface ProductListDocumentData {
  userId: string;
  name: string;
  icon: string;
  createdAt: Timestamp;
}

const formatTimestampToDateString = (timestamp?: Timestamp | string | Date): string => {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') return timestamp.split('T')[0]; 
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

export const getProductLists = async (userId: string): Promise<ProductList[]> => {
  if (!userId) {
    console.error("getProductLists: User ID is required to fetch product lists.");
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
        id: docSnap.id,
        userId: data.userId,
        name: data.name,
        icon: data.icon,
        createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
      });
    });
    return lists;
  } catch (error) {
    console.error("Error fetching product lists for userId:", userId, error);
    throw error;
  }
};

export const addProductList = async (userId: string, listData: { name: string; icon: string }): Promise<ProductList> => {
  if (!userId) {
    console.error("addProductList: User ID is required to add a product list.");
    throw new Error("User ID is required to add a product list.");
  }
  try {
    const docData: ProductListDocumentData = {
      name: listData.name,
      icon: listData.icon,
      userId: userId,
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
    console.error("Error adding product list for userId:", userId, error);
    throw error;
  }
};

export const updateProductListName = async (userId: string, listId: string, name: string): Promise<void> => {
  if (!userId || !listId) {
    throw new Error("User ID and List ID are required to update list name.");
  }
  try {
    const listRef = doc(db, PRODUCT_LISTS_COLLECTION, listId);
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
    // TODO: Add ownership check for each product if critical, though rules should cover.
    productIds.forEach((id) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      batch.delete(productRef);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error deleting multiple products:", error);
    throw error;
  }
};

export const moveProductsToList = async (userId: string, productOriginalIds: string[], targetListId: string): Promise<void> => {
  if (!userId || !targetListId) {
    throw new Error("User ID and Target List ID are required.");
  }
  if (!productOriginalIds || productOriginalIds.length === 0) {
    console.warn("No product IDs provided for moving.");
    return;
  }
  try {
    const batch = writeBatch(db);
    for (const productId of productOriginalIds) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      // Optional: Fetch product to verify ownership (userId) before adding to batch
      // const productSnap = await getDoc(productRef);
      // if (productSnap.exists() && productSnap.data()?.userId === userId) {
      //   batch.update(productRef, { listId: targetListId, updatedAt: Timestamp.now() });
      // } else {
      //   console.warn(`Product ${productId} not found or user ${userId} does not have permission to move it.`);
      // }
      // Assuming Firestore rules will handle ownership.
      batch.update(productRef, { listId: targetListId, updatedAt: Timestamp.now() });
    }
    await batch.commit();
  } catch (error) {
    console.error("Error moving products to another list:", error);
    throw error;
  }
};

export const updateMultipleProductExpirations = async (userId: string, productOriginalIds: string[], newExpiryDate: string): Promise<void> => {
  if (!userId || !newExpiryDate) {
    throw new Error("User ID and New Expiry Date are required.");
  }
  if (!productOriginalIds || productOriginalIds.length === 0) {
    console.warn("No product IDs provided for updating expiration.");
    return;
  }

  const validadeTimestamp = parseDateStringToTimestamp(newExpiryDate);
  if (!validadeTimestamp) {
    throw new Error("Invalid date format for 'newExpiryDate'. Please use YYYY-MM-DD.");
  }

  try {
    const batch = writeBatch(db);
    for (const productId of productOriginalIds) {
      const productRef = doc(db, PRODUCTS_COLLECTION, productId);
      // Assuming Firestore rules will handle ownership.
      batch.update(productRef, { validade: validadeTimestamp, updatedAt: Timestamp.now() });
    }
    await batch.commit();
  } catch (error) {
    console.error("Error updating multiple product expirations:", error);
    throw error;
  }
};

