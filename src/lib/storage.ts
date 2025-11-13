// src/lib/storage.ts

// I've removed StockTransaction and Sale, as they're no longer needed
import { Product, Category, User } from '@/types';
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
} from 'firebase/firestore'; // Removed 'writeBatch'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

const STORAGE_KEYS = {
  USER: 'dtl_user',
};

export const StorageService = {
  
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

};