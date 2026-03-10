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

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await fetch('https://localhost:7135/api/owner/login', {
        method: 'POST',
        credentials: 'include', // 👈 THIS IS CRUCIAL - allows cookies to be set/received
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

      console.log('Backend response:', apiResponse);

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
      await fetch('https://localhost:7135/api/Auth/logout', {
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

  validateToken: async (): Promise<boolean> => {
    try {
      const response = await fetch('https://localhost:7135/api/owner/validate', {
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