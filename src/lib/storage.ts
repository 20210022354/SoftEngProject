// src/lib/storage.ts

// I've added StockTransaction back
import { Product, StockTransaction, Category, User } from '@/types';
import { toast } from 'sonner';

// --- FIREBASE IMPORTS ---
import { db, auth } from "./firebase.ts";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  writeBatch, // Added 'writeBatch' back
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

// This is the only STORAGE_KEYS object
const STORAGE_KEYS = {
  USER: 'dtl_user',
};

export const StorageService = {
  // --- AUTH (FIREBASE) ---
  login: async (email: string, password: string): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const user = userDoc.data() as User;
        StorageService.setCurrentUser(user);
        return user;
      } else {
        toast.error('User profile not found.');
        return null;
      }
    } catch (error: any) {
      console.error('Firebase login error:', error);
      toast.error('Invalid credentials.');
      return null;
    }
  },

  logout: async () => {
    await signOut(auth);
    StorageService.setCurrentUser(null);
  },

  onAuthChange: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const user = userDoc.data() as User;
          StorageService.setCurrentUser(user);
          callback(user);
        } else {
          callback(null);
        }
      } else {
        StorageService.setCurrentUser(null);
        callback(null);
      }
    });
  },

  // --- USER SESSION (LocalStorage) ---
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  // --- CATEGORIES (FIRESTORE) ---
  getCategories: async (): Promise<Category[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        categories.push(doc.data() as Category);
      });
      return categories;
    } catch (e) {
      console.error('Error getting categories: ', e);
      toast.error('Failed to load categories');
      return [];
    }
  },

  // --- PRODUCTS (FIRESTORE) ---
  getProducts: async (): Promise<Product[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push(doc.data() as Product);
      });
      return products;
    } catch (e) {
      console.error('Error getting products: ', e);
      toast.error('Failed to load products');
      return [];
    }
  },

  addProduct: async (product: Product) => {
    try {
      const productRef = doc(db, 'products', product.id);
      await setDoc(productRef, product);
    } catch (e) {
      console.error('Error adding product: ', e);
      toast.error('Failed to add product');
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, updates);
    } catch (e) {
      console.error('Error updating product: ', e);
      toast.error('Failed to update product');
    }
  },

  deleteProduct: async (id: string) => {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
    } catch (e) {
      console.error('Error deleting product: ', e);
      toast.error('Failed to delete product');
    }
  },

  // --- TRANSACTIONS (FIRESTORE) ---
  // Added this function back in
  getTransactions: async (): Promise<StockTransaction[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'transactions'));
      const transactions: StockTransaction[] = [];
      querySnapshot.forEach((doc) => {
        transactions.push(doc.data() as StockTransaction);
      });
      return transactions.sort(
        (a, b) =>
          new Date(b.transactionDate).getTime() -
          new Date(a.transactionDate).getTime()
      );
    } catch (e) {
      console.error('Error getting transactions: ', e);
      toast.error('Failed to load transactions');
      return [];
    }
  },

  // Added this function back in
  addTransactionAndUpdateProduct: async (
    transactionData: Omit<StockTransaction, 'id'>,
    productId: string,
    newQuantity: number
  ) => {
    const batch = writeBatch(db);
    const transRef = doc(collection(db, 'transactions'));
    const transaction: StockTransaction = {
      ...transactionData,
      id: transRef.id,
    };
    batch.set(transRef, transaction);
    const productRef = doc(db, 'products', productId);
    batch.update(productRef, { quantity: newQuantity });

    try {
      await batch.commit();
      toast.success('Transaction recorded');
    } catch (e) {
      console.error('Error in transaction batch: ', e);
      toast.error('Transaction failed to record');
    }
  },
};