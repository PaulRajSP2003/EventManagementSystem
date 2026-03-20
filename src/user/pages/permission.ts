// D:\Project\campmanagementsystem_final\src\user\pages\permission.ts

export interface PermissionData {
  name: string;
  email: string;
  role: string;
  eventId: number;
  permissions: number[];
  groups: string[];
}

import { API_BASE } from '../../config/api';
import { encryptData, decryptData } from '../utils/encryption';

const PERMISSION_API_URL = `${API_BASE.replace(/\/$/, '')}/user/permission`;

let _cachedPermissionData: PermissionData | null = null;

export async function fetchPermissionData(forceFresh = false): Promise<PermissionData | null> {
  if (!forceFresh && _cachedPermissionData) {
    return _cachedPermissionData;
  }

  try {
    const response = await fetch(PERMISSION_API_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (response.status === 401) {
      clearPermissionCache();
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const data = json?.data;

    const result: PermissionData = {
      name: data?.name || '',
      email: data?.email || '',
      role: data?.role || 'user',
      eventId: data?.eventId || 0,
      groups: Array.isArray(data?.groups) ? data.groups : [],
      permissions: Array.isArray(data?.permissions)
        ? data.permissions.map((p: any) => Number(p))
        : [],
    };

    _cachedPermissionData = result;

    try {
      const stored = localStorage.getItem('login-data');
      const existing = decryptData<any>(stored) || {};

      localStorage.setItem('login-data', encryptData({
        ...existing,
        name: result.name,
        role: result.role,
        eventId: result.eventId,
        email: result.email
      }));
    } catch { }

    return result;

  } catch (err) {
    console.error('Permission fetch failed:', err);
    return null;
  }
}

export function clearPermissionCache() {
  _cachedPermissionData = null;
}

export const PAGE_PERMISSIONS = {
  // Student (100–150)
  STUDENT_LIST: 100,
  STUDENT_DETAIL: 101,
  STUDENT_NEW: 102,
  STUDENT_EDIT: 103,
  STUDENT_STATUS_UPDATE: 104,

  // Leader (150–200)
  LEADER_LIST: 150,
  LEADER_DETAIL: 151,
  LEADER_NEW: 152,
  LEADER_EDIT: 153,
  LEADER_STATUS_UPDATE: 154,

  //GROUPS (200-250)
  FOLLOWING_GROUP: 200,
  SUB_GROUP: 201,

  // Medical (250–300)
  MEDICAL_REPORT_LIST: 250,
  MEDICAL_REPORT_DETAIL: 251,
  MEDICAL_REPORT_NEW: 252,
  MEDICAL_REPORT_EDIT: 253,
  MEDICAL_TREATMENT_ADD: 254,

  // Room Management (300–350)
  VIEW_ROOM: 300,
  KEY_HANDING: 301,
  ROOM_LEADER_ASSIGN: 302,

  TASK_DETAILS: 401
} as const;

export function hasPermission(
  permissions: number[] | undefined,
  pageId: number
): boolean {
  if (!permissions) {
    return false;
  }
  return permissions.includes(pageId);
}

export function canAccess(
  user: { role?: string; permissions?: number[] } | undefined | null,
  pageId: number | number[]
): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'co-admin') return true;

  if (Array.isArray(pageId)) {
    return pageId.some(id => hasPermission(user.permissions, id));
  }

  return hasPermission(user.permissions, pageId);
}

export function isAdminOrCoAdmin(user?: { role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'co-admin';
}

export function isAdmin(role?: string | null): boolean {
  return role === 'admin';
}
