import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authAPI } from '../api/AuthAPI';

interface AuthContextType {
  isAuthenticated: boolean;
  ownerEmail: string | null;
  ownerId: number | null;
  ownerRole: string | null;
  login: (email: string, ownerId?: number, role?: string) => void;
  logout: () => void;
  isLoading: boolean;
  validateAndSetAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [ownerRole, setOwnerRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Validate token on mount and when page refreshes
  useEffect(() => {
    const validateOnMount = async () => {
      // Only validate if we are in the owner section or if we already have owner storage data
      const isOwnerPath = window.location.pathname.startsWith('/owner');
      const hasOwnerData = localStorage.getItem('ownerEmail');

      if (isOwnerPath || hasOwnerData) {
        await validateAndSetAuth();
      }
      setIsLoading(false);
    };

    validateOnMount();
  }, []);

  const validateAndSetAuth = async (): Promise<boolean> => {
    try {
      // Validate token with backend
      const isValid = await authAPI.validateToken();

      if (isValid) {
        // Token is valid, get user data from localStorage
        const email = localStorage.getItem('ownerEmail');
        const id = localStorage.getItem('ownerId');
        const role = localStorage.getItem('ownerRole');

        if (email) {
          setOwnerEmail(email);
          setOwnerId(id ? parseInt(id) : null);
          setOwnerRole(role || 'owner');
          setIsAuthenticated(true);
          return true;
        }
      }

      // Token is invalid or no user data
      setIsAuthenticated(false);
      setOwnerEmail(null);
      setOwnerId(null);
      setOwnerRole(null);
      return false;
    } catch (error) {
      console.error('Auth validation error:', error);
      setIsAuthenticated(false);
      return false;
    }
  };

  const login = (email: string, id?: number, role?: string) => {
    // Clear all existing storage for a fresh session
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.warn('Failed to clear storage:', err);
    }

    setOwnerEmail(email);
    setOwnerId(id || null);
    setOwnerRole(role || 'owner');
    setIsAuthenticated(true);

    // Store in localStorage
    localStorage.setItem('ownerEmail', email);
    if (id) localStorage.setItem('ownerId', id.toString());
    if (role) localStorage.setItem('ownerRole', role);
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      // Clear state
      setIsAuthenticated(false);
      setOwnerEmail(null);
      setOwnerId(null);
      setOwnerRole(null);

      // Clear localStorage and sessionStorage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (err) {
        console.warn('Failed to clear storage:', err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      ownerEmail,
      ownerId,
      ownerRole,
      login,
      logout,
      isLoading,
      validateAndSetAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
