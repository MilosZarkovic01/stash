import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, type User } from './api';
import { getToken, setToken } from './storage';

type AuthState = {
  loading: boolean;
  token: string | null;
  user: User | null;
  error: string | null;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function hydrate() {
    const stored = await getToken();
    setTokenState(stored);
    if (!stored) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
      setError(null);
    } catch {
      await setToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void hydrate();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      token,
      user,
      error,
      signIn: async (nextToken, nextUser) => {
        await setToken(nextToken);
        setTokenState(nextToken);
        setUser(nextUser);
      },
      signOut: async () => {
        await setToken(null);
        setTokenState(null);
        setUser(null);
      },
      refresh: hydrate,
    }),
    [loading, token, user, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
