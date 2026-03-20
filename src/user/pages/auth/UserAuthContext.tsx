import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { userAuthAPI, type LoginCredentials, type User } from '../api/UserAuthAPI';
import { fetchPermissionData, clearPermissionCache } from '../permission';
import { encryptData, decryptData } from '../../utils/encryption';

interface UserAuthContextType {
  user: User | null;
  isLoading: boolean;        // ONLY for permission / app load
  isLoggingIn: boolean;      // ONLY for login button
  isAuthenticated: boolean;
  loginError: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export const UserAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('login-data');
      const saved = decryptData<any>(stored);
      if (saved) {
        return {
          name: saved.name || '',
          email: saved.email || '',
          role: saved.role || '',
          eventId: saved.eventId || 0,
          permissions: [],
          groups: []
        };
      }
    } catch { }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);   // 🔥 ONLY for permission
  const [isLoggingIn, setIsLoggingIn] = useState(false); // 🔥 login button only
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  // ✅ INITIAL AUTH CHECK
  const checkAuth = async (): Promise<boolean> => {
    try {
      setIsLoading(true);

      const data = await fetchPermissionData(true);

      if (!data) {
        clearPermissionCache();
        setUser(null);
        localStorage.removeItem('login-data');
        return false;
      }

      setUser({
        name: data.name,
        email: data.email,
        role: data.role,
        eventId: data.eventId,
        permissions: data.permissions,
        groups: data.groups,
      });

      return true;

    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      return false;

    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED LOGIN FLOW
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setLoginError(null);
      setIsLoggingIn(true); // 🔥 ONLY button loading

      const loginResponse = await userAuthAPI.login(credentials);

      // ❌ STOP HERE (NO BRIDGE)
      if (!loginResponse.success || !loginResponse.data) {
        setLoginError(loginResponse.message || 'Invalid email or password');
        return false;
      }

      // ✅ SUCCESS → CLEAR OLD DATA
      localStorage.clear();
      sessionStorage.clear();

      const loginData = {
        token: loginResponse.data.token || '',
        name: loginResponse.data.name || '',
        role: loginResponse.data.role || '',
        eventId: credentials.eventId,
        email: credentials.email
      };

      localStorage.setItem('login-data', encryptData(loginData));

      // ✅ NOW START BRIDGE (permission loading)
      setIsLoading(true);

      const permissionData = await fetchPermissionData(true);

      if (!permissionData) {
        throw new Error('Could not load user permissions');
      }

      const userData: User = {
        name: loginResponse.data.name || '',
        email: credentials.email,
        role: permissionData.role,
        eventId: credentials.eventId,
        permissions: permissionData.permissions,
        groups: permissionData.groups
      };

      setUser(userData);

      return true;

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed';
      setLoginError(msg);
      setUser(null);
      return false;

    } finally {
      setIsLoggingIn(false);
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await userAuthAPI.logout();
    } finally {
      clearPermissionCache();
      setUser(null);
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  return (
    <UserAuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggingIn,
        isAuthenticated: !!user,
        loginError,
        login,
        logout,
        checkAuth
      }}
    >
      {children}
    </UserAuthContext.Provider>
  );
};

export const useUserAuth = () => {
  const ctx = useContext(UserAuthContext);
  if (!ctx) throw new Error('useUserAuth must be used within provider');
  return ctx;
};