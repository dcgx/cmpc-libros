import { createContext, useContext, useMemo, useState } from 'react';
import { api, session } from '../api/client';

type User = { id: string; email: string; name: string; role: string };

type AuthState = {
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(session.get());

  const value = useMemo<AuthState>(
    () => ({
      token,
      async login(email, password) {
        const { data } = await api<{ accessToken: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        session.set(data.accessToken);
        setToken(data.accessToken);
      },
      logout() {
        session.clear();
        setToken(null);
      },
    }),
    [token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider ausente');
  return ctx;
}
