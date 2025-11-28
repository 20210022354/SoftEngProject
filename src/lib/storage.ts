// src/lib/storage.ts
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, addDoc 
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser 
} from 'firebase/auth';
import { db, auth } from "./firebase.ts"; // Adjust path if firebase.ts is in src/
import { Product, StockTransaction, Category, User } from '@/types';
import { toast } from 'sonner';

const STORAGE_KEYS = { USER: 'dtl_user' };

export const StorageService = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // We assume user data is stored in a 'users' collection with the same UID
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

  // --- CATEGORIES ---
  getCategories: async (): Promise<Category[]> => {
    const snapshot = await getDocs(collection(db, 'categories'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
  },

  // --- PRODUCTS ---
  getProducts: async (): Promise<Product[]> => {
    const snapshot = await getDocs(collection(db, 'products'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));
  },

  addProduct: async (product: Product) => {
    // If ID is missing, Firestore can generate one, but if you generate it locally:
    const ref = doc(db, 'products', product.id); 
    await setDoc(ref, product);
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    const ref = doc(db, 'products', id);
    await updateDoc(ref, updates);
  },

  deleteProduct: async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  },

  // --- TRANSACTIONS ---
  getTransactions: async (): Promise<StockTransaction[]> => {
    const snapshot = await getDocs(collection(db, 'transactions'));
    const txs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StockTransaction));
    // Sort by date descending
    return txs.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  },

  addTransaction: async (transaction: StockTransaction) => {
    // We use setDoc because you likely generate the ID in the UI, 
    // or you can use addDoc(collection(db, 'transactions'), transaction)
    await setDoc(doc(db, 'transactions', transaction.id), transaction);
  },

  updateTransaction: async (id: string, updates: Partial<StockTransaction>) => {
    await updateDoc(doc(db, 'transactions', id), updates);
  },

  deleteTransaction: async (id: string) => {
    await deleteDoc(doc(db, 'transactions', id));
  }
};