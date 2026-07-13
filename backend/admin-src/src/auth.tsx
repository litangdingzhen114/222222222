import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { TOKEN_KEY } from './api';

type AuthContextValue = {
  token: string;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');

  const value = useMemo<AuthContextValue>(() => ({
    token,
    login(nextToken) {
      localStorage.setItem(TOKEN_KEY, nextToken);
      setToken(nextToken);
    },
    logout() {
      localStorage.removeItem(TOKEN_KEY);
      setToken('');
    }
  }), [token]);

  useEffect(() => {
    const onUnauthorized = () => value.logout();
    window.addEventListener('hailin-admin-unauthorized', onUnauthorized);
    return () => window.removeEventListener('hailin-admin-unauthorized', onUnauthorized);
  }, [value]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
