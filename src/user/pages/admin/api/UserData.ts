import type { User } from '../../../../types';

const BASE_URL = 'https://localhost:7135/api/admin';

// API Response types
interface ApiSaveResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
  };
}

interface ApiUserResponse {
  id: number;
  name: string;
  contactNumber: string;
  email: string;
  role: string;
  assignRole: number;
  isActive: boolean;
  remark: string;
  permissionPages: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiUsersListResponse {
  success: boolean;
  message: string;
  data: ApiUserResponse[];
}

// Dynamic header function - reads user info from localStorage on each request
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const apiResponse: ApiUsersListResponse = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch users');
    }

    // Transform API response to User type
    const users: User[] = apiResponse.data.map((apiUser) => {
      let permissions: number[] = [];
      try {
        // Parse permissionPages JSON string to array
        permissions = JSON.parse(apiUser.permissionPages);
      } catch (e) {
        console.warn('Failed to parse permissionPages:', apiUser.permissionPages);
        permissions = [];
      }

      return {
        id: apiUser.id,
        name: apiUser.name,
        email: apiUser.email,
        contactNumber: apiUser.contactNumber,
        role: apiUser.role,
        assignRole: apiUser.assignRole,
        isActive: apiUser.isActive,
        remarks: apiUser.remark,
        permissions,
      };
    });

    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: number): Promise<User> => {
  try {
    const response = await fetch(`${BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }

    const apiResponse: { success: boolean; message: string; data: ApiUserResponse } = await response.json();

    if (!apiResponse.success) {
      throw new Error(apiResponse.message || 'Failed to fetch user');
    }

    const apiUser = apiResponse.data;

    // Parse permissionPages JSON string to array
    let permissions: number[] = [];
    try {
      permissions = JSON.parse(apiUser.permissionPages);
    } catch (e) {
      console.warn('Failed to parse permissionPages:', apiUser.permissionPages);
      permissions = [];
    }

    // Transform API response to User type
    const user: User = {
      id: apiUser.id,
      name: apiUser.name,
      email: apiUser.email,
      contactNumber: apiUser.contactNumber,
      role: apiUser.role,
      assignRole: apiUser.assignRole,
      isActive: apiUser.isActive,
      remarks: apiUser.remark,
      permissions,
    };

    
    return user;
  } catch (error) {
    console.error(`Error fetching user with id ${id}:`, error);
    throw error;
  }
};

// Create new user
export const createUser = async (userData: {
  id: number;
  name: string;
  email: string;
  contactNumber: string;
  role: string;
  assignRole: number;
  isActive: boolean;
  remarks?: string;
  password: string;
  permissions: number[];
}): Promise<User> => {
  try {
    const eventId = localStorage.getItem('evenId') || '0';
    const payload = {
      id: 0,
      eventId: parseInt(eventId, 10),
      name: userData.name,
      email: userData.email,
      contactNumber: userData.contactNumber,
      role: userData.role,
      assignRole: userData.assignRole,
      isActive: userData.isActive,
      remark: userData.remarks || '',
      password: userData.password,
      permissionPages: JSON.stringify(userData.permissions),
    };

    const response = await fetch(`${BASE_URL}/user/save`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data: ApiSaveResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to create user');
    }

    // Return created user with the new ID from response
    const newUser: User = {
      id: data.data?.id || 0,
      name: userData.name,
      email: userData.email,
      contactNumber: userData.contactNumber,
      role: userData.role,
      assignRole: userData.assignRole,
      isActive: userData.isActive,
      remarks: userData.remarks,
      permissions: userData.permissions,
    };

    
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user (edit)
export const updateUser = async (
  id: number,
  userData: {
    id: number;
    name: string;
    email: string;
    contactNumber: string;
    role: string;
    assignRole: number;
    isActive: boolean;
    remarks?: string;
    password?: string;
    permissions: number[];
  }
): Promise<User> => {
  try {
    const eventId = localStorage.getItem('evenId') || '0';
    const payload = {
      id: userData.id,
      eventId: parseInt(eventId, 10),
      name: userData.name,
      email: userData.email,
      contactNumber: userData.contactNumber,
      role: userData.role,
      assignRole: userData.assignRole,
      isActive: userData.isActive,
      remark: userData.remarks || '',
      password: userData.password || '',
      permissionPages: JSON.stringify(userData.permissions),
    };

    const response = await fetch(`${BASE_URL}/user/save`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    const data: ApiSaveResponse = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to update user');
    }

    // Return updated user
    const updatedUser: User = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      contactNumber: userData.contactNumber,
      role: userData.role,
      assignRole: userData.assignRole,
      isActive: userData.isActive,
      remarks: userData.remarks,
      permissions: userData.permissions,
    };

    
    return updatedUser;
  } catch (error) {
    console.error(`Error updating user with id ${id}:`, error);
    throw error;
  }
};