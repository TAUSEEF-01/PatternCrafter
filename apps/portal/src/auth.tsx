import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export type User = {
  id?: string;
  name: string;
  email: string;
  role?: 'admin' | 'task_manager' | 'user';
  avatarUrl?: string;
};

type AuthContextValue = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'pc_user';
const TOKEN_KEY = 'pc_token';
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

function getInitialUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getInitialUser());

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = async (email: string, password: string) => {
    const body = new URLSearchParams();
    body.set('username', email);
    body.set('password', password);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      if (!res.ok) {
        const detail = await safeDetail(res);
        throw new Error(detail ?? `Login failed (${res.status})`);
      }
      const data = await res.json();
      const token = data.access_token as string;
      const u = data.user as User;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      setUser({ id: u.id, name: u.name, email: u.email, role: u.role });
    } catch (e) {
      throw e;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const detail = await safeDetail(res);
      throw new Error(detail ?? `Registration failed (${res.status})`);
    }
    const u = (await res.json()) as User;
    setUser({ id: u.id, name: u.name, email: u.email, role: u.role });
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(() => ({ user, login, register, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function capitalize(s: string) {
  return s
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

async function safeDetail(res: Response): Promise<string | undefined> {
  try {
    const data = await res.json();
    const d = (data as any)?.detail;
    if (typeof d === 'string') return d;
    if (d) return JSON.stringify(d);
  } catch {}
  return undefined;
}
