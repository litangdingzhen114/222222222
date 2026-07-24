import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ACCESS_TOKEN_KEY,
  clearTokens,
  getAdminMe,
  loginAdmin,
  saveAdminProfile,
  storedAdminProfile
} from './api';
import type { AdminProfile } from './types';

type LoginPayload = {
  username: string;
  password: string;
};

type AuthContextValue = {
  token: string;
  admin: AdminProfile | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY) || '');
  const [admin, setAdmin] = useState<AdminProfile | null>(() => storedAdminProfile());

  const logout = () => {
    clearTokens();
    setToken('');
    setAdmin(null);
  };

  const refreshProfile = async () => {
    if (!localStorage.getItem(ACCESS_TOKEN_KEY)) return;
    const result = await getAdminMe();
    saveAdminProfile(result.admin);
    setAdmin(result.admin);
  };

  const login = async (payload: LoginPayload) => {
    const result = await loginAdmin(payload);
    setToken(result.accessToken);
    setAdmin(result.admin);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      admin,
      login,
      logout,
      refreshProfile
    }),
    [token, admin]
  );

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('hailin-admin-unauthorized', onUnauthorized);
    return () => window.removeEventListener('hailin-admin-unauthorized', onUnauthorized);
  }, []);

  useEffect(() => {
    if (token && !admin) {
      refreshProfile().catch(() => logout());
    }
  }, [token, admin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
