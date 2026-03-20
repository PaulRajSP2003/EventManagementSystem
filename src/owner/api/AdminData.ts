// src/api/AdminData.ts
import type { Admin } from '../../types';
import { API_BASE } from '../../config/api';

const BASE_URL = `${API_BASE}/owner/`;

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

export const adminAPI = {
  getAll: async (): Promise<Admin[]> => {
    const response = await fetch(`${BASE_URL}user`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch admins (HTTP ${response.status})`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch admins');
    }

    return json.data as Admin[];
  },

  getById: async (adminId: number): Promise<Admin | null> => {
    if (adminId <= 0) return null;

    const response = await fetch(`${BASE_URL}user/${adminId}`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders(),
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch admin (HTTP ${response.status})`);
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.message || 'Failed to fetch admin');
    }

    return json.data as Admin;
  },

  save: async (data: Partial<Admin> & { id: number }): Promise<Admin> => {
    const isCreate = data.id === 0;

    const response = await fetch(`${BASE_URL}admin/save`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
        `${isCreate ? 'Create' : 'Update'} failed (HTTP ${response.status})`
      );
    }

    const json = await response.json();
    if (!json.success) {
      throw new Error(json.message || `${isCreate ? 'Create' : 'Update'} failed`);
    }

    const returnedId = json.data?.id ?? data.id;
    if (returnedId == null) {
      throw new Error('Server did not return a valid ID');
    }

    return { ...data, id: returnedId } as Admin;
  },

  create: async (data: Omit<Admin, 'id' | 'createdAt' | 'updatedAt'>): Promise<Admin> =>
    adminAPI.save({ ...data, id: 0 }),

  update: async (id: number, changes: Partial<Omit<Admin, 'id'>>): Promise<Admin> =>
    adminAPI.save({ ...changes, id }),
};
