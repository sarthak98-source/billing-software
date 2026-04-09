/**
 * lib/types.ts — Shared frontend types (mirrors backend types minus passwordHash)
 */

export interface User {
  uniqueId: string;
  name: string;
  age: string;
  email: string;
  mobile: string;
  shopName: string;
  gstNo: string;
  address: string;
  city: string;
  district: string;
  state: string;
  createdAt: string;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  hsn: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillItem {
  productId: string;
  name: string;
  quantity: number;
  rate: number;
  amount: number;
  unit: string;
  hsn: string;
}

export interface Bill {
  id: string;
  userId: string;
  billNo: number;
  date: string;
  items: BillItem[];
  subTotal: number;
  cgstPercent: number;
  sgstPercent: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
}
