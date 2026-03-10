// D:\Project\campmanagementsystem\src\user\pages\permission.ts

export interface PermissionData {
  name: string;
  email: string;
  role: string;
  eventId: number;
  permissions: number[];
  groups: string[];
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
const PERMISSION_API_URL = `${API_BASE.replace(/\/$/, '')}/user/permission`;

let _cachedPermissionData: PermissionData | null = null;
export async function fetchPermissionData(): Promise<PermissionData> {
  if (_cachedPermissionData) {
    
    return _cachedPermissionData;
  }

  try {
    

    const response = await fetch(PERMISSION_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important: Ensure cookies are being sent
    });

    

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Permissions Error: User is Unauthorized (401)');
        throw new Error('Unauthorized');
      }

      console.warn('Permission API returned non-OK status. Falling back to guest defaults.', response.status);
      return {
        name: '',
        email: '',
        role: 'user',
        eventId: 0,
        groups: [],
        permissions: []
      };
    }

    const json = await response.json();
    

    const data = json?.data;

    // Mapping and sanitizing the data
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
    return result;

  } catch (err) {
    console.error('--- Permissions: Critical Fetch Error ---');
    console.error(err);
    throw err;
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
  pageId: number
): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'co-admin') return true;
  return hasPermission(user.permissions, pageId);
}

export function isAdminOrCoAdmin(user?: { role?: string } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'co-admin';
}

export function isAdmin(role?: string | null): boolean {
  return role === 'admin';
}