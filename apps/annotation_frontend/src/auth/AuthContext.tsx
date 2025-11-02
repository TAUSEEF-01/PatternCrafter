import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/api/client';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        if (!token) return;
        const me = await apiFetch<User>('/auth/me');
        setUser(me);
      } catch (e) {
        console.warn('Failed to fetch /auth/me', e);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ access_token: string }>('/auth/login', {
      method: 'POST',
      body: { email, password },
      noAuth: true,
    });
    localStorage.setItem('token', res.access_token);
    setToken(res.access_token);
    const me = await apiFetch<User>('/auth/me');
    setUser(me);
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    await apiFetch('/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
      noAuth: true,
    });
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
