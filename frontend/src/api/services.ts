/**
 * api/services.ts — All API calls to the backend
 */

import api from './client';
import type { User, Product, Bill, BillItem } from '../lib/types';

/* ─────────────── AUTH ─────────────── */

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export interface RegisterResponse {
  success: boolean;
  uniqueId: string;
  message: string;
}

export async function apiLogin(uniqueId: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { uniqueId, password });
  return data;
}

export async function apiRegister(payload: {
  name: string; age: string; email: string; mobile: string;
  shopName: string; gstNo: string; address: string; city: string;
  district: string; state: string; password: string;
}): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>('/auth/register', payload);
  return data;
}

export async function apiGetMe(): Promise<User> {
  const { data } = await api.get<{ success: boolean; user: User }>('/auth/me');
  return data.user;
}

export async function apiUpdateProfile(payload: Partial<User>): Promise<User> {
  const { data } = await api.put<{ success: boolean; user: User }>('/auth/profile', payload);
  return data.user;
}

/* ─────────────── PRODUCTS ─────────────── */

export async function apiGetProducts(): Promise<Product[]> {
  const { data } = await api.get<{ success: boolean; products: Product[] }>('/products');
  return data.products;
}

export async function apiAddProduct(payload: Omit<Product, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const { data } = await api.post<{ success: boolean; product: Product }>('/products', payload);
  return data.product;
}

export async function apiUpdateProduct(id: string, payload: Partial<Product>): Promise<Product> {
  const { data } = await api.put<{ success: boolean; product: Product }>(`/products/${id}`, payload);
  return data.product;
}

export async function apiDeleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

/* ─────────────── BILLS ─────────────── */

export interface StatsResponse {
  totalProducts: number;
  totalBills: number;
  todaysBills: number;
  todaysSales: number;
}

export async function apiGetBills(date?: string): Promise<Bill[]> {
  const params = date ? { date } : {};
  const { data } = await api.get<{ success: boolean; bills: Bill[] }>('/bills', { params });
  return data.bills;
}

export async function apiGetStats(): Promise<StatsResponse> {
  const { data } = await api.get<{ success: boolean; stats: StatsResponse }>('/bills/stats');
  return data.stats;
}

export async function apiSaveBill(payload: {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  cgstPercent: number;
  sgstPercent: number;
  items: BillItem[];
}): Promise<Bill> {
  const { data } = await api.post<{ success: boolean; bill: Bill }>('/bills', payload);
  return data.bill;
}

export function getBillsExportUrl(): string {
  const token = localStorage.getItem('billcraft_token') || '';
  return `/api/bills/export?token=${token}`;
}
