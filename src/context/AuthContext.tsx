import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleName } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, role: RoleName, token?: string, fullName?: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('vivero_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default logged in user for immediate demo experience
    return {
      username: 'admin',
      fullName: 'Admin',
      role: 'ROLE_ADMIN',
      token: 'demo-jwt-token'
    };
  });

  const login = (username: string, role: RoleName, token?: string, fullName?: string) => {
    const newUser: User = {
      username,
      fullName: fullName || (username === 'admin' ? 'Admin' : username),
      role,
      token: token || 'demo-token'
    };
    setUser(newUser);
    localStorage.setItem('vivero_user', JSON.stringify(newUser));
    if (token) localStorage.setItem('vivero_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vivero_user');
    localStorage.removeItem('vivero_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
