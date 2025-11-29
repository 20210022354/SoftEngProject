import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  query,       // ✅ Added
  where,       // ✅ Added
  writeBatch   // ✅ Added
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, signOut 
} from 'firebase/auth';
import { db, auth } from "./firebase"; 
import { Product, StockTransaction, Category, User } from '@/types';

const STORAGE_KEYS = { USER: 'dtl_user' };

// --- INTERFACES ---

export interface ReportHistory {
  id: string;
  title: string;
  generatedDate: string;
  generatedBy: string;
  recordCount: number;
  status: string;
  data: any[];
}

export interface ProductHistory {
  id: string;
  action: 'ADDED' | 'EDITED' | 'DELETED';
  type: 'Product' | 'Category';
  name: string;
  details: string;
  timestamp: string;
  user: string;
  previousData?: any;
  newData?: any;
}

export const StorageService = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;
        StorageService.setCurrentUser(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Login failed", error);
      return null;
    }
  },

  logout: async () => {
    await signOut(auth);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // --- PRODUCT HISTORY LOGGING ---
  getProductHistory: async (): Promise<ProductHistory[]> => {
    const snapshot = await getDocs(collection(db, 'product_history'));
    const history = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProductHistory));
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  logProductAction: async (
    action: 'ADDED' | 'EDITED' | 'DELETED', 
    type: 'Product' | 'Category', 
    name: string, 
    details: string,
    previousData?: any,
    newData?: any
  ) => {
    try {
      const user = StorageService.getCurrentUser();
      const newLog: ProductHistory = {
        id: Date.now().toString(),
        action,
        type,
        name,
        details,
        timestamp: new Date().toISOString(),
        user: user?.fullName || 'Unknown User',
        previousData: previousData || null,
        newData: newData || null
      };
      await setDoc(doc(db, 'product_history', newLog.id), newLog);
    } catch (error) {
      console.error("Failed to log product history", error);
    }
  },

  // --- CATEGORIES ---
  getCategories: async (): Promise<Category[]> => {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
  },

  addCategory: async (category: Category) => {
    await setDoc(doc(db, 'categories', category.id), category);
    await StorageService.logProductAction('ADDED', 'Category', category.name, 'New category created', null, category);
  },

  deleteCategory: async (id: string) => {
    console.log(`Attempting to delete category with ID: ${id}`);
    try {
      const docRef = doc(db, 'categories', id);
      const catDoc = await getDoc(docRef);
      
      if (!catDoc.exists()) {
        console.error("❌ Document does not exist in Firestore!");
        throw new Error("Category not found in database");
      }

      const catData = catDoc.data() as Category;
      await deleteDoc(docRef);

      if (catData) {
        await StorageService.logProductAction('DELETED', 'Category', catData.name, 'Category removed', catData, null);
      }
    } catch (error: any) {
      console.error("🔥 DELETE FAILED:", error);
      throw error;
    }
  },
  
  updateCategory: async (id: string, updates: Partial<Category>) => {
    const catRef = doc(db, 'categories', id);
    const oldDoc = await getDoc(catRef);
    const oldData = oldDoc.data();

    // 1. Update the Category itself
    await updateDoc(catRef, updates);

    // 2. Cascade Update: If name changed, update all products with this category
    if (updates.name && oldData && updates.name !== oldData.name) {
      try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, where("categoryId", "==", id));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { categoryName: updates.name });
          });
          await batch.commit();
          console.log(`Updated category name for ${querySnapshot.size} products.`);
        }
      } catch (err) {
        console.error("Failed to cascade update category name to products", err);
      }
    }

    if (oldData) {
      await StorageService.logProductAction('EDITED', 'Category', oldData.name || 'Category', 'Updated details', oldData, { ...oldData, ...updates });
    }
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const snapshot = await getDocs(collection(db, 'products'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  },

  addProduct: async (product: Product) => {
    // Fetch category name if not provided (safety check)
    let finalProduct = { ...product };
    if (!finalProduct.categoryName) {
        const catDoc = await getDoc(doc(db, 'categories', product.categoryId));
        if (catDoc.exists()) {
            finalProduct.categoryName = catDoc.data().name;
        }
    }

    const ref = doc(db, 'products', product.id); 
    await setDoc(ref, finalProduct);
    await StorageService.logProductAction('ADDED', 'Product', finalProduct.name, `Added with ${finalProduct.quantity} ${finalProduct.unit}`, null, finalProduct);
  },

  updateProduct: async (id: string, updates: Partial<Product>, skipLog: boolean = false) => {
    const ref = doc(db, 'products', id);
    const oldDoc = await getDoc(ref);
    const oldData = oldDoc.data() as Product;

    await updateDoc(ref, updates);

    if (oldData && !skipLog) {
      await StorageService.logProductAction('EDITED', 'Product', oldData.name, 'Product updated', oldData, { ...oldData, ...updates });
    }
  },

  deleteProduct: async (id: string) => {
    const ref = doc(db, 'products', id);
    const oldDoc = await getDoc(ref);
    const oldData = oldDoc.data() as Product;

    await deleteDoc(ref);

    if (oldData) {
      await StorageService.logProductAction('DELETED', 'Product', oldData.name, `SKU: ${oldData.sku}`, oldData, null);
    }
  },

  // --- TRANSACTIONS ---
  getTransactions: async (): Promise<StockTransaction[]> => {
    const snapshot = await getDocs(collection(db, 'transactions'));
    const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StockTransaction));
    return txs.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  },

  addTransaction: async (transaction: StockTransaction) => {
    await setDoc(doc(db, 'transactions', transaction.id), transaction);
  },

  updateTransaction: async (id: string, updates: Partial<StockTransaction>) => {
    await updateDoc(doc(db, 'transactions', id), updates);
  },

  deleteTransaction: async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  },

  // --- REPORT HISTORY ---
  getReportHistory: async (): Promise<ReportHistory[]> => {
    const snapshot = await getDocs(collection(db, 'report_history'));
    const reports = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ReportHistory));
    return reports.sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime());
  },

  addReportHistory: async (report: ReportHistory) => {
    await setDoc(doc(db, 'report_history', report.id), report);
  }
};