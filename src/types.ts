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
  currency: string;
  unit: string;
  image_url: string;
  category: string;
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
  address: string;
  phone: string;
  email: string;
  default_currency: string;
  language: string;
  plan: string;
  subscription_end: string;
  created_at: string;
}

export interface Account {
  id: number;
  store_id: number;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  country: string;
  tax_office: string;
  tax_number: string;
  balance: number;
  notes: string;
  created_at: string;
  transactions?: AccountTransaction[];
}

export interface AccountTransaction {
  id: number;
  store_id: number;
  account_id: number;
  type: 'debit' | 'credit';
  amount: number;
  description: string;
  reference_no: string;
  due_date: string;
  created_at: string;
}

export interface Quotation {
  id: number;
  store_id: number;
  quotation_no: string;
  account_id: number;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  status: 'Beklemede' | 'Onaylandı' | 'Reddedildi' | 'Satış Yapıldı';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes: string;
  valid_until: string;
  converted_at: string;
  payment_method: string;
  due_date: string;
  created_at: string;
  items?: QuotationItem[];
}

export interface QuotationItem {
  id: number;
  quotation_id: number;
  product_id: number;
  barcode: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total: number;
  currency: string;
}

export interface StockMovement {
  id: number;
  store_id: number;
  product_id: number;
  product_name: string;
  barcode: string;
  type: 'in' | 'out';
  quantity: number;
  reference_type: string;
  reference_id: number;
  description: string;
  created_at: string;
}

export interface CashRegister {
  id: number;
  store_id: number;
  register_type: 'Nakit Kasa' | 'Kredi Kartı' | 'Banka/EFT';
  amount: number;
  description: string;
  reference_no: string;
  company_name: string;
  created_at: string;
}
