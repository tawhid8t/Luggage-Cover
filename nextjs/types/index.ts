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
  sort_order?: number;
  // Pricing
  price_small: number;
  price_medium: number;
  price_large: number;
  // Stock
  stock_small: number;
  stock_medium: number;
  stock_large: number;
  // Images
  image_url?: string;
  gallery_1?: string;
  gallery_2?: string;
  gallery_3?: string;
  gallery_4?: string;
  gallery_5?: string;
  // SEO
  meta_title?: string;
  meta_description?: string;
  seo_title?: string;
  seo_description?: string;
  // Timestamps
  created_at?: string;
  updated_at?: string;
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
  product_id: string;
  product_name: string;
  product_code: string;
  size: ProductSize;
  price: number;
  quantity?: number;
  qty?: number;
  total?: number;
}

export interface Order {
  id: string;
  order_number: string;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: "pending" | "paid" | "failed" | "refunded";
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  shipping_address?: string;
  district: string;
  items: OrderItem[];
  subtotal: number;
  discount_amount?: number;
  delivery_charge: number;
  total_amount: number;
  courier_name?: string;
  tracking_number?: string;
  order_notes?: string;
  status_history?: StatusHistoryEntry[];
  created_at?: string;
  updated_at?: string;
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
  total_orders: number;
  total_spent: number;
  created_at?: string;
  last_order_at?: string;
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
