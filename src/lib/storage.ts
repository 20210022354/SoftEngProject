import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc 
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

// ✅ ADDED: Product History Interface for the Products Tab
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

  // --- PRODUCT HISTORY LOGGING (Firebase Implementation) ---
  
  // 1. Get History List
  getProductHistory: async (): Promise<ProductHistory[]> => {
    const snapshot = await getDocs(collection(db, 'product_history'));
    const history = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProductHistory));
    // Sort newest first
    return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  // 2. Log an Action (Internal Helper)
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
        previousData: previousData || null, // Firebase doesn't like undefined
        newData: newData || null
      };
      
      // Save to 'product_history' collection
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
    // ✅ Log Action
    await StorageService.logProductAction('ADDED', 'Category', category.name, 'New category created', null, category);
  },

  deleteCategory: async (id: string) => {
    console.log(`Attempting to delete category with ID: ${id}`);
    
    try {
      // 1. Check if it exists first
      const docRef = doc(db, 'categories', id);
      const catDoc = await getDoc(docRef);
      
      if (!catDoc.exists()) {
        console.error("❌ Document does not exist in Firestore!");
        throw new Error("Category not found in database");
      }

      const catData = catDoc.data() as Category;
      console.log("Found category:", catData);

      // 2. Perform Delete
      await deleteDoc(docRef);
      console.log("✅ Successfully deleted from Firestore");

      // 3. Log Action
      if (catData) {
        await StorageService.logProductAction('DELETED', 'Category', catData.name, 'Category removed', catData, null);
      }
    } catch (error: any) {
      console.error("🔥 DELETE FAILED:", error);
      // Check for permission error
      if (error.code === 'permission-denied') {
        alert("Permission Denied: Check your Firestore Security Rules in the Firebase Console.");
      }
      throw error; // Re-throw so the UI knows it failed
    }
  },
  
    updateCategory: async (id: string, updates: Partial<Category>) => {
    const catRef = doc(db, 'categories', id);
    const oldDoc = await getDoc(catRef);
    const oldData = oldDoc.data();

    await updateDoc(catRef, updates);

    // ✅ Log Action
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
    const ref = doc(db, 'products', product.id); 
    await setDoc(ref, product);
    // ✅ Log Action
    await StorageService.logProductAction('ADDED', 'Product', product.name, `Added with ${product.quantity} ${product.unit}`, null, product);
  },

  updateProduct: async (id: string, updates: Partial<Product>, skipLog: boolean = false) => {
    const ref = doc(db, 'products', id);
    const oldDoc = await getDoc(ref);
    const oldData = oldDoc.data() as Product;

    await updateDoc(ref, updates);

    // ✅ Log Action (unless skipped, e.g. during transactions)
    if (oldData && !skipLog) {
      await StorageService.logProductAction('EDITED', 'Product', oldData.name, 'Product updated', oldData, { ...oldData, ...updates });
    }
  },

  deleteProduct: async (id: string) => {
    const ref = doc(db, 'products', id);
    const oldDoc = await getDoc(ref);
    const oldData = oldDoc.data() as Product;

    await deleteDoc(ref);

    // ✅ Log Action
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