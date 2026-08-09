import React, { createContext, useContext, useState } from 'react';
import { User, RoleName } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vivero_user');
    const token = localStorage.getItem('vivero_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        localStorage.removeItem('vivero_user');
        localStorage.removeItem('vivero_token');
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    try {
      const res = await authApi.login({ username: cleanUser, password: cleanPass });
      if (res?.data) {
        const responseData = res.data;
        const role = (responseData.role || 'ROLE_ADMIN') as RoleName;
        const newUser: User = {
          id: undefined,
          username: responseData.username,
          fullName: responseData.fullName || 'Anthony Villalta',
          role: role,
          token: responseData.token,
        };
        setUser(newUser);
        localStorage.setItem('vivero_user', JSON.stringify(newUser));
        localStorage.setItem('vivero_token', responseData.token || '');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Login API error:', err?.response?.data?.message || err?.message);

      // Local fallback for admin credentials if backend is redeploying or offline
      if (
        (cleanUser === 'anthony.villalta@hotmail.com' || cleanUser === 'admin') &&
        cleanPass === '060697'
      ) {
        const fallbackUser: User = {
          username: 'anthony.villalta@hotmail.com',
          fullName: 'Anthony Villalta',
          role: 'ROLE_ADMIN',
          token: 'offline-jwt-token-anthony'
        };
        setUser(fallbackUser);
        localStorage.setItem('vivero_user', JSON.stringify(fallbackUser));
        localStorage.setItem('vivero_token', 'offline-jwt-token-anthony');
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vivero_user');
    localStorage.removeItem('vivero_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
