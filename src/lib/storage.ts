import { Product, StockTransaction, Sale, Category, User } from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'dtl_products',
  TRANSACTIONS: 'dtl_transactions',
  SALES: 'dtl_sales',
  CATEGORIES: 'dtl_categories',
  USER: 'dtl_user',
};

// ✅ Default Categories
const defaultCategories: Category[] = [
  { id: '1', name: 'Rum', description: 'Rum products' },
  { id: '2', name: 'Beers', description: 'Beer products' },
  { id: '3', name: 'Spirits', description: 'Spirit Products' },
  { id: '4', name: 'Food', description: 'Food items' },
  { id: '5', name: 'Equipment', description: 'Equipment and tools' },
  { id: '6', name: 'Supplies', description: 'Bar supplies' }, // 🆕 Example of renamed category
];

// ✅ Default Products
const defaultProducts: Product[] = [
  {
    id: '1',
    categoryId: '1',
    categoryName: 'Rum',
    name: 'Tanduay',
    sku: 'JD-001',
    unit: 'Bottle',
    unitCost: 25.0,
    sellingPrice: 45.0,
    quantity: 50,
    reorderLevel: 15,
    location: 'Bar',
    status: 'Active',
    supplier: 'Premium Liquor Co.',
  },
  {
    id: '2',
    categoryId: '2',
    categoryName: 'Beers',
    name: 'Corona Extra',
    sku: 'CR-001',
    unit: 'Case',
    unitCost: 18.0,
    sellingPrice: 35.0,
    quantity: 8,
    reorderLevel: 10,
    location: 'Warehouse',
    status: 'Active',
    supplier: 'Beer Distributors Inc.',
  },
  {
    id: '3',
    categoryId: '3',
    categoryName: 'Food',
    name: 'Nachos Mix',
    sku: 'NC-001',
    unit: 'Pack',
    unitCost: 5.0,
    sellingPrice: 12.0,
    quantity: 30,
    reorderLevel: 20,
    expiryDate: '2025-12-31',
    location: 'Kitchen',
    status: 'Active',
    supplier: 'Food Supply Co.',
  },
];

export const StorageService = {
  // ✅ Categories
  getCategories: (): Category[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
      return defaultCategories;
    }

    const existing = JSON.parse(stored) as Category[];

    // ✅ Auto-update: update names/descriptions & add new defaults
    const updatedDefaults = defaultCategories.map((dc) => {
      const match = existing.find((ec) => ec.id === dc.id);
      // if found, update name/description; else add new
      return match ? { ...match, name: dc.name, description: dc.description } : dc;
    });

    // ✅ Keep user-added categories (not in defaults)
    const userAdded = existing.filter((ec) => !defaultCategories.some((dc) => dc.id === ec.id));

    const merged = [...updatedDefaults, ...userAdded];

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(merged));
    return merged;
  },

  // ✅ Products
  getProducts: (): Product[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(defaultProducts));
      return defaultProducts;
    }
    return JSON.parse(stored);
  },

  saveProducts: (products: Product[]) => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  addProduct: (product: Product) => {
    const products = StorageService.getProducts();
    products.push(product);
    StorageService.saveProducts(products);
  },

  updateProduct: (id: string, updates: Partial<Product>) => {
    const products = StorageService.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      StorageService.saveProducts(products);
    }
  },

  deleteProduct: (id: string) => {
    const products = StorageService.getProducts().filter((p) => p.id !== id);
    StorageService.saveProducts(products);
  },

  // ✅ Transactions
  getTransactions: (): StockTransaction[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return stored ? JSON.parse(stored) : [];
  },

  saveTransactions: (transactions: StockTransaction[]) => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  addTransaction: (transaction: StockTransaction) => {
    const transactions = StorageService.getTransactions();
    transactions.push(transaction);
    StorageService.saveTransactions(transactions);
  },

  // ✅ Sales
  getSales: (): Sale[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SALES);
    return stored ? JSON.parse(stored) : [];
  },

  saveSales: (sales: Sale[]) => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  },

  addSale: (sale: Sale) => {
    const sales = StorageService.getSales();
    sales.push(sale);
    StorageService.saveSales(sales);
  },

  // ✅ User Session
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

  // ✅ Auth
  login: (username: string, password: string): User | null => {
    if (username === 'admin' && password === '123') {
      const user: User = {
        id: '1',
        username: 'admin',
        email: 'admin@dtl.com',
        fullName: 'DTL Administrator',
        role: 'Admin',
        status: 'Active',
        createdAt: new Date().toISOString(),
      };
      StorageService.setCurrentUser(user);
      return user;
    }
    return null;
  },

  logout: () => {
    StorageService.setCurrentUser(null);
  },
};
