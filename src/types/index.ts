export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  sku: string;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  expiryDate?: string;
  location: string;
  status: 'Active' | 'Inactive';
  supplier?: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName?: string;
  transactionType: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason?: string;
  transactionDate: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  quantitySold: number;
  totalPrice: number;
  salesDate: string;
}

export interface Report {
  id: string;
  userId: string;
  reportType: string;
  generatedOn: string;
  data: any;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  totalValue: number;
  recentTransactions: number;
}
