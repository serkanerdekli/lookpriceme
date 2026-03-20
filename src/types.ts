export interface User {
  id: number;
  username: string;
  email: string;
  role: 'superadmin' | 'storeadmin' | 'editor' | 'viewer';
  store_id?: number;
  store_slug?: string;
}

export interface Product {
  id: number;
  store_id: number;
  barcode: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  currency: string;
  stock_quantity: number;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
}
