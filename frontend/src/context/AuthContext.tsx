import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  loginAsDemo: () => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => void;
  updateUserSettings: (data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('docmind_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('docmind_token');
      if (storedToken) {
        try {
          const me = await api.getMe();
          setUser(me);
        } catch (err) {
          console.error("Auth check failed:", err);
          localStorage.removeItem('docmind_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthSuccess = (res: AuthResponse) => {
    localStorage.setItem('docmind_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    handleAuthSuccess(res);
  };

  const loginAsDemo = async () => {
    const res = await api.login({ email: 'demo@docmind.ai', password: 'password123' });
    handleAuthSuccess(res);
  };

  const register = async (email: string, pass: string, name?: string) => {
    const res = await api.register({ email, password: pass, full_name: name });
    handleAuthSuccess(res);
  };

  const logout = () => {
    localStorage.removeItem('docmind_token');
    setToken(null);
    setUser(null);
  };

  const updateUserSettings = async (data: any) => {
    const updated = await api.updateSettings(data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginAsDemo,
        register,
        logout,
        updateUserSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
