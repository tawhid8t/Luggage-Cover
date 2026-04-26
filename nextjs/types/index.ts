// ============================================================
// LUGGAGE COVER BD — TypeScript Type Definitions
// ============================================================

export type ProductSize = "small" | "medium" | "large";

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  featured: boolean;
  sortOrder?: number;
  // Pricing
  priceSmall: number;
  priceMedium: number;
  priceLarge: number;
  // Stock
  stockSmall: number;
  stockMedium: number;
  stockLarge: number;
  // Images
  imageUrl?: string;
  gallery1?: string;
  gallery2?: string;
  gallery3?: string;
  gallery4?: string;
  gallery5?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  key: string;
  productId: string;
  productName: string;
  productCode: string;
  emoji?: string;
  imageUrl?: string;
  size: ProductSize;
  price: number;
  qty: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productCode: string;
  size: ProductSize;
  price: number;
  quantity?: number;
  qty?: number;
  total?: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: string;
  district: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount?: number;
  deliveryCharge: number;
  totalAmount: number;
  courierName?: string;
  trackingNumber?: string;
  orderNotes?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus =
  | "new"
  | "confirmed"
  | "packing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "returned"
  | "refunded";

export type PaymentMethod = "cod" | "bkash" | "nagad" | "card";

export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  district?: string;
  totalOrders: number;
  totalSpent: number;
  status?: "active" | "blocked";
  notes?: string;
  tags?: string[];
  createdAt?: string;
  lastOrderAt?: string;
}

export interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  updated_at?: string;
}

export interface User {
  id: string;
  username: string;
  full_name: string;
  role: "admin" | "editor" | "viewer";
  status: "active" | "inactive";
  last_login?: string;
  created_at?: string;
}

export interface AdminSession {
  userId: string;
  username: string;
  fullName: string;
  role: "admin" | "editor" | "viewer";
  loginTime: number;
  token?: string;
}

export interface DiscountInfo {
  amount: number;
  percent: number;
  applied: boolean;
  minQty: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
