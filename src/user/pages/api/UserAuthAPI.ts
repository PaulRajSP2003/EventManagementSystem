// D:\Project\campmanagementsystem\src\user\api\UserAuthAPI.ts

export interface LoginCredentials {
  eventId: number;
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token?: string;
    userId?: number;
    name?: string;
    role?: string;
    eventId?: number;
    email?: string;
  };
}

export interface User {
  name: string;
  email: string;
  role: string;
  eventId: number;
  permissions?: number[];
  groups?: string[];
}

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

class UserAuthAPI {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId: credentials.eventId,
          email: credentials.email,
          password: credentials.password,
          deviceInfo: credentials.deviceInfo || navigator.userAgent
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          message: data.message || 'Login failed'
        };
      }

      return {
        success: true,
        message: data.message || 'Login successful',
        data: data.data
      };
    } catch (error) {
      console.error('Login API error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE}/user/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}

export const userAuthAPI = new UserAuthAPI();