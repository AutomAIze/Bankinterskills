import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { brandConfig } from '@/config/brand';

interface User {
  name: string;
  role: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const DEMO_USERS: Record<string, { password: string; user: User }> = Object.fromEntries(
  brandConfig.demoCredentials.map((demo) => [
    demo.email.toLowerCase(),
    {
      password: demo.password,
      user: {
        name: demo.name,
        role: demo.role,
        email: demo.email,
      },
    },
  ]),
);

const SESSION_KEY = 'skills_intel_session';

function loadSession(): User | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadSession);

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 800));

    const entry = DEMO_USERS[email.toLowerCase().trim()];
    if (entry && entry.password === password) {
      setUser(entry.user);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(entry.user));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
