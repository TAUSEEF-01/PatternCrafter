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
  unseenInvites: boolean;
  markInvitesSeen: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [unseenInvites, setUnseenInvites] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('unseenInvites');
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  });

  // helper to persist last seen invite ids per user
  const saveLastSeenInviteIds = (ids: string[]) => {
    if (!user) return;
    try {
      localStorage.setItem(`lastSeenInvites::${user.id}`, JSON.stringify(ids));
    } catch {}
  };
  const getLastSeenInviteIds = (): string[] => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`lastSeenInvites::${user.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

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

  // Poll invites periodically when logged in to detect new invites
  useEffect(() => {
    let mounted = true;
    let timer: any = null;

    const checkInvites = async () => {
      if (!user || !token) return;
      try {
        const invites = await apiFetch<{ id: string }[]>('/invites');
        if (!mounted) return;
        const lastSeen = getLastSeenInviteIds();
        const incomingIds = invites.map((i) => i.id);
        const newIds = incomingIds.filter((id) => !lastSeen.includes(id));
        if (newIds.length > 0) {
          setUnseenInvites(true);
          try {
            localStorage.setItem('unseenInvites', JSON.stringify(true));
          } catch {}
        }
      } catch (e) {
        // ignore polling errors
      }
    };

    // start immediately and then every 15s
    if (user && token) {
      checkInvites();
      timer = setInterval(checkInvites, 15000);
    }

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [user, token]);

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
    try {
      localStorage.setItem('unseenInvites', JSON.stringify(false));
    } catch {}
    setToken(null);
    setUser(null);
  };

  const markInvitesSeen = () => {
    setUnseenInvites(false);
    try {
      localStorage.setItem('unseenInvites', JSON.stringify(false));
      if (user) {
        // update lastSeen to current invites on server
        apiFetch<{ id: string }[]>('/invites')
          .then((inv) => saveLastSeenInviteIds(inv.map((i) => i.id)))
          .catch(() => {});
      }
    } catch {}
  };

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, unseenInvites, markInvitesSeen }),
    [user, token, loading, unseenInvites]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
