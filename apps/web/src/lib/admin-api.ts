import axios from 'axios';

export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('tekrovia_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function readAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem('tekrovia_user');
    if (!raw) return null;
    const user = JSON.parse(raw) as AdminUser;
    return user && typeof user.role === 'string' ? user : null;
  } catch {
    return null;
  }
}

export function isAdmin(user: AdminUser | null): boolean {
  return !!user && ['ADMIN', 'SUPER_ADMIN'].includes(user.role);
}
