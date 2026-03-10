// D:\Project\campmanagementsystem\src\user\pages\auth\UserAuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { userAuthAPI, type LoginCredentials, type User } from '../api/UserAuthAPI';
import { fetchPermissionData, clearPermissionCache } from '../permission';

interface UserAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

interface UserAuthProviderProps {
  children: ReactNode;
}

const USER_STORAGE_KEY = 'loginUserData';

export const UserAuthProvider: React.FC<UserAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);

      try {
        const permissionData = await fetchPermissionData();

        const userData: User = {
          name: permissionData.name,
          email: permissionData.email,
          role: permissionData.role,
          eventId: permissionData.eventId,
        };

        setUser(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      } catch (error) {
        
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      }

    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);

      const loginResponse = await userAuthAPI.login(credentials);

      if (!loginResponse.success || !loginResponse.data) {
        throw new Error(loginResponse.message || 'Login failed');
      }

      const permissionData = await fetchPermissionData();

      const userData: User = {
        name: loginResponse.data.name || '',
        email: credentials.email,
        role: permissionData.role,
        eventId: credentials.eventId,
        permissions: permissionData.permissions,
        groups: permissionData.groups
      };

      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await userAuthAPI.logout();
    } finally {
      clearPermissionCache();
      setUser(null);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};