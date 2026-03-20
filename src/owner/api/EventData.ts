import type { Event } from '../../types';

import { API_BASE } from '../../config/api';
const BASE_URL = `${API_BASE}/owner/event`;

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

export const eventAPI = {
  getAll: async (): Promise<Event[]> => {
    const res = await fetch(`${BASE_URL}`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Backend error:', data);
      throw new Error(data.message || 'Failed to fetch events');
    }
    return data.data as Event[];
  },

  getById: async (id: number): Promise<Event | null> => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) return null;
    return data.data as Event;
  },

  create: async (data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
    const res = await fetch(`${BASE_URL}/save`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify({ ...data, id: 0 })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create event');
    return { ...data, ...result.data } as Event;
  },

  update: async (id: number, changes: Partial<Omit<Event, 'id'>>): Promise<Event | null> => {
    const res = await fetch(`${BASE_URL}/save`, {
      method: 'POST',
      credentials: 'include',
      headers: getHeaders(),
      body: JSON.stringify({ ...changes, id })
    });
    
    const result = await res.json();
    if (!res.ok) {
      console.error('Update failed:', result);
      throw new Error(result.message || result.error || 'Failed to update event');
    }
    return { id, ...changes, ...result.data } as Event;
  },
};
