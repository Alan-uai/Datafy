import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  getDoc 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TableLayout, CustomColumn } from '@/types';

export const getTableLayouts = async (userId: string): Promise<TableLayout[]> => {
  const q = query(
    collection(db, 'tableLayouts'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as TableLayout));
};

export const getDefaultTableLayout = async (userId: string): Promise<TableLayout | null> => {
  const q = query(
    collection(db, 'tableLayouts'),
    where('userId', '==', userId),
    where('isDefault', '==', true)
  );

  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as TableLayout;
};

export const createTableLayout = async (
  userId: string, 
  name: string, 
  columns: CustomColumn[], 
  isDefault: boolean = false
): Promise<string> => {
  const layoutData = {
    name,
    userId,
    isDefault,
    columns,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  if (isDefault) {
    // Remove default flag from other layouts
    const existingLayouts = await getTableLayouts(userId);
    const updatePromises = existingLayouts
      .filter(layout => layout.isDefault)
      .map(layout => 
        updateDoc(doc(db, 'tableLayouts', layout.id), { isDefault: false })
      );
    await Promise.all(updatePromises);
  }

  const docRef = await addDoc(collection(db, 'tableLayouts'), layoutData);
  return docRef.id;
};

export const updateTableLayout = async (
  layoutId: string, 
  updates: Partial<TableLayout>
): Promise<void> => {
  const layoutRef = doc(db, 'tableLayouts', layoutId);
  await updateDoc(layoutRef, {
    ...updates,
    updatedAt: new Date()
  });
};

export const deleteTableLayout = async (layoutId: string): Promise<void> => {
  await deleteDoc(doc(db, 'tableLayouts', layoutId));
};

export const setDefaultLayout = async (userId: string, layoutId: string): Promise<void> => {
  // Remove default flag from all layouts
  const existingLayouts = await getTableLayouts(userId);
  const updatePromises = existingLayouts.map(layout => 
    updateDoc(doc(db, 'tableLayouts', layout.id), { isDefault: false })
  );
  await Promise.all(updatePromises);

  // Set new default
  await updateDoc(doc(db, 'tableLayouts', layoutId), { isDefault: true });
};

export const getDefaultColumns = (): CustomColumn[] => [
  { id: 'name', name: 'Produto', type: 'text', order: 0, visible: true },
  { id: 'brand', name: 'Marca', type: 'text', order: 1, visible: true },
  { id: 'quantity', name: 'Quantidade', type: 'number', order: 2, visible: true },
  { id: 'unit', name: 'Unidade', type: 'text', order: 3, visible: true },
  { id: 'expiryDate', name: 'Vencimento', type: 'date', order: 4, visible: true },
  { id: 'barcode', name: 'Código de Barras', type: 'barcode', order: 5, visible: false },
  { id: 'category', name: 'Categoria', type: 'text', order: 6, visible: false },
  { id: 'location', name: 'Localização', type: 'text', order: 7, visible: false },
  { id: 'price', name: 'Preço', type: 'currency', order: 8, visible: false },
];

// Alias for the function used in dashboard
export { getDefaultTableLayout } from './tableLayoutService';