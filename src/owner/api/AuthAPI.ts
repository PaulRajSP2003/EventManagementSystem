interface LoginResponse {
  email: string;
  message: string;
  ownerId?: number;
  role?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

import { API_BASE } from '../../config/api';

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await fetch(`${API_BASE}/owner/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const text = await response.text();

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      let apiResponse;
      try {
        apiResponse = JSON.parse(text);
      } catch (parseErr) {
        console.error('Invalid JSON received:', text);
        throw new Error('Invalid response from server');
      }



      let email: string = '';
      let message: string = 'Login successful';
      let ownerId: number | null = null;
      let role: string = '';

      if (apiResponse.data) {
        // New response format
        email = apiResponse.data.email || '';
        ownerId = apiResponse.data.ownerId || null;
        role = apiResponse.data.role || 'owner';
        message = apiResponse.data.message || apiResponse.message || 'Login successful';
      } else {
        email = apiResponse.email || '';
        message = apiResponse.message || 'Login successful';
      }

      if (!email) {
        throw new Error('Invalid response: missing email');
      }

      // Store only email in localStorage, token is in HTTP-only cookie
      localStorage.setItem('ownerEmail', email);
      if (role) {
        localStorage.setItem('ownerRole', role);
      }
      if (ownerId) {
        localStorage.setItem('ownerId', ownerId.toString());
      }

      return {
        email,
        message,
        ownerId: ownerId || undefined,
        role: role || 'owner'
      };
    } catch (error) {
      console.error('Login error details:', error);
      localStorage.removeItem('ownerEmail');
      localStorage.removeItem('ownerRole');
      localStorage.removeItem('ownerId');
      throw error instanceof Error ? error : new Error('Login failed');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await fetch(`${API_BASE}/owner/logout`, {
        method: 'POST',
        credentials: 'include', // Include cookies for logout
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('ownerEmail');
      localStorage.removeItem('ownerRole');
      localStorage.removeItem('ownerId');
    }
  },

  registerOwner: async (credentials: LoginCredentials): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE}/owner/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const text = await response.text();
    let data: { message?: string; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Registration failed');
    }

    return { message: data.message || 'Owner registered successfully' };
  },

  validateToken: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE}/owner/validate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  },
};
