
import { db } from '@/lib/firebase';
import type { Product } from '@/types';
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
} from 'firebase/firestore';

const PRODUCTS_COLLECTION = 'products';

interface ProductDocumentData extends Omit<Product, 'id' | 'originalId' | 'validade' | 'isExploding'> {
  userId: string;
  validade: Timestamp | string; // Store as Timestamp or ISO string for querying
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Helper to convert Firestore Timestamp to ISO date string for the input field
const formatTimestampToDateString = (timestamp?: Timestamp | string): string => {
  if (!timestamp) return '';
  if (typeof timestamp === 'string') return timestamp; // Already a string
  return timestamp.toDate().toISOString().split('T')[0];
};

// Helper to convert ISO date string from input to Firestore Timestamp
const parseDateStringToTimestamp = (dateString: string): Timestamp | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return Timestamp.fromDate(date);
};


export const getProducts = async (userId: string): Promise<Product[]> => {
  if (!userId) {
    console.error("User ID is required to fetch products.");
    return [];
  }
  try {
    const productsRef = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const products: Product[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data() as ProductDocumentData;
      products.push({
        ...data,
        id: docSnap.id, // Use Firestore doc ID as display ID initially
        originalId: docSnap.id, // Firestore doc ID is the true original ID
        validade: formatTimestampToDateString(data.validade),
        isExploding: false,
      });
    });
    // console.log(`Fetched ${products.length} products for user ${userId}`);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

export const addProduct = async (userId: string, productData: Omit<Product, 'id' | 'originalId' | 'isExploding'>): Promise<Product> => {
  if (!userId) {
    throw new Error("User ID is required to add a product.");
  }
  try {
    const validadeTimestamp = parseDateStringToTimestamp(productData.validade);
    if (!validadeTimestamp && productData.validade) {
        throw new Error("Invalid date format for 'validade'. Please use YYYY-MM-DD.");
    }

    const docData: ProductDocumentData = {
      ...productData,
      userId,
      validade: validadeTimestamp || '', // Store as Timestamp or empty string if invalid/not provided
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), docData);
    // console.log(`Product added with ID: ${docRef.id} for user ${userId}`);
    return {
      ...productData,
      id: docRef.id,
      originalId: docRef.id,
      isExploding: false,
    };
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

export const updateProduct = async (userId: string, productId: string, productData: Omit<Product, 'id' | 'originalId' | 'isExploding'>): Promise<void> => {
  if (!userId) {
    throw new Error("User ID is required to update a product.");
  }
  if (!productId) {
    throw new Error("Product ID is required to update a product.");
  }
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    // Ensure the product belongs to the user before updating (optional, rules should enforce this)
    // const docSnap = await getDoc(productRef);
    // if (!docSnap.exists() || docSnap.data().userId !== userId) {
    //   throw new Error("Product not found or access denied.");
    // }
    
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
    // console.log(`Product ${productId} updated for user ${userId}`);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

export const deleteProduct = async (userId: string, productId: string): Promise<void> => {
   if (!userId) {
    throw new Error("User ID is required to delete a product.");
  }
  if (!productId) {
    throw new Error("Product ID is required to delete a product.");
  }
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    // Optional: Check ownership before deleting, though Firestore rules are better for this.
    await deleteDoc(productRef);
    // console.log(`Product ${productId} deleted for user ${userId}`);
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
    productIds.forEach((id) => {
      const productRef = doc(db, PRODUCTS_COLLECTION, id);
      batch.delete(productRef);
    });
    await batch.commit();
    // console.log(`${productIds.length} products deleted for user ${userId}`);
  } catch (error) {
    console.error("Error deleting multiple products:", error);
    throw error;
  }
};
